# GoldenDawn OS – Daten- und Sync-Verträge

## Dokumentstatus

| Feld | Wert |
| --- | --- |
| Projektphase | `v0.3.0 – ADR 0032 angenommen; gebundenes Chrome-151-Runtimegate weiterhin FAIL; Ursache CAUSE_NOT_PROVEN; nächster Slice: reine netzwerkfreie effects-as-data-Diagnosefoundation` |
| Vertragsversion | `1.0` |
| PromptVault-Speicherschema | `2` |
| LearningHub-Schema | `2` |
| LearningHub-Persistenznamespace | `v1` |
| LearningProgress-Schema | `1` |
| LearningProgress-Persistenznamespace | `v1` |
| LearningArtifact-Schema | `1` |
| LearningArtifact-Persistenznamespace | `v1` |
| LearningTestBank-Schema | `1` |
| LearningTestBank-Persistenznamespace | `v1` |
| LearningTestAttemptLog-Schema | `1` |
| LearningTestAttempt-Persistenznamespace | `v1` |
| LichtwaldLog-Schema | `1` |
| LichtwaldLog-Persistenznamespace | `v1` |
| LichtwaldLog-Snapshotlimit | 500.000 UTF-16-Codeeinheiten |
| Agenten-Scope | SyncAgent, DataAgent und TestAgent |
| Status | Paketversion `0.2.2`; neuestes veröffentlichtes Release und Tag `v0.2.2`; lokale Foundations, modellfreier `syncTest`-SyncAgent-Kern, ADR-0025-In-Process-Komposition, isolierter BrowserSyncTransport und feste transportlokale v1-Wire-Policy implementiert; der einmalige Schema-1-Lauf `chrome-stable-win-01` bleibt mit `normalSyntheticTransport: FAIL`, `pnaLnaPermission: UNPROVEN`, nicht ausgeführten Negativvektoren und `cleanupRedaction: PASS` dokumentiert; `overallGate: FAIL`, Ursache `CAUSE_NOT_PROVEN`; ADR 0032 ersetzt ADR 0031 formal und totalisiert ausschließlich den separaten passiven Diagnosevertrag, implementiert oder autorisiert aber weder Diagnosefoundation noch Adapter oder Runtimevorgang; BrowserSyncTransport weiterhin weder mit SyncService noch in `src/main.js` komponiert; Browser-End-to-End-Fluss fehlt; n8n Stable OSS und Aktivierung `FAIL`, Tenant-, Provider-/Execution- und Production-Evidenz `UNPROVEN`; Provideradapter weiterhin nicht autorisiert |
| Letzte Aktualisierung | 2026-09-02 |

Dieses Dokument definiert die implementierten lokalen Speicherverträge für
PromptVault, LearningHub-Inhalte, LearningHub-Fortschritt, LearningArtifacts,
die lokale LearningTestBank und abgeschlossene LearningTestAttempts. Es
dokumentiert außerdem den implementierten LichtwaldLog-Schema-1-Vertrag, seine
begrenzte private Full-Snapshot-Persistenz, die darauf aufbauenden lokalen
Service-, Controller- sowie isolierte View- und CSS-Foundation, die reine
lokale Such- und Filterableitung und deren Anwendungskomposition in
`src/main.js`. Es dokumentiert außerdem den implementierten transportneutralen
`syncTest`-Kern, die darauf aufbauende SyncService Foundation, die
transportneutrale SyncGateway Request Boundary für bereits materialisierte
Raw-Body-Werte, die implementierte lokale Raw-Wire-/HTTP-Foundation auf
GD-WS01 und das daraus reproduzierbar generierte eigenständige Boundary-
Artefakt mit seinem SHA-256-Manifest, die lokal netzwerkinaktive Evidence-
Gate-Foundation aus ADR 0022, den isolierten lokalen modellfreien
`syncTest`-SyncAgent-Kern aus ADR 0024, den implementierten lokalen
Kompositionsvertrag aus ADR 0025, den durch ADR 0027 korrigierten und
inzwischen isoliert implementierten Browser SyncTransport Contract sowie die
mit ADR 0028 implementierte feste Validator-Integritätsgrenze, das durch ADR
0029 entschiedene und mit Gesamt-`FAIL` ausgeführte Runtimegate sowie den durch
ADR 0032 als formalen Ersatz für ADR 0031 davon getrennt totalisierten, noch
nicht implementierten
`BrowserTransportDiagnosticRecord`. ADR 0028
ersetzt ADR 0027 formal, übernimmt dessen
beide Korrekturen vollständig und ergänzt vor der Wirefreigabe genau eine
private feste v1-Wire-Policy. Alle nicht ausdrücklich geänderten Regeln aus
ADR 0026 und ADR 0027 gelten fort. ADR 0023
ersetzt den ursprünglich von ADR 0019
vorgesehenen verpflichtenden n8n-Cloud-Hop durch den lokalen
SyncAgent vor optionalen capability-spezifischen Providern. Die n8n-Evidenz
bleibt mit Stable-OSS-`FAIL`, Tenant-`UNPROVEN` und geschlossener Aktivierung
unverändert. Weitere maschinenlesbare Aktionen zwischen GoldenDawn OS,
`SyncAgent`, `DataAgent` und `TestAgent` bleiben ausdrücklich geplant. Das Dokument konkretisiert die
Grenzen aus `AGENTS.md`, `docs/architecture.md` und `docs/security.md`.

Der lokale PromptVault-Vertrag gilt für den abgeschlossenen Stand von `v0.2.0`.
In `v0.2.1` sind die LearningHub-Schema-2-Foundation, die lokale
Inhaltspersistenz sowie Controller und Inhaltsoberfläche implementiert. Der
separate Schema-1-Fortschrittsvertrag, seine Projektion, sein Service und seine
lokale Persistenz sind ebenfalls implementiert und über den vorhandenen
Controller und die View bedienbar. Die UI-Integration verändert keinen der
beiden Verträge. Zusätzlich sind der getrennte LearningArtifact-Schema-1-
Vertrag, sein privater lokaler Storage und sein referenzprüfender Service
implementiert und über den vorhandenen Controller sowie die View bedienbar.
Die UI-Integration verändert den LearningArtifact-Vertrag nicht. Zusätzlich
sind die getrennten Schema-1-Verträge für die veränderbare LearningTestBank und
den append-only LearningTestAttemptLog, ihre privaten Storages, die reine
deterministische Engine und der referenzprüfende LearningTestService
implementiert und über `src/main.js`, den vorhandenen
`LearningHubController` und die `LearningHubView` als lokaler
deterministischer Mock-Test bedienbar. Der LearningHub Local MVP ist vollständig
geprüft und veröffentlicht. Der annotierte Tag `v0.2.1` und das zugehörige
GitHub Release wurden am `2026-07-25` veröffentlicht; GoldenDawn OS ist
seitdem als öffentlich sichtbares Portfolio-Repository ohne Open-Source-Lizenz
verfügbar. Der transportneutrale `syncTest`-Vertragskern ist der erste
implementierte Slice von `v0.3.0`. Die ebenfalls implementierte SyncService
Foundation ergänzt den kontrollierten Request-Build, einen injizierten
Transport-Port und defensive normale Response-Verarbeitung. Die implementierte
SyncGateway Request Boundary Foundation begrenzt einen bereits
materialisierten Raw-Body-Wert, parst einen bestandenen String exakt einmal und
gibt ausschließlich eine defensive gültige Request-Projektion oder eine
kontrollierte frühe Gateway-Fehlerresponse aus. Darauf setzt nun die getrennte
Local SyncGateway Raw-Wire and HTTP Foundation auf: Ein explizit gestarteter
Node-Prozess bindet ausschließlich an `127.0.0.1`, setzt die lokale HTTP- und
Streamingpolicy durch, dekodiert bestandene Bytes exakt einmal streng als
UTF-8 und ruft die vorhandene Boundary exakt einmal auf. Ein akzeptierter
Request erreicht synchron und höchstens einmal den injizierten lokalen
SyncAgent; ausschließlich dessen exakt geeigneter ADR-0024-Erfolg ergibt nach
defensiver Responseprojektion lokal HTTP `200`. Die Generated n8n Boundary
Bundle Foundation ergänzt ausschließlich das
direkt bindbare Expression-IIFE und dessen Reproduzierbarkeits-, Integritäts-,
Snapshot-/ABA-, Outputpfad-, Paritäts- und Mutationsprüfungen.
Der isolierte lokale modellfreie `syncTest`-SyncAgent-Kern erzeugt inzwischen
aus einem gültigen Request eine neue validierte und korrelierte synthetische
Normalresponse. Der Gateway-/SyncAgent-Kompositionsvertrag aus ADR 0025 ist
implementiert. Der erste Implementierungsversuch des BrowserSyncTransport wurde
vor jeder Dateiänderung hart gestoppt. ADR 0027 ersetzt ADR 0026 und korrigiert
die nicht beweisbare Realmprovenienz sowie die öffentliche Erreichbarkeit der
privaten Requestgrenze. Nach dem Merge von ADR 0027 sind sein Modul und die
netzwerkfreie mutationswirksame Unit-Suite isoliert implementiert. Die
erneute defensive Prüfung hatte jedoch einen bestätigten Produktfehler
ergeben: Beide erforderlichen `validateSyncRequest`-Aufrufe
verwenden live manipulierbare Laufzeitfunktionen, während die bestehende
terminale Transportprüfung Shape, Freeze und Snapshotidentität, aber keine
unabhängigen festen v1-Werte bestätigt. Kontrollierte netzwerkfreie Proben
ließen dadurch vertragswidrige Versionen, Aktionen, Quellen und Request-IDs bis
zu Serialisierung, Controller, Timer und Fetch-Seam gelangen. Die damalige
grüne Suite mit 1604/1604 Tests bewies die Schließung dieser Lücke nicht. Die
nun implementierte feste v1-Wire-Policy schließt die Transportlücke; der
Contractvalidator selbst wurde nicht gehärtet. Die
Browserkomposition sowie optionale OpenAI-, lokale Modell- oder n8n-Adapter
bleiben nicht implementiert. Der SyncAgent-Kern ist ausschließlich über den
explizit gestarteten lokalen Gateway-Prozess erreichbar, der Browser nutzt ihn
noch nicht, und es gibt keinen externen Datenfluss. Alle
LearningTest-, DataAgent- und sonstigen
externen Agentenverträge bleiben Zielzustand späterer Slices beziehungsweise
Versionen.

Für `v0.2.2` sind der reine LichtwaldLog-Schema-1-Vertrag,
`validateLichtwaldLog`, die zugehörigen synthetischen Contract-Tests und die
private Storage-Foundation unter `goldendawn.lichtwaldLog.content.v1`
implementiert. Die darauf aufbauende Service-Foundation stellt den privaten
fachlichen Kern für Laden, Erstellen, vollständiges Bearbeiten, Löschen und
Fokusverwaltung bereit. Die Controller-Foundation koordiniert diesen Kern über
eine flüchtige, defensiv validierte UI-Projektion. Die isolierte View- und
CSS-Foundation stellt diese Projektion sicher dar und ist über den gemeinsamen
`StorageAdapter` in `src/main.js` komponiert. LichtwaldLog ist über die
Navigation mit dem sichtbaren Status `Lokales MVP` erreichbar; der lokale
UI-CRUD- und Fokusfluss ist vollständig über die Anwendung bedienbar und real
im Browser auf Desktop mit `1440 × 1000` sowie bei exakt `390 × 844` geprüft.
Die lokale Textsuche über Kalenderdatum, Titel, Text und Tags sowie exakte
Kalenderdatum- und Tagfilter sind als reine flüchtige Controllerableitung
implementiert. Die strikt getrennte synthetische In-Memory-Demo ist als eigener
vollständig bedienbarer Storage-, Service-, Controller- und View-Stack
umgesetzt. Die lokalen Foundations und ihre Komposition führen keine externe
Aktion ein. Der funktionale Umfang ist vollständig abgeschlossen und geprüft.
Der annotierte Tag `v0.2.2` und das zugehörige GitHub Release wurden am
`2026-08-02` veröffentlicht; `v0.2.2` ist das neueste veröffentlichte Release.
`v0.3.0` baut auf den drei implementierten transportneutralen Foundations,
der lokalen Raw-Wire-/HTTP-Foundation und der durch ADR 0023 entschiedenen
lokalen SyncAgent-Grenze auf. Die Raw-Wire-/HTTP-Foundation ist implementiert und mit
gezielten, kombinierten und vollständigen Tests sowie dem Produktions-Build
verifiziert.

Solange eine externe Aktion noch nicht implementiert ist, muss sie in UI und
Dokumentation als geplant gekennzeichnet bleiben.

## Vertragsgrenzen der lokalen Module v0.2.1 und v0.2.2

Die lokalen Module `v0.2.1` und `v0.2.2` erweitern die externe
Aktions-Allowlist dieses Dokuments nicht. LearningHub-Inhalt,
LearningProgress, LearningArtifacts, LearningTestBank und
LearningTestAttemptLog sind rein interne Datenverträge und führen keine
externe Aktion ein. Der LichtwaldLog-Schema-1-Vertrag ist ebenfalls rein
intern. Seine implementierte private Persistenz verwendet den festen Namespace
`goldendawn.lichtwaldLog.content.v1`; das `v1` im Key und
`schemaVersion: 1` werden unabhängig versioniert. Die implementierten
LearningHub-Persistenzen verwenden die getrennten festen
Namespaces `goldendawn.learningHub.content.v1`,
`goldendawn.learningHub.progress.v1`,
`goldendawn.learningHub.artifacts.v1`,
`goldendawn.learningHub.testBank.v1` und
`goldendawn.learningHub.testAttempts.v1`. Das jeweilige `v1` im Key bezeichnet
keine Schemaversion: Der Inhaltsvertrag bleibt bei `schemaVersion: 2`; die vier
anderen lokalen Verträge verwenden unabhängig davon jeweils
`schemaVersion: 1`. Die nachfolgenden externen `learningTest.*`-Verträge
bleiben ausdrücklich ein Zielzustand für `v0.5.0` und sind nicht mit den
lokalen Serviceoperationen gleichzusetzen. Die internen `DataAgent`-Verträge
sind Zielzustände für `v0.4.0` und, im Lernfluss, `v0.5.0`.

### v0.2.1 – LearningHub Local MVP

Der implementierte vollständige Pfad für die lokale Inhaltsverwaltung bleibt
vollständig lokal:

```text
LearningHubView
  → LearningHubController
  → LearningHubService
  → LearningHubStorage
  → StorageAdapter
  → localStorage
```

Implementiert sind `LearningHubView`, `LearningHubController`,
`createLearningHubService` mit `loadHub`, `createModule`, `renameModule`,
`addChapter`, `renameChapter`, `addLearningNode` und `updateLearningNode`
sowie `createLearningHubStorage` mit `loadLearningHub` und
`saveLearningHub`. Modulauswahl, Accordion-Zustände, Node-Auswahl und
Formularzustände bleiben flüchtig im Controller beziehungsweise in der View
und werden nicht in den Inhaltsvertrag geschrieben.

Daneben ist die lokale Progress-Foundation über
`validateLearningProgress`, `projectLearningProgress`,
`createLearningProgressService` und `createLearningProgressStorage`
implementiert. `src/main.js` injiziert den Progress-Service in den bestehenden
`LearningHubController`; Kapitel-Checkboxen sowie sichtbare Modulzähler,
Prozentwerte und Fortschrittsbalken verwenden ausschließlich die validierte
Projektion. Es gibt keinen separaten Progress-Controller.

Die ebenfalls implementierte LearningArtifact-Foundation umfasst
`validateLearningArtifactStore`, `createLearningArtifactService` und
`createLearningArtifactStorage`. Sie speichert aktuelle private Notizen und
Zusammenfassungen getrennt von Inhalt und Fortschritt. Der Artifact-Service
prüft Referenzen über `LearningHubService`; der Inhaltsservice besitzt keine
Rückabhängigkeit. `src/main.js` injiziert ihn in den vorhandenen
`LearningHubController`; die `LearningHubView` macht aktuelle Notizen und
Zusammenfassungen lokal bedienbar. Es gibt keinen separaten
LearningArtifact-Controller.

Davon getrennt ist der lokale LearningTest-Pfad mit UI-Anbindung implementiert:

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

Die reine Engine präzisiert und ersetzt für diese Foundation die frühere
`MockLearningTestProvider`-Platzhalterplanung. Die nutzergesteuerte Testbank
ist die getrennte Fragenquelle; die Engine bleibt auf Auswahl, öffentliche
Projektion und Auswertung ohne Seiteneffekte begrenzt. Die UI-Anbindung führt
weder Agenten- noch externe Providerlogik ein.

Sie verwendet nutzerkonfigurierte Single-Choice-Fragen, arbeitet ohne Zufall
und speichert ausschließlich abgeschlossene Attempts. Laufende Sessions
bleiben flüchtig. Dieser lokale Ablauf verwendet weder `SyncAgent` noch
`TestAgent` und ist nicht mit den geplanten externen Aktionen
`learningTest.create`, `learningTest.evaluate` oder
`learningTest.result.get` gleichzusetzen. Die UI kennzeichnet ihn sichtbar als
„Lokaler Mock-Test“. `v0.2.1` ist vollständig geprüft und veröffentlicht. Von
`v0.2.2 – LichtwaldLog Local MVP` sind die nachfolgend dokumentierte Contract-
und private Storage-Foundation sowie die darauf aufbauenden Service- und
Controller-Foundations und die isolierte View- und CSS-Foundation vollständig
abgeschlossen und geprüft. `src/main.js`
komponiert sie über den gemeinsamen
`StorageAdapter`; Navigation und der vollständig über die Anwendung bedienbare
UI-CRUD- und Fokusfluss sind ebenfalls implementiert und real im Browser auf
Desktop sowie bei exakt `390 × 844` geprüft. Lokale Textsuche sowie exakte
Kalenderdatum- und Tagfilter sind ebenfalls implementiert und nicht
persistiert. Die getrennte synthetische Demo-Runtime ist als unabhängiger
In-Memory-Stack implementiert und als Teil desselben rein lokalen
`v0.2.2`-Umfangs geprüft.

#### Interner LearningHub-Vertrag – Schema 2

Schema 2 beschreibt ausschließlich die Inhaltsstruktur:

```json
{
  "schemaVersion": 2,
  "dataOrigin": "synthetic",
  "modules": [
    {
      "id": "demo_module_garden",
      "title": "Erfundene Ideenwerkstatt",
      "position": 1,
      "chapters": [
        {
          "id": "demo_chapter_observations",
          "title": "Neutrale Beobachtungen",
          "position": 1,
          "learningNodes": [
            {
              "id": "demo_node_perspectives",
              "title": "Zwei Blickwinkel",
              "content": "Beschreibe eine erfundene Beobachtung aus zwei Perspektiven.",
              "position": 1
            }
          ]
        }
      ]
    }
  ]
}
```

Die verbindliche Hierarchie lautet **LearningHub → LearningModule →
LearningChapter → LearningNode**. `schemaVersion` ist exakt `2`; Schema 1 und
unbekannte Versionen werden abgelehnt. `dataOrigin` erlaubt ausschließlich
`synthetic` oder `private`. `modules` ist ein Array, darf für einen neuen Hub
leer sein und unterstützt mehrere Module. Jedes persistierbare Modul besitzt
mindestens ein Kapitel. `learningNodes` ist ein Array und darf leer sein.

IDs, Titel und LearningNode-Inhalte sind nicht leer und bereits getrimmt. IDs
sind über Module, Kapitel und LearningNodes hinweg global eindeutig.
`position` ist eine positive Ganzzahl und unter Geschwistern eindeutig; gleiche
Positionen unter verschiedenen Eltern sind zulässig. Die Validierung
normalisiert oder verändert Eingaben nicht und sammelt Fehler stabil als
`{ code, path, message }`.

Alle Kapitel sind implizit trackbar; `isTrackable` wird nicht gespeichert.
Course, Unit, `parentId`, rekursive Strukturverweise, Knotentypen, Abschluss-
und Fortschrittsfelder, UI-Zustände und Aktionen, Testdaten, Zeitstempel und
Versionshistorien gehören nicht zu Schema 2. Kapitelabschluss und
Modulfortschritt verwenden den nachfolgend dokumentierten separaten
LearningProgress-Vertrag. Testkompetenz bleibt davon getrennt.

Der tief eingefrorene Demo-Hub enthält genau das Modul
`[Demo] KI-Grundlagen – vom Datensatz zum Transformer` mit drei Kapiteln und
vier LearningNodes in fester Reihenfolge. Seine Inhalte sind unabhängig
erfunden und tragen in der kanonischen Repository-Quelle
`dataOrigin: synthetic`; private Nutzerdaten tragen `dataOrigin: private` und
werden nie in diese Quelle übernommen. Die zugehörigen acht Artefakte und
sieben Fragen stammen aus derselben kanonischen Seed-Definition. Eine
Migration ist nicht erforderlich, weil keine LearningHub-Nutzerdaten nach
Schema 1 persistiert wurden.

Schema 2 bleibt ein reiner Inhaltsvertrag. Die lokale Persistenz speichert
genau diesen Vertrag, ergänzt ihn aber nicht um UI-, Fortschritts-, Notiz- oder
Testfelder. Diese getrennten Belange benötigen eigene Service-, Storage- und
Datenverträge.

#### Lokaler LearningHub-Inhaltsspeichervertrag

##### Storage-Key und Versionssemantik

LearningHub-Inhalte verwenden ausschließlich diesen festen, nicht
nutzergesteuerten Storage-Key:

```text
goldendawn.learningHub.content.v1
```

Das `v1` im Storage-Key bezeichnet den Persistenz-Namespace. Es ist weder die
Schemaversion des gespeicherten Hubs noch ein Hinweis auf eine Schema-1-
Migration. Der gespeicherte Wert ist unmittelbar ein LearningHub mit
`schemaVersion: 2`; ein zusätzlicher Storage-Envelope oder eine zweite
Serialisierungslogik wird nicht eingeführt.

Der Key enthält ausschließlich LearningHub-Inhalte. Kapitelabschluss und
Fortschritt gehören in den getrennten Vertrag unter
`goldendawn.learningHub.progress.v1`. Notizen und Zusammenfassungen gehören in
den nachfolgend dokumentierten LearningArtifact-Vertrag unter
`goldendawn.learningHub.artifacts.v1`. Fragen und abgeschlossene Testversuche
gehören in keinen dieser Werte; sie verwenden die getrennten Verträge unter
`goldendawn.learningHub.testBank.v1` und
`goldendawn.learningHub.testAttempts.v1`.

`dataOrigin` klassifiziert die Herkunft als `synthetic` oder `private`. Das Feld
ist keine Verschlüsselungs-, Authentifizierungs- oder Sicherheitsfunktion.

##### Initialzustand und Demo-Trennung

Fehlt der Storage-Key, liefert das Laden im Arbeitsspeicher einen neuen leeren
privaten Hub:

```json
{
  "schemaVersion": 2,
  "dataOrigin": "private",
  "modules": []
}
```

Dieser reine Lesevorgang schreibt nichts. Erst eine erfolgreiche fachliche
Mutation persistiert den vollständigen neuen Hub. Zusätzlich darf der in
ADR 0012 definierte vorgelagerte Erststartkoordinator den kanonischen
synthetischen Demo-Datensatz genau einmal als private, lokal editierbare
Arbeitskopie speichern. Diese Ausnahme gehört nicht zu `loadLearningHub()` und
verändert dessen schreibfreies Verhalten nicht.

Der Erststart gilt nur dann als vollständig uninitialisiert, wenn alle vier
Keys fehlen:

```text
goldendawn.learningHub.content.v1
goldendawn.learningHub.artifacts.v1
goldendawn.learningHub.testBank.v1
goldendawn.learningHub.demoInitialization.v1
```

Jeder vorhandene Fachstore verhindert das Seeding, auch wenn sein Vertragswert
leer oder technisch nicht auswertbar ist. Der Koordinator ergänzt,
normalisiert oder überschreibt einen solchen Wert nicht. Er validiert Hub,
Artifact-Store und Testbank vollständig vor dem ersten Write, prüft ihre
Referenzketten und schreibt danach sequenziell über die bestehenden
Fachstorages. Progress und Attempts gehören nicht zum Seed.

Der Marker wird als letzter Wert geschrieben und besitzt bei neuen Writes
exakt diese Form:

```json
{
  "schemaVersion": 1,
  "initializationCompleted": true,
  "decision": "seeded"
}
```

`decision` ist `seeded` oder `skippedExistingData`. Bereits die Existenz des
Marker-Keys gilt als abgeschlossene Entscheidung; sein Inhalt wird nicht zur
Freigabe eines erneuten Seeds herangezogen. Wiederholte Aufrufe schreiben
nichts, lokale Bearbeitungen bleiben erhalten und ein später gelöschtes Demo
kehrt bei erhaltenem Marker nicht zurück. Nur das vollständige Löschen aller
lokalen Anwendungsdaten einschließlich Marker ermöglicht einen neuen
Erststart.

Scheitert ein Fach- oder Marker-Write, gleicht der Koordinator jeden
möglicherweise angelegten Fachwert mit dem vorbereiteten serialisierten Seed
ab. Nur ein weiterhin bytegleicher Seed-Wert darf in umgekehrter Reihenfolge
entfernt werden; fremde oder zwischenzeitlich geänderte Werte bleiben
unangetastet. Dies ist eine defensive Rollback-Strategie, aber keine
Multi-Key-Transaktion oder Multi-Tab-Sperre.

Fehlende Daten sind ausdrücklich von ungültigem JSON, ungültigen Schema-Daten,
einer falschen Datenherkunft und Adapterfehlern zu unterscheiden. Beschädigte
oder ungültige gespeicherte Daten werden nicht automatisch gelöscht,
überschrieben oder durch den leeren privaten Initialzustand ersetzt. Es wird
keine Migration für nicht vorhandene Schema-1-Nutzerdaten erfunden.

##### LearningHubStorage

`createLearningHubStorage` erhält den gemeinsamen `StorageAdapter` per
Dependency Injection und stellt ausschließlich `loadLearningHub` und
`saveLearningHub` bereit. Beide Operationen verwenden nur den festen
LearningHub-Key.

Geladene und zu speichernde Werte werden vollständig mit
`validateLearningHub` validiert. Der private Persistenzpfad verlangt zusätzlich
`dataOrigin: 'private'`. Der Storage unterscheidet einen fehlenden Key von
beschädigten oder ungültigen Daten und von technischen Lese-, Schreib-,
Verfügbarkeits- und Quota-Fehlern. Technische Fehler werden in stabile lokale
Fehlerergebnisse übersetzt; rohe `DOMException`- oder Storage-Objekte und
private Titel oder LearningNode-Texte werden nicht an höhere Schichten oder
Logs weitergereicht.

Die JSON-Serialisierung verbleibt beim gemeinsamen `StorageAdapter`.
`LearningHubStorage` erzeugt keine zweite Serialisierungslogik und führt bei
Fehlern weder automatische Löschungen noch Reparaturwrites aus.

##### LearningHubService und Mutationen

`createLearningHubService` verwendet den Storage als persistente Quelle und
stellt diese öffentlichen Operationen bereit:

| Operation | Fachliche Wirkung |
| --- | --- |
| `loadHub()` | aktuellen privaten Hub laden oder bei fehlendem Key den unpersistierten leeren Initialzustand liefern |
| `createModule({ title, firstChapterTitle })` | Modul und erstes Kapitel atomar am Ende der jeweiligen Listen anlegen |
| `renameModule({ moduleId, title })` | Modultitel ändern und Identität, Position sowie Kapitel erhalten |
| `addChapter({ moduleId, title })` | Kapitel im angegebenen Modul ergänzen |
| `renameChapter({ moduleId, chapterId, title })` | Kapiteltitel ändern und Identität, Position sowie LearningNodes erhalten |
| `addLearningNode({ moduleId, chapterId, title, content })` | Textkarte im angegebenen Kapitel ergänzen |
| `updateLearningNode({ moduleId, chapterId, learningNodeId, title, content })` | Titel und Inhalt einer Textkarte ändern; Identität und Position erhalten |

Jede Mutation folgt derselben Reihenfolge:

1. aktuellen Hub laden;
2. Zielzuordnung und Eingaben prüfen;
3. einen neuen Zustand ohne Mutation des geladenen Hubs oder des
   Eingabeobjekts erzeugen;
4. den vollständigen neuen Hub mit `validateLearningHub` validieren;
5. genau einmal über `saveLearningHub` speichern;
6. nur nach erfolgreicher Speicherung den aktualisierten Zustand zurückgeben.

Eingabetexte werden vor der fachlichen Prüfung und damit vor der Längenprüfung
an den Rändern getrimmt. Der `LearningHubService` begrenzt alle Modul-, Kapitel-
und LearningNode-Titel auf maximal 120 Zeichen sowie LearningNode-Inhalte auf
maximal 10.000 Zeichen. Leere Titel und leere LearningNode-Inhalte werden vor
jedem Schreibzugriff abgelehnt. Nicht gefundene oder falsch zugeordnete Modul-,
Kapitel- und LearningNode-IDs erzeugen kontrollierte Fehler und keinen
Schreibzugriff.

Diese Werte sind Eingabegrenzen der Anwendungsschicht. Der persistierte
Inhaltsvertrag bleibt unverändert bei `schemaVersion: 2`; es wird weder ein
neues Vertragsfeld noch eine Schema-3-Erweiterung eingeführt. Die Grenzen
reduzieren versehentlich übergroße einzelne Eingaben, ersetzen aber weder die
kontrollierte Quota-Behandlung noch eine allgemeine Größenbegrenzung des
vollständigen LearningHubs.

Neue IDs werden ausschließlich im Service über einen injizierbaren Generator
erzeugt. Sie müssen getrimmt, nicht leer und im gesamten Hub eindeutig sein;
Kollisionen oder fehlerhafte Generatoren werden mit einer begrenzten Zahl von
Versuchen behandelt. Bestehende IDs ändern sich bei Mutationen nicht. Neue
Positionen liegen hinter der höchsten vorhandenen Geschwisterposition und
werden nicht nur aus der Array-Länge abgeleitet.

`createModule` speichert Modul und erstes Kapitel atomar, sodass zu keinem
Zeitpunkt ein vertragswidriges Modul ohne Kapitel persistiert wird. Schlägt
Zielprüfung, Eingabevalidierung, ID-Erzeugung, vollständige Vertragsvalidierung
oder Speicherung fehl, wird kein teilweise veränderter Hub geschrieben.

Löschen, Archivieren, Umsortieren, Schema-Migrationen und garantierte
Multi-Tab-Synchronisierung oder Transaktionssperren gehören nicht zu diesem
Vertrag.

#### Lokale LearningTestBank – Schema 1

##### Trennung und Persistenznamespace

Die LearningTestBank speichert nutzerkonfigurierte Single-Choice-Fragen als
veränderbaren aktuellen Bestand. Sie erweitert weder den LearningHub-Inhalt
noch Progress, LearningArtifacts oder die abgeschlossene Versuchshistorie:

| Belang | Vertrag | Storage-Key | Lebenszyklus |
| --- | --- | --- | --- |
| Module, Kapitel und LearningNodes | LearningHub `schemaVersion: 2` | `goldendawn.learningHub.content.v1` | editierbarer Inhalt |
| Kapitelzustandswechsel und Modulfortschritt | LearningProgress `schemaVersion: 1` | `goldendawn.learningHub.progress.v1` | append-only Ereignisfolge |
| Notizen und Zusammenfassungen | LearningArtifact `schemaVersion: 1` | `goldendawn.learningHub.artifacts.v1` | editierbarer aktueller Stand |
| Single-Choice-Fragen | LearningTestBank `schemaVersion: 1` | `goldendawn.learningHub.testBank.v1` | veränderbarer aktueller Fragenbestand |
| abgeschlossene Testversuche | LearningTestAttemptLog `schemaVersion: 1` | `goldendawn.learningHub.testAttempts.v1` | append-only Attempts |

Die Zahlen in den Keys versionieren ausschließlich ihre Persistenz-Namespaces.
Der LearningTestBank-Vertrag wird unabhängig davon durch
`schemaVersion: 1` versioniert.

##### LearningTestBank: Struktur und Validierung

```json
{
  "schemaVersion": 1,
  "dataOrigin": "synthetic",
  "questions": [
    {
      "id": "question_synthetic_1",
      "moduleId": "module_synthetic_1",
      "chapterId": "chapter_synthetic_1",
      "learningNodeId": "node_synthetic_1",
      "type": "singleChoice",
      "prompt": "Welche erfundene Markierung zeigt nach Norden?",
      "difficulty": "easy",
      "position": 1,
      "revision": 1,
      "createdAt": "2026-07-19T10:00:00.000Z",
      "updatedAt": "2026-07-19T10:00:00.000Z",
      "options": [
        {
          "id": "option_synthetic_blue",
          "label": "Die blaue Raute",
          "position": 1
        },
        {
          "id": "option_synthetic_gold",
          "label": "Der goldene Kreis",
          "position": 2
        }
      ],
      "correctOptionId": "option_synthetic_blue",
      "explanation": "Im erfundenen Beispiel markiert die blaue Raute Norden."
    }
  ]
}
```

Root, Fragen und Optionen besitzen jeweils ausschließlich die dokumentierten
eigenen Pflichtfelder. Vertragsobjekte akzeptieren nur
`Object.prototype` oder `null` als direkten Prototyp. Arrays oder `null` sind
an Objektstellen ungültig. Zusätzliche, unbekannte oder geerbte Vertragsfelder
und benutzerdefinierte Prototypen werden kontrolliert abgelehnt.

| Feld | Typ | Regel |
| --- | --- | --- |
| `schemaVersion` | Ganzzahl | exakt `1` |
| `dataOrigin` | String | ausschließlich `synthetic` oder `private` |
| `questions` | Array | darf leer sein |
| `questions[].id` | String | nicht leer, bereits getrimmt und zusammen mit allen Option-IDs bankweit eindeutig |
| `questions[].moduleId` | String | nicht leer und bereits getrimmt |
| `questions[].chapterId` | String | nicht leer und bereits getrimmt |
| `questions[].learningNodeId` | String | nicht leer und bereits getrimmt |
| `questions[].type` | String | exakt `singleChoice` |
| `questions[].prompt` | String | nicht leer, bereits getrimmt und höchstens 500 Zeichen |
| `questions[].difficulty` | String | `easy`, `medium` oder `hard` |
| `questions[].position` | positive Ganzzahl | innerhalb desselben LearningNodes eindeutig |
| `questions[].revision` | positive Ganzzahl | steigt bei tatsächlichen Updates |
| `questions[].createdAt` | String | kanonischer UTC-Zeitstempel im exakten Format `YYYY-MM-DDTHH:mm:ss.sssZ` |
| `questions[].updatedAt` | String | dasselbe kanonische UTC-Format und nicht vor `createdAt` |
| `questions[].options` | Array | zwei bis sechs Einträge |
| `questions[].options[].id` | String | nicht leer, bereits getrimmt und zusammen mit allen Frage- und Option-IDs bankweit eindeutig |
| `questions[].options[].label` | String | nicht leer, bereits getrimmt und höchstens 300 Zeichen |
| `questions[].options[].position` | positive Ganzzahl | innerhalb der Frage eindeutig |
| `questions[].correctOptionId` | String | nicht leer, bereits getrimmt und exakt die ID einer Option derselben Frage |
| `questions[].explanation` | String | bereits getrimmt, darf leer sein und umfasst höchstens 2.000 Zeichen |

Fragepositionen sind nur innerhalb desselben LearningNodes eindeutig; gleiche
Positionen an unterschiedlichen LearningNodes sind zulässig. Optionspositionen
sind nur innerhalb ihrer jeweiligen Frage eindeutig. Die Arrayreihenfolge ist
nicht die Testreihenfolge: Die Engine verwendet die dokumentierten
Strukturpositionen.

Der reine Validator sammelt alle strukturell auffindbaren Fehler vollständig
und stabil als `{ code, path, message }`. Meldungen enthalten keine privaten
Prompts, Optionslabel, Erklärungen, IDs oder sonstigen Rohwerte. Die Validierung
verändert oder normalisiert ihre Eingabe nicht. Ob die drei Referenz-IDs im
aktuellen LearningHub existieren und ihre vollständige Elternkette bilden,
prüft bewusst erst der `LearningTestService`.

Confidence, Hinweise, Freitext-Rubriken und Kompetenzstände gehören nicht zu
Schema 1. Sie sind ausschließlich mögliche spätere versionierte Erweiterungen;
dieser Vertrag reserviert oder erfindet keine Felder dafür.

Die stabilen Bank-Validatorcodes lauten:

| Code | Bedeutung |
| --- | --- |
| `invalidLearningTestBank` | Root ist kein unterstütztes Vertragsobjekt |
| `unsupportedSchemaVersion` | `schemaVersion` ist nicht exakt `1` |
| `invalidDataOrigin` | Herkunft ist weder `synthetic` noch `private` |
| `invalidQuestions` | `questions` ist kein Array |
| `invalidQuestion` | Frage ist kein unterstütztes Vertragsobjekt oder besitzt einen unzulässigen Prototype |
| `unknownProperty` | ein unterstütztes Root-, Frage- oder Optionsobjekt enthält einen unbekannten eigenen Schlüssel |
| `missingProperty` | ein erforderliches eigenes Feld fehlt |
| `invalidId` | ID oder Referenz ist leer, ungetrimmt oder kein String |
| `duplicateId` | Frage- oder Option-ID ist bankweit nicht eindeutig |
| `invalidQuestionType` | Fragetyp ist nicht `singleChoice` |
| `invalidPrompt` | Prompt ist leer, ungetrimmt oder kein String |
| `promptTooLong` | Prompt überschreitet 500 Zeichen |
| `invalidDifficulty` | Schwierigkeit ist nicht `easy`, `medium` oder `hard` |
| `invalidPosition` | Frage- oder Optionsposition ist keine positive Ganzzahl |
| `duplicateQuestionPosition` | Frageposition ist im LearningNode nicht eindeutig |
| `invalidRevision` | Revision ist keine positive Ganzzahl |
| `invalidCreatedAt` | Erstellungszeitpunkt ist nicht kanonisch |
| `invalidUpdatedAt` | Änderungszeitpunkt ist nicht kanonisch |
| `updatedAtBeforeCreatedAt` | Änderungszeitpunkt liegt vor dem Erstellungszeitpunkt |
| `invalidOptions` | `options` ist kein Array |
| `invalidOptionCount` | Frage besitzt nicht zwei bis sechs Optionen |
| `invalidOption` | Option ist kein unterstütztes Vertragsobjekt oder besitzt einen unzulässigen Prototype |
| `duplicateOptionPosition` | Optionsposition ist in der Frage nicht eindeutig |
| `invalidOptionLabel` | Optionslabel ist leer, ungetrimmt oder kein String |
| `optionLabelTooLong` | Optionslabel überschreitet 300 Zeichen |
| `correctOptionNotFound` | `correctOptionId` gehört nicht zu einer Option derselben Frage |
| `invalidExplanation` | Erklärung ist ungetrimmt oder kein String |
| `explanationTooLong` | Erklärung überschreitet 2.000 Zeichen |

#### Lokaler LearningTestAttemptLog – Schema 1

##### Struktur abgeschlossener Testversuche

```json
{
  "schemaVersion": 1,
  "dataOrigin": "synthetic",
  "attempts": [
    {
      "id": "attempt_synthetic_1",
      "moduleId": "module_synthetic_1",
      "startedAt": "2026-07-19T10:05:00.000Z",
      "completedAt": "2026-07-19T10:06:00.000Z",
      "totalQuestionCount": 1,
      "correctAnswerCount": 1,
      "scorePercent": 100,
      "answers": [
        {
          "questionId": "question_synthetic_1",
          "questionRevision": 1,
          "learningNodeId": "node_synthetic_1",
          "selectedOptionId": "option_synthetic_blue",
          "correctOptionId": "option_synthetic_blue",
          "isCorrect": true
        }
      ]
    }
  ]
}
```

Root, Attempts und Antworten besitzen ausschließlich die dargestellten eigenen
Pflichtfelder und akzeptieren nur `Object.prototype` oder `null` als direkten
Prototyp. Zusätzliche, unbekannte oder geerbte Vertragsfelder,
benutzerdefinierte Prototypen und Nichtobjekte werden abgelehnt.

| Feld | Typ | Regel |
| --- | --- | --- |
| `schemaVersion` | Ganzzahl | exakt `1` |
| `dataOrigin` | String | ausschließlich `synthetic` oder `private` |
| `attempts` | Array | darf leer sein; Append-Reihenfolge ist autoritativ |
| `attempts[].id` | String | nicht leer, bereits getrimmt und im Log eindeutig |
| `attempts[].moduleId` | String | nicht leer und bereits getrimmt |
| `attempts[].startedAt` | String | kanonischer UTC-Zeitstempel im exakten Format `YYYY-MM-DDTHH:mm:ss.sssZ` |
| `attempts[].completedAt` | String | dasselbe kanonische UTC-Format und nicht vor `startedAt` |
| `attempts[].totalQuestionCount` | positive Ganzzahl | exakt `answers.length` |
| `attempts[].correctAnswerCount` | nicht-negative Ganzzahl | exakt die Zahl der Antworten mit `isCorrect: true` |
| `attempts[].scorePercent` | Ganzzahl | exakt `Math.round(correctAnswerCount / totalQuestionCount * 100)` |
| `attempts[].answers` | Array | mindestens eine Antwort in autoritativer Testreihenfolge |
| `attempts[].answers[].questionId` | String | nicht leer, bereits getrimmt und innerhalb des Attempts eindeutig |
| `attempts[].answers[].questionRevision` | positive Ganzzahl | eingefrorene Revision der beantworteten Frage |
| `attempts[].answers[].learningNodeId` | String | nicht leer und bereits getrimmt |
| `attempts[].answers[].selectedOptionId` | String | nicht leer und bereits getrimmt |
| `attempts[].answers[].correctOptionId` | String | nicht leer und bereits getrimmt |
| `attempts[].answers[].isCorrect` | Boolean | exakt `selectedOptionId === correctOptionId` |

Fragen und Antworten erscheinen in der beim Teststart autoritativ bestimmten
Reihenfolge; jede `questionId` kommt in einem Attempt genau einmal vor. Der Log
wird weder bei der Validierung noch beim Laden anhand von Zeitstempeln sortiert.
Zeitstempel beschreiben den Versuch, während die Arrayreihenfolge seine
persistierte Historie festlegt. Fragen-, Options- und LearningNode-Texte werden
nicht in Attempts kopiert.

Der Validator prüft alle ableitbaren Zähler, den exakten Prozentwert und jede
Korrektheitsgleichheit, sammelt strukturell auffindbare Fehler vollständig als
stabile `{ code, path, message }`-Einträge und verändert seine Eingabe nicht.
Fehlermeldungen enthalten keine Antworten, IDs, Zeitstempel oder Rohwerte.

Schema 1 enthält keine Confidence-Werte, Hinweise, Freitext-Rubriken,
semantische Bewertung oder Kompetenzprojektion. Solche Fähigkeiten benötigen
eine spätere versionierte Erweiterung und werden nicht durch leere optionale
Felder vorweggenommen.

Die stabilen Attempt-Validatorcodes lauten:

| Code | Bedeutung |
| --- | --- |
| `invalidLearningTestAttemptLog` | Root ist kein unterstütztes Vertragsobjekt |
| `unsupportedSchemaVersion` | `schemaVersion` ist nicht exakt `1` |
| `invalidDataOrigin` | Herkunft ist weder `synthetic` noch `private` |
| `invalidAttempts` | `attempts` ist kein Array |
| `invalidAttempt` | Attempt ist kein unterstütztes Vertragsobjekt oder besitzt einen unzulässigen Prototype |
| `unknownProperty` | ein unterstütztes Root-, Attempt- oder Antwortobjekt enthält einen unbekannten eigenen Schlüssel |
| `missingProperty` | ein erforderliches eigenes Feld fehlt |
| `invalidId` | ID oder Referenz ist leer, ungetrimmt oder kein String |
| `duplicateAttemptId` | Attempt-ID ist im Log nicht eindeutig |
| `invalidStartedAt` | Startzeitpunkt ist nicht kanonisch |
| `invalidCompletedAt` | Abschlusszeitpunkt ist nicht kanonisch |
| `completedAtBeforeStartedAt` | Abschlusszeitpunkt liegt vor dem Startzeitpunkt |
| `invalidTotalQuestionCount` | Gesamtzahl ist keine positive Ganzzahl |
| `invalidCorrectAnswerCount` | Korrektzahl ist keine nicht-negative Ganzzahl |
| `invalidScorePercent` | Prozentwert ist keine Ganzzahl im gültigen Bereich |
| `invalidAnswers` | `answers` ist kein Array |
| `attemptRequiresAnswer` | Attempt enthält keine Antwort |
| `invalidAnswer` | Antwort ist kein unterstütztes Vertragsobjekt oder besitzt einen unzulässigen Prototype |
| `duplicateQuestionId` | Frage kommt im Attempt mehrfach vor |
| `invalidQuestionRevision` | Fragenrevision ist keine positive Ganzzahl |
| `invalidIsCorrect` | `isCorrect` ist kein Boolean |
| `inconsistentIsCorrect` | `isCorrect` widerspricht dem strikten ID-Vergleich |
| `totalQuestionCountMismatch` | Gesamtzahl entspricht nicht `answers.length` |
| `correctAnswerCountMismatch` | Korrektzahl entspricht nicht den korrekten Antworten |
| `scorePercentMismatch` | Prozentwert entspricht nicht der exakten `Math.round`-Formel |

#### Lokale LearningTest-Persistenzgrenzen

`createLearningTestBankStorage` erhält ausschließlich den gemeinsamen
`StorageAdapter` und verwendet den festen, nicht nutzerkontrollierten Key:

```text
goldendawn.learningHub.testBank.v1
```

Es stellt `loadLearningTestBank()` und `saveLearningTestBank(testBank)` bereit.
Ein erfolgreicher Load liefert `status: missing` oder `status: found` und den
vollständig defensiv geklonten Wert in `testBank`; ein erfolgreicher Save
liefert `status: saved`. Ein fehlender Key ergibt ohne
Initialisierungsschreibzugriff diesen frischen privaten Leerzustand:

```json
{
  "schemaVersion": 1,
  "dataOrigin": "private",
  "questions": []
}
```

`createLearningTestAttemptStorage` verwendet getrennt ausschließlich diesen
festen Key:

```text
goldendawn.learningHub.testAttempts.v1
```

Es stellt `loadLearningTestAttempts()` und
`appendLearningTestAttempt(attempt)` bereit. Ein erfolgreicher Load liefert
`status: missing` oder `status: found` und den defensiv geklonten Wert in
`attemptLog`. Ein fehlender Key ergibt schreibfrei einen frischen privaten Log
mit `schemaVersion: 1`, `dataOrigin: private` und leerem `attempts`-Array. Ein
erfolgreicher Append liefert `status: appended` und den vollständigen neuen
defensiv geklonten `attemptLog`.

Der einmalige LearningHub-Demo-Erststart legt diesen Attempt-Key ausdrücklich
nicht an. Fragen werden vorbefüllt, aber Attempts, Antworten, Ergebnisse und
Historieneinträge entstehen erst durch eine vom Nutzer abgeschlossene Abgabe.

`LearningTestAttemptStorage` besitzt keinen öffentlichen allgemeinen
Save-Pfad. Vor dem Schreiben lädt und validiert es den aktuellen vollständigen
Log und hängt genau einen neuen, validen Attempt an einen unveränderten
gültigen Präfix. Bestehende Attempts dürfen weder verändert, entfernt noch
umsortiert werden. Eine doppelte Attempt-ID oder ein abweichender historischer
Präfix blockiert den Schreibzugriff.

Beide Storages validieren Lese- und Schreibwerte vollständig, klonen sie
defensiv und akzeptieren im privaten Produktionspfad ausschließlich
`dataOrigin: private`. Synthetische, beschädigte oder nicht unterstützte Werte
werden weder gelöscht noch überschrieben oder als private Leerzustände
ausgegeben. Vor jedem Save beziehungsweise Append liest der Storage seinen
festen Key erneut. Nur ein fehlender Key oder ein vollständig valider privater
Bestand erlaubt den Schreibzugriff.

Stabile fachliche Storage-Fehler unterscheiden mindestens ungültige
Testbankdaten (`invalidLearningTestBankData`), falsche Bankherkunft
(`privateLearningTestBankRequired`), ungültige Attempt-Logs
(`invalidLearningTestAttemptLogData`) und falsche Attempt-Herkunft
(`privateLearningTestAttemptsRequired`) von den bestehenden technischen
Adapter-, Lese-, Schreib- und Quota-Fehlern. Meldungen geben keine Prompts,
Optionen, Erklärungen, Antworten, IDs, Rohwerte oder ungefilterten
Dependency-Fehler weiter. Es gibt keine Console-Ausgaben.

Der Read-Preflight ist keine Transaktion. Zwischen Lesen und Schreiben kann
sich derselbe Wert ändern; TOCTOU- und Multi-Tab-Rennen werden dadurch nicht
verhindert. `localStorage` ist unverschlüsselt und für JavaScript derselben
Origin grundsätzlich lesbar. `dataOrigin` ist nur eine Klassifikation, keine
Authentifizierung oder technische Geheimhaltungsgrenze. Browser-Quota,
fehlende Gesamtgrößenlimits, verlorene Änderungen, fehlende Synchronisierung
und das Löschen des Browserprofils bleiben bekannte Grenzen.

Append-only ist eine Service- und Storage-Regel über vollständig neu
geschriebene JSON-Snapshots. Es gibt keine kryptografische Verkettung,
Signatur, Manipulationssperre oder beweisbare Urheberschaft historischer
Attempts.

#### Reine LearningTestEngine

Die reine Engine exportiert drei Operationen:

| Operation | Wirkung |
| --- | --- |
| `selectModuleTestQuestions(learningHub, testBank, moduleId)` | alle Fragen des Moduls nach aktueller Hub-Struktur deterministisch auswählen |
| `projectPublicTestQuestions(questions)` | defensive öffentliche Fragen ohne Lösung und Erklärung erzeugen |
| `evaluateLearningTestAnswers(questions, answers)` | vollständige Single-Choice-Antworten mit dem privaten Fragensnapshot auswerten |

Die Auswahl sortiert stabil nach Kapitelposition des aktuellen LearningHubs,
LearningNode-Position und Frageposition. Optionen werden ausschließlich nach
ihrer eigenen Position sortiert. Arrayindizes, Zeitstempel und sichtbare Texte
sind keine Sortierschlüssel. Die Engine verwendet niemals `Math.random`,
verändert keine Eingabe und besitzt weder Uhr-, ID-, Storage-, Netzwerk- noch
DOM-Zugriffe.

Eine öffentliche Frage hat exakt diese Form:

```json
{
  "id": "question_synthetic_1",
  "learningNodeId": "node_synthetic_1",
  "type": "singleChoice",
  "prompt": "Welche erfundene Markierung zeigt nach Norden?",
  "difficulty": "easy",
  "options": [
    {
      "id": "option_synthetic_blue",
      "label": "Die blaue Raute"
    },
    {
      "id": "option_synthetic_gold",
      "label": "Der goldene Kreis"
    }
  ]
}
```

`correctOptionId`, `explanation`, Referenzkette, Revision, Positionen und
Zeitstempel werden vor der Auswertung nicht öffentlich projiziert. Diese
Reduktion verhindert eine versehentliche Lösungsweitergabe an die
Runner-View, bildet gegenüber lokalem Same-Origin-JavaScript aber keine technische
Geheimhaltungsgrenze.

Der `LearningTestService` akzeptiert vor dem Engine-Aufruf genau eine bekannte
Antwort je ausgewählter Frage und weist fehlende, doppelte, zusätzliche und
unbekannte Fragen oder Optionen ab. Die reine Engine erhält dadurch eine
vollständige Antwortmenge und vergleicht die Options-IDs strikt. Sie übernimmt
weder Korrektheitswerte noch Zähler oder Scores vom Aufrufer. Ihr Ergebnis hat
die Form
`{ answers, totalQuestionCount, correctAnswerCount, scorePercent }`; die
einzelnen Antworten entsprechen dem Attempt-Vertrag. Dabei gelten exakt:

```text
isCorrect = selectedOptionId === correctOptionId
totalQuestionCount = answers.length
correctAnswerCount = Anzahl der Antworten mit isCorrect === true
scorePercent = Math.round(correctAnswerCount / totalQuestionCount * 100)
```

Fragen und Ergebnisantworten bleiben in der autoritativen Testreihenfolge.
Nach der Auswertung darf eine Service-Ergebnisprojektion korrekte Option und
Erklärung als Feedback enthalten; der rohe Fragenbestand wird nicht
zurückgegeben.

#### LearningTestService und flüchtige Sessions

`LearningTestService` stellt diese öffentlichen Operationen bereit:

| Operation | Fachliche Wirkung |
| --- | --- |
| `loadTestBank()` | aktuellen privaten Fragenbestand laden und vollständig gegen den aktuellen Hub prüfen |
| `createQuestion({ moduleId, chapterId, learningNodeId, prompt, difficulty, options, correctOptionIndex, explanation })` | Single-Choice-Frage am Ende der Fragen desselben LearningNodes erstellen |
| `updateQuestion({ moduleId, chapterId, learningNodeId, questionId, prompt, difficulty, options, correctOptionIndex, explanation })` | vorhandene Frage ohne unbemerkten Referenzwechsel aktualisieren |
| `startModuleTest({ moduleId })` | deterministische öffentliche Testsession für ein Modul starten |
| `submitModuleTest({ testSessionId, answers })` | eingefrorene Session exakt einmal auswerten und Attempt anhängen |
| `cancelModuleTest({ testSessionId })` | eine sicher abbrechbare flüchtige Session ohne Attempt oder Persistenz beenden |
| `loadAttemptHistory({ moduleId })` | textfreie Attempt-Projektionen eines Moduls in Append-Reihenfolge laden |

Mit Ausnahme des rein speicherinternen `cancelModuleTest` lädt jede Operation
zuerst den aktuellen autoritativen LearningHub. Bank und Hub werden vollständig
validiert; jede gespeicherte Frage muss auf eine
existierende vollständige Modul-, Kapitel- und LearningNode-Kette zeigen.
Global vorhandene IDs mit falscher Elternzuordnung und verwaiste Referenzen
werden kontrolliert abgelehnt und nicht repariert. Eine Frage kann durch
`updateQuestion` nicht unbemerkt auf einen anderen LearningNode verschoben
werden. Der Inhaltsservice besitzt keine Rückabhängigkeit auf den Testservice.

Serviceeingaben werden vor Leer- und Längenprüfung an den Rändern getrimmt.
`options` ist ein Array aus zwei bis sechs Texten; `correctOptionIndex` muss
exakt auf eine dieser Optionen zeigen. `createQuestion` verwendet die nächste
freie positive Geschwisterposition des LearningNodes. `updateQuestion` erhält
Frage-ID, `createdAt` und Position und erhöht `revision` nur bei einer
tatsächlichen Änderung. Bei identischen normalisierten Eingaben erfolgt ein
vollständiger No-op ohne ID-, Uhr- oder Schreibzugriff. Unveränderte Optionen
behalten ihre IDs; ändert sich Optionsinhalt, -reihenfolge oder -anzahl, erhält
der vollständige Optionssatz neue stabile IDs.

ID-Generator und Uhr sind injizierbar. IDs müssen im jeweiligen vollständigen
Vertrag eindeutig, nicht leer und bereits getrimmt sein. Kollisionen,
ungültige Generatorwerte und Generatorfehler sind auf insgesamt fünf Versuche
begrenzt. Eine erfolgreiche echte Bankmutation validiert den vollständigen
neuen Bestand und speichert exakt einmal.

Die stabilen Erfolgsstatus und Ergebnisfelder lauten:

| Operation und Fall | `status` | Ergebnisfeld | `changed` |
| --- | --- | --- | --- |
| `loadTestBank`, fehlender Key | `empty` | `testBank` | `false` |
| `loadTestBank`, vorhandene valide Bank | `loaded` | `testBank` | `false` |
| `createQuestion`, erfolgreich | `questionCreated` | `testBank`, `question` | `true` |
| `updateQuestion`, tatsächliche Änderung | `questionUpdated` | `testBank`, `question` | `true` |
| `updateQuestion`, identische normalisierte Eingabe | `questionUnchanged` | `testBank`, `question` | `false` |
| `startModuleTest`, erfolgreich | `testStarted` | `testSession` | `true` |
| `submitModuleTest`, erfolgreich persistiert | `testCompleted` | `result` | `true` |
| `cancelModuleTest`, sicher abgebrochen | `testCancelled` | – | `true` |
| `loadAttemptHistory`, keine Attempts des Moduls | `attemptHistoryEmpty` | `attempts` | `false` |
| `loadAttemptHistory`, vorhandene Attempts | `attemptHistoryLoaded` | `attempts` | `false` |

`testSession` enthält eine defensive öffentliche Fragenprojektion ohne Lösung
oder Erklärung. `result` enthält sichere Attempt-Metadaten und Feedback nach
der Auswertung, aber keine Rohstores. `attempts` enthält defensive, textfreie
Projektionen und bleibt in persistierter Append-Reihenfolge. Jeder Fehler
verwendet `ok: false`, `changed: false` sowie stabile generische Codes und
Meldungen; ungefilterte Dependency-Meldungen und private Eingabewerte werden
nicht weitergereicht.

`startModuleTest` benötigt mindestens eine gültige Frage des Moduls. Erst nach
allen Validierungen erzeugt es eine lokale Session-ID und genau einen
kanonischen Startzeitpunkt, friert die autoritative Fragenreihenfolge samt
Antwortschlüssel im privaten Servicezustand ein und gibt nur die öffentliche
Projektion zurück. Es schreibt keinen Attempt und verwendet weder
Zufallsauswahl noch Shuffle. Fehler oder No-ops konsumieren keine ID und keinen
Zeitstempel.

In-Progress-Sessions werden absichtlich nicht persistiert. Nach einem Reload
oder einer neuen Serviceinstanz muss der Test neu begonnen werden. Änderungen
an Hub oder Testbank verändern den bereits eingefrorenen Sessionsnapshot
nicht. Die UI weist sichtbar auf diese Grenze hin und verspricht keine
Wiederaufnahme eines nicht gespeicherten Tests.

`submitModuleTest` akzeptiert ausschließlich `{ questionId,
selectedOptionId }` für genau jede Sessionfrage und bewertet nur anhand des
privaten Snapshots. Erst eine vollständige valide Abgabe erzeugt eine
Attempt-ID und einen kanonischen Abschlusszeitpunkt, konstruiert den
konsistenten Attempt und ruft `appendLearningTestAttempt` genau einmal auf.
Die Session wird erst nach erfolgreichem Append entfernt. Ein Speicherfehler
erhält sie für einen kontrollierten Retry; nach erfolgreichem Abschluss wird
eine zweite Abgabe derselben Session ohne zweiten Attempt abgelehnt.

`cancelModuleTest` liest `testSessionId` defensiv genau einmal. Eine bekannte
Session wird nur entfernt, wenn weder `submissionInProgress` noch
`pendingSubmission` gesetzt ist. Der sichere Abbruch erzeugt keinen Attempt,
keinen Storage-Zugriff, keine neue ID und keine Uhrzeit. Während einer laufenden
Abgabe oder nach einem möglicherweise bereits erfolgten Schreibzugriff liefert
der Service `conflict` mit `changed: false`, damit Retry beziehungsweise
Reconciliation möglich bleibt. Eine unbekannte Session liefert kontrolliert
`notFound`; Sessiondetails oder Dependency-Meldungen werden nicht ausgegeben.
Abgebrochene Session-IDs bleiben innerhalb derselben Serviceinstanz reserviert.

`loadAttemptHistory` filtert nur anhand der validierten `moduleId`, sortiert
nicht nach Zeitstempeln und kopiert weder Fragen-, Options- noch
LearningNode-Texte. Attempts führen keine Progress-Mutation aus und leiten
keinen Kompetenzstand ab. Fortschritt, LearningArtifacts und Testkompetenz
bleiben fachlich getrennt.

`src/main.js` erzeugt beide Test-Storages über den vorhandenen
`StorageAdapter`, erzeugt den `LearningTestService` und injiziert ihn in den
vorhandenen `LearningHubController`. Es gibt keinen separaten Test-Controller.
Der Controller validiert Bankmutationen gegen unveränderte Schwesterfragen,
öffentliche Sessions gegen Ziel, Reihenfolge und lösungsfreie Felder,
`testCompleted` gegen die eingefrorene Session und den abgegebenen
Antwortpayload sowie Historienprojektionen gegen Modul, Reihenfolge, Zähler und
`Math.round`. Die View erhält während des Tests keine Lösungen oder
Erklärungen; historische View-Modelle enthalten nur Abschlusszeit, Zähler und
Prozentwert.

Die sichtbare lokale Mock-Test-UI ist bedienbar; `v0.2.1` ist vollständig
geprüft und veröffentlicht. Der spätere externe Zielpfad lautet künftig:

```text
LearningTestService
  → SyncService
  → künftiger lokaler SyncTransport
  → lokales SyncGateway auf GD-WS01 (aktuell nur syncTest-Foundation)
  → lokaler SyncAgent
  → TestAgent
```

Ein optionaler ModelProvider oder WorkflowProvider dürfte erst hinter dem
lokalen SyncAgent und nur nach einer capability-spezifischen Entscheidung
hinzukommen; n8n ist kein zwingender Hop.

Semantische Freitextbewertung, automatische Fragengenerierung, Confidence,
Hinweise und Testkompetenz beginnen frühestens mit einer späteren
versionierten Entscheidung. Die lokalen Schema-1-Verträge reservieren dafür
keine Felder. ADR 0023 autorisiert diese private und fachlich weitergehende
Capability nicht; sie benötigt vor Umsetzung eine neue Identitäts-,
Berechtigungs-, Body-Binding-, Replay-, Idempotenz- und Datenschutzentscheidung.

#### Lokaler LearningArtifact-Vertrag – Schema 1

##### Trennung von Inhalt und Fortschritt

LearningArtifacts bilden private, benutzerverfasste Notizen und
Zusammenfassungen als aktuelle Arbeitsstände ab. Sie erweitern weder den
LearningHub-Inhaltsvertrag noch den append-only Progress-Vertrag:

| Belang | Vertrag | Storage-Key | Lebenszyklus |
| --- | --- | --- | --- |
| Module, Kapitel und LearningNodes | LearningHub `schemaVersion: 2` | `goldendawn.learningHub.content.v1` | editierbarer Inhalt |
| Kapitelzustandswechsel und Modulfortschritt | LearningProgress `schemaVersion: 1` | `goldendawn.learningHub.progress.v1` | append-only Ereignisfolge |
| Notizen und Zusammenfassungen | LearningArtifact `schemaVersion: 1` | `goldendawn.learningHub.artifacts.v1` | editierbarer aktueller Stand ohne Historie |

Die Zahlen in den Storage-Keys versionieren ausschließlich die jeweiligen
Persistenz-Namespaces. Sie ändern die unabhängig versionierten Verträge nicht.
Die Artifact-Foundation führt keine Progress-Ereignisse, kein Schema 3 des
LearningHubs und keine gemeinsame Sammelpersistenz ein.

##### LearningArtifact: Struktur und Validierung

Der Root enthält ausschließlich die Vertragsversion, die
Herkunftsklassifikation und das Artefakt-Array. Jedes Artefakt enthält
ausschließlich seine Identität, seinen Typ, die drei stabilen
Quellenreferenzen, den privaten Text und zwei Zeitstempel. Alle aufgeführten
Felder sind eigene Pflichtfelder; fehlende und unbekannte Felder werden
abgelehnt.

| Feld | Typ | Regel |
| --- | --- | --- |
| `schemaVersion` | Ganzzahl | exakt `1` |
| `dataOrigin` | String | ausschließlich `synthetic` oder `private` |
| `artifacts` | Array | darf leer sein |
| `artifacts[].id` | String | nicht leer, bereits getrimmt und im vollständigen Store global eindeutig |
| `artifacts[].type` | String | ausschließlich `note` oder `summary` |
| `artifacts[].moduleId` | String | nicht leer und bereits getrimmt |
| `artifacts[].chapterId` | String | nicht leer und bereits getrimmt |
| `artifacts[].learningNodeId` | String | nicht leer und bereits getrimmt |
| `artifacts[].content` | String | nicht leer, bereits getrimmt und höchstens 10.000 Zeichen |
| `artifacts[].createdAt` | String | kanonischer UTC-Zeitstempel im exakten Format `YYYY-MM-DDTHH:mm:ss.sssZ` |
| `artifacts[].updatedAt` | String | dasselbe kanonische UTC-Format und nicht vor `createdAt` |

Die Kombination aus `learningNodeId` und `type` ist im vollständigen Store
eindeutig. Ein LearningNode besitzt daher höchstens eine aktuelle `note` und
höchstens eine aktuelle `summary`; beide Typen dürfen gleichzeitig existieren.
Modul-, Kapitel- und LearningNode-Titel sowie deren vollständige Inhalte werden
nicht in den Artifact-Store kopiert. Gespeichert werden ausschließlich die
stabilen Referenz-IDs und der private Artefakttext einschließlich seiner
Artefaktmetadaten.

`validateLearningArtifactStore` sammelt alle strukturell auffindbaren Fehler als
stabile Einträge `{ code, path, message }` und verändert die Eingabe nicht. Die
Implementierung exportiert die fachlich benötigten Vertragskonstanten, die
kanonische Zeitprüfung und den Validator. Die stabilen Vertragsfehlercodes sind:

| Code | Bedeutung |
| --- | --- |
| `invalidLearningArtifactStore` | Root ist kein Objekt |
| `unsupportedSchemaVersion` | `schemaVersion` ist nicht exakt `1` |
| `invalidDataOrigin` | Herkunft ist weder `synthetic` noch `private` |
| `invalidArtifacts` | `artifacts` ist kein Array |
| `invalidArtifact` | ein Artefakteintrag ist kein Objekt |
| `unknownProperty` | Root oder Artefakt enthält ein nicht unterstütztes eigenes Feld |
| `missingProperty` | ein erforderliches eigenes Feld fehlt |
| `invalidId` | Artefakt-ID oder Referenz-ID ist leer, ungetrimmt oder kein String |
| `duplicateArtifactId` | eine Artefakt-ID kommt im Store mehrfach vor |
| `invalidArtifactType` | Typ ist weder `note` noch `summary` |
| `duplicateLearningNodeArtifactType` | Kombination aus `learningNodeId` und `type` kommt mehrfach vor |
| `invalidContent` | Artefakttext ist leer, ungetrimmt oder kein String |
| `contentTooLong` | Artefakttext überschreitet 10.000 Zeichen |
| `invalidCreatedAt` | `createdAt` ist ungültig oder nicht kanonisch |
| `invalidUpdatedAt` | `updatedAt` ist ungültig oder nicht kanonisch |
| `updatedAtBeforeCreatedAt` | `updatedAt` liegt vor `createdAt` |

Die strukturelle Validierung prüft bewusst nicht, ob die Referenz-IDs im
aktuellen LearningHub existieren und richtig miteinander verknüpft sind. Diese
Prüfung benötigt den aktuellen Inhaltsstand und liegt im
`LearningArtifactService`.

##### Datenfluss, Service und Referenzintegrität

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

`LearningArtifactService` verwendet `LearningHubService` ausschließlich zum
Laden des aktuellen privaten Inhaltsstands und zur Referenzprüfung. Der
Inhaltsservice besitzt keine Rückabhängigkeit auf den Artifact-Service; eine
zirkuläre Service-Abhängigkeit entsteht nicht. `src/main.js` injiziert den
Service in den vorhandenen Controller, der der View nur eine defensiv geprüfte
Projektion aktueller Notiz- und Zusammenfassungstexte übergibt. Ein eigener
Artifact-Controller entsteht nicht; Artefakt-IDs, Referenzketten und
Zeitstempel gehören nicht zum UI-Vertrag.

Der Service stellt diese öffentlichen Operationen bereit:

| Operation | Fachliche Wirkung |
| --- | --- |
| `loadArtifacts()` | aktuellen privaten Artifact-Store laden oder bei fehlendem Key den unpersistierten leeren Initialzustand liefern |
| `saveNote({ moduleId, chapterId, learningNodeId, content })` | aktuelle Notiz erstellen oder ihren Text aktualisieren |
| `saveSummary({ moduleId, chapterId, learningNodeId, content })` | aktuelle Zusammenfassung erstellen oder ihren Text aktualisieren |
| `clearNote({ moduleId, chapterId, learningNodeId })` | exakt die Notiz der Referenz entfernen |
| `clearSummary({ moduleId, chapterId, learningNodeId })` | exakt die Zusammenfassung der Referenz entfernen |

Die stabilen Erfolgsstatus lauten:

| Operation und Fall | `status` | `changed` |
| --- | --- | --- |
| `loadArtifacts`, fehlender Artifact-Key | `empty` | `false` |
| `loadArtifacts`, vorhandener valider Store | `loaded` | `false` |
| erstmaliges Speichern eines Typs | `artifactCreated` | `true` |
| Aktualisieren eines vorhandenen Typs | `artifactUpdated` | `true` |
| Speichern eines inhaltlich identischen Texts | `artifactUnchanged` | `false` |
| Entfernen eines vorhandenen Typs | `artifactCleared` | `true` |
| Entfernen eines nicht vorhandenen Typs | `artifactAlreadyEmpty` | `false` |

Jeder Service-Erfolg und -Fehler enthält ein konsistentes `changed`. Sichere
Ergebnisse liefern defensive Kopien des vollständigen `artifactStore`;
Fehlerfälle verwenden stabile generische Codes und Meldungen ohne private
Inhalte.

Jede Mutation folgt diesen Grenzen:

1. aktuellen LearningHub über `LearningHubService` laden und vollständig
   validieren;
2. Existenz und Eigentum der Zielkette `moduleId` → `chapterId` →
   `learningNodeId` prüfen;
3. aktuellen Artifact-Store laden und vollständig validieren;
4. alle bereits gespeicherten Referenzketten gegen den aktuellen Hub prüfen;
5. immutable einen neuen vollständigen Zustand erzeugen;
6. den Ergebniszustand vollständig validieren;
7. nur bei einer echten Änderung genau einmal speichern.

Ein Modul muss existieren, das Kapitel muss zu diesem Modul und der LearningNode
zu diesem Kapitel gehören. Eine andernorts global vorhandene ID macht eine
falsche Elternkette nicht gültig. Verwaiste oder falsch zugeordnete gespeicherte
Artefakte blockieren Mutationen kontrolliert und werden weder repariert,
gelöscht noch überschrieben.

`saveNote` und `saveSummary` trimmen `content` vor Leer- und Längenprüfung.
Leerer Text wird abgelehnt; Entfernen erfolgt ausschließlich über die
Clear-Operationen. Beim Erstellen entstehen eine neue stabile Artefakt-ID und
genau ein Zeitwert, der gleichermaßen für `createdAt` und `updatedAt` verwendet
wird. Beim Aktualisieren bleiben `id` und `createdAt` unverändert; der neue
`updatedAt`-Wert darf nicht vor dem vorherigen `updatedAt` liegen.

Neue IDs werden über einen injizierbaren Generator erzeugt und im vollständigen
Store auf Eindeutigkeit geprüft. Nach höchstens fünf ungültigen Werten,
Generatorfehlern oder Kollisionen bricht die Erzeugung kontrolliert ohne
Schreibzugriff ab. Die injizierbare Uhr muss einen kanonischen UTC-Zeitstempel
liefern; Uhrfehler, nicht kanonische Werte und rückläufige Aktualisierungszeiten
führen ebenfalls zu keinem Save.

Inhaltlich identische Speicheraufrufe sind vollständige No-ops: Sie erzeugen
weder ID noch Zeitstempel und schreiben nicht. Clear-Operationen erzeugen
grundsätzlich keine ID oder Uhrabfrage. Sie entfernen nur den exakt
referenzierten Typ, erhalten das andere Artefakt desselben LearningNodes und
verändern die Reihenfolge aller übrigen Artefakte nicht. Auch ein bereits leerer
Typ bleibt ohne Schreibzugriff.

##### UI-Projektion, No-ops und Fehlerisolation

Der `LearningHubController` akzeptiert beim Laden ausschließlich `empty` und
`loaded`. Für Speichermutationen akzeptiert er `artifactCreated` und
`artifactUpdated` mit `changed: true` sowie `artifactUnchanged` mit
`changed: false`. Clear-Mutationen verwenden `artifactCleared` mit
`changed: true` oder `artifactAlreadyEmpty` mit `changed: false`. Andere oder
widersprüchliche Status-/Changed-Kombinationen gelten nicht als Erfolg.

Die UI verbindet Artefakte ausschließlich über die stabile Auswahl des
aktuellen LearningNodes. Sie erhält defensiv geprüfte aktuelle Texte für
`note` und `summary`, nicht den rohen Store, Artefakt-IDs, Referenzketten oder
Zeitstempel. Nutzertext wird nur über `textContent`, Formularwert-Eigenschaften
oder gleichwertige sichere DOM-Erzeugung ausgegeben.

Ein isolierter Ladefehler markiert Artefakte als nicht verfügbar, deaktiviert
ihre Mutationen und bietet `loadArtifacts` als nicht destruktiven Retry an;
Inhalte und Fortschritt bleiben bedienbar. Mutationsfehler behalten die letzte
valide Projektion und den eingegebenen Text. Erfolgreiche No-ops werden als
Hinweis sichtbar und lösen keinen zusätzlichen Save aus.

Das Leeren einer vorhandenen Notiz oder Zusammenfassung benötigt eine
zugängliche Inline-Bestätigung. Abbrechen verändert weder Projektion noch
Storage; Bestätigen ruft ausschließlich die passende Clear-Operation auf.
Blockierende Browserdialoge werden nicht verwendet. Busy-Zustände verhindern
parallele Artefaktmutationen, und der Fokus wird nach Erfolg, No-op oder Fehler
zum betroffenen Editor oder zur auslösenden Aktion zurückgeführt.

Wichtige stabile Service-Fehlercodes sind:

| Code | Bedeutung |
| --- | --- |
| `invalidLearningArtifactInput` | Ziel-IDs oder Artefakttext sind formal ungültig |
| `moduleNotFound` | Zielmodul existiert nicht |
| `chapterNotFound` | Zielkapitel existiert nicht |
| `chapterModuleMismatch` | Zielkapitel gehört nicht zum angegebenen Modul |
| `learningNodeNotFound` | Ziel-LearningNode existiert nicht |
| `learningNodeChapterMismatch` | Ziel-LearningNode gehört nicht zur angegebenen Elternkette |
| `orphanedArtifactModuleReference` | gespeichertes Artefakt verweist auf kein vorhandenes Modul |
| `orphanedArtifactChapterReference` | gespeichertes Artefakt verweist auf kein vorhandenes Kapitel |
| `artifactChapterModuleMismatch` | gespeichertes Artefakt besitzt eine falsche Modul-Kapitel-Zuordnung |
| `orphanedArtifactLearningNodeReference` | gespeichertes Artefakt verweist auf keinen vorhandenen LearningNode |
| `artifactLearningNodeChapterMismatch` | gespeichertes Artefakt besitzt eine falsche vollständige Elternkette |
| `learningArtifactIdGenerationFailed` | in höchstens fünf Versuchen entstand keine gültige eindeutige Artefakt-ID |
| `learningArtifactClockFailed` | injizierte Uhr ist fehlgeschlagen |
| `invalidLearningArtifactTimestamp` | Uhrwert ist kein kanonischer UTC-Zeitstempel |
| `learningArtifactTimestampMovedBackward` | Aktualisierungszeitpunkt liegt vor dem vorherigen `updatedAt` |
| `invalidLearningArtifactState` | vollständiger neuer Artifact-Store ist nicht vertragsgültig |
| `invalidStoredLearningHub` | geladener Inhaltszustand ist kein gültiger privater Schema-2-Hub |
| `invalidStoredLearningArtifacts` | geladener Artefaktzustand ist kein gültiger privater Schema-1-Store |
| `learningArtifactStorageUnavailable` | Artifact-Storage-Schnittstelle fehlt |
| `learningArtifactStorageReadFailed` | Artifact-Store konnte nicht gelesen werden |
| `learningArtifactStorageWriteFailed` | Artifact-Store konnte nicht geschrieben werden |
| `unexpectedLearningHubResult` | Inhaltsservice lieferte kein verwertbares Ergebnis |
| `unexpectedStorageResult` | Artifact-Storage lieferte kein verwertbares Ergebnis |

##### Lokale Persistenz und Sicherheitsgrenzen

`createLearningArtifactStorage` erhält ausschließlich den gemeinsamen
`StorageAdapter` und stellt `loadLearningArtifacts` sowie
`saveLearningArtifacts` unter diesem festen, nicht nutzerkontrollierten Key
bereit:

```text
goldendawn.learningHub.artifacts.v1
```

Fehlt der Key, liefert jeder Lesevorgang ohne Initialisierungsschreibzugriff
einen frischen Store mit `schemaVersion: 1`, `dataOrigin: private` und leerem
`artifacts`-Array. Ein erfolgreicher Lesevorgang liefert `status: missing` oder
`status: found` und den defensiv geklonten Wert in `artifactStore`; ein
erfolgreicher Schreibvorgang liefert `status: saved`.

Vor jedem Schreibzugriff liest der Storage denselben festen Key erneut und
wendet auf einen vorhandenen Wert dieselbe vollständige Vertrags- und
Herkunftsprüfung an. Ein synthetischer, beschädigter, nicht unterstützter oder
nicht sicher lesbarer Bestand blockiert den Save; erst ein fehlender Key oder
ein gültiger privater Bestand erlaubt den anschließenden Schreibzugriff. Dieser
Read-Preflight verhindert ein bewusstes Überschreiben erkennbar unsicherer
Bestände, ist aber keine Transaktion und schließt Multi-Tab-Rennen nicht aus.

Laden und Speichern validieren den vollständigen Vertrag. Der private Pfad
akzeptiert ausschließlich `dataOrigin: private`. Synthetische, beschädigte und
nicht unterstützte gespeicherte Werte werden weder gelöscht, überschrieben noch
durch den leeren Initialzustand ersetzt. Auch an den Adapter übergebene
Schreibwerte werden defensiv geklont.

Adapter-, Verfügbarkeits-, Lese-, Schreib- und Quota-Fehler werden kontrolliert
in stabile Ergebnisse übersetzt. Fehler und Konsolenausgaben enthalten keine
privaten Texte, IDs, Referenzketten, Rohwerte oder Zeitstempel. Es gibt keinen
Demo-Import, Netzwerkzugriff und keine Telemetrie.

`dataOrigin` ist nur eine Klassifikation und kein technischer Schutz.
`localStorage` ist unverschlüsselt und für JavaScript derselben Origin
grundsätzlich zugänglich. Die lokale Ablage ist keine Cloud-Sicherung und keine
geräteübergreifende Synchronisierung; Browserdaten können gelöscht werden.
Browser-Quota, Multi-Tab-Rennen und fehlende Transaktionssperren bleiben
Grenzen. Die 10.000-Zeichen-Grenze gilt je Artefakt und ersetzt keine
Gesamtgrößenbegrenzung des Stores. Die implementierte UI gibt private
Artefakttexte über `textContent`, Formularwert-Eigenschaften oder gleichwertige
sichere DOM-Erzeugung aus.

Schema 1 enthält keine Artefakt-Versionshistorie. Eine spätere Historie,
Migration, Import/Export, Synchronisierung sowie Archivierungs- oder
Löschregeln für referenzierte LearningHub-Inhalte benötigen jeweils eine
gesonderte Vertrags- und Architekturentscheidung.

#### Lokaler LearningHub-Fortschrittsvertrag – Schema 1

##### Trennung vom Inhaltsvertrag

Der Fortschrittsvertrag erweitert den LearningHub-Inhaltsvertrag nicht. Ein
Kapitel erhält insbesondere kein veränderliches `completed`-Feld. Inhalt und
Fortschritt besitzen getrennte Schemaversionen, Validierungen, Services und
Storage-Keys:

| Belang | Vertrag | Storage-Key |
| --- | --- | --- |
| Module, Kapitel und LearningNodes | LearningHub `schemaVersion: 2` | `goldendawn.learningHub.content.v1` |
| Kapitelzustandswechsel und daraus abgeleiteter Modulfortschritt | LearningProgress `schemaVersion: 1` | `goldendawn.learningHub.progress.v1` |

Die identische Zahl `1` in Progress-Schema und Progress-Key ist zufällig. Das
`v1` im Key versioniert den Persistenz-Namespace; `schemaVersion: 1`
versioniert unabhängig davon die Struktur des gespeicherten Fortschrittslogs.

##### LearningHub-Fortschritt: Struktur und Validierung

```json
{
  "schemaVersion": 1,
  "dataOrigin": "synthetic",
  "events": [
    {
      "id": "learning-progress-event-synthetic-example",
      "type": "chapter.completed",
      "moduleId": "module-synthetic-atlas",
      "chapterId": "chapter-synthetic-compass",
      "occurredAt": "2026-07-18T12:00:00.000Z"
    },
    {
      "id": "learning-progress-event-synthetic-reopen",
      "type": "chapter.reopened",
      "moduleId": "module-synthetic-atlas",
      "chapterId": "chapter-synthetic-compass",
      "occurredAt": "2026-07-18T12:05:00.000Z"
    }
  ]
}
```

| Feld | Typ | Regel |
| --- | --- | --- |
| `schemaVersion` | Ganzzahl | exakt `1` |
| `dataOrigin` | String | ausschließlich `synthetic` oder `private` |
| `events` | Array | darf leer sein; Reihenfolge ist autoritativ |
| `events[].id` | String | nicht leer, bereits getrimmt und im vollständigen Log eindeutig |
| `events[].type` | String | `chapter.completed` oder `chapter.reopened` |
| `events[].moduleId` | String | nicht leer und bereits getrimmt |
| `events[].chapterId` | String | nicht leer und bereits getrimmt |
| `events[].occurredAt` | String | gültiger kanonischer ISO-8601-UTC-Zeitstempel im Format mit Millisekunden und `Z` |

Root und jedes Ereignis müssen Objekte sein; Arrays oder `null` sind an diesen
Stellen ungültig. Zeitstempel müssen weder eindeutig noch monoton sein. Der
Vertrag sortiert nicht nach `occurredAt`: Die persistierte Reihenfolge im
`events`-Array bestimmt die Zustandsableitung.

`validateLearningProgress` sammelt alle strukturell auffindbaren Fehler als
stabile Einträge `{ code, path, message }` und verändert die Eingabe nicht. Die
Implementierung exportiert `LEARNING_PROGRESS_SCHEMA_VERSION`,
`LEARNING_PROGRESS_DATA_ORIGINS`, `LEARNING_PROGRESS_EVENT_TYPES`,
`LEARNING_PROGRESS_ERROR_CODES` und `validateLearningProgress`. Die
exportierten Fehlercodes sind:

| Code | Bedeutung |
| --- | --- |
| `invalidLearningProgress` | Root ist kein Objekt |
| `unsupportedSchemaVersion` | `schemaVersion` ist nicht exakt `1` |
| `invalidDataOrigin` | Herkunft ist weder `synthetic` noch `private` |
| `invalidEvents` | `events` ist kein Array |
| `invalidEvent` | ein Ereigniseintrag ist kein Objekt |
| `invalidId` | Ereignis-ID oder Referenz ist leer, ungetrimmt oder kein String |
| `duplicateEventId` | Ereignis-ID kommt im vollständigen Log mehrfach vor |
| `invalidEventType` | Ereignistyp gehört nicht zu Schema 1 |
| `invalidOccurredAt` | Zeitstempel ist ungültig oder nicht kanonisch |

Die strukturelle Validierung prüft bewusst nicht, ob `moduleId` oder
`chapterId` im aktuellen LearningHub existieren oder ob das Kapitel zum Modul
gehört. Diese referenzielle Prüfung benötigt den aktuellen Inhaltsstand und
liegt im `LearningProgressService`.

Schema 1 unterstützt kein `chapter.started`. Eine spätere Einführung dieses
oder eines anderen Ereignistyps ist keine stille Enum-Erweiterung, sondern eine
versionierte Vertragsänderung mit angepasster Validierung, Projektion,
Persistenzdokumentation und Tests.

##### Reine Fortschrittsprojektion

`projectLearningProgress(learningHub, progressLog)` erhält einen validen
LearningHub und einen validen Fortschrittslog, verändert beide Eingaben nicht
und persistiert nichts. Die Funktion gibt direkt ein Modul-Array zurück:

```json
[
  {
    "moduleId": "module-synthetic-atlas",
    "completedChapterCount": 1,
    "totalChapterCount": 3,
    "progressPercent": 33,
    "isCompleted": false,
    "chapters": [
      {
        "chapterId": "chapter-synthetic-compass",
        "isCompleted": true
      },
      {
        "chapterId": "chapter-synthetic-map",
        "isCompleted": false
      },
      {
        "chapterId": "chapter-synthetic-route",
        "isCompleted": false
      }
    ]
  }
]
```

Die Ereignisreihenfolge ist autoritativ. `chapter.completed` setzt das
referenzierte Kapitel auf abgeschlossen, `chapter.reopened` wieder auf offen;
das letzte Array-Ereignis derselben Modul- und Kapitelreferenz gewinnt.
`occurredAt` beeinflusst die Reihenfolge nicht.

Module und Kapitel werden ohne Eingabemutation aufsteigend nach ihrer
`position` aus dem Inhaltsvertrag projiziert. Titel und LearningNode-Inhalte
werden nicht kopiert. `progressPercent` ist
`Math.round(completedChapterCount / totalChapterCount * 100)`; bei exakt `.5`
gilt für die nicht negativen Werte die aufwärts gerichtete `Math.round`-Regel.
Bei null Kapiteln ist der Prozentwert `0`. `isCompleted` ist nur wahr, wenn das
Modul mindestens ein Kapitel besitzt und alle Kapitel abgeschlossen sind. Ein
leerer Hub ergibt `[]`; Module mit 100 Prozent bleiben vollständig im Ergebnis.

##### Datenfluss und referenzielle Integrität

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

`LearningProgressService` verwendet `LearningHubService` ausschließlich zum
Laden des aktuellen Inhaltsstands und zur Prüfung von Modul-, Kapitel- und
Eigentumsreferenzen. Es gibt keine Rückabhängigkeit vom Inhaltsservice und
keine zirkuläre Service-Abhängigkeit. Der Progress-Service stellt
`loadProgress`, `completeChapter({ moduleId, chapterId })` und
`reopenChapter({ moduleId, chapterId })` bereit.

Die stabilen Erfolgsstatus lauten:

| Operation und Fall | `status` | `changed` |
| --- | --- | --- |
| `loadProgress`, fehlender Progress-Key | `empty` | `false` |
| `loadProgress`, vorhandener valider Log | `loaded` | `false` |
| echte Änderung durch `completeChapter` | `chapterCompleted` | `true` |
| `completeChapter` bei abgeschlossenem Kapitel | `chapterAlreadyCompleted` | `false` |
| echte Änderung durch `reopenChapter` | `chapterReopened` | `true` |
| `reopenChapter` bei offenem Kapitel | `chapterAlreadyOpen` | `false` |

Jeder Erfolg enthält defensive Kopien von `progressLog` und dem direkten
Modul-Array `projection`. Fehler enthalten immer `ok: false`, `changed: false`
und einen stabilen `error`; der letzte valide Log und seine Projektion werden
nur mitgeliefert, soweit der Fehlerfall einen sicheren aktuellen Zustand
besitzt.

Wichtige stabile Service-Fehlercodes sind:

| Code | Bedeutung |
| --- | --- |
| `invalidLearningProgressInput` | Ziel-IDs sind formal ungültig; `fieldErrors` benennt die Felder |
| `moduleNotFound` | Zielmodul existiert nicht |
| `chapterNotFound` | Zielkapitel existiert nicht |
| `chapterModuleMismatch` | Zielkapitel gehört nicht zum angegebenen Modul |
| `orphanedProgressModuleReference` | gespeichertes Ereignis verweist auf kein vorhandenes Modul |
| `orphanedProgressChapterReference` | gespeichertes Ereignis verweist auf kein vorhandenes Kapitel |
| `progressChapterModuleMismatch` | gespeichertes Ereignis besitzt eine falsche Modul-Kapitel-Zuordnung |
| `learningProgressEventIdGenerationFailed` | in höchstens fünf Versuchen entstand keine gültige eindeutige Ereignis-ID |
| `learningProgressClockFailed` | injizierte Uhr ist fehlgeschlagen |
| `invalidLearningProgressTimestamp` | Uhrwert ist kein kanonischer UTC-Zeitstempel |
| `invalidLearningProgressState` | vollständiger neuer Log ist nicht vertragsgültig |
| `invalidStoredLearningHub` | geladener Inhaltszustand ist nicht der gültige private Schema-2-Hub |
| `invalidStoredLearningProgress` | geladener Fortschrittszustand ist nicht der gültige private Schema-1-Log |
| `learningProgressStorageUnavailable` | Progress-Storage-Schnittstelle fehlt |
| `learningProgressStorageReadFailed` | Progress-Log konnte nicht gelesen werden |
| `learningProgressStorageWriteFailed` | Progress-Log konnte nicht geschrieben werden |
| `unexpectedLearningHubResult` | Inhaltsservice lieferte kein verwertbares Ergebnis |
| `unexpectedStorageResult` | Progress-Storage lieferte kein verwertbares Ergebnis |
| `learningProgressProjectionFailed` | Projektion konnte nicht sicher erzeugt werden |

Kontrollierte Abhängigkeitsfehler werden mit ihrem stabilen Status und Code
weitergereicht. Kein Fehlerfall löst einen Reparatur-, Lösch- oder
Ersatzschreibzugriff aus.

Jede Mutation:

1. lädt den aktuellen LearningHub über `LearningHubService`;
2. lädt den aktuellen Fortschrittslog;
3. validiert beide vollständigen Zustände;
4. prüft sämtliche bereits gespeicherten Ereignisreferenzen;
5. prüft Existenz und Eigentum der Zielreferenz;
6. leitet den aktuellen Kapitelzustand ausschließlich aus der Arrayreihenfolge
   ab;
7. hängt bei einer echten Zustandsänderung genau ein neues Ereignis an;
8. validiert den vollständigen neuen Log;
9. speichert genau einmal;
10. gibt die neue Projektion zurück.

`moduleId` muss ein vorhandenes LearningModule bezeichnen, `chapterId` ein
vorhandenes LearningChapter, und das Kapitel muss zum angegebenen Modul
gehören. Verwaiste oder falsch zugeordnete gespeicherte Ereignisse führen zu
einem kontrollierten Fehler. Ungültige Daten werden nicht repariert, gelöscht
oder überschrieben.

| Ausgangszustand und Operation | Ergebnis |
| --- | --- |
| offenes Kapitel + `completeChapter` | genau ein `chapter.completed`, `changed: true`, genau ein Save |
| abgeschlossenes Kapitel + `completeChapter` | erfolgreicher No-op, `changed: false`, kein Save |
| abgeschlossenes Kapitel + `reopenChapter` | genau ein `chapter.reopened`, `changed: true`, genau ein Save |
| offenes oder nie abgeschlossenes Kapitel + `reopenChapter` | erfolgreicher No-op, `changed: false`, kein Save |
| nach `chapter.reopened` erneut `completeChapter` | neues `chapter.completed`, `changed: true`, genau ein Save |

No-ops erzeugen weder Ereignis-ID noch Zeitstempel, speichern nicht und
verändern keine Eingaben. Service-Ergebnisse folgen den bestehenden lokalen
Konventionen und liefern je nach Fall strukturierte `ok`-, `status`-,
`changed`-, `error`-, `progressLog`- und `projection`-Informationen.

Neue Ereignis-IDs verwenden im Produktionsdefault das fachliche Präfix
`learning-progress-event` und müssen im vollständigen Log eindeutig sein. Der
injizierbare Generator erhält höchstens fünf Versuche;
Fehler, leere oder ungetrimmte Werte und Kollisionen führen nach der Begrenzung
zu einem kontrollierten Ergebnis ohne Schreibzugriff. Eine injizierbare Uhr
muss einen kanonischen ISO-UTC-Zeitstempel liefern. Auch eine fehlschlagende
oder ungültige Uhr führt zu keinem Save. `occurredAt` bleibt beschreibend; die
Append-Reihenfolge ist fachlich autoritativ.

Es gibt keine öffentlichen Operationen zum Bearbeiten, Entfernen oder
Umsortieren vorhandener Fortschrittsereignisse.

##### UI-Projektion und Fehlerisolation

Der Controller akzeptiert beim Laden ausschließlich die Erfolgsstatus `empty`
und `loaded`. Für Fortschrittsmutationen akzeptiert er exakt
`chapterCompleted` und `chapterReopened` mit `changed: true` sowie
`chapterAlreadyCompleted` und `chapterAlreadyOpen` mit `changed: false`. Ein
gültiger Erfolg wird ohne weiteren Schreibzugriff aus der zurückgegebenen
`projection` übernommen. Obwohl Service-Ergebnisse für andere
Anwendungsschichten auch `progressLog` enthalten, hält oder rendert die
LearningHub-UI ausschließlich die Projektion; Ereignis-IDs und Zeitstempel
gelangen nicht in ihren Zustand.

Vor der Darstellung wird die Projektion anhand stabiler `moduleId`- und
`chapterId`-Zuordnungen vollständig gegen den aktuellen Hub geprüft. Zähler und
Abschlussstatus müssen exakt zu den Kapitelstatus passen. Der Prozentwert muss
eine plausible Ganzzahl zwischen 0 und 100 mit konsistenten 0- und
100-Prozent-Endpunkten sein; der Controller berechnet oder rundet ihn nicht
selbst neu. Arrayindizes verbinden keine Progress- und Inhaltsobjekte.
Ungültige oder unvollständige Projektionen gelten als nicht verfügbar und
werden weder als 0 Prozent dargestellt noch zur Mutation verwendet.

Ein Progress-Fehler blockiert den gültigen Inhaltszustand nicht. Die UI
deaktiviert Fortschrittsaktionen, bietet `loadProgress` als gezielten Retry an
und führt keinen Reparatur-, Lösch- oder Ersatzschreibzugriff aus. Die letzte
valide Projektion bleibt bei einer fehlgeschlagenen Mutation unverändert. Nach
`createModule` und `addChapter` wird sie neu geladen; scheitert dieser Refresh
nach erfolgreicher Inhaltsmutation, bleibt der Inhaltserfolg bestehen und die
vorherige Projektion wird nicht mehr als aktuell ausgegeben. Umbenennungen und
LearningNode-Mutationen verändern die Projektion nicht.

##### Lokale Persistenz und Fehlergrenzen

`createLearningProgressStorage` erhält ausschließlich den gemeinsamen
`StorageAdapter` und stellt `loadLearningProgress` sowie
`saveLearningProgress` unter diesem festen, nicht nutzerkontrollierten Key
bereit:

```text
goldendawn.learningHub.progress.v1
```

Fehlt der Key, liefert ein Lesevorgang jeweils einen frischen privaten, leeren
Log, ohne ihn sofort zu speichern:

```json
{
  "schemaVersion": 1,
  "dataOrigin": "private",
  "events": []
}
```

Ein erfolgreicher Lesevorgang liefert `status: missing` oder `status: found`
und den defensiv geklonten Wert im Feld `progressLog`. Ein erfolgreicher
Schreibvorgang liefert `status: saved`. Fehlende oder unbrauchbare
Adapter-Schnittstellen und formal unerwartete Adapterresultate werden von
Vertrags-, Herkunfts-, Lese-, Schreib- und Quota-Fehlern kontrolliert
unterschieden.

Laden und Speichern validieren den vollständigen Vertrag. Der private
Storage-Pfad akzeptiert ausschließlich `dataOrigin: private`. Synthetische,
beschädigte oder nicht unterstützte gespeicherte Werte werden nicht gelöscht,
überschrieben, repariert oder durch den leeren Initialzustand ersetzt. Es gibt
weder Demo-Import noch Netzwerkzugriff. Rückgaben und an den Adapter übergebene
Werte werden defensiv geklont.

Adapter-Ausnahmen, unerwartete Adapterergebnisse, Verfügbarkeits-, Lese-,
Schreib- und Quota-Fehler werden in kontrollierte stabile Ergebnisse übersetzt.
Fehlermeldungen enthalten keine privaten Modul- oder Kapiteltitel,
LearningNode-Inhalte, vollständigen Logs oder Rohdaten.

##### Append-only-Grenzen und spätere Inhaltslebenszyklen

Append-only ist eine Anwendungsregel des `LearningProgressService`. Technisch
wird bei jeder echten Zustandsänderung der vollständige JSON-Log als Snapshot
in `localStorage` geschrieben. Es gibt keine kryptografische Verkettung,
Signatur oder Manipulationssperre; andere Skripte derselben Origin könnten den
Wert lesen oder verändern. GoldenDawn OS beansprucht damit kein vollständiges
Event Sourcing. Das Modell ist xAPI-inspiriert, aber nicht xAPI-konform, und es
gibt kein LRS.

Multi-Tab-Rennen, Browser-Quota, fehlende Transaktionssperren, fehlende
Verschlüsselung und fehlende Synchronisierung bleiben bekannte Grenzen. Lokale
Browserpersistenz ist weder Cloud-Sicherung noch geräteübergreifende
Speicherung; das Löschen des Browserprofils kann den Log entfernen.

Archivieren und dauerhaftes Löschen sind nicht implementiert. Eine spätere
Archivierung von Modulen oder Kapiteln muss verknüpfte Ereignisse erhalten und
deren Projektionssichtbarkeit festlegen. Dauerhaftes Löschen benötigt zuvor
eine gesonderte Referenz- und Löschrichtlinie für verbundene Ereignisse,
mögliche Tombstones und historische Nachvollziehbarkeit. Stilles
kaskadierendes Löschen oder das bewusste Erzeugen verwaister Ereignisse wird
nicht vorweggenommen.

### v0.2.2 – LichtwaldLog Local MVP

Contract Foundation, private Storage-Foundation, Service-Foundation,
Controller-Foundation sowie isolierte View- und CSS-Foundation des rein lokalen
LichtwaldLogs sind implementiert und über den gemeinsamen `StorageAdapter` in
`src/main.js` komponiert. Sie umfassen das Schema-1-Modul
`lichtwaldLogContract.js`, den reinen Validator `validateLichtwaldLog`,
synthetische Contract-Tests, das reine Modul `lichtwaldLogSearch.js`,
`createLichtwaldLogStorage` hinter dem
gemeinsamen `StorageAdapter` sowie `createLichtwaldLogService` als
Anwendungsgrenze und `createLichtwaldLogController` als flüchtige
UI-Koordinationsgrenze und `createLichtwaldLogView` als isolierte DOM-Grenze.
LichtwaldLog ist über die Navigation mit dem sichtbaren Status `Lokales MVP`
erreichbar; Anzeigen, Erstellen, vollständiges Bearbeiten, dauerhaftes Löschen
sowie explizites Setzen und Entfernen des Fokus sind vollständig über die
Anwendung bedienbar. Die reale Browserprüfung war in einem frischen isolierten
temporären Chrome-Profil auf Desktop mit `1440 × 1000` sowie bei exakt
`390 × 844` erfolgreich. Der vollständige lokale Navigations-, CRUD-, Fokus-,
Dirty-Guard-, Delete- und Reload-Fluss, Tastaturfokus, Live-Regionen, der
sichtbare `3px`-Fokusrahmen sowie fehlender horizontaler Seitenoverflow wurden
bestätigt. Es gab 0 Console-Warnungen oder -Fehler, 0 Runtime-Exceptions und
0 externe Requests. Die lokale Suche sowie exakte Kalenderdatum- und Tagfilter
wurden einschließlich AND-Verknüpfung, Leerzustand, Reset, Caretfokus,
gefilterten Mutationsflüssen und ausbleibenden Storage-Schreiboperationen real
im Browser geprüft und sind permanent automatisiert abgedeckt. Die getrennte
synthetische Demo-Runtime und der gesamte lokale Umfang sind vollständig
abgeschlossen, geprüft und veröffentlicht.
Vertrag, View, Controller, Service, Storage und Anwendungskomposition führen
weder eine externe Aktion noch einen Zugriff durch `SyncAgent`, `DataAgent`
oder `TestAgent` ein.

#### Getrennte synthetische LichtwaldLog-Demo-Runtime

ADR 0015 definiert neben dem unveränderten privaten Pfad diesen eigenständigen
Datenfluss:

```text
LichtwaldLogView
  → LichtwaldLogController(expectedDataOrigin: synthetic)
  → LichtwaldLogDemoService
  → LichtwaldLogDemoStorage
  → In-Memory-Full-Snapshot
  → createLichtwaldLogDemoSnapshot
```

`lichtwaldLogDemo.js` exportiert ausschließlich
`createLichtwaldLogDemoSnapshot()`. Die Factory ist argumentlos,
deterministisch und liest weder Datum, Zufall, Storage, Netzwerk noch
Umgebungswerte. Eine statische tief eingefrorene kanonische Quelle enthält
exakt fünf unabhängig erfundene Einträge mit zukünftigen Kalenderdaten, jeweils
einem `[Demo]`-Titel und einer gültigen `featuredEntryId`. Jeder Aufruf
liefert einen frischen vollständig entkoppelten Schema-1-Snapshot mit
`dataOrigin: synthetic`. Der Datensatz demonstriert ein gemeinsames Datum,
einen gemeinsamen Tag, die getrennten exakten Tags `Wald` und
`Waldweg`, den NFC-relevanten Tag `Äther` sowie Suchtreffer in Datum,
Titel, Text und Tags.

`createLichtwaldLogDemoStorage` exportiert eine eingefrorene API mit exakt:

```text
loadLichtwaldLog()
saveLichtwaldLog(lichtwaldLog)
```

Eine Storage-Instanz ruft ihre Seed-Factory genau einmal auf, validiert und
klont den synthetischen Snapshot vollständig und hält danach ausschließlich
ihren eigenen In-Memory-Full-Snapshot. Ein Load liefert `status: found` und
einen frischen defensiven Clone. Ein erfolgreicher Save ersetzt den
vollständigen Snapshot und liefert `status: saved`. Es gibt keinen Missing-,
Reset-, Clear-, Import-, Export-, Seed-, Debug-, Migrations- oder
Browser-Storage-Pfad.

Seed, Load- und Save-Werte müssen den vollständigen Schema-1-Vertrag erfüllen
und exakt `dataOrigin: synthetic` tragen. Jeder Clone wird erneut validiert.
Die tatsächliche JSON-Zeichenfolge ist auch im Demo-Storage anhand von
`String.length` auf 500.000 UTF-16-Codeeinheiten begrenzt; exakt 500.000
sind erlaubt, 500.001 werden abgelehnt. Serialisierungs-, Größen-, Herkunfts-
und Vertragsfehler verwenden ausschließlich statische redigierte Status- und
Code-Paare. Ein ungültiger Seed erzeugt keinen Fallback; ein fehlgeschlagener
Save verändert den letzten vertrauenswürdigen Snapshot nicht.

`createLichtwaldLogDemoService({ lichtwaldLogDemoStorage,
generateLichtwaldLogDemoEntryId })` erhält ausschließlich Demo-Dependencies
und exportiert eine eingefrorene API mit exakt denselben fünf Operationen wie
der private Service:

```text
loadLog()
createEntry({ calendarDate, title, text, tags })
updateEntry(entryId, { calendarDate, title, text, tags })
deleteEntry(entryId)
setFeaturedEntry(entryIdOrNull)
```

Die Implementierung importiert weder privaten Service noch privaten Storage,
hält keinen langlebigen Cache und lädt für jede gültige Operation den aktuellen
synthetischen Snapshot. Trim-, Kalenderdatum-, Tag-, Reihenfolge-, Fokus-,
No-op-, 1.000-Entry-, fünf-Versuche-, genau-ein-Save- und
Fehlerschutzsemantik entsprechen dem privaten Service. Der Produktionsdefault
erzeugt `lichtwald-demo-entry-${crypto.randomUUID()}`. Jeder Kandidat und
jede Rückgabe bleibt synthetisch und defensiv entkoppelt; nach einem
fehlgeschlagenen Save bleibt nur der vorherige vertrauenswürdige Snapshot
autoritativ.

Der wiederverwendete Controller erhält optional `expectedDataOrigin`.
Fehlend oder `undefined` bedeutet exakt `private`; andere gültige
Konstruktionen verwenden ausschließlich `private` oder `synthetic`.
Der Wert bleibt für den Lifecycle unveränderlich und jeder Service-Snapshot
muss exakt dazu passen. Die View erhält daraus nur
`runtimeMode: private` beziehungsweise
`runtimeMode: syntheticDemo`; der Wert wird nicht aus dem Snapshot
abgeleitet und nicht persistiert.

`src/main.js` komponiert beide vollständigen Stacks mit eigenen Storage-,
Service-, View-, Controller- und ID-Generator-Lebenszyklen. Das
Demo-Navigationselement folgt unmittelbar auf das private Modul. Wechsel
erfolgen nur nach erfolgreichem `close()` der aktiven Instanz und es ist
niemals mehr als eine View montiert. Demo-Mutationen bleiben innerhalb der
aktuellen Anwendungskomposition bei Navigation erhalten; Reload oder neue
Komposition erzeugt wieder den kanonischen Seed. Auswahl, Formulare, Filter,
Feedback, Fokus und Caretmetadaten werden beim Schließen zurückgesetzt. Es gibt
keine Konvertierung, kein gemeinsames Seeding, keinen Browser-Key, keinen
privaten Portzugriff und keinen Fallback zwischen beiden Stacks.

#### LichtwaldLog – Schema 1

Schema 1 beschreibt einen vollständigen flachen Journalzustand. Der Root
besitzt exakt `schemaVersion`, `dataOrigin`, `featuredEntryId` und `entries`.
Ein Eintrag besitzt exakt `id`, `calendarDate`, `title`, `text` und `tags`.
Alle Felder sind eigene Pflichtfelder; unbekannte Root- und Entry-Felder werden
abgelehnt.

```json
{
  "schemaVersion": 1,
  "dataOrigin": "synthetic",
  "featuredEntryId": "lichtwald-entry-example",
  "entries": [
    {
      "id": "lichtwald-entry-example",
      "calendarDate": "2026-07-26",
      "title": "Vollständig synthetischer Testmoment",
      "text": "Dieser Inhalt wurde ausschließlich als Testfixture erfunden.",
      "tags": ["Natur", "Ruhe"]
    }
  ]
}
```

##### Root-Felder

| Feld | Typ | Regel |
| --- | --- | --- |
| `schemaVersion` | Zahl | exakt `1` |
| `dataOrigin` | String | exakt `private` oder `synthetic` |
| `featuredEntryId` | String oder `null` | immer vorhanden; bei String bereits getrimmt, 1 bis 100 Zeichen und exakte Referenz auf einen vorhandenen Eintrag |
| `entries` | Array | dichtes Vertragsarray, darf leer sein, höchstens 1.000 Einträge |

Bei einem leeren `entries`-Array muss `featuredEntryId` `null` sein. Der
allgemeine Contract akzeptiert private und synthetische Zustände. Der
implementierte private Storage akzeptiert an seiner Lese- und Schreibgrenze
ausschließlich `dataOrigin: private`.

##### Entry-Felder

| Feld | Typ | Regel |
| --- | --- | --- |
| `id` | String | bereits getrimmt, 1 bis 100 Zeichen, innerhalb von `entries` exakt und case-sensitive eindeutig |
| `calendarDate` | String | existierendes gregorianisches Datum im exakten Format `YYYY-MM-DD`, Jahr `0001` bis `9999` |
| `title` | String | bereits getrimmt, 1 bis 120 Zeichen |
| `text` | String | bereits getrimmt, 1 bis 10.000 Zeichen |
| `tags` | Array | dichtes Vertragsarray, 0 bis 8 Strings |
| `tags[]` | String | bereits getrimmt, 1 bis 30 Zeichen, je Eintrag case-insensitive eindeutig |

Alle Zeichenlimits beziehen sich auf JavaScripts `String.length`. Entry-IDs
und die Referenz in `featuredEntryId` sind case-sensitive; zwei IDs, die sich
nur in Groß- und Kleinschreibung unterscheiden, sind daher verschieden. Das
Datum wird rein arithmetisch nach den gregorianischen Schaltjahrregeln geprüft.
Der Validator verwendet dafür weder `Date` noch UTC- oder Zeitzonenumwandlung.
Auch ein gültiges zukünftiges Kalenderdatum ist vertragskonform.

`text` bleibt als Nutzereingabe unverändert. Zeilenumbrüche sowie HTML- oder
Script-ähnliche Zeichenfolgen sind zulässiger Stringinhalt; der Validator
bereinigt, interpretiert oder normalisiert sie nicht. Eine spätere View muss
diesen Inhalt sicher als Text darstellen. Tags verwenden keine Whitelist und
werden nicht an Kommata aufgeteilt. Ihre Eindeutigkeit wird ohne Mutation
case-insensitive geprüft, während die eingegebene Schreibweise erhalten
bleibt.

##### Arraycontainer für `entries` und `tags`

`entries` und jedes `tags`-Feld sind dichte Vertragsarrays. Ihr direkter
Prototyp muss entweder `Array.prototype` oder `null` sein. Ihre Länge muss als
nicht negative sichere Ganzzahl lesbar sein. Neben der eigenen
`length`-Eigenschaft sind ausschließlich kanonische eigene Arraypositionen
zulässig. Eine solche Position ist ein String-Key, der exakt der dezimalen
Darstellung seines Index entspricht und innerhalb der Arraylänge liegt.
Zusätzliche eigene Stringfelder wie `note` oder `01`, nicht enumerierbare
Stringfelder und eigene Symbolfelder sind nicht Teil des Schema-1-Vertrags.

Zusätzliche Arrayfelder erzeugen je betroffenem Container genau einen
redigierten `unknownProperty`-Fehler an `$.entries.*` beziehungsweise
`$.entries[n].tags.*`. Ein benutzerdefinierter direkter Prototyp oder ein nicht
sicher inspizierbarer Container erzeugt stattdessen `invalidEntries` an
`$.entries` beziehungsweise `invalidTags` an `$.entries[n].tags`. Feldnamen,
Symbolbeschreibungen, Werte und fremde Exception-Meldungen werden nicht in das
Fehlerresultat übernommen.

Bei mehr als 1.000 Entries beziehungsweise mehr als acht Tags darf die
vollständige Own-Key-Aufzählung bewusst übersprungen werden, damit die Prüfung
begrenzt bleibt. Die kontrollierte Prototyp- und Längenprüfung findet weiterhin
statt; für die überschrittene Containergrenze reicht der bestehende
`entryLimitExceeded`- beziehungsweise `tagLimitExceeded`-Fehler aus. Dadurch
werden zusätzliche Felder eines überlangen Arrays nicht vertragsgültig: Der
Container ist bereits wegen seiner überschrittenen Grenze ungültig.

Reguläre, mit `JSON.parse` erzeugte und bisher vertragsgültige Snapshots bleiben
kompatibel. Das Array-Hardening ändert weder `schemaVersion: 1` noch den
Storage-Key `goldendawn.lichtwaldLog.content.v1` oder dessen
Persistenznamespace `v1`; eine Migration ist nicht erforderlich.

##### Fokusmodell

`featuredEntryId` ist die einzige Fokusinformation des Vertrags. Der Eintrag
wird weder in einem zweiten Feld kopiert noch durch ein `isFeatured`-Flag
markiert. `null` bedeutet, dass kein Eintrag fokussiert ist. Jeder String muss
exakt auf eine vorhandene Entry-ID verweisen; verwaiste Referenzen sind
ungültig.

Der implementierte Service setzt `featuredEntryId` beim Löschen des aktuell
fokussierten Eintrags innerhalb desselben vollständig validierten Kandidaten auf
`null`. Ein zwischenzeitlich persistierter Zustand mit verwaister Referenz ist
nicht zulässig. Die Contract Foundation definiert diese Invariante; die
Service-Foundation setzt sie atomar in genau einer erfolgreichen Mutation um.

##### Validierungsverhalten und Fehlercodes

`validateLichtwaldLog` ist rein, verändert die Eingabe nicht und liefert
entweder `{ ok: true, errors: [] }` oder `{ ok: false, errors }`. Jeder Fehler
besitzt die Form `{ code, path, message }`. Der Validator sammelt unabhängig
prüfbare Fehler in stabiler Reihenfolge, ohne Rohwerte oder private Inhalte in
Fehlermeldungen aufzunehmen.

Root und einzelne Entries müssen einfache Objekte mit `Object.prototype` oder
ohne Prototyp sein; Arrays, Klasseninstanzen und Objekte mit
benutzerdefiniertem Prototyp werden abgelehnt. Die `entries`- und
`tags`-Container folgen zusätzlich der oben beschriebenen dichten Arrayform.
Fehlende Pflichtfelder, unbekannte String- oder Symbolfelder, ungültige
Arraypositionen und nicht lesbare Strukturen werden kontrolliert als Fehler
gemeldet. Die Prüfung trimmt, sortiert, dedupliziert oder ergänzt keine Werte.

| Code | Bedeutung |
| --- | --- |
| `invalidLichtwaldLog` | Der Root ist kein zulässiges Vertragsobjekt. |
| `unsupportedSchemaVersion` | `schemaVersion` ist nicht exakt `1`. |
| `invalidDataOrigin` | `dataOrigin` ist weder `private` noch `synthetic`. |
| `invalidEntries` | `entries` ist kein Array mit zulässigem direktem Prototyp oder sein Container ist nicht sicher inspizierbar. |
| `entryLimitExceeded` | `entries` enthält mehr als 1.000 Positionen. |
| `invalidEntry` | Eine Entry-Position enthält kein zulässiges Vertragsobjekt. |
| `unknownProperty` | Root, Entry, `entries` oder `tags` enthält ein nicht erlaubtes eigenes String- oder Symbolfeld. |
| `missingProperty` | Ein vorgeschriebenes eigenes Feld fehlt. |
| `invalidId` | Entry-ID oder Fokus-ID ist kein nicht leerer, bereits getrimmter String. |
| `idTooLong` | Entry-ID oder Fokus-ID überschreitet 100 Zeichen. |
| `duplicateEntryId` | Eine exakte, case-sensitive Entry-ID kommt mehrfach vor. |
| `invalidCalendarDate` | Das Kalenderdatum verletzt Format, Jahresbereich oder gregorianische Datumsregeln. |
| `invalidTitle` | Der Titel ist kein nicht leerer, bereits getrimmter String. |
| `titleTooLong` | Der Titel überschreitet 120 Zeichen. |
| `invalidText` | Der Text ist kein nicht leerer, bereits getrimmter String. |
| `textTooLong` | Der Text überschreitet 10.000 Zeichen. |
| `invalidTags` | `tags` ist kein Array mit zulässigem direktem Prototyp oder sein Container ist nicht sicher inspizierbar. |
| `tagLimitExceeded` | Ein Eintrag besitzt mehr als acht Tag-Positionen. |
| `invalidTag` | Eine Tag-Position ist kein nicht leerer, bereits getrimmter String. |
| `tagTooLong` | Ein Tag überschreitet 30 Zeichen. |
| `duplicateTag` | Ein Tag kommt im selben Eintrag case-insensitive mehrfach vor. |
| `featuredEntryNotFound` | Die gültig geformte Fokus-ID referenziert keine gültige vorhandene Entry-ID. |

##### Reine lokale Such- und Filterableitung

`lichtwaldLogSearch.js` ergänzt den Vertrag ausschließlich um eine reine,
flüchtige Ableitung. Seine öffentliche API besteht exakt aus:

```js
export const ALL_LICHTWALD_LOG_TAGS = ''
export const LICHTWALD_LOG_SEARCH_QUERY_MAX_LENGTH = 200

export function getLichtwaldLogFilterTags(entries) {}

export function filterLichtwaldLogEntries(
  entries,
  {
    query = '',
    calendarDate = '',
    tag = ALL_LICHTWALD_LOG_TAGS,
  } = {}
) {}
```

Für den Suchvergleich wird ausschließlich die äußere Query-Whitespace entfernt,
anschließend kanonisch mit NFC normalisiert und mit `toLowerCase()` in eine
einheitliche Groß-/Kleinschreibung überführt. Interne Leerzeichen, Tabs und
Zeilenumbrüche bleiben unverändert und bedeutungsvoll. Der normalisierte Wert
wird als literaler zusammenhängender Teilstring ausschließlich mit
`calendarDate`, `title`, `text` und jedem Wert aus `tags[]` verglichen. Entry-ID,
`dataOrigin`, `schemaVersion`, Status und andere Metadaten sind keine
Suchfelder. Es gibt weder RegExp- oder Markup-Auswertung noch Akzententfernung,
Transliteration, Kompatibilitätsnormalisierung, Tokenisierung, Fuzzy Search,
Ranking oder Highlighting. Der rohe Querywert bleibt für das Control
unverändert; der Controller akzeptiert höchstens 200 UTF-16-Codeeinheiten.

Der leere Kalenderdatum-Filter bedeutet alle Daten. Jeder andere Wert muss
bereits ein gültiges gregorianisches Datum im exakten Format `YYYY-MM-DD` sein
und wird mit dem vorhandenen `isValidCalendarDate` ohne `Date`-, UTC-,
Zeitzonen- oder Locale-Konvertierung geprüft. Der Vergleich verwendet nur den
exakten gespeicherten String. Der leere Tag-Sentinel bedeutet alle Tags. Ein
anderer Tag trifft ausschließlich einen vollständigen Tag nach derselben NFC-
und Case-Normalisierung; ein Teilstring reicht nicht.

`getLichtwaldLogFilterTags` leitet Optionen immer aus allen autoritativen
Einträgen ab. Normalisiert gleiche Tags werden dedupliziert, wobei die erste
gespeicherte Schreibweise sowie Entry- und Tag-Reihenfolge erhalten bleiben.
Suche, Datum und Tag werden mit logischem AND kombiniert. Die Ergebnisreihenfolge
bleibt exakt die Snapshot-Reihenfolge; auch der fokussierte Eintrag wird nicht
verschoben. Beide Funktionen verändern keine Eingabe, geben neue dichte Arrays
zurück und bewahren die ursprünglichen Entry-Referenzen. Ein nicht arrayförmiger
Entry-Container wird kontrolliert als leer behandelt; unbekannte Filterwerte
werden nicht durch String-Coercion interpretiert.

Suchkriterien, Tagoptionen und Ergebnis-IDs sind keine Felder von Schema 1 und
werden weder vom Service noch vom Storage oder Adapter gelesen oder gespeichert.
Die APIs dieser drei Grenzen bleiben unverändert.

##### Implementierte LichtwaldLog-Controller-Foundation

Die Controller-Foundation ergänzt den lokalen Pfad, ohne den Schema-1- oder
Persistenzvertrag zu verändern:

```text
LichtwaldLogView
  → LichtwaldLogController
  → LichtwaldLogService
  → LichtwaldLogStorage
  → StorageAdapter
  → localStorage
```

Die Factory erhält Service, View-Port, optionalen Scheduler und die optionale
erwartete Herkunft:

```js
createLichtwaldLogController({
  lichtwaldLogService,
  lichtwaldLogView,
  scheduleTask,
  expectedDataOrigin,
})
```

Fehlendes oder `undefined` `expectedDataOrigin` bedeutet exakt
`private`; ansonsten sind nur `private` und `synthetic` zulässig.
Der Wert ist konstruktionsgebunden und kann im Lifecycle nicht wechseln.

Ihre Rückgabe ist eingefroren und enthält exakt:

```text
open
close
```

Der injizierte View-Port ist ausschließlich auf `render(viewModel, actions)`
und `unmount()` begrenzt. `createLichtwaldLogView(rootElement)` implementiert
ihn als isolierte DOM-Foundation und liefert eine eingefrorene API mit exakt
den eigenen Data-Properties `render` und `unmount`. Jeder Render erhält
dieselbe eingefrorene Action-API mit exakt:

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

Das View-Modell projiziert ausschließlich die Phasen `loading`, `empty`,
`ready`, `loadError` und `mutating`, die Eintrags- und Fokusprojektion sowie
flüchtige Auswahl-, Formular-, Löschbestätigungs-, Fokusmutations-, Status-,
Fehler-, Fokusziel-, Such- und Filterzustände. `entries` bleibt die vollständige
autoritative UI-Projektion. `visibleEntryIds`, `availableTags`, `searchQuery`,
`calendarDateFilter`, `selectedTag`, `hasActiveFilters` und
`filteredEmptyState` werden aus ihr neu abgeleitet. Die Übersicht rendert nur
die bezeichneten sichtbaren Entries; Detail und Formulare greifen weiterhin auf
den vollständigen Snapshot zu. Null Treffer bleiben `phase: ready`; nur ein
tatsächlich leerer Snapshot verwendet `phase: empty`. Das View-Modell wird für
jeden Render frisch erzeugt, tief
eingefroren und von internen sowie früheren Referenzen entkoppelt. Der rohe
Schema-1-Root, `schemaVersion`, `dataOrigin`, Service-, Storage- und
Adapterresultate sowie Lifecycle- und Operationstokens werden nicht an die View
weitergegeben. Ein ausgewählter Entry wird nicht als zweite Inhaltskopie im
View-Modell gehalten.

Der intern gehaltene LichtwaldLog-Snapshot ist ausschließlich eine flüchtige
UI- und Reconciliation-Projektion. Jeder vom Service gelieferte Snapshot wird
erneut vollständig mit `validateLichtwaldLog` geprüft, tief entkoppelt und nur
mit der konstruktionsgebundenen exakten `dataOrigin` akzeptiert.
Abweichende oder unvollständige Snapshots werden kontrolliert abgelehnt. Das
View-Modell projiziert zusätzlich ausschließlich `runtimeMode: private` oder
`runtimeMode: syntheticDemo` aus dieser Konfiguration, nie aus dem
geladenen Snapshot. Der Controller konstruiert aus seiner
Projektion niemals einen Persistenzkandidaten. Storage bleibt die einzige
veränderliche Wahrheit; der Service bleibt die autoritative fachliche
Operationsgrenze.

Pro akzeptierter Lade- oder Mutationsintention wird exakt eine passende
Servicemethode aufgerufen:

- Initiales Laden und ein ausdrücklich akzeptierter Retry rufen jeweils einmal
  `loadLog` auf.
- Ein Create- oder Update-Submit ruft einmal `createEntry(input)`
  beziehungsweise `updateEntry(entryId, input)` auf.
- Eine bestätigte Löschung ruft einmal `deleteEntry(entryId)` auf.
- Fokus setzen oder entfernen ruft einmal
  `setFeaturedEntry(entryIdOrNull)` auf.
- Auswahl, Rückkehr zur Übersicht, Öffnen und Ändern eines Formulars,
  Formularabbruch sowie Anfordern und Abbrechen einer Löschbestätigung rufen
  keinen Service auf und bleiben schreibfrei.
- Gültige Änderungen von Query, Kalenderdatum und Tag sowie gemeinsames
  Zurücksetzen rufen weder Service, Storage, Adapter, ID-Generator noch
  Scheduler auf und bleiben vollständig lese- und schreibfrei.

Nach Mutationen erfolgt kein zusätzlicher `loadLog`-Aufruf, kein automatischer
Retry und kein Storage-Fallback. Der Controller verändert Inhalte, Delete-Ziele
oder Fokus nicht optimistisch, sondern ersetzt seine Projektion erst mit einem
vollständig akzeptierten Service-Snapshot. Ein scheinbar identisches Update
oder Fokusziel wird nicht controllerseitig abgekürzt; ausschließlich der
Service entscheidet anhand des aktuellen Storagezustands über einen
schreibfreien No-op.

Auswahl-, Update-, Delete- und Fokusziele werden ausschließlich als bereits
getrimmte, exakte und case-sensitive IDs aus dem aktuellen vertrauenswürdigen
Snapshot akzeptiert. In der Übersicht muss ein Auswahlziel zusätzlich in
`visibleEntryIds` enthalten sein. `onSetFeaturedEntry` erhält den ausdrücklichen
Endzustand als Entry-ID oder `null`; es existiert weder eine Toggle- noch eine
zusätzliche Clear-Aktion. Akzeptierte Service-Snapshots ersetzen die alte Projektion
vollständig. Ihre Entry- und Tag-Reihenfolge bleibt unverändert.

Die Query ist auf 200 UTF-16-Codeeinheiten begrenzt; exakt 200 werden
akzeptiert. Datum ist nur als leerer Wert oder gültiges Contract-Datum, Tag nur
als Sentinel oder aktuell verfügbare Option zulässig. Ungeeignete Typen,
überlange Queries und unbekannte Werte sind vollständige No-ops. Filteraktionen
sind nur in der Overview mit nutzbarem Snapshot und ohne Formular,
Delete-Bestätigung oder Mutation erlaubt. Filter bleiben innerhalb eines
geöffneten Lifecycles bei Detail und Rückkehr, Formular und Abbruch sowie allen
kontrollierten Mutationsergebnissen erhalten. Nach jedem autoritativen Snapshot
werden Ergebnisse und Optionen neu abgeleitet. Ein ausgewählter normalisierter
Tag wird auf die aktuelle erste Schreibweise abgebildet oder bei vollständigem
Verschwinden auf alle Tags zurückgesetzt. `open()`, Load-Retry, erfolgreiches
`close()` und ein tatsächlich leerer Snapshot setzen die Kriterien zurück.
Filter allein sind niemals dirty.

Serviceergebnisse werden ausschließlich über erlaubte eigene Data-Properties
und dokumentierte Status-Code-Kombinationen geprüft. Controllerfehler,
Feldfehler und Statusmeldungen stammen aus festen Allowlists. Private Werte,
IDs, Tags, fremde Getter-, Proxy-, Service-, Dependency- oder
Exception-Meldungen werden nicht in Feedback, Logs oder Console-Ausgaben
übernommen. Jeder View-Entry, jedes Tag-Array, jeder Formularwert und jedes
Fokusziel ist defensiv entkoppelt.

Gültiger LichtwaldLog-Text bleibt ungeparster, nicht vertrauenswürdiger Plain
Text. Der Controller interpretiert, bereinigt oder interpoliert HTML-, Script-
oder markupähnliche Inhalte nicht. Die isolierte View gibt ihn ausschließlich
über `textContent`, `createTextNode`, Formcontrol-Werte und feste Attribute
sicher aus.

Die Controller-Foundation ändert weder den Read-Preflight noch das
500.000-UTF-16-Codeeinheiten-Limit. Browser-Quota, unverschlüsselter
Same-Origin-Zugriff, TOCTOU- und Multi-Tab-Verhalten bleiben ebenfalls
unverändert.

##### Implementierte isolierte LichtwaldLog-View-Foundation

`createLichtwaldLogView(rootElement)` liest ausschließlich das defensive,
tief eingefrorene Controller-View-Modell und die oben dokumentierte
sechzehnteilige Action-API. Sie liest weder `schemaVersion`, `dataOrigin` noch den
rohen Schema-1-Root und führt keine zweite Vertrags-, Service- oder
Storagevalidierung ein. Jeder Render baut einen frischen DOM-Baum auf und
bewahrt Entry- und Tag-Reihenfolge sowie die gespeicherte Schreibweise.

Titel, Texte, Tags und Formwerte bleiben ungeparster Plain Text.
Entry-IDs dienen ausschließlich unverändert als Action-Ziele in Closures und
renderlokalen Maps. Sie werden weder angezeigt noch in DOM-/ARIA-IDs,
Selektoren, Klassen, `data-*`-Attribute, URLs oder View-eigene Meldungen
übernommen. Die View verwendet keine dynamische HTML- oder Markup-Auswertung.

Das Filterpanel erscheint ausschließlich in der nicht leeren Overview und
verwendet feste öffentliche IDs. Query und Kalenderdatum werden nur über die
jeweilige Control-Property `.value`, Tagoptionen nur über sichere Text- und
Formcontrol-APIs ausgegeben. Der Ergebnisstatus enthält ausschließlich Zahlen
und statische Texte. Query, Datum, Tag und Entry-IDs gelangen nicht in
dynamische IDs, Klassen, Selektoren, Meldungen, URLs, `data-*`- oder
ARIA-Attribute. Nicht sichtbare Entries werden vollständig aus dem neuen DOM
entfernt. Der gefilterte Leerzustand bleibt vom autoritativen Leerzustand
getrennt und bietet einen erreichbaren Reset.

Die Create-Submitform ist exakt:

```js
{
  type: 'createEntry',
  calendarDate,
  title,
  text,
  tags,
}
```

Die Update-Submitform ist exakt:

```js
{
  type: 'updateEntry',
  entryId,
  calendarDate,
  title,
  text,
  tags,
}
```

Die Update-ID stammt ausschließlich aus dem gebundenen View-Modell. Tags
werden über getrennte Eingabefelder als jeweils neues dichtes Standard-Array
übergeben. Die View trimmt, splittet, sortiert, dedupliziert oder normalisiert
sie nicht und entfernt insbesondere keine leeren Draftpositionen. Kommas
bleiben regulärer Bestandteil eines einzelnen Tagstrings.

Lade-, Leer-, Busy-, Erfolgs-, Notice-, Validierungs- und Fehlerzustände werden
zugänglich dargestellt. Nach dem vollständigen DOM-Austausch löst die View die
Controller-Fokusziele `heading`, `entry`, `formField`, `formAlert`,
`formTrigger`, `deleteConfirmation`, `deleteAlert`, `featuredAlert` und
`status` sowie `searchInput`, `calendarDateFilter` und `tagFilter` kontrolliert
auf. Suchevents stellen Suchfokus und geklemmte Selection/Caret-Metadaten wieder
her; Datum und Tag erhalten ihren jeweiligen Controlfokus zurück, Reset das
leere Suchfeld bei Position 0. Ergebnisänderungen fokussieren keine Karte.
Fokusaktionen verwenden ausschließlich den
ausdrücklichen Endzustand als exakte Entry-ID oder `null`; die View projiziert
Inhalt, Löschung und Fokus nicht optimistisch.

`unmount()` entfernt sämtliche Inhalte und `aria-busy` aus dem
dedizierten Root und verwirft nur flüchtige Fokus- und Caret-Metadaten. Die
View bildet keine persistente oder fachlich autoritative Zustandsquelle;
Storage und Service bleiben die autoritativen Grenzen. Das responsive
Modul-CSS besitzt Reduced-Motion-Regeln und ist ebenso wie die View über
`src/main.js` in die Anwendungskomposition eingebunden. Der bestehende
Storage-Key, das 500.000-Codeeinheiten-Limit, Browser-Quota, Read-Preflight,
TOCTOU- und Multi-Tab-Grenzen bleiben unverändert.

Bei exakt `runtimeMode: syntheticDemo` verwendet die View dauerhaft die
textlichen Kennzeichnungen `Synthetische Demo`, `LichtwaldLog Demo`
und `Demo · nur für diese Sitzung` sowie den Hinweis
`Synthetische Demo mit vollständig erfundenen Beispieldaten. Änderungen bleiben nur bis zum Neuladen dieser Seite erhalten.`
Sie verwendet in diesem Modus weder Texte über private Journale, aktuelles
Browserprofil, `localStorage`, Cloud-Sicherung noch dauerhaftes Löschen.
Fehlendes oder unbekanntes `runtimeMode` behält die private Darstellung.

##### Implementierte LichtwaldLog-Service-Foundation

Die Service-Foundation führt keine neue Datenquelle ein. Ihr vollständiger
lokaler Pfad lautet:

```text
LichtwaldLogService
  → LichtwaldLogStorage
  → StorageAdapter
  → localStorage
```

Die Factory wird ausschließlich mit dem fachlichen Storage und dem optionalen
ID-Generator erzeugt:

```js
createLichtwaldLogService({
  lichtwaldLogStorage,
  generateLichtwaldLogEntryId,
})
```

Ihre Rückgabe ist eingefroren und enthält exakt diese fünf Operationen:

```js
loadLog()
createEntry({ calendarDate, title, text, tags })
updateEntry(entryId, { calendarDate, title, text, tags })
deleteEntry(entryId)
setFeaturedEntry(entryIdOrNull)
```

`setFeaturedEntry(null)` entfernt den Fokus. Eine zusätzliche öffentliche
Clear- oder Toggle-Methode wird nicht angeboten.

###### Autoritativer Zustand und Erfolgsresultate

`LichtwaldLogStorage` bleibt die einzige veränderliche Wahrheit. Der Service
hält keinen langlebigen Cache. Nach erfolgreicher Eingabeprüfung lädt jede
gültige Mutation den aktuellen Zustand an ihrer Dependency-Grenze genau einmal
neu. Akzeptiert werden ausschließlich die dokumentierten Storage-Erfolge
`missing` und `found` mit einem vollständig gültigen privaten
Schema-1-Snapshot. Auch `loadLog` prüft und entkoppelt den erhaltenen Zustand
erneut.

Die Ladeerfolge enthalten keinen Initialisierungsschreibzugriff:

| Storage-Fall | `status` | Weitere Ergebnisfelder |
| --- | --- | --- |
| Key fehlt | `empty` | `ok: true`, `initialized: false`, frischer privater `lichtwaldLog` |
| gültiger privater Bestand | `loaded` | `ok: true`, `initialized: false`, geladener privater `lichtwaldLog` |

Mutationserfolge verwenden exakt diese Status- und Nutzdatenfelder:

| Operation und Fall | `status` | `changed` | Weitere Ergebnisfelder |
| --- | --- | --- | --- |
| Eintrag erstellt | `entryCreated` | `true` | `createdEntry`, `lichtwaldLog` |
| Eintrag tatsächlich oder inhaltlich identisch aktualisiert | `entryUpdated` | `true` oder `false` | `updatedEntry`, `lichtwaldLog` |
| Eintrag gelöscht | `entryDeleted` | `true` | `deletedEntryId`, `focusCleared`, `lichtwaldLog` |
| Fokus tatsächlich oder inhaltlich identisch geändert | `featuredEntryUpdated` | `true` oder `false` | `featuredEntryId`, `lichtwaldLog` |

Alle Snapshots und Einzeleinträge in Rückgaben sowie jedes Save-Argument sind
tief von Formeingaben, Storage-Resultaten, vorherigen Snapshots, internen
Mutationskandidaten, anderen Rückgaben und späteren Serviceaufrufen entkoppelt.
Gültige tief eingefrorene Eingaben und Storage-Zustände werden nicht mutiert.

###### Eingabevalidierung und Normalisierung

Form- und Ziel-ID-Eingaben werden vor dem ersten Storage-Zugriff validiert.
Ungültige Eingaben lösen weder Load noch Save oder ID-Generator aus. Der Service
liest ausschließlich die erwarteten eigenen Formularfelder und konstruiert
persistierte Entries aus einer festen Feld-Allowlist; zusätzliche Felder können
weder ID noch Herkunft oder andere Vertragswerte überschreiben.

Für `calendarDate`, `title` und `text` muss der Eingabewert ein String
sein. Der Service trimmt nur äußere Whitespaces; interne Whitespaces und
Zeilenumbrüche bleiben erhalten. Die Längenprüfung verwendet die exportierten
Vertragsgrenzen. Anschließend wird das Kalenderdatum über die vorhandene
`isValidCalendarDate`-Prüfung rein arithmetisch geprüft. Der Service verwendet
weder `Date`-Parsing noch UTC- oder Zeitzonenumwandlung.

`tags` muss ein dichtes Array mit direktem Prototyp `Array.prototype` oder
`null` sein und darf höchstens acht Positionen enthalten. Jede Position muss
ein String sein, wird außen getrimmt und muss danach die vorhandene
Vertragslänge einhalten. Duplikate werden nach der Normalisierung
case-insensitive abgelehnt. Reihenfolge und Schreibweise gültiger Tags bleiben
erhalten; der Service teilt nicht an Kommata, sortiert nicht, dedupliziert nicht
und entfernt keine Position stillschweigend. Sparse Arrays, zusätzliche eigene
Arrayfelder, geerbte Ersatzpositionen, ungeeignete Prototypen sowie nicht sicher
lesbare Getter-, Proxy- oder Reflection-Strukturen werden kontrolliert
abgelehnt.

Ziel-IDs für Update, Delete und Fokus müssen nicht leer, bereits getrimmt und
höchstens 100 Zeichen lang sein. Sie werden nicht automatisch normalisiert,
sondern exakt und case-sensitive aufgelöst. `null` ist ausschließlich für
`setFeaturedEntry` erlaubt.

###### ID-Erzeugung und Kapazitätsgrenze

Der Produktionsdefault erzeugt
`lichtwald-entry-${crypto.randomUUID()}`. Eine generierte ID muss ein nicht
leerer, bereits getrimmter String von höchstens 100 Zeichen und im aktuellen
`entries`-Array exakt sowie case-sensitive eindeutig sein. Ungültige,
überlange, kollidierende und werfende Generatorresultate teilen sich insgesamt
höchstens fünf Versuche. Danach endet Create kontrolliert mit
`generationFailed` / `lichtwaldLogEntryIdGenerationFailed` und ohne Save.

Der Generator wird erst nach erfolgreicher Formvalidierung, autoritativem Load
und Kapazitätsprüfung aufgerufen. Aus 999 Einträgen darf der 1.000. Eintrag
entstehen. Bei bereits 1.000 Einträgen folgt `limitReached` /
`lichtwaldLogEntryLimitReached`, ohne Generator- oder Save-Aufruf.

###### Mutations- und No-op-Semantik

Jede echte Mutation erzeugt ohne Eingabe- oder Bestandsmutation einen neuen
vollständigen privaten Zustand, validiert ihn mit `validateLichtwaldLog`,
verlangt weiterhin `dataOrigin: private`, ruft an der Servicegrenze genau
einmal `saveLichtwaldLog` auf und gibt den Kandidaten erst nach bestätigtem
`status: saved` als neuen Zustand zurück.

- Create hängt den neuen Entry am Ende des vorhandenen Arrays an, sortiert
  nicht nach Kalenderdatum und verändert `featuredEntryId` nicht.
- Update ersetzt Kalenderdatum, Titel, Text und Tags vollständig. Die ID,
  Arrayposition und eine passende Fokusreferenz bleiben erhalten. Sind alle
  normalisierten fachlichen Werte identisch, bleibt der Erfolgsstatus
  `entryUpdated` bei `changed: false` und ohne Save.
- Delete behandelt ein unbekanntes Ziel als `notFound`, nicht als
  idempotenten Erfolg. Die Reihenfolge der übrigen Entries bleibt erhalten.
  Wird der fokussierte Entry gelöscht, werden Entry und Fokus im selben
  Kandidaten geändert, vollständig validiert und genau einmal gespeichert.
  Ein verwaister Zwischenzustand wird niemals persistiert.
- Ein nicht-null Fokus darf nur auf eine vorhandene exakte Entry-ID gesetzt
  werden. `null` entfernt den Fokus. Ein identischer Fokus oder das erneute
  Entfernen eines bereits leeren Fokus liefert
  `featuredEntryUpdated` / `changed: false` ohne Save. Fokusinformation
  bleibt ausschließlich in `featuredEntryId`; ein `isFeatured`-Feld oder
  eine Inhaltskopie entsteht nicht.

###### Kontrollierte Servicefehler

Fehler aus Mutationsoperationen haben diese gemeinsame Form:

```js
{
  ok: false,
  status,
  changed: false,
  lichtwaldLog: previousTrustedSnapshotOrNull,
  error: {
    code,
    message,
    fieldErrors,
  },
}
```

`fieldErrors` ist ausschließlich bei Eingabefehlern vorhanden. Vor einem
erfolgreichen Load ist `lichtwaldLog: null`. Nach einem erfolgreichen Load
darf ein vollständig entkoppelter Clone des vorherigen vertrauenswürdigen
Snapshots zurückgegeben werden. Nach einem fehlgeschlagenen Save wird niemals
der nicht persistierte Kandidat als autoritativ ausgegeben. Das explizite
`lichtwaldLog`-Nutzdatenfeld bleibt von der redigierten `error`-Struktur
getrennt.

Mindestens diese servicespezifischen Status-Code-Paare sind stabil:

| Fall | `status` | `code` |
| --- | --- | --- |
| ungültige Form- oder Ziel-ID-Eingabe | `validationFailed` | `invalidLichtwaldLogInput` |
| Eintragsgrenze bereits erreicht | `limitReached` | `lichtwaldLogEntryLimitReached` |
| Ziel nicht gefunden | `notFound` | `lichtwaldLogEntryNotFound` |
| ID-Erzeugung nach fünf Versuchen gescheitert | `generationFailed` | `lichtwaldLogEntryIdGenerationFailed` |
| intern erzeugter Gesamtzustand ungültig | `validationFailed` | `invalidLichtwaldLogState` |
| Storage-Abhängigkeit fehlt | `unavailable` | `lichtwaldLogStorageUnavailable` |
| geworfener Lesezugriff | `readFailed` | `lichtwaldLogStorageReadFailed` |
| geworfener Schreibzugriff | `writeFailed` | `lichtwaldLogStorageWriteFailed` |
| unbekanntes oder widersprüchliches Storage-Resultat | `storageFailed` | `unexpectedStorageResult` |

Bekannte dokumentierte Status-Code-Paare des LichtwaldLog-Storage dürfen nur
über eine ausdrückliche Allowlist unterscheidbar bleiben. Der Service verwendet
für jeden Fall eigene statische Meldungen und kopiert niemals fremde Storage-,
Adapter- oder Exception-Meldungen. Formwerte, Entry- und Fokus-IDs, Tags,
Generatorwerte, Getter- oder Proxy-Sentinels und fremde Fehlertexte gelangen
weder in `error` noch in Logs oder Console-Ausgaben.

Der Service serialisiert nicht, prüft nicht selbst die
500.000-UTF-16-Codeeinheiten-Grenze, greift weder auf `StorageAdapter` noch
auf `localStorage` zu und führt keinen zusätzlichen Read-Preflight aus. Der
vorhandene `saveLichtwaldLog`-Pfad behält seinen eigenen Preflight. Deshalb
kann eine echte Mutation trotz genau eines Service-Loads und eines
Service-Saves auf Adapterebene zusätzliche Reads ausführen. Browser-Quota,
unverschlüsselter Same-Origin-Zugriff, TOCTOU- und Multi-Tab-Rennen bleiben
unveränderte Grenzen.

##### Implementierte private LichtwaldLog-Persistenz und Sicherheitsgrenzen

Die private Storage-Foundation verwendet ausschließlich diesen Datenfluss:

```text
LichtwaldLogStorage
  → StorageAdapter
  → localStorage
```

`LICHTWALD_LOG_STORAGE_KEY` ist fest auf
`goldendawn.lichtwaldLog.content.v1` gesetzt. Das `v1` bezeichnet nur den
Persistenznamespace und wird unabhängig vom fachlichen `schemaVersion: 1`
versioniert. Der gespeicherte Wert ist unmittelbar der vollständige
Schema-1-Root. Es gibt weder ein zweites Envelope noch getrennte Keys für
`entries` und `featuredEntryId`. Dadurch bleibt die Fokusreferenz Bestandteil
desselben vollständig validierten JSON-Snapshots.

`LICHTWALD_LOG_MAX_SERIALIZED_LENGTH` ist exakt `500_000`. Gemessen wird die
tatsächliche, vom gemeinsamen `StorageAdapter` erzeugte JSON-Zeichenfolge mit
JavaScripts `String.length`, also in UTF-16-Codeeinheiten einschließlich der
von `JSON.stringify` erzeugten JSON-Escapes. Ein Wert mit exakt 500.000
Codeeinheiten ist erlaubt; jeder größere Wert wird kontrolliert abgelehnt.
Diese Grenze ist eine Anwendungsgrenze und keine Garantie für die
browserabhängige Storage-Quota. Ein `QuotaExceededError` bleibt deshalb ein
getrennter technischer Fehlerfall.

Der gemeinsame Adapter unterstützt dafür rückwärtskompatibel:

```text
readJson(key, options?)
writeJson(key, value, options?)
```

Ohne `options` beziehungsweise mit `undefined` bleibt das bisherige Verhalten
aller bestehenden Aufrufer unverändert. Wird `options` angegeben, muss
`options.maxSerializedLength` eine positive sichere Ganzzahl sein. Eine
ungültige Konfiguration wird vor jedem Storage- oder Serialisierungszugriff als
`invalidLimit` / `invalidStorageLimit` abgelehnt.

Beim Lesen ruft der Adapter `getItem` kontrolliert auf und behandelt einen
fehlenden Key weiterhin als `missing`. Einen vorhandenen String prüft er vor
`JSON.parse` anhand seiner `String.length`. Eine Überschreitung liefert
`sizeLimitExceeded` / `storageSizeLimitExceeded`, ohne den Inhalt zu parsen.
Deshalb hat dieses Ergebnis auch für übergroßes ungültiges JSON Vorrang vor
`invalidJson`.

Beim Schreiben serialisiert der Adapter den Wert exakt einmal mit
`JSON.stringify`. Nach einem kontrollierten Serialisierungsfehler prüft er die
tatsächliche Zeichenfolge vor `setItem`. Eine Überschreitung liefert ebenfalls
`sizeLimitExceeded` / `storageSizeLimitExceeded`; `setItem` wird in diesem Fall
nicht aufgerufen. Erst ein Wert innerhalb des Limits führt zu genau einem
`setItem`-Aufruf. Die JSON-Serialisierung bleibt damit vollständig im
gemeinsamen Adapter und wird im LichtwaldLog-Storage nicht dupliziert.

Die bestehende Semantik von `removeJsonIfUnchanged` bleibt unverändert. Für
`readJson`, `writeJson` und `removeJsonIfUnchanged` gilt zusätzlich: Lässt sich
der `name` eines gefangenen Fehlerobjekts nicht sicher lesen, entkommt keine
Exception. Der Adapter fällt kontrolliert auf den allgemeinen Lese-, Schreib-
beziehungsweise Entfernungsfehler zurück.

`createLichtwaldLogStorage(storageAdapter)` gibt eine eingefrorene API mit
exakt diesen beiden Methoden zurück:

```text
loadLichtwaldLog()
saveLichtwaldLog(lichtwaldLog)
```

Frei wählbare Keys und Methoden für Delete, Clear, Reset, Import, Export,
Migration, Seeding, Append oder Sync werden nicht angeboten. Ein fehlender Key
liefert bei jedem Aufruf ohne Schreibzugriff einen frischen privaten
Leerzustand:

```json
{
  "ok": true,
  "status": "missing",
  "lichtwaldLog": {
    "schemaVersion": 1,
    "dataOrigin": "private",
    "featuredEntryId": null,
    "entries": []
  }
}
```

Ein vorhandener Wert wird mit dem festen Größenlimit geladen, vollständig mit
`validateLichtwaldLog` validiert und zusätzlich auf `dataOrigin: private`
geprüft. Danach wird er defensiv tief geklont, als Clone erneut vollständig
validiert und ausschließlich als detached Clone zurückgegeben. Der Erfolg hat
`status: found` und enthält den Clone in `lichtwaldLog`. Synthetische,
beschädigte, inkompatible oder übergroße Bestände werden dabei weder
umklassifiziert noch repariert, gelöscht oder überschrieben.

`saveLichtwaldLog` validiert zuerst den vollständigen Kandidaten und verlangt
die private Herkunft. Danach wird der Kandidat defensiv tief geklont, als Clone
erneut vollständig validiert und erneut auf private Herkunft geprüft. Erst
danach werden die benötigten Adaptermethoden geprüft und der bestehende feste
Key mit demselben Größenlimit gelesen. Jeder Preflight-Fehler beendet die
Operation ohne Schreibzugriff. Nur ein fehlender Key oder ein vollständig
valider privater Bestand erlaubt den anschließenden Full-Snapshot-Write des
validierten Clones mit festem Key und festem Limit. Ein erfolgreicher Save
liefert `{ ok: true, status: "saved" }`.

Der Read-Preflight schützt erkennbare synthetische, beschädigte, inkompatible,
übergroße oder nicht sicher lesbare Rohwerte vor automatischem Überschreiben.
Er ist keine Transaktion, kein Compare-and-Swap, kein Lock und verhindert
weder TOCTOU- noch Multi-Tab-Rennen. Die Storage-Foundation führt keine
Reparatur, Migration, Demo-Übernahme oder automatische Löschung durch.

Die domänenspezifische Fehlergrenze erkennt nur fest erlaubte
Status-Code-Paare des gemeinsamen Adapters und verwendet eigene statische
Meldungen. Insbesondere gelten:

| Fall | `status` | `code` |
| --- | --- | --- |
| ungültige gespeicherte Vertragsdaten | `invalidStoredData` | `invalidLichtwaldLogData` |
| nicht private gespeicherte Daten | `invalidStoredData` | `privateLichtwaldLogRequired` |
| ungültiger Save-Kandidat | `validationFailed` | `invalidLichtwaldLogData` |
| nicht privater Save-Kandidat | `validationFailed` | `privateLichtwaldLogRequired` |
| fehlende Adaptermethode | `unavailable` | `storageAdapterUnavailable` |
| geworfenes, widersprüchliches, unbekanntes oder formal unbrauchbares Adapterresultat | `storageFailed` | `unexpectedStorageResult` |

Bekannte technische Adapterfehler einschließlich ungültiger Keys oder Limits,
Unavailable-, Read-, Invalid-JSON-, Größen-, Serialisierungs-, Quota- und
Write-Fehlern behalten ihr dokumentiertes Status-Code-Paar, erhalten an der
Domänengrenze aber ausschließlich statische LichtwaldLog-Meldungen. Entry-IDs,
`featuredEntryId`, Titel, Texte, Tags, vollständige JSON-Werte, tatsächliche
gespeicherte Größen, fremde Adapter- oder `DOMException`-Meldungen, Stacktraces
und Validator-Rohwerte werden weder in Fehlern noch in Logs ausgegeben.

`dataOrigin` bleibt eine fachliche Klassifikation und ist weder
Authentifizierung noch Zugriffsschutz oder Verschlüsselung. `localStorage`
liegt unverschlüsselt im aktuellen Browserprofil, kann von JavaScript derselben
Origin gelesen oder verändert werden, besitzt browserabhängige Quoten und kann
durch das Löschen des Browserprofils verloren gehen. Die Foundation bietet
keine Zugriffskontrolle, Integritätsgarantie, Transaktion, Multi-Tab-Sperre,
Cloud-Sicherung oder geräteübergreifende Synchronisierung.

Repository und automatisierte Tests verwenden ausschließlich klar
gekennzeichnete, unabhängig erfundene synthetische Inhalte. Private
Journaltexte dürfen nicht als Fixture, Demo oder Beispieldatensatz in das
Repository gelangen. Bilder und andere Binärdaten sind für `v0.2.2`
vollständig ausgeschlossen; dazu zählen insbesondere Base64-Inhalte,
Dateipfade und Bildmetadaten. Schema 1 enthält außerdem keine Erstellungs- oder
Änderungszeitstempel. `calendarDate` ist nur ein reines Kalenderdatum.
Stimmung, Energie, Gesundheitswerte, Trainingsmetriken, Airtable-IDs,
Sync-Zustände, Agentenmetadaten und KI-Ausgaben sind ebenfalls keine
Vertragsfelder. Jeder Eintrag bleibt flach und eigenständig.

Contract, reine Suchableitung, Controller, Service und Storage kommunizieren
nicht extern und führen
weder Webhooks, Airtable, Synchronisierung noch `SyncAgent`, `DataAgent`,
`TestAgent` oder andere KI-Logik ein. Ein späterer Agentenfluss benötigt einen
eigenen minimierten Vertrag; der private lokale Gesamtsnapshot darf nicht
automatisch oder vollständig an Agenten weitergegeben werden. Aus dieser
lokalen Foundation wird weder formale AI-Act- noch allgemeine
Sicherheitskonformität abgeleitet.

## Ziele des Vertrags

Der Vertrag soll:

- alle externen Requests durch einen einheitlichen Umschlag führen;
- Routing ohne frei formulierte Agentenauswahl ermöglichen;
- Eingaben und Antworten an jeder Systemgrenze validierbar machen;
- Fehler, Warnungen und fachliche Ergebnisse eindeutig trennen;
- Wiederholungen von Schreibrequests ohne Duplikate ermöglichen;
- private und öffentliche Datenflüsse unterscheidbar halten;
- spätere Änderungen kontrolliert versionierbar machen.

## Geltungsbereich von Version 1

### Externe Aktionen des Dashboards

Nur `syncTest` ist als transportneutraler Validatorvertrag, kontrollierter
argumentloser SyncService-Aufruf, synchrone Request Boundary für einen bereits
materialisierten Raw-Body-Wert und isolierter synchroner modellfreier
SyncAgent-Kern implementiert. Zusätzlich ist der lokale Raw-Wire-/HTTP-Handler
als separater Loopback-Prozess implementiert und an den SyncAgent-Kern
komponiert, aber nicht an den Browser. Deshalb gibt es weiterhin keinen externen
Aufruf. ADR 0023 ändert den SyncContract nicht. Es entscheidet für dieselbe
nebenwirkungsfreie synthetische Capability den Gesamtpfad `Browser →
SyncService → lokaler SyncTransport → lokales SyncGateway auf GD-WS01 →
lokaler SyncAgent → lokal validierte und korrelierte SyncResponse`. ADR 0024
konkretisiert den isolierten Kern, der `syncTest` bereits vollständig lokal
und providerfrei beantwortet und durch den explizit gestarteten Gateway-Prozess
erreichbar ist. OpenAI,
lokale Modelle und n8n sind nur optionale spätere Adapter hinter ihm. Alle LearningTest- und
DataAgent-Aktionen in diesem Dokument bleiben ausdrücklich geplante
Zielverträge und werden vom aktuellen SyncContract-Modul nicht akzeptiert.

| Aktion | Zweck | Primärer Handler | Status |
| --- | --- | --- | --- |
| `syncTest` | geschlossenes `syncTest`-Vertragsformat kontrolliert bauen, Raw-Wire-Bytes lokal begrenzen, streng einmalig dekodieren, den materialisierten String einmalig parsen und defensiv projizieren sowie lokal durch den SyncAgent beantworten und normal korrelieren | lokaler SyncAgent | Vertragsvalidator, transportneutraler SyncService, SyncGateway Request Boundary, lokaler Loopback-HTTP-Handler, modellfreier SyncAgent-Kern, ADR-0025-In-Process-Komposition mit lokaler HTTP-`200`-Normalresponse, isolierter BrowserSyncTransport und feste v1-Wire-Policy samt mutationswirksamer ADR-0028-Matrix implementiert; produktive SyncService-/`src/main.js`-Komposition, Browser-End-to-End-Fluss und alle Provideradapter sind nicht implementiert |
| `learningTest.create` | Lerntest erzeugen und Definition sicher speichern | TestAgent | geplant für eine spätere Version |
| `learningTest.evaluate` | Antworten bewerten und Ergebnis speichern | TestAgent | geplant für eine spätere Version |
| `learningTest.result.get` | Gespeichertes Testergebnis abrufen | DataAgent | geplant für eine spätere Version |

Die **implementierte** Allowlist enthält exakt `syncTest`. Die breitere
Version-1-Ziel-Allowlist ist noch nicht aktiviert. Externe Clients dürfen auch
später keine `data.*`-Aktionen oder frei gewählten Agentennamen übermitteln.

### Interne Aktionen zwischen Agenten

Alle Aktionen dieses Unterabschnitts sind ausschließlich geplant und nicht
Bestandteil der implementierten SyncContract Foundation.

| Aktion | Quelle | Ziel | Zweck |
| --- | --- | --- | --- |
| `test.generate` | SyncAgent | TestAgent | Test und serverseitige Bewertungskriterien erzeugen |
| `test.evaluate` | SyncAgent | TestAgent | Antworten nach gespeicherten Kriterien bewerten |
| `data.record.create` | SyncAgent | DataAgent | erlaubten Datensatz anlegen |
| `data.record.get` | SyncAgent | DataAgent | erlaubten Datensatz über stabile ID lesen |
| `data.record.list` | SyncAgent | DataAgent | erlaubte Datensätze paginiert lesen |
| `data.record.update` | SyncAgent | DataAgent | erlaubte Felder eines Datensatzes ändern |

`data.record.delete` ist nicht Teil von Version 1. Löschungen werden nicht
autonom durch Agenten ausgeführt.

### Bewusst nicht enthaltene Verträge

- PromptVault-Synchronisation mit Airtable;
- weitere Agentenrollen;
- E-Mail-, Kalender-, GitHub- oder Gesundheitsdaten;
- Datei-Uploads oder binäre Payloads;
- Benutzerkonten und Rollenmodelle;
- öffentliche Schreibzugriffe ohne gesonderte Sicherheitsentscheidung.

### Lokaler SyncAgent und optionale Providergrenzen

Der implementierte isolierte SyncAgent-Kern ist für `syncTest` die lokale
Validierungs- und Responsegrenze. Er validiert einen übergebenen Request
defense-in-depth erneut, wendet die feste Aktions-Allowlist mit ausschließlich
`syncTest` an und erzeugt die lokal validierte, mit Version, Aktion und
`requestId` korrelierte normale SyncResponse. Die spätere Routerrolle für
weitere Agenten oder Provider ist nicht Bestandteil dieses Kerns. Diese
Zuständigkeitsentscheidung ändert keine Felder, Validatorregeln oder
Fehlerprofile des bestehenden SyncContract.

`ModelProvider` und `WorkflowProvider` bezeichnen nur zwei konzeptionelle
Klassen späterer capability-spezifischer Ports. Es werden hier keine
JavaScript-Signaturen, Methoden, Dateien oder Schemas festgelegt. Einen
generischen Port für beliebige Modelle, Prompts, Workflows, Tools, Agenten oder
Endpoints gibt es nicht. Provider, Modell, Workflow, Endpoint und Umgebung
stammen ausschließlich aus vertrauenswürdiger lokaler Composition und niemals
aus Browserwerten, Requestfeldern oder Modelloutput.

Der bestehende leere `syncTest` ist modellfrei und ruft weder ModelProvider
noch WorkflowProvider auf. Ein späterer OpenAI-, lokaler Modell- oder n8n-
Adapter läge ausschließlich hinter dem lokalen SyncAgent, erhielte nur eine
neu erzeugte, explizite und minimierte Projektion und dürfte nie direkt an
Browser oder SyncService antworten. Provideroutput bleibt unvertrauenswürdig
und wird lokal begrenzt, defensiv projiziert, validiert und korreliert.
Browser-Raw-Body, Browserheader, URL, Query und ursprüngliche Serialisierung
werden an keinen Provider weitergegeben.

PromptVault bleibt in `v0.2.0` ausschließlich lokal. Falls später eine externe
Synchronisation beschlossen wird, läuft sie ebenfalls ausschließlich über
SyncAgent und DataAgent und erhält eigene dokumentierte Aktionen.

## Lokaler PromptVault-Speichervertrag

### Geltungsbereich und Datenfluss

Der lokale Vertrag ist implementiert und verwendet ausschließlich diesen
Datenfluss:

```text
PromptVaultView
  → PromptVaultController
  → PromptService
  → PromptStorage
  → StorageAdapter
  → localStorage
```

View und Controller greifen nicht direkt auf `localStorage`, `PromptStorage`
oder `StorageAdapter` zu. Die vollständige Promptliste aus dem Service ist die
autoritative Datenquelle der Oberfläche. Suchtext, Kategorieauswahl und der
Favoritenfilter sind flüchtige UI-Zustände und nicht Bestandteil des
Speichervertrags.

### Storage-Key und Envelope

PromptVault verwendet genau diesen Storage-Key:

```text
goldendawn.promptVault.v1
```

Neue Schreibvorgänge verwenden den Schema-2-Envelope:

```json
{
  "schemaVersion": 2,
  "prompts": []
}
```

| Feld | Typ | Regel |
| --- | --- | --- |
| `schemaVersion` | Ganzzahl | für den aktuellen Vertrag exakt `2` |
| `prompts` | Array | vollständige Promptliste; darf bewusst leer sein |

Storage-Key und `schemaVersion` erfüllen unterschiedliche Aufgaben. Der Name
des bestehenden Keys bleibt trotz der Schema-2-Migration unverändert.

### Aktueller Promptvertrag

Jeder Prompt im Schema-2-Envelope enthält mindestens folgende Felder:

| Feld | Typ | Regel |
| --- | --- | --- |
| `id` | String | stabil, nicht leer und ohne führende oder abschließende Leerzeichen |
| `title` | String | aktueller Titel, nicht leer; Anwendungslimit 120 Zeichen |
| `category` | String | aktuelle Kategorie oder leer; Anwendungslimit 60 Zeichen |
| `description` | String | aktuelle Beschreibung oder leer; Anwendungslimit 240 Zeichen |
| `content` | String | aktueller vollständiger Prompt-Text, nicht leer; Anwendungslimit 10.000 Zeichen |
| `createdAt` | ISO-8601-String | Erstellungszeitpunkt des Prompts in UTC |
| `updatedAt` | ISO-8601-String | Zeitpunkt der letzten erfolgreichen Promptmutation in UTC; nicht vor `createdAt` |
| `isFavorite` | Boolean | persistenter Favoritenstatus außerhalb der Inhaltsversionen |
| `isDemo` | Boolean | Kennzeichnung synthetischer Beispielprompts |
| `versions` | Array | nicht leere, lückenlos aufsteigende und fachlich unveränderliche Versionshistorie |

`title`, `category`, `description` und `content` auf der Prompt-Ebene bilden den
aktuellen, durchsuchbaren Stand. Diese vier Felder müssen exakt der letzten
gespeicherten Version entsprechen. Suche und Kategorie-Filter verwenden nur
diesen aktuellen Top-Level-Inhalt und durchsuchen nicht die Historie.

### Vertrag einer Promptversion

Jeder Eintrag in `versions` enthält exakt folgende Felder:

| Feld | Typ | Regel |
| --- | --- | --- |
| `versionNumber` | positive Ganzzahl | beginnt bei `1` und steigt lückenlos um eins |
| `title` | String | Titel-Snapshot dieser Fassung, nicht leer |
| `category` | String | Kategorie-Snapshot dieser Fassung oder leer |
| `description` | String | Beschreibungs-Snapshot dieser Fassung oder leer |
| `content` | String | vollständiger Prompt-Text dieser Fassung, nicht leer |
| `createdAt` | ISO-8601-String | Entstehungszeitpunkt dieser Inhaltsversion in UTC |
| `changeType` | String | einer der erlaubten Änderungstypen |
| `restoredFromVersion` | positive Ganzzahl oder `null` | direkte Ursprungsversion einer Wiederherstellung |

Erlaubte Werte für `changeType`:

| Wert | Bedeutung |
| --- | --- |
| `created` | Version 1 eines neu erstellten oder synthetischen Beispielprompts |
| `migrated` | im Arbeitsspeicher erzeugte Ausgangsversion eines gültigen Schema-1-Prompts |
| `edited` | neue Version nach einer tatsächlichen Änderung der vier Inhaltsfelder |
| `restored` | neue Version aus einer ausgewählten früheren Fassung |

Für `created`, `migrated` und `edited` ist `restoredFromVersion` immer `null`.
Bei `restored` enthält das Feld die positive Nummer einer bereits vorhandenen,
kleineren Version. Es verweist auf die direkt ausgewählte Fassung. Wird eine
frühere Restore-Version ausgewählt, verweist die neue Version daher auf deren
eigene `versionNumber` und nicht transitiv auf deren Ursprung.

### Unveränderlichkeit und Mutationen

Das gespeicherte `versions`-Array ist fachlich append-only:

- Versionen bleiben lückenlos aufsteigend gespeichert und werden weder
  umsortiert noch überschrieben oder entfernt.
- Die Oberfläche darf für die absteigende Anzeige eine Kopie verwenden, aber
  nicht das gespeicherte Array verändern.
- Erstellen legt genau Version 1 mit `changeType: "created"` an.
- Eine tatsächliche Änderung an `title`, `category`, `description` oder
  `content` hängt genau eine neue Version mit `changeType: "edited"` an.
- Wiederherstellen übernimmt ausschließlich die vier Inhaltsfelder der
  ausgewählten Version und hängt genau eine neue Version mit
  `changeType: "restored"` an. Identität, Listenposition, Erstellungsmetadaten,
  Demo-Herkunft, Favoritenstatus und frühere Versionen bleiben erhalten.
- Entsprechen die vier Zielwerte bereits dem aktuellen Stand, ist Bearbeiten
  beziehungsweise Wiederherstellen ein No-op. Es entsteht keine Version, kein
  neuer Zeitstempel und kein Storage-Schreibvorgang.
- Eine Favoritenänderung aktualisiert ausschließlich Top-Level-Metadaten. Sie
  erzeugt keine Inhaltsversion und verändert keinen historischen Snapshot.
- Löschen entfernt den vollständigen Prompt einschließlich seiner gesamten
  Versionshistorie.

Nach jeder erfolgreichen Mutation speichert `PromptStorage` die vollständige
Promptliste im Schema-2-Envelope. Schlägt die Validierung, Zeitstempelerzeugung
oder Speicherung fehl, bleibt die zuvor geladene Liste autoritativ; es wird
keine neue Version vorgetäuscht.

### Migration von Schema 1

Ein gültiger Schema-1-Envelope wird beim Laden validiert und ausschließlich im
Arbeitsspeicher normalisiert:

- fehlende boolesche Felder werden kontrolliert auf `false` normalisiert;
- jeder Prompt erhält genau eine Baseline als Version 1;
- diese Baseline übernimmt die vier vorhandenen Top-Level-Inhaltsfelder;
- ihr `createdAt` entspricht dem bisherigen `updatedAt`;
- ihr `changeType` ist `migrated` und `restoredFromVersion` ist `null`;
- frühere, nicht gespeicherte Änderungen werden nicht rekonstruiert.

Das bloße Laden eines vorhandenen Schema-1-Envelopes überschreibt den Rohwert
nicht. Erst eine erfolgreiche Mutation schreibt die vollständige Sammlung als
Schema 2. Ein fehlender Storage-Key ist davon zu unterscheiden: Beim ersten
Laden initialisiert der Service die klar gekennzeichneten synthetischen
Beispielprompts direkt als Schema 2. Eine bewusst gespeicherte leere Liste
bleibt leer.

Beschädigte Daten, ein unbekanntes Schema und fehlgeschlagene Schreibvorgänge
werden nicht durch Fallback- oder Migrationsdaten überschrieben.

### Lokale Grenzen

`localStorage` speichert PromptVault-Daten ausschließlich für den aktuellen
Browser-Origin und das aktuelle Browserprofil. Diese Speicherung ist:

- keine Cloud-Sicherung;
- keine geräte- oder browserübergreifende Synchronisierung;
- kein Import- oder Exportmechanismus;
- kein Backend und keine Airtable-Anbindung.

Das Löschen lokaler Browserdaten kann die PromptVault-Daten entfernen.
Benutzerkonten, automatische Cloud-Sicherung und Wiederherstellung außerhalb
des aktuellen Browserprofils sind nicht implementiert.

## Öffentliche API der SyncContract Foundation

`src/contracts/syncContract.js` exportiert ausschließlich den
transportneutralen Vertragskern. Die öffentlichen Konstanten sind:

| Export | Verbindlicher Wert oder Inhalt |
| --- | --- |
| `SYNC_CONTRACT_VERSION` | `"1.0"` |
| `SYNC_CONTRACT_ACTIONS` | eingefroren: `["syncTest"]` |
| `SYNC_CONTRACT_SOURCES` | eingefroren: `["goldendawn-os"]` |
| `SYNC_CONTRACT_HANDLERS` | eingefroren: `["SyncAgent"]` |
| `SYNC_CONTRACT_DATA_ORIGINS` | eingefroren: `["synthetic"]` |
| `SYNC_CONTRACT_MAX_RAW_BODY_BYTES` | `65536` |
| `SYNC_CONTRACT_REQUEST_ID_MAX_LENGTH` | `64` |
| `SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS` | `300000` |
| `SYNC_CONTRACT_MAX_DURATION_MS` | `300000` |
| `SYNC_CONTRACT_VALIDATION_ERROR_CODES` | eingefrorene statische interne Validierungsfehler-Allowlist |
| `SYNC_CONTRACT_RESPONSE_ERROR_PROFILES` | eingefrorene statische, redigierte Normal- und Gateway-Fehlerprofile |

Die statischen Validierungsfehlercodes sind:

```text
invalidSyncRequest
invalidSyncResponse
invalidGatewayErrorResponse
invalidCorrelatedRequest
invalidRawBody
rawBodyTooLarge
unknownProperty
missingProperty
invalidPropertyDescriptor
unsupportedVersion
unknownAction
invalidSource
invalidRequestId
requestIdTooLong
invalidGatewayRequestId
invalidTimestamp
invalidReferenceTimestamp
timestampOutsideTolerance
invalidPayload
invalidSuccess
invalidHandler
invalidData
invalidError
invalidErrorCode
invalidErrorMessage
invalidRetryable
invalidErrorDetails
invalidWarnings
invalidMeta
invalidDuration
invalidProcessedBy
invalidGatewayAction
responseVersionMismatch
responseActionMismatch
responseRequestIdMismatch
```

Die vier öffentlichen Funktionen sind:

| Export | Aufgabe |
| --- | --- |
| `validateSyncRequest(syncRequest, referenceTimestamp)` | prüft den exakten `syncTest`-Request und das inklusive Zeitfenster gegenüber der expliziten Referenzzeit |
| `validateSyncResponse(syncResponse, correlatedRequest)` | prüft Erfolg oder normalen Fehler und die exakte Version-/Aktions-/ID-Korrelation |
| `validateSyncGatewayErrorResponse(syncResponse)` | prüft ausschließlich das getrennte frühe Gateway-Fehlerprofil |
| `validateSyncRawBodySize(rawBody)` | prüft ausschließlich einen bereits vorhandenen String auf höchstens 65.536 UTF-8-Bytes |

Für stabile, seiteneffektfreie gewöhnliche Records, Arrays und Strings liefert
jede Funktion deterministisch `{ ok: true, errors: [] }` oder
`{ ok: false, errors }`. Der Validator schreibt selbst keine Properties und
übernimmt keine ungültigen Rohwerte in Meldungen. Das Modul besitzt keinen
Storage, keine Uhr, keinen Scheduler, keine Netzwerk- oder UI-Abhängigkeit; die
Referenzzeit wird vom Aufrufer explizit übergeben. Für Proxies gelten die
nachfolgend dokumentierten engeren Garantien.

### Härtung gegen feindliche JavaScript-Strukturen

Objekte und Arrays werden über eigene Keys und Property-Deskriptoren geprüft.
Bei gewöhnlichen Records liest der Validator eigene Accessors nicht als Werte
und ruft deren Getter nicht auf, sondern lehnt ihre Descriptorform ab.
Symbol-Properties, zusätzliche eigene Felder einschließlich `__proto__`,
`constructor` oder `prototype`, ungeeignete Prototypen sowie sparse oder
manipulierte Arrays werden anhand der beobachteten Struktur abgelehnt. Plain
Objects und Null-Prototyp-Objekte sind erlaubt, wo ein Objekt erwartet wird.

Diese Aussage lässt sich nicht unverändert auf Proxies übertragen:
`Object.getPrototypeOf`, `Reflect.ownKeys` und
`Object.getOwnPropertyDescriptor` können Proxy-Traps ausführen. Beim
Normalisieren eines von einer Trap gelieferten Descriptors kann die
JavaScript-Laufzeit außerdem Getter auf dem Descriptorobjekt ausführen. Traps
und solche Descriptor-Getter können Eingaben mutieren, externen Zustand ändern,
zwischen Reflection-Schritten unterschiedliche Ergebnisse liefern oder werfen.
Same-Realm-Proxy-Traps sind beliebiger JavaScript-Code und können globale
Laufzeitobjekte verändern, die Ausführung blockieren oder spätere Operationen
zum Werfen bringen. Reflection-Catches behandeln beobachtbare Fehler
kontrolliert, können diese Wirkungen aber weder verhindern noch rückgängig
machen.

Eine portable vollständige Proxy-Erkennung existiert nicht; insbesondere kann
ein transparenter Proxy wie sein Ziel erscheinen. Ein erfolgreiches Ergebnis
bestätigt deshalb nur die während dieses Aufrufs beobachtete Struktur, nicht die
Abwesenheit von Seiteneffekten, eine unveränderliche Objektidentität oder einen
später identischen Zustand. Der Validator selbst schreibt weiterhin keine
Properties und serialisiert unvertrauenswürdige Objekte nicht.

## Öffentliche API der SyncService Foundation

`src/services/syncService.js` exportiert die Factory:

```js
createSyncService({
  syncTransport,
  generateRequestId = defaultCryptoRequestIdGenerator,
  getCurrentTimestamp = defaultUtcClock,
} = {})
```

Die Factory liefert eine eingefrorene API mit exakt einer eigenen
Dateneigenschaft:

```js
{
  runSyncTest
}
```

`runSyncTest()` ist immer Promise-basiert und akzeptiert keine Argumente. Ein
Aufruf mit zusätzlichen Argumenten wird als `invalidInvocation` abgelehnt,
ohne diese Werte zu inspizieren, ihre Properties zu lesen oder eine
Konvertierung auszuführen. Generator und Clock werden in diesem Fall nicht
ausgewertet; auf `syncTransport` oder seine `sendSyncRequest`-Property wird
nicht zugegriffen. Es gibt keinen generischen `execute(action, payload)`-Pfad,
keinen frei konfigurierbaren Contractwert, Endpoint oder Client-Modus.

### Kontrollierter Request-Build

Vor dem Request-Build versucht der Service zuerst genau einmal sicher,
`syncTransport.sendSyncRequest` aufzulösen. Bei fehlender, nicht funktionaler
oder werfend aufgelöster Methode endet der Aufruf mit `unavailable`; Generator
und Clock werden nicht ausgewertet. Erst nach erfolgreicher Methodenauflösung
beginnt der Request-Build und erzeugt einen frischen Request mit exakt diesen
sechs Feldern:

```js
{
  version: "1.0",
  action: "syncTest",
  source: "goldendawn-os",
  requestId: "<kontrolliert erzeugte req_-ID>",
  timestamp: "<kontrolliert erzeugter kanonischer UTC-Zeitstempel>",
  payload: {}
}
```

Version, Aktion und Quelle stammen ausschließlich aus den bestehenden
SyncContract-Konstanten. Während dieses Request-Builds werden
`generateRequestId` und `getCurrentTimestamp` jeweils exakt einmal ausgewertet.
Beide Ergebnisse müssen primitive Strings sein. Boxed Strings, Promises,
Thenables, Arrays, Records, Functions, Symbole und andere Typen werden weder
konvertiert noch akzeptiert; `String(...)`, `toString`, `valueOf` und
`Symbol.toPrimitive` werden nicht als Fallback verwendet.

Der einmal erfasste Clock-Wert dient gleichzeitig als Request-`timestamp` und
als lokale Referenzzeit für `validateSyncRequest`. Der vollständige Request
wird vor jedem Aufruf der Portmethode validiert. Bei einem ungültigen
Generator-, Clock- oder Validatorergebnis wird die Portmethode nicht
aufgerufen.

Der Standard-ID-Generator verwendet ausschließlich:

```text
req_ + crypto.randomUUID()
```

Es existiert kein `Math.random`-, Timestamp- oder anderer schwächerer Fallback.
Ist `crypto.randomUUID()` nicht verfügbar, wirft es oder entsteht kein gültiger
String, endet der Request-Build mit einem statisch redigierten lokalen Fehler.
Die syntaktische ID-Prüfung beweist weiterhin weder Kollisionsarmut noch
semantische Freiheit von privaten Informationen. Injizierte Generatoren und
Clocks sind vertrauenswürdige Composition-Dependencies und dürfen nicht aus
PromptVault, LearningHub, LichtwaldLog oder anderen privaten Inhalten
ableiten.

### Unveränderliche Korrelation und Transport-Port

Transportrequest und interne Korrelationsgrundlage enthalten dieselben
kontrollierten Werte, teilen aber keine veränderlichen Records. Beide sowie
ihre jeweiligen frischen `payload`-Objekte sind tief eingefroren. Der Transport
kann die spätere Korrelation deshalb nicht durch den Austausch oder die
Mutation eines gemeinsam verwendeten Payload-Records verändern. Sequenzielle
und parallele Aufrufe besitzen vollständig getrennte Requests und
Korrelationen; es gibt keinen globalen Request-, In-flight-, Kollisions- oder
Idempotenzspeicher.

Der einzige Port dieses Slices lautet:

```js
syncTransport.sendSyncRequest(syncRequest)
```

Die bereits vor dem Request-Build einmal sicher aufgelöste Methode wird mit dem
vorgesehenen Receiver erst nach vollständiger Requestvalidierung und pro
Serviceaufruf höchstens einmal aufgerufen. Sie darf synchron einen Wert oder
asynchron ein Promise liefern; `runSyncTest()` bleibt in beiden Fällen
Promise-basiert. Synchrones Werfen, Promise-Rejections und beobachtbare
Thenable-Fehler werden kontrolliert in einen statischen lokalen Fehler
übersetzt. Es gibt keinen Retry, Backoff, Timeout oder zweiten Aufruf der
Portmethode.

### Exakter lokaler Service-Result

Jeder Service-Result besitzt immer exakt dieselben fünf Felder:

```js
{
  ok,
  status,
  requestId,
  syncResponse,
  error
}
```

Eine vollständig gültige und korrelierte normale SyncResponse ergibt:

```js
{
  ok: true,
  status: "syncResponseReceived",
  requestId: "<ausgehende req_-ID>",
  syncResponse: "<defensiver, tief eingefrorener Response-Snapshot>",
  error: null
}
```

`ok: true` bedeutet ausschließlich, dass eine gültige normale SyncResponse
empfangen wurde. Eine vollständig gültige normale Contract-Fehlerresponse
bleibt deshalb ebenfalls außen `ok: true`. Ob der fachliche Sync-Vorgang
erfolgreich war, drückt weiterhin ausschließlich `syncResponse.success` aus.

Lokale Fehler verwenden ausschließlich diese Allowlist:

| Status | Code | Exakte Meldung |
| --- | --- | --- |
| `invalidInvocation` | `invalidSyncServiceInvocation` | `Der Sync-Test akzeptiert keine Eingabedaten.` |
| `unavailable` | `syncTransportUnavailable` | `Der Sync-Dienst ist nicht verfügbar.` |
| `requestBuildFailed` | `syncRequestBuildFailed` | `Die Sync-Anfrage konnte nicht sicher vorbereitet werden.` |
| `transportFailed` | `syncTransportFailed` | `Die Sync-Anfrage konnte nicht übermittelt werden.` |
| `invalidResponse` | `invalidSyncTransportResponse` | `Die Sync-Antwort konnte nicht sicher verarbeitet werden.` |

Vor einem vollständig gültigen Request ist `requestId` immer `null`. Nach dem
erfolgreichen Request-Build darf ein Transport- oder Responsefehler
ausschließlich die bereits validierte ausgehende `req_`-ID enthalten.
Ungültige Generatorwerte werden niemals gespiegelt. `syncResponse` ist bei
jedem lokalen Fehler `null`; `error` enthält ausschließlich den statischen
Code und die statische Meldung. Validatorfehlerlisten, Rohrequests,
Rohresponses, Exceptionwerte, Stacks und Dependency-Meldungen werden nicht
übernommen oder geloggt.

Lokale Fehler sind keine SyncContract-Responses. Sie besitzen weder
`handledBy: "SyncAgent"` noch `processedBy: ["SyncAgent"]` und behaupten keine
Agentenverarbeitung. Result, Error und gültiger Response-Snapshot sind defensiv
entkoppelt und tief eingefroren.

### Defensive Response-Projektion

Der Port-Rückgabewert bleibt unvertrauenswürdige Eingabe. Der Service erzeugt
eine neue allowlist-basierte gewöhnliche Datenprojektion, validiert diese mit
dem unveränderten internen Request über
`validateSyncResponse(syncResponse, correlatedRequest)` und gibt nur den
vollständig gültigen tief eingefrorenen Snapshot aus.

Das originale Transportobjekt wird niemals direkt zurückgegeben, verändert
oder eingefroren. Nachträgliche Mutationen daran verändern den Service-Snapshot
nicht. Zusätzliche, symbolische oder accessor-basierte Felder, ungeeignete
Records, falsche Version, Aktion, `requestId`, Handler, Verarbeitungskette oder
Datenherkunft werden nicht repariert oder normalisiert. Das frühe
Gateway-Fehlerprofil wird nicht versuchsweise über einen zweiten Validator
akzeptiert, sondern ergibt in diesem Slice `invalidResponse`.

Eigene Accessors gewöhnlicher Records werden kontrolliert abgelehnt, ohne ihre
Werte zu übernehmen. Reflection auf Proxies sowie Promise-/Thenable-Auflösung
kann dennoch beliebigen fremden Same-Realm-Code ausführen. Beobachtbare Throws
und Rejections werden redigiert; bereits ausgelöste Seiteneffekte können weder
verhindert noch rückgängig gemacht werden. Eine portable universelle Proxy-
oder Thenable-Erkennung und eine Garantie, dass beliebiger Dependency-Code
niemals wirft oder blockiert, werden nicht behauptet. Für stabile,
seiteneffektfreie gewöhnliche Werte arbeitet der Service deterministisch und
ohne Inputmutation.

## Aktuell implementierter isolierter Browser SyncTransport

`src/transports/browserSyncTransport.js` exportiert ausschließlich
`createBrowserSyncTransport`. Eine bestandene Factory liefert eine frische
gewöhnliche und eingefrorene API exakt mit `sendSyncRequest`. Die Factory
erfasst entweder die bei Modulevaluation gesicherten Browserdefaults oder die
vier exakt geschlossenen Composition-Seams `fetchRequest`,
`createAbortController`, `setDeadlineTimer` und `clearDeadlineTimer`, ohne sie
bei Import oder Factoryaufruf auszuführen. Das Modul führt keine weitere API,
Dependency oder Produktionsseam ein.

`sendSyncRequest(syncRequest)` setzt den aus ADR 0027 und den fortgeltenden
ADR-0026-Regeln übernommenen Vertrag um: exakt ein Argument, einmalige
descriptorbasierte Callerbeobachtung, ein frischer disjunkter Sechs-Felder-
Requestgraph mit frischem leerem Payload, exakt zwei Validierungen desselben
Graphen vor und nach Deep Freeze, danach exakt eine feste v1-Wire-Policy sowie
genau eine geschlossene JSON-/UTF-8-
Serialisierung. Der feste Endpoint bleibt
`http://127.0.0.1:8787/api/sync-test`. RequestInit und Header sind frische,
eingefrorene Null-Prototyp-Records; Controller und Timer entstehen erst nach
bestandener privater Requestgrenze. Pro Aufruf gibt es höchstens einen Fetch,
keinen Retry, Redirect-Follow oder Fallback.

Die 5.000-ms-Deadline besitzt einen einzigen ersten terminalen Owner. Fetch-,
Read- und zulässige Cleanup-Promises werden ausschließlich über das erfasste
native `Promise.prototype.then` und ihr geschlossen beobachtbares Profil
verarbeitet. Response, Header, Readergebnisse, echte `Uint8Array`-Chunks und
ihre echten festen `ArrayBuffer` werden fail-closed geprüft; akzeptierte Bytes
werden unmittelbar in einen eigenen lokalen Zielbuffer kopiert. Anschließend
folgen striktes UTF-8-Decoding und einmaliges JSON-Parsing, bevor nur die
passende Parsed-Identität als Transportergebnis zurückgegeben wird. Alle
Transportfehler bleiben auf den statischen tief eingefrorenen
`BROWSER_SYNC_TRANSPORT_FAILED`-Fehler begrenzt.

Der private produktive Requestcap bleibt 65.536 UTF-8-Bytes. Der geschlossene
v1-Vertrag erreicht öffentlich maximal 193 Bytes; eine 65 Zeichen lange
`requestId` scheitert bereits an der Contractvalidierung. Die Unit-Suite führt
einen gültigen 193-Byte-Request bis exakt zu einem Fetch-Seam und beweist die
private Capverdrahtung zusätzlich mit vollständig bereinigten temporären
Quellkopien für Cap 193 beziehungsweise 192. Die öffentlich erreichbare
Responsegrenze bleibt 16.384/16.385 Bytes. Diese Tests beweisen Verdrahtung und
Vergleichsposition, weder echte Browserlaufzeit noch Netzwerkverhalten.

Die Verifikation besteht mit 423/423 fokussierten Tests, 466/466 Tests zusammen
mit dem SyncService, 735/735 Tests der sechs seriellen Sync-Suites und
1755/1755 Tests der vollständigen seriellen Gesamtsuite. Der ausschließlich
aus den Transporttests stammende Zuwachs beträgt `Δ = 151`; alle Läufe besitzen
0 Fehlschläge, Abbrüche, Skips oder Todos. Der Produktions-Build transformiert
exakt 46 Browsermodule; der schreibfreie n8n-Bundle-Check meldet keinen Drift.

Der enge Phase-0-/Tor-A-Befund wurde an der tatsächlichen ADR-0028-
Implementierung erneut bestätigt:
kein Modell, keine statistische Inferenz, kein Provider oder Workflow, keine
Credentials, keine privaten Inhalts-Payloads, kein Logging, Storage oder
Telemetrie und keine Rechts- oder Complianceklassifikation. Es erfolgte keine
echte Browser-, externe Netzwerk-, Gateway-, Cloud-, n8n-, Provider-, Credential- oder
Vaultnutzung. Der Befund bleibt ein enger technischer Arbeitsbefund und kein
Runtime-, Datenschutz- oder Compliancebeweis.

Der Transport ist weiterhin weder mit dem SyncService noch in `src/main.js`
komponiert; ein Browser-End-to-End-`syncTest` existiert nicht. Der einmalig
ausgeführte ADR-0029-Lauf bleibt mit Gesamt-`FAIL` dokumentiert; seine Ursache
ist `CAUSE_NOT_PROVEN`. ADR 0032 ersetzt ADR 0031 formal und totalisiert
ausschließlich den davon unabhängigen passiven Diagnosevertrag. Als Nächstes
folgt nur dessen reine netzwerkfreie effects-as-data-Foundationimplementierung
und -prüfung; darauf folgen ein eigener Adapter-ADR und dessen getrennte
netzwerkfreie Implementierung. Erst danach benötigt ein sichtbarer
Diagnoselauf eine neue ausdrückliche Autorisierung;
Browserkomposition und lokaler Browser-End-to-End-`syncTest` bleiben bis zu
einem späteren vollständig neuen ADR-0029-Gesamt-`PASS` geschlossen.

<a id="browser-transport-diagnostic-record--adr-0030"></a>

## Browser Transport Diagnostic Record / ADR 0032

ADR 0032 ersetzt ADR 0031 formal und übernimmt alle nicht ausdrücklich
geänderten Regeln. ADR 0030 bleibt als bereits durch ADR 0031 ersetzte
historische Ebene erhalten. Dieser Living Contract beschreibt ausschließlich
den künftigen passiven Diagnose-Record; er autorisiert weder Foundation,
Adapter noch einen Browser-, CDP-, Debug-Pipe-, Vite-, Gateway-, Netzwerk- oder
Diagnoselauf.

`BrowserTransportDiagnosticRecord` besitzt weiterhin `schemaVersion: 1`,
`recordType: browser-transport-diagnostic`, exakt 17 Rootfelder, sechs
Protokolloperationen, 17 Integritätschecks, neun Requestbudgetzähler plus
Sequenz, zehn Stages, drei Clockdomänen, 20 Cleanup-IDs und fünf Findings. Das
ADR-0029-Gesamtgate bleibt `FAIL`; `causeStatus` bleibt ausnahmslos
`CAUSE_NOT_PROVEN`.

`schemaVersion: 1` bleibt ausschließlich deshalb unverändert, weil weder eine
Implementierung noch eine einzige konforme persistierte
`BrowserTransportDiagnosticRecord`-Instanz existiert. Daraus folgt weder eine
Migrations- noch eine Rückwärtskompatibilitätsbehauptung.

### Geschlossene Rootform

```text
BrowserTransportDiagnosticRecord = {
  schemaVersion,
  recordType,
  diagnosticRunId,
  observedAt,
  timeZone,
  historicalEvidence,
  replay,
  observer,
  requestBudget,
  publicSettlement,
  stages,
  timing,
  cleanup,
  adr0029OverallGate,
  observerGate,
  finding,
  causeStatus
}
```

Die Rootwerte sind:

- `schemaVersion` exakt `1`;
- `recordType` exakt `browser-transport-diagnostic`;
- `diagnosticRunId` ein neues lokales ASCII-Label `[a-z0-9-]{1,32}`;
- `observedAt` exakt im 24-stelligen kanonischen
  `YYYY-MM-DDTHH:mm:ss.sssZ`-Profil mit echter UTC-Rückprojektion;
- `timeZone` eine ASCII-IANA-Zeitzonen-ID mit höchstens 64 Zeichen;
- `observerGate` exakt `PASS`, `FAIL` oder `UNPROVEN`;
- `causeStatus` ausnahmslos exakt `CAUSE_NOT_PROVEN`;
- `adr0029OverallGate` exakt
  `{ before: "FAIL", after: "FAIL", unchanged: true }`.

### Unveränderliche historische Referenz

`historicalEvidence` besitzt exakt:

```text
historicalEvidence = {
  recordPath,
  recordSha256,
  measurementRunId,
  baseContextId,
  overallGate
}
```

Die Werte sind fest:

```text
recordPath = docs/evidence/browser-runtime-evidence.chrome-stable-windows-01.json
recordSha256 = ffad6b1de2e0c32ec5c2cdc3e88bfd455b14adc2eb4dd45f0d81e911e1a64b33
measurementRunId = chrome-stable-win-01
baseContextId = chrome-stable-win-t0-01
overallGate = FAIL
```

Der historische Record wird weder ersetzt noch revidiert. Der neue
Diagnoserecord ist kein vierter ADR-0029-Vektor und kein zusätzliches
Runtimegate.

### Neues `T_replay` und totale Relation

Die einzige zulässige Bindung bleibt:

```text
T_replay ≡R T₀
T_diag = T_replay + Δ_observer
```

`T_replay` ist eine neue Referenzbindung vor dem höchstens einen Stimulus und
kein observerfreier Kontrolllauf. `replay` besitzt exakt:

```text
replay = {
  replayContextId,
  repositoryCommit,
  repositoryState,
  profileInstanceBinding,
  causalContext,
  equivalence
}

profileInstanceBinding = {
  lifecycle,
  newInstanceConfirmed,
  historicalInstanceReused
}

equivalence = {
  relationId,
  comparisons,
  noUnexplainedCausalDeviation,
  result
}
```

- `replayContextId` ist `[a-z0-9-]{1,32}`, neu und verschieden von
  `baseContextId`.
- `repositoryCommit` ist ein Lower-Hex-Git-Commit mit genau 40 Zeichen.
- `repositoryState` ist `clean`, `dirty` oder `unknown`; ein autorisierbarer
  Lauf verlangt `clean`.
- `relationId` ist exakt `adr-0032-causal-replay-v2`.
- `noUnexplainedCausalDeviation` ist `confirmed`, `contradicted` oder
  `unproven`.
- `equivalence.result` ist `EQUIVALENT`, `DIVERGED` oder `UNPROVEN`.

`profileInstanceBinding` wird total abgeleitet:

```text
fresh-disposable-new-instance-confirmed
  newInstanceConfirmed: true
  historicalInstanceReused: false

reused
  newInstanceConfirmed: false
  historicalInstanceReused: true

unknown
  newInstanceConfirmed: false
  historicalInstanceReused: false
```

`true/true` ist ungültig. Neue Run-ID, Messzeit, Zeitzone, Repositorycommit,
Replaykontext und Wegwerfprofil sind neue gebundene Identitäten und kein
Observerdelta.

Die Äquivalenzableitung ist exakt:

```text
DIVERGED
  bei mindestens einem mismatch
  oder noUnexplainedCausalDeviation = contradicted

UNPROVEN
  wenn kein DIVERGED-Grund vorliegt und mindestens ein unproven besteht
  oder noUnexplainedCausalDeviation = unproven

EQUIVALENT
  ausschließlich bei allen Vergleichen observed/match
  und noUnexplainedCausalDeviation = confirmed
```

### Exakt 59 kausale Vergleiche

Jeder Vergleich besitzt exakt:

```text
comparison = {
  fieldId,
  comparisonBasis,
  observationState,
  historicalValue,
  replayValue,
  result
}

comparisonBasis =
  historical-record-value |
  historical-record-closed-derivation |
  historical-commit-artifact-sha256 |
  historical-commit-closed-derivation

observationState = observed | not-observed | ambiguous
result = match | mismatch | unproven
```

Bei `not-observed` oder `ambiguous` ist `result` zwingend `unproven`.
Fehlende historische oder neue Grundlagen verwenden `null` und `unproven` und
werden niemals als Gleichheit behandelt. `comparisons` enthält ohne Duplikat
exakt diese 59 `fieldId` in dieser Reihenfolge:

```text
artifact.transport.src/transports/browserSyncTransport.js.sha256
artifact.contract.src/contracts/syncContract.js.sha256
artifact.gateway.server/startLocalSyncGateway.js.sha256
artifact.gateway.server/localSyncGatewayRuntimeConfig.js.sha256
artifact.gateway.server/localSyncGatewayHttpServer.js.sha256
artifact.gateway.src/gateways/syncGatewayRequestBoundary.js.sha256
artifact.gateway.src/agents/syncAgent.js.sha256
artifact.frontend.runtime-source-set.sha256
repository.state
hostRuntime.executionClass
operatingSystem.family
operatingSystem.edition
operatingSystem.architecture
operatingSystem.version
operatingSystem.build
operatingSystem.patch
node.version
browser.product
browser.channel
browser.version
browser.engine
browser.engineBuild
browser.executionMode
browser.privateMode
profile.lifecycle
profile.extensions
profile.startParameters
profile.featureFlags
profile.enterprisePolicies
networkEnvironment.proxy
networkEnvironment.vpn
initialState.serviceWorker
initialState.permission
initialState.preflightCache
initialState.siteCache
bindingComparisonProfile
frontend.topLevelUrl
frontend.serializedOrigin
frontend.contextKind
frontend.isSecureContext
transportRequest.factoryProfile
transportRequest.compositionProfile
transportRequest.requestProfile
transportRequest.requestEqualityMethod
transportRequest.initialUrl
transportRequest.initialScheme
transportRequest.initialHost
transportRequest.initialPort
transportRequest.initialPath
transportRequest.requestInitProfile
gateway.listenerHost
gateway.listenerPort
gateway.portEnvironmentValue
gateway.allowedOrigin.value
gateway.allowedOrigin.relationToFrontend
gateway.endpoint
gateway.responderProfile
gateway.responseProfile
toolchain.vite.lockfileVersion
```

Das sind acht Artefaktvergleiche, ein separater `repository.state`-Vergleich
und 50 kausale Kontextvergleiche. Die acht `artifact.*`-Werte verwenden
Lower-Hex-SHA-256 und `historical-commit-artifact-sha256`.
`gateway.responseProfile` verwendet
`historical-record-closed-derivation`;
`historical-commit-closed-derivation` darf ausschließlich für
`toolchain.vite.lockfileVersion` verwendet werden; dieser Vergleich verwendet
diese Basis. Die übrigen kausalen Werte verwenden `historical-record-value`.
Es wird kein Vergleich ergänzt; die Kardinalität bleibt unverändert bei 59.

#### Frontend-Runtime-Source-Set

Die historische Basis ist der Git-Tree des im Evidence-Record gebundenen
Commits `8001cc7eb7d2fed68c5ca4061514b486a204ac44`. Das historische Set
besitzt exakt diese 51 Literalpfade:

```text
index.html
package-lock.json
package.json
src/agents/syncAgent.js
src/contracts/syncContract.js
src/data/mock/learningHubDemo.js
src/data/mock/lichtwaldLogDemo.js
src/gateways/syncGatewayRequestBoundary.js
src/main.js
src/modules/learning-hub/learningArtifactContract.js
src/modules/learning-hub/learningHub.css
src/modules/learning-hub/learningHubContract.js
src/modules/learning-hub/learningHubController.js
src/modules/learning-hub/learningHubView.js
src/modules/learning-hub/learningProgressContract.js
src/modules/learning-hub/learningProgressProjection.js
src/modules/learning-hub/learningTestAttemptContract.js
src/modules/learning-hub/learningTestBankContract.js
src/modules/learning-hub/learningTestEngine.js
src/modules/lichtwald-log/lichtwaldLog.css
src/modules/lichtwald-log/lichtwaldLogContract.js
src/modules/lichtwald-log/lichtwaldLogController.js
src/modules/lichtwald-log/lichtwaldLogSearch.js
src/modules/lichtwald-log/lichtwaldLogView.js
src/modules/prompt-vault/promptSearch.js
src/modules/prompt-vault/promptSeedData.js
src/modules/prompt-vault/promptVault.css
src/modules/prompt-vault/promptVaultController.js
src/modules/prompt-vault/promptVaultView.js
src/navigationVisibility.js
src/services/learningArtifactService.js
src/services/learningHubDemoInitializer.js
src/services/learningHubService.js
src/services/learningProgressService.js
src/services/learningTestService.js
src/services/lichtwaldLogDemoService.js
src/services/lichtwaldLogService.js
src/services/promptService.js
src/services/syncService.js
src/storage/learningArtifactStorage.js
src/storage/learningHubDemoInitializationStorage.js
src/storage/learningHubStorage.js
src/storage/learningProgressStorage.js
src/storage/learningTestAttemptStorage.js
src/storage/learningTestBankStorage.js
src/storage/lichtwaldLogDemoStorage.js
src/storage/lichtwaldLogStorage.js
src/storage/promptStorage.js
src/storage/storageAdapter.js
src/style.css
src/transports/browserSyncTransport.js
```

Der Manifeststrom ist exakt:

```text
goldendawn-frontend-runtime-source-set-v1\n
<literal-path>\t<byte-length-decimal>\t<sha256-of-raw-git-blob-content>\n
...
```

Pfade verwenden `/`. Einträge stehen in lexikografischer UTF-8-Bytereihenfolge.
Das Manifest ist UTF-8 ohne BOM, verwendet ausschließlich LF und besitzt
genau einen abschließenden Newline. Bytelänge und Einzeldigest beziehen sich
auf den rohen Git-Blobinhalt ohne Git-Objektheader, BOM-, EOL-, Unicode-,
Trim- oder andere Normalisierung. Der historische Manifestdigest ist:

```text
6f3d5740b043308b4d38df33b6293c9064d8dd1b3f0c5801d50844336c195591
```

Im Replaycommit werden erneut `index.html`, `package.json`,
`package-lock.json` und jeder dort getrackte reguläre Pfad unter `src/`
aufgelöst. Abweichende Pfadmengen oder Bytes ergeben bei bestätigter
Ableitung `mismatch`; fehlende oder mehrdeutige Ableitung ergibt `unproven`.
Globs, NUL-separierte Ersatzformate und vage Sammelhashes sind keine zulässige
Hashdomäne.

#### Geschlossener kausaler Kontext und Vite

`causalContext` besitzt exakt:

```text
causalContext = {
  hostRuntime,
  operatingSystem,
  node,
  browser,
  profile,
  networkEnvironment,
  initialState,
  bindingComparisonProfile,
  frontend,
  transportRequest,
  gateway,
  toolchain
}

hostRuntime = { executionClass }
operatingSystem = { family, edition, architecture, version, build, patch }
node = { version }
browser = {
  product, channel, version, engine, engineBuild,
  executionMode, privateMode
}
profile = {
  lifecycle, extensions, startParameters, featureFlags,
  enterprisePolicies
}
networkEnvironment = { proxy, vpn }
initialState = { serviceWorker, permission, preflightCache, siteCache }
frontend = { topLevelUrl, serializedOrigin, contextKind, isSecureContext }
transportRequest = {
  factoryProfile, compositionProfile, requestProfile,
  requestEqualityMethod, initialUrl, initialScheme, initialHost,
  initialPort, initialPath, requestInitProfile
}
gateway = {
  listenerHost, listenerPort, portEnvironmentValue,
  allowedOrigin: { value, relationToFrontend },
  endpoint, responderProfile, responseProfile
}
toolchain = {
  vite: {
    lockfileVersion,
    runtimeVersion
  }
}
```

Die bisherigen geschlossenen ADR-0030-Werte bleiben unverändert. Insbesondere
sind Factoryprofil `real-default-factory`, Komposition `transport-only`,
Requestprofil `synthetic-v1-syncTest-empty-payload`, Equalityprofil
`ephemeral-full-value-comparison-without-retention`, Request-Init-Profil
`adr-0028-fixed`, Endpoint
`http://127.0.0.1:8787/api/sync-test`, Listenerhost `127.0.0.1` und
Responseprofil `adr-0020-options204-post200-syncresponse-v1`.

Die historische Ableitung von `toolchain.vite.lockfileVersion` erfolgt
ausschließlich am gebundenen historischen Commit und über exakt diesen Pfad:

```text
package-lock.json
→ lockfileVersion === 3
→ packages["node_modules/vite"].version
```

Der Wert am letzten Pfad muss ein unveränderter primitiver kanonischer
SemVer-String sein; der so abgeleitete historische Wert lautet `8.1.4`. Die
Replayableitung verwendet denselben Pfad am `replay.repositoryCommit`.
Fehlende, malformed oder mehrdeutige Grundlagen ergeben `unproven`. Es gibt
keinen Fallback auf den Evidence-Record, eine Root-Dependency-Range,
`node_modules`, eine Registry oder eine tatsächlich geladene Binärdatei.

Diese Basis bestätigt ausschließlich die Lockfileversion. Die tatsächlich
verwendete Vite-`runtimeVersion` bleibt ein getrennter Authentizitätsnachweis
der neuen Laufbindung und kein 60. Vergleich. Fehlender Nachweis ihrer
Übereinstimmung ergibt `unproven`, bestätigte Abweichung `mismatch`. Die
Vergleichskardinalität bleibt unverändert bei 59.

### Observerprofil

`observer` besitzt exakt zwölf Felder:

```text
observer = {
  deltaProfile,
  controllerExclusivity,
  connectionProfile,
  targetProfile,
  foundationSha256,
  evaluationSha256,
  protocolOperations,
  mainWorldEvaluationCount,
  transportFactoryCallCount,
  primitiveProjectionProfile,
  integrityChecks,
  interferenceObservation
}
```

Die geschlossenen Werte sind:

```text
deltaProfile =
  adr-0030-passive-external-observer-v1

controllerExclusivity =
  exclusive | not-exclusive | unknown

connectionProfile =
  remote-debugging-pipe | other-prohibited | unknown

targetProfile =
  single-goldendawn-top-level | other | unknown

mainWorldEvaluationCount =
  zero | one | multiple | unknown

transportFactoryCallCount =
  zero | one | multiple | unknown

primitiveProjectionProfile =
  immediate-closed-by-value-pretransport-context-and-settlement-v2-no-handle

interferenceObservation =
  none-contract-visible-detected |
  contract-visible-detected |
  unknown
```

`foundationSha256` und `evaluationSha256` sind Lower-Hex-SHA-256 mit genau 64
Zeichen oder `null`; `null` bedeutet `unproven`.

#### Foundation- und Evaluation-Hashdomänen

Der einzige spätere Foundationpfad lautet:

```text
scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js
```

Er ist ein selbständiges importinaktives Modul ohne lokale oder relative
Implementierungsimports. Einziger Export ist
`createBrowserSyncTransportRuntimeDiagnosticObserver`; jede Factory liefert
eine frische gewöhnliche tief eingefrorene API exakt `{ run }`, und `run` ist
one-shot sowie Promise-basiert.

Die Foundation besitzt keine Realdefaults, kein CLI, keinen Main-Guard und
keinen Launcher-, Browser-, Pipe-, Prozess-, Socket-, Port-, Dateisystem- oder
Netzwerkzugriff. Sie verarbeitet nur effects-as-data: unveränderliche
Command-, Cap- und Cleanup-Intents sowie unvertraute materialisierte
In-Memory-Werte.

`foundationSha256` ist SHA-256 über die exakten tatsächlich geladenen
Dateibytes dieses Pfads. Vor einem späteren Lauf müssen sie bytegleich zum
Git-Blobinhalt unter `replay.repositoryCommit` sein. Git-Objektheader und jede
Normalisierung bleiben außerhalb. Abweichung ergibt
`sourceUnmodified: violated`; fehlender oder mehrdeutiger Nachweis
`sourceUnmodified: unproven`.

`evaluationSha256` ist Lower-Hex-SHA-256 über:

```text
UTF-8(exakt Runtime.evaluate.params.expression)
```

Die Domäne ist der tatsächlich gesendete primitive String, UTF-8 ohne BOM,
ohne Normalisierung, Trim, Wrapper, JSON-Serialisierung oder CDP-Envelope. Der
Hash wird vor dem Send gebildet; gehashter und gesendeter String sind
bytegleich. Der statische Text enthält keine Run-ID, Request-ID,
Requesttimestamp, Profilkennung oder privaten Werte. Ohne Evaluate-Send ist
der Wert `null`.

### Globaler Setupcap, Capture und Completion

Ein gültiger Diagnoseversuch beginnt ausschließlich in dieser Reihenfolge:

1. Die eine controller-monotone Clockfähigkeit und die eine
   One-shot-Setupcapfähigkeit werden vollständig validiert. Ein fehlender,
   nicht funktionaler, werfend aufgelöster oder nicht scharf schaltbarer Cap-
   beziehungsweise Clockpfad verhindert einen gültigen Diagnoseversuch vor
   jedem Kommando und Stimulus.
2. `m_setup` wird nach validierter Cap-/Clock-Fähigkeit exakt einmal
   controller-monoton erfasst. Throw, nicht endliche primitive Zahl oder
   negativer Wert ist `V`; es gibt keinen Kommando-Send.
3. Der persistierte relative Nullpunkt wird auf `t_setup := 0` gesetzt und die
   rohe Deadline als `setupDeadline := m_setup + 6000` gebildet. Der
   One-shot-Setupcap wird auf diese Deadline scharf
   geschaltet. Ein nicht endliches oder nicht sicher darstellbares Ergebnis
   ist `V`. Wirft oder versagt das tatsächliche Arm, ist kein gültiger
   Diagnoseversuch entstanden und kein Kommando darf gesendet werden.
4. Erst nach bestätigtem Cap-Arm wird Stage 1 `observer-armed` als
   `observed/match`, `receiptOrder: 1`, `relativeMilliseconds: 0` und
   `timingState: measured` eingefroren.
5. Danach wird der unveränderliche `Target.getTargets`-Intent erzeugt und
   nicht blockierend genau einmal gesendet. Der Timer ist vor dem Send aktiv.

Setupkommandos laufen strikt sequenziell; zu jedem Zeitpunkt existiert
höchstens eine ausstehende Setupantwort. Erst ein vollständig erfolgreiches
Profil erlaubt das nächste Kommando.

Die getrennten Zustände sind:

```text
setupWindowMilliseconds = 6000
captureWindowMilliseconds = 6000

m_setup := exakt einmal controller-monoton nach validierter
           Cap-/Clock-Fähigkeit erfasst
t_setup := 0
setupDeadline := m_setup + 6000

setupReady := alle drei Setupantworten sind eindeutig korreliert,
              erfolgreich und vollständig validiert

U := Setup ist vor Runtime.evaluate terminal nicht beweisbar
V := sticky bestätigte Observer-, Hüllen-, Request- oder Ablaufverletzung
C := verarbeiteter controllerlokaler Capturecap nach gesendetem
     Runtime.evaluate

setupClosed       := setupReady || U || V
observationClosed := V || U || C

S := genau ein gültiger Settlementkandidat
N := genau ein eindeutig dem POST zugeordnetes loadingFinished
     oder loadingFailed
P := S && N

productEvidenceComplete := P
```

Der Setupcap umfasst gemeinsam `Target.getTargets`,
`Target.attachToTarget` und `Network.enable` und wird nicht zurückgesetzt.
Beim Dequeue jedes materialisierten CDP-Eingangswerts während einer
ausstehenden Setupantwort wird die controller-monotone Clock vor jeder
Reflection genau einmal zu `m_answer` ausgewertet.
`lastValidControllerMonotonicSample` ist initial exakt `m_setup`. Es gibt für
diesen Eingangswert keine zweite Clockauswertung. Throw, eine nicht endliche
oder negative primitive Zahl, `m_answer < m_setup` oder
`m_answer < lastValidControllerMonotonicSample` ist `V`. Erst nach bestandener
Endlichkeits-, Nichtnegativitäts- und Monotonieprüfung wird
`lastValidControllerMonotonicSample := m_answer` gesetzt.

Nur bei der rohen Differenz `d_setup := m_answer - m_setup` strikt kleiner
als `6000` darf der Eingangswert descriptorbasiert inspiziert werden. Bei
`d_setup >= 6000` gewinnt der Setupcap; der gesamte dequeue-te Eingangswert
bleibt ungelesen und kann weder Setup, `V` noch einen Stimulus nachträglich
begründen. Persistierte 10-ms-Rundung beeinflusst diese Entscheidung nie.
Bereits bestätigtes `V` besitzt absolute Präzedenz.

Ein Eingangswert, insbesondere ein CDP-Event, ohne eigene Response-ID ist kein
Antwortkandidat und verändert den ausstehenden Setupzustand nicht. Besitzt ein
descriptor-richtig beobachtbarer Antwortkandidat eine Response-ID, ist aber
deren Zuordnung zur einzigen ausstehenden Command-ID und gegebenenfalls zur
gebundenen Session fehlend oder mehrdeutig, ist das `U`. Ein malformed
Routingdescriptor oder Routingwert ist `V`. Besitzt eine
eindeutig korrelierte descriptor-richtig beobachtbare Antwort eine eigene normale Data-Property
`error`, ist sie eine Setupfehlerantwort und führt zu `U`; ihr Wert wird nie
gelesen. Ein Accessor, falscher oder sonst malformed `error`-Descriptor ist
`V`.

`U` wird unterschieden:

- `setup-cap`: Der Cap wurde vor `setupReady` oder `V` verarbeitet,
  insbesondere bei fehlender Antwort.
- `setup-terminal-unproven`: Ein eindeutig korrelierter browserseitiger
  CDP-Fehler, kein oder mehrere geeignete Targets, nicht eindeutig gebundene
  Session oder nicht eindeutig erfolgreiches `Network.enable` macht den Setup
  vorher terminal unbewiesen, ohne eine Verletzung zu bestätigen. Dasselbe
  gilt bei irreversibel geschlossener Verbindung vor der erforderlichen
  Antwort.

Eine Antwort gilt nur dann als fehlend, wenn der Setupcap verarbeitet wurde
oder die gebundene Verbindung vor ihrer erforderlichen eindeutig korrelierten
Antwort irreversibel geschlossen ist. Eine momentan leere Queue oder eine
lediglich noch nicht eingetroffene Antwort reicht dafür nicht aus.

Falsch erzeugtes Kommando, falsche Parameter, Allowlistüberschreitung,
bestätigte Descriptor-/Envelopeverletzung oder ein vom Controller
beziehungsweise Observer bestätigt ausgeführtes fremdes oder zweites
Attachment ist `V`, nicht `U`. Verhindert Routing bereits die Korrelation,
gilt ohne unabhängige Verletzung `U`.

`Runtime.evaluate` darf ausschließlich nach `setupReady` und höchstens einmal
gesendet werden. Erst sein bestätigter Sendeübergang startet den getrennten
6.000-ms-Capturecap. Nach `U` oder `V` und bei verspäteter Setupantwort gibt es
keinen Stimulus. `S`, `N` und `P` schließen die Observation nicht. Ohne `V`
bleibt das Capture bis zum verarbeiteten `C` aktiv. Bei `V` wird sofort
fail-closed eingefroren und ein bereits gestarteter Capturecap entwaffnet.
Bei `C` zählen alle bis zur Cap-Verarbeitung verarbeiteten Beobachtungen; bei
Gleichzeitigkeit entscheidet die controllerlokale Verarbeitungsreihenfolge.
Nach dem Freeze eintreffende Werte werden verworfen und begründen keine
Abwesenheitsaussage.

Eine zweite descriptor-richtig beobachtbare Antwort auf eines der drei
Setupkommandos vor dem Evaluate-Sendeübergang ergibt
`U/setup-terminal-unproven`; Evaluate bleibt gegatet. Wird eine solche
Dublette erst während des Capturefensters verarbeitet, bleibt ihr tatsächlicher
Antwortcount `multiple`; der Send-Ledger-Count bleibt davon unverändert. Das
betroffene Operationsergebnis wird `unproven`. Die Dublette erzeugt allein kein
`V`, hält den endgültigen Ausgang aber bis `C` `UNPROVEN/inconclusive`. Eine
malformed Dublette ist jederzeit `V`.

`timing.completion` besitzt im Finalrecord exakt:

```text
completion = {
  productEvidenceComplete,
  observationCloseReason,
  observationClosed,
  captureWindowState,
  evaluateReplyCountClass,
  requestBudgetFinalized,
  cleanupFinalizeReason,
  cleanupFinalized
}

observationCloseReason =
  setup-cap |
  setup-terminal-unproven |
  capture-cap |
  confirmed-violation

captureWindowState = not-started | elapsed | truncated
evaluateReplyCountClass = zero | one | multiple | unknown
cleanupFinalizeReason = all-steps-terminal | cleanup-cap
```

Die Ableitung ist:

- `U`: entsprechender Setupgrund, `not-started`, `zero`,
  `productEvidenceComplete: false`, `observationClosed: true` und
  `requestBudgetFinalized: true`;
- `C`: `capture-cap`, `elapsed`;
- `V` vor Evaluate-Send: `confirmed-violation`, `not-started`;
- `V` nach Evaluate-Send: `confirmed-violation`, `truncated`.

Regulärer `PASS` verlangt `capture-cap`, `elapsed`, genau eine gültige
Evaluate-Antwort, einen Stimulus und ein finalisiertes Requestbudget. Null oder
mehrere ansonsten gültige Evaluate-Antworten sind `UNPROVEN`; eine eindeutig
korrelierte malformed Hülle ist `V`.

Bei `U`, `V` oder `C` wird zuerst ein frischer tief eingefrorener
Pre-Cleanup-Observation-Snapshot erzeugt. Er enthält Replay- und Hashbindungen,
Observer-/Evaluationzustand, die ersten vier Operationen, Requestbudget,
Settlement, Stages 1 bis 8, Timing, die sechs observationsseitigen
Completionwerte und den sticky `FAIL`-Latch.

Danach entsteht getrennt ein tief eingefrorenes Cleanup-Ledger mit
`Network.disable`, `Target.detachFromTarget`, Stages 9 und 10, 20 Checks sowie
den zwei cleanupseitigen Completionwerten. Erst der Finalrecord projiziert aus
beiden unveränderten Quellen das geschlossene achtfeldrige Completionobjekt.
Cleanup vor Snapshot, Mutation oder Übernahme später Ereignisse ist
`FAIL/observer-invalid`.

### Sechs Protokolloperationen

`protocolOperations` enthält exakt diese sechs Einträge in dieser Reihenfolge:

```text
Target.getTargets
Target.attachToTarget
Network.enable
Runtime.evaluate
Network.disable
Target.detachFromTarget
```

Jeder Eintrag besitzt exakt:

```text
operation = {
  command,
  allowedMaximum,
  observedCountClass,
  result
}

allowedMaximum = 1
observedCountClass = zero | one | multiple | unknown
result = match | mismatch | unproven
```

Der controllerlokale unveränderliche Send-Ledger ist die einzige Quelle für
Zählklasse und Parameterprofil:

- erlaubtes, einmal gesendetes und erforderlichenfalls eindeutig erfolgreiches
  Profil: `one/match`;
- gesendetes, aber am Setupcap oder nach irreversibler
  Verbindungsschließung wegen fehlender beziehungsweise wegen fehlerhafter
  oder mehrdeutiger Antwort nicht beweisbares Setupprofil: `one/unproven`;
- nach `U` oder `V` bewusst gegatetes Downstreamkommando:
  `zero/unproven`, nie `zero/mismatch`;
- falsche Parameter, Überschreitung oder Allowlistverletzung:
  `mismatch` und `V`;
- `Network.disable` und `Target.detachFromTarget`: `zero` oder `one` abhängig
  von der tatsächlich verfügbaren identitätsgebundenen Cleanupfähigkeit.

Die Parameterprofile sind exakt:

```text
Target.getTargets
  params: {}

Target.attachToTarget
  params: { targetId: <ephemeral>, flatten: true }

Network.enable
  params: {}

Runtime.evaluate
  params: {
    expression: <prehashed exact string>,
    awaitPromise: true,
    returnByValue: true,
    generatePreview: false
  }

Network.disable
  params: {}

Target.detachFromTarget
  params: { sessionId: <ephemeral> }
```

Jeder Setup-Antwortkandidat besitzt eine eigene normale Data-Property `id` mit
der exakt erwarteten Request-ID; sessiongebundene Antworten besitzen zusätzlich
eine eigene normale Data-Property `sessionId` mit der exakt erwarteten
Session-ID. Die drei erfolgreichen Setupresultate besitzen ausschließlich diese
Profile:

```text
Target.getTargets.result     = { targetInfos }
Target.attachToTarget.result = { sessionId }
Network.enable.result        = {}
```

Die drei `result`-Werte müssen das descriptor-beobachtbare Profil der exakt
geschlossenen Records besitzen; dies bestätigt keine gewöhnliche oder
proxyfreie Eingabeidentität. `targetInfos` muss das descriptor-beobachtbare
Profil eines dichten Arrays besitzen. Jeder TargetInfo-Rawrecord muss die
erforderlichen eigenen normalen Data-Properties `targetId`, `type`, `url` und
`attached` besitzen; weitere TargetInfo-Feldwerte bleiben ungelesen.

Zuerst werden über `type` und `url` alle Einträge mit `type === "page"` und
exakt gebundener URL gezählt, unabhängig von `attached`. Genau ein solcher
Kandidat ist erforderlich. Erst danach muss an genau diesem Kandidaten
`attached === false` gelten und erst dann wird sein `targetId` gebunden. Null
oder mehrere Kandidaten sowie `attached !== false` ergeben `U`; ein zweiter
passender, bereits attachter Eintrag darf nicht ignoriert werden.

`Target.attachToTarget.result.sessionId` ist eine eigene normale Data-Property
mit einem nichtleeren primitiven String. `Network.enable.result` muss exakt das
descriptor-beobachtbare Profil eines leeren Records besitzen; dies bestätigt
keine gewöhnliche oder proxyfreie Eingabeidentität. Eine Antwort gilt nur am
verarbeiteten Setupcap oder nach irreversibler Verbindungsschließung als
fehlend und ergibt dann `U`;
eine leere Queue oder ein bloßes Noch-nicht-Eintreffen genügt nicht. Eine
normale Fehlerantwort oder null beziehungsweise mehrere gültige Kandidaten
ergeben ebenfalls `U`. Eine
korrelierte angebliche Erfolgsantwort mit fehlendem `result`, fehlender
Pflichtproperty, falschem Typ, falschem Descriptor oder nicht geschlossener
Resultform ergibt `V`.

Zusatzparameter, insbesondere `contextId`, `uniqueContextId`, `objectGroup`,
`includeCommandLineAPI`, `userGesture`, `serializationOptions` und
CDP-Timeoutparameter, sind verboten. Command-IDs sind flüchtige streng
steigende positive Safe Integers. Routing verwendet nur die eine flache
Session. Setup-CDP-Fehler ergeben `U`; korrelierter Evaluate-Fehler oder eigene
`exceptionDetails` ergibt `V`; Disable-/Detachfehler sind Cleanup-`FAIL`.

### Target-, Session- und Networkprofil

Aus `Target.getTargets` dürfen nur eigene Data-Descriptoren dieser Felder
gelesen werden:

```text
targetId
type
url
attached
```

Zuerst werden alle Einträge mit `type === "page"` und exakt der vorgebundenen
Top-Level-URL gezählt, ohne `attached` in dieses Kandidatenprädikat
einzubeziehen. Nur bei genau einem Kandidaten wird dessen `attached` geprüft;
es muss exakt `false` sein, bevor `targetId` gebunden wird. Null oder mehrere
Kandidaten sowie `attached !== false` ergeben `U`; insbesondere darf ein
zweiter passender Eintrag mit `attached === true` nicht ignoriert werden. Nur
ein unabhängig als Controller-/Observerhandlung bestätigtes fremdes oder
zweites Attachment ergibt `V`.

Aus Network dürfen nur folgende Pfade gelesen werden:

```text
Eventrouting:
method
sessionId
params

requestWillBeSent:
requestId
request.url
request.method
timestamp

responseReceived:
requestId
response.url
response.status
timestamp

loadingFinished:
requestId
timestamp

loadingFailed:
requestId
timestamp
```

`loadingFailed.errorText`, Header, Body, Initiator, Redirectdetails und andere
Felder bleiben ungelesen. Zuordnung erfolgt nur über gebundene Session, exakte
URL-Gleichheit ohne Normalisierung und flüchtige Request-ID. Wiederholte oder
neue Endpoint-IDs sind zusätzliche Sequenzeinträge und werden nicht
überschrieben. Alle flüchtigen IDs werden vor Recordmaterialisierung
verworfen.

### Descriptorbasierte CDP-Hülle und v2-Projektion

Die Foundation behauptet für keinen unvertrauenswürdigen materialisierten
Eingabegraphen Parser-, Raw-Byte-, Materialisierungs-, Plain-Data- oder
Proxy-free-Provenienz. Auch ein transparent pass-through Proxy kann bei
Prototyp-, Own-Key- und Descriptorprüfungen wie sein Ziel erscheinen. Diese
bloße Möglichkeit ist allein weder `V` noch ein Grund für eine
Proxy-free-Bestätigung.

Nur konsumierte erforderliche Feldwerte werden descriptorbasiert über die bei
Modulevaluation erfassten Intrinsics gelesen. Jedes davon muss eine eigene
aufzählbare Data-Property ohne Getter oder Setter und mit dem erforderlichen
primitiven Wertprofil sein. Geerbte oder frei aufgelöste Properties bleiben
verboten. Accessor, Reflection-Throw, falscher Descriptor oder malformed
erforderlicher Wert ist nach eindeutiger Korrelation
`V/FAIL/observer-invalid`. Geschlossene Own-Key- beziehungsweise Own-Presence-
Prüfungen dürfen ausschließlich die benannten Vertrags- und Verbotsfelder
klassifizieren; zusätzliche Feldwerte bleiben ungelesen und werden nie
übernommen oder persistiert.

Für `Runtime.evaluate` gilt zwingend:

1. Antwort über Command-ID und gegebenenfalls Session-ID korrelieren.
2. Own-Presence von `error` prüfen; Inhalt nie lesen.
3. Eigenen Data-Descriptor `result` als Methodenergebnis übernehmen.
4. Own-Presence von `exceptionDetails` prüfen.
5. Eigenen Data-Descriptor `result` als `Runtime.RemoteObject` übernehmen.
6. `type` und `value` nur über eigene Data-Descriptoren lesen.
7. Own-Presence von `objectId`, `unserializableValue`,
   `deepSerializedValue`, `preview` und `customPreview` prüfen.
8. Ausschließlich die konsumierten erforderlichen Projektionsblätter gegen
   ihre Descriptor- und primitiven Wertprofile prüfen, ohne den Eingabegraphen
   als Plain Data oder proxyfrei zu klassifizieren.
9. Akzeptierte primitive Blätter sofort ohne Eingabereferenz in einen frischen
   controller-eigenen gewöhnlichen geschlossenen Recordbaum kopieren, diesen
   tief einfrieren und Hüllen sowie Routingwerte verwerfen.

Zusätzliche äußere Metadaten werden weder aufgezählt noch gelesen. Falscher
erforderlicher Descriptor nach eindeutiger Korrelation ist
`FAIL/observer-invalid`; verhindert Routing die Korrelation, gilt ohne
unabhängige Verletzung `UNPROVEN/inconclusive`.

Die eigene `Runtime.RemoteObject.value`-Property besitzt exakt:

```text
value = {
  preTransportContext,
  execution,
  settlement
}

preTransportContext = {
  url,
  origin,
  topLevel,
  secureContext
}

contextResult = match | mismatch | unproven

execution = {
  factoryCallCount,
  transportCallCount,
  dispatchState
}

factoryCallCount = zero | one
transportCallCount = zero | one

dispatchState =
  dispatched |
  blocked-context-mismatch |
  blocked-context-unproven |
  failed-before-public-settlement

settlement = null | {
  outcome,
  staticProfileResult,
  relativeMilliseconds,
  timingState
}
```

Jedes der vier Kontextfelder enthält nur einen `contextResult`, niemals reale
abweichende URL- oder Originwerte. Die vier Prüfungen erfolgen innerhalb
derselben Main-World-Evaluation vor Import, Factory und Transport. Nur viermal
`match` erlaubt dynamischen Import des unveränderten realen Transports,
einmalige Auswertung des benannten Exports, höchstens einen argumentlosen
Factoryaufruf, Konstruktion eines frischen gültigen v1-`syncTest`-Requests und
höchstens einen `sendSyncRequest(request)`-Aufruf.

Bei Kontext-`mismatch` oder `unproven` bleiben beide Counts `zero`,
Settlement ist `null` und es gibt keinen Produktrequest. Das ist
`UNPROVEN/inconclusive`, kein Obserververstoß. Fehler vor öffentlichem Promise
werden ohne Grund- oder Stackinspektion auf
`failed-before-public-settlement` projiziert. `dispatched` verlangt Counts
`one/one` und ein nicht-nullisches Settlement. `settlement: null` setzt `S`
nie wahr.

Ein Fulfillmentwert wird nicht inspiziert. Ein Rejectiongrund darf nur
descriptorbasiert gegen das descriptor- und freeze-beobachtbare Profil des
exakten statischen Zwei-Feld-Records geprüft werden:

```text
code = BROWSER_SYNC_TRANSPORT_FAILED
message = Der lokale Browser-SyncTransport ist fehlgeschlagen.
```

Accessor, Symbol, Zusatzfeld, falscher Prototyp, fehlender Freeze oder falscher
Wert ergibt `other-rejection/mismatch`; kein Getter wird aufgerufen. Auch
`match` bestätigt am unvertrauenswürdigen Rejectiongrund keine Plain-Data- oder
Proxy-free-Eingabeidentität.
Zulässige Settlementpaare sind:

```text
fulfilled / not-applicable
static-redacted-rejection / match
other-rejection / mismatch
```

Relative Dauer und Timingstatus folgen ausschließlich der
JavaScript-Main-World-Clock. Nur die neu konstruierte controller-eigene
Projektion kann `closedPrimitiveProjectionConfirmed: confirmed` besitzen, auch
wenn sie wegen Kontextblockierung kein Settlement behauptet. Sie ist ein
frischer gewöhnlicher geschlossener, tief eingefrorener Recordbaum mit
ausschließlich primitiven, sofort ohne Inputreferenz kopierten Blattwerten.
Die Eingabehülle und ihr Graph erhalten dadurch keine Plain-Data-, Proxy-,
Parser-, Raw-Byte- oder Materialisierungsbestätigung. Die Hülle ist kein
Remote-Handle; `Runtime.getProperties`,
`Runtime.releaseObject`, Object-ID-Dereferenzierung und jede Folgeinspektion
bleiben verboten.

### 17 Integritätschecks und Ableitungsquellen

`integrityChecks` enthält in dieser Reihenfolge exakt:

```text
sourceUnmodified
instrumentedSourceCopyAbsent
compositionSeamsAbsent
protocolAllowlistOnly
runtimeSurfaceMutationAbsent
fetchInterceptionAbsent
debuggerBreakpointsAndSteppingAbsent
profilerAndTracingAbsent
responseBodyReadAbsent
freeRawInspectionAbsent
additionalNativeFetchAbsent
observerProductEndpointRequestAbsent
rawPersistenceAbsent
observerDiagnosticDuringRunOutputAbsent
closedPrimitiveProjectionConfirmed
singleTargetAndSessionConfirmed
singleMainWorldEvaluationConfirmed
```

Jeder Wert ist `confirmed`, `violated` oder `unproven`.
`confirmed` verlangt die benannte gebundene Quelle, Gegenbeweis ergibt
`violated`, fehlende oder nicht authentisch zuordenbare Grundlage `unproven`:

| Check | Ableitungsquelle |
| --- | --- |
| `sourceUnmodified` | Checkoutbytes, Replaycommit-Blob und Foundationdigest |
| `instrumentedSourceCopyAbsent` | geschlossene Adapter-/Residueinventur gegen die reale Transportquelle |
| `compositionSeamsAbsent` | statisches Evaluationprofil und Command-/Capabilityledger |
| `protocolAllowlistOnly` | vollständiger controllerlokaler Send-Ledger |
| `runtimeSurfaceMutationAbsent` | statisches Evaluationprofil und zulässiger Main-World-Aktionsledger |
| `fetchInterceptionAbsent` | Evaluationprofil, Operationsledger und Adapterbindung |
| `debuggerBreakpointsAndSteppingAbsent` | Operationsledger ohne Debuggerdomain |
| `profilerAndTracingAbsent` | Operationsledger ohne Profiler-/Tracingdomain |
| `responseBodyReadAbsent` | Network-Zugriffsledger ohne Bodykommando oder Bodyfeld |
| `freeRawInspectionAbsent` | descriptorbasierter Own-Data-Zugriffsledger |
| `additionalNativeFetchAbsent` | Main-World-Counts und Requestbudget |
| `observerProductEndpointRequestAbsent` | Requestownership und Endpointbudget |
| `rawPersistenceAbsent` | Capability-/Outputledger und Residueprüfung |
| `observerDiagnosticDuringRunOutputAbsent` | geschlossener Outputledger bis zum Finalrecord |
| `closedPrimitiveProjectionConfirmed` | ausschließlich der frisch konstruierte controller-eigene geschlossene, tief eingefrorene v2-Projektionsbaum ohne Inputreferenzen |
| `singleTargetAndSessionConfirmed` | Targetset, flache Session und Sessionrouting |
| `singleMainWorldEvaluationConfirmed` | Send-Ledger, Antwortklasse und Evaluationscount |

`closedPrimitiveProjectionConfirmed` bestätigt ausschließlich die neue
Outputprojektion, niemals Eingabe-, Proxy-, Parser-, Raw-Byte- oder
Materialisierungsprovenienz. Die pure Foundation allein kann adapter-,
prozess- oder residueabhängige Checks nicht bestätigen und keine reale Evidenz
für `observerGate: PASS` erzeugen. Ein späterer hashgebundener
Parser-/Adapterpfad muss seine Provenienz intern aus den gebundenen Bytes, dem
Parser- und dem Capabilityledger ableiten; ein frei gelieferter
Provenienzboolean ist verboten.

`interferenceObservation` wird total abgeleitet:

- bestätigte vertraglich sichtbare Interferenz:
  `contract-visible-detected`;
- alle relevanten Checks bestätigt und keine Verletzung:
  `none-contract-visible-detected`;
- sonst `unknown`.

### Exaktes Requestbudget

`requestBudget` besitzt exakt neun Zähler und eine Sequenz:

```text
requestBudget = {
  defaultTransportCalls,
  retries,
  directDiagnosticFetches,
  negativeOriginRuns,
  redirectRuns,
  observerProductEndpointRequests,
  endpointOptions,
  endpointPosts,
  endpointOtherMethods,
  sequence
}
```

Jeder Zähler ist `zero`, `one`, `multiple` oder `unknown`. Für einen regulären
Stimulus gilt:

```text
defaultTransportCalls = one
retries = zero
directDiagnosticFetches = zero
negativeOriginRuns = zero
redirectRuns = zero
observerProductEndpointRequests = zero
endpointOptions = one
endpointPosts = one
endpointOtherMethods = zero

sequence =
  OPTIONS-204-POST-200-loadingFinished |
  other |
  incomplete |
  ambiguous
```

Das Budget gilt nur von `observer-armed` bis zum verarbeiteten `U`, `V` oder
`C` und behauptet keine Abwesenheit danach. Nach `U` sind Evaluate, Factory,
Transportstimulus und gegatete Downstreamoperationen `zero`; nicht zuverlässig
beobachtete Networkzähler bleiben `unknown`, Sequenz ist `incomplete`.

Bei einem Stimulus wird Sequenz total abgeleitet:

1. `ambiguous`, sobald Attribution nicht eindeutig ist;
2. `other`, sobald eine eindeutig beobachtete Methode, Statusklasse,
   Reihenfolge, Zusatzanforderung oder Terminalklasse abweicht;
3. `OPTIONS-204-POST-200-loadingFinished` nur bei vollständiger Übereinstimmung;
4. andernfalls `incomplete`.

Zweiter Transportaufruf, zweiter `POST`, direkter Diagnose-Fetch oder
Observerrequest am Produktendpoint ist `V/FAIL`. Fehlende oder mehrdeutige
Attribution ist ohne unabhängige Verletzung `UNPROVEN`. Ein klar abweichender
Status, `loadingFailed`, zusätzliche produktverursachte `OPTIONS` oder andere
produktverursachte Methode bildet `other`. Der Transportaufruf ausgelöste
`OPTIONS` und `POST` zählen nicht als Observerrequest; Frontend- und
Modulladeresourcen zählen nicht zum Endpointbudget.

### Öffentliches Settlement

`publicSettlement` besitzt exakt:

```text
publicSettlement = {
  observationState,
  outcome,
  staticProfileResult,
  deadlineRelation,
  internalStage,
  internalOwner
}

observationState = observed | not-observed | ambiguous
outcome = fulfilled | static-redacted-rejection | other-rejection | unknown
staticProfileResult = match | mismatch | unproven | not-applicable
deadlineRelation = deadline-compatible | no-causal-classification | unknown
internalStage = unknown
internalOwner = unknown
```

Nach `U` gilt in Feldreihenfolge:
`not-observed`, `unknown`, `unproven`, `unknown`, `unknown`, `unknown`.
Die interne Stage und der First-Terminal-Owner werden niemals behauptet.

### Exakt zehn Stages

`stages` besitzt exakt zehn Slots in kanonischer Speicherreihenfolge:

```text
observer-armed
transport-call-dispatched
preflight-request-observed
preflight-204-observed
post-request-observed
post-response-200-observed
post-loading-finished | post-loading-failed
public-promise-settled
cleanup-started
cleanup-completed
```

Jeder Slot besitzt exakt acht Felder:

```text
stage = {
  stageId,
  layer,
  observationState,
  receiptOrder,
  result,
  clockDomain,
  relativeMilliseconds,
  timingState
}
```

Geschlossene Werte sind:

```text
layer = controller | javascript-main-world | browser-network | cleanup
observationState = observed | not-observed | ambiguous
receiptOrder = positive-safe-integer | null
result = match | mismatch | unproven
clockDomain =
  controller-monotonic |
  javascript-main-world |
  browser-network
relativeMilliseconds =
  null | 0 | 10 | ... | 59990 | 60000
timingState = measured | at-or-above-cap | unavailable
```

Die feste Matrix lautet:

| Stage | Layer | Clock |
| --- | --- | --- |
| `observer-armed` | `controller` | `controller-monotonic` |
| `transport-call-dispatched` | `javascript-main-world` | `javascript-main-world` |
| `preflight-request-observed` | `browser-network` | `browser-network` |
| `preflight-204-observed` | `browser-network` | `browser-network` |
| `post-request-observed` | `browser-network` | `browser-network` |
| `post-response-200-observed` | `browser-network` | `browser-network` |
| `post-loading-finished` oder `post-loading-failed` | `browser-network` | `browser-network` |
| `public-promise-settled` | `javascript-main-world` | `javascript-main-world` |
| `cleanup-started` | `cleanup` | `controller-monotonic` |
| `cleanup-completed` | `cleanup` | `controller-monotonic` |

`receiptOrder` wird je Layer lückenlos ab `1` vergeben. Nur eindeutig
beobachtete Slots erhalten eine positive Zahl; `not-observed` und `ambiguous`
verwenden `null`. Ein Preflight-`loadingFinished` dient nur flüchtig der
Korrelation und erzeugt keinen Slot. `post-response-200-observed` behauptet
keinen Header- oder Streamabschluss. Nach einem späteren `U` bleibt Stage 1
`observer-armed` als `observed/match` mit `receiptOrder: 1`,
`relativeMilliseconds: 0` und `timingState: measured` erhalten. Stages 2 bis 8
sind `not-observed/unproven` mit `receiptOrder: null`,
`relativeMilliseconds: null` und `timingState: unavailable`; Cleanup verwendet
weiterhin Slots 9 und 10.

### Timing

`timing` besitzt exakt:

```text
timing = {
  roundingMilliseconds,
  durationCapMilliseconds,
  setupWindowMilliseconds,
  captureWindowMilliseconds,
  clockDomains,
  calibration,
  crossDomainComparison,
  completion
}
```

Die festen Werte sind:

```text
roundingMilliseconds = 10
durationCapMilliseconds = 60000
setupWindowMilliseconds = 6000
captureWindowMilliseconds = 6000
calibration = none
crossDomainComparison = forbidden
```

`clockDomains` enthält exakt:

| Domain | Quelle | Aussage |
| --- | --- | --- |
| `controller-monotonic` | `controller-monotonic-fixed-v1` | nur setup-, controller- und cleanuplokale Folge und Dauer |
| `javascript-main-world` | `window.performance.now` | nur stimulus- und settlementlokale Folge und Dauer |
| `browser-network` | `cdp-network-monotonic-time` | nur networklokale Folge und Dauer |

Setup- und Observationcontroller verwenden dieselbe Controllerdomäne; es gibt
keine vierte Clock. `m_setup` ist der rohe controller-monotone Clockursprung
des Setupfensters; `t_setup = 0` ist ausschließlich dessen persistierter
relativer Nullpunkt. Die übrigen Nullpunkte sind `observer-armed`, der
Evaluate-Sendeübergang, unmittelbar vor `sendSyncRequest`, das erste eindeutig
attribuierte Endpoint-`requestWillBeSent` und `cleanup-started`. Keine
Clockdomäne wird mit einer anderen verrechnet.

Für jede rohe ebenenlokale Dauer `d` gilt ohne Koerzierung:

```text
d ist keine endliche primitive Zahl oder d < 0
  => relativeMilliseconds = null
     timingState = unavailable

0 <= d < 60000
  => relativeMilliseconds = 10 * floor(d / 10)
     timingState = measured

d >= 60000
  => relativeMilliseconds = 60000
     timingState = at-or-above-cap
```

Die Setupmitgliedschaft verwendet vorher ausschließlich die rohe
`d_setup < 6000`-Grenze. `deadline-compatible` ist nur bei gültiger gerundeter
Main-World-Dauer von einschließlich `4500` bis `5500` zulässig. Außerhalb gilt
`no-causal-classification`, bei unbrauchbarem Timing `unknown`.

### Cleanup

`cleanup` besitzt exakt vier Felder:

```text
cleanup = {
  observationClosedBeforeCleanup,
  checks,
  result,
  recordMaterializedAfterCleanup
}
```

Die beiden Ablauffelder sind boolesch. `result` ist `PASS`, `FAIL` oder
`UNPROVEN`. Cleanup startet nach `U`, `V` oder `C` aus dem tatsächlich
erreichten partiellen Setupzustand.

```text
cleanupWindowMilliseconds = 60000
cleanupFinalized :=
  allCleanupStepsTerminal ||
  cleanupCapProcessed
```

Der Cleanupcap beginnt bei `cleanup-started`, wird nicht mit dem
Durationcap gleichgesetzt und verwendet bei Gleichzeitigkeit die
controllerlokale Verarbeitungsreihenfolge. Offene Checks werden am Cap
`unproven`; bestätigtes `failed` behält Präzedenz. `cleanupCompleted` bedeutet,
dass alle Schritte vor dem Cap terminal bewertet wurden, nicht dass sie
erfolgreich waren. Stage 10 bleibt am Cap ohne vollständige Terminalität
`not-observed/unproven`. `recordMaterializedAfterCleanup` bedeutet nach
terminaler Finalisierung, auch bei `FAIL` oder `UNPROVEN`.

`checks` enthält exakt diese 20 IDs:

```text
cleanupStarted
networkDomainClosed
targetSessionClosed
debugPipeClosed
controllerObservationClosed
browserStopped
devServerStopped
gatewayStopped
profileRemoved
harnessFragmentsRemoved
objectGroupsAbsentOrReleased
rawEventsDiscarded
ephemeralIdentifiersDiscarded
permissionSiteCacheAndServiceWorkerStateCleared
environmentRestored
portsFree
repositoryAndIndexRestored
historicalEvidenceHashUnchanged
observerStorageLogAndTelemetryResidueAbsent
cleanupCompleted
```

Jeder Check ist `confirmed`, `failed` oder `unproven`. Die Quellen sind:

| Check | Ableitungsquelle |
| --- | --- |
| `cleanupStarted` | interner Übergang nach Frozen Observation-Snapshot |
| `networkDomainClosed` | korrelierter Disable-Erfolg oder Beweis, dass Enable nie gesendet wurde |
| `targetSessionClosed` | korrelierter Detach-Erfolg oder Beweis, dass Attach nie gesendet wurde |
| `debugPipeClosed` | identitätsgebundene irreversible Close-Bestätigung |
| `controllerObservationClosed` | verworfene Event-/Commandfähigkeiten, nur geschlossene Primitive |
| `browserStopped` | terminaler Wait-/Terminate-Ausgang des gebundenen Handles |
| `devServerStopped` | terminaler Wait-/Terminate-Ausgang des gebundenen Handles |
| `gatewayStopped` | terminaler Wait-/Terminate-Ausgang des gebundenen Handles |
| `profileRemoved` | Verifikation des exakt gebundenen temporären Profilpfads |
| `harnessFragmentsRemoved` | Verifikation der allowlisteten temporären Fragmente |
| `objectGroupsAbsentOrReleased` | bestätigte Abwesenheit; Objectgroup und Release bleiben verboten |
| `rawEventsDiscarded` | Entleerung der flüchtigen Raw-Eventhaltung |
| `ephemeralIdentifiersDiscarded` | Entleerung aller flüchtigen IDs |
| `permissionSiteCacheAndServiceWorkerStateCleared` | gebundene Wegwerfprofilprüfung |
| `environmentRestored` | Vergleich der geschlossenen Umgebungsbaseline |
| `portsFree` | Verifikation ausschließlich der gebundenen lokalen Ports |
| `repositoryAndIndexRestored` | Repository-/Indexprüfung unmittelbar vor Finalrecord |
| `historicalEvidenceHashUnchanged` | SHA-256 der historischen Evidence-Datei |
| `observerStorageLogAndTelemetryResidueAbsent` | Residueprüfung unmittelbar vor Finalrecord |
| `cleanupCompleted` | alle vorherigen Cleanupschritte vor Cap terminal bewertet |

Wurde Enable oder Attach möglicherweise ausgeführt, ist die zugehörige
Fähigkeit aber nicht identifizierbar, bleibt der Close-Check `unproven`; bloße
Unzugänglichkeit bestätigt keine Schließung. Mindestens ein `failed` oder
falsches Ablauffeld ergibt `FAIL`; andernfalls ergibt ein `unproven`
`UNPROVEN`; nur alle `confirmed` und beide booleschen Werte `true` ergeben
`PASS`.

`Network.disable` und `Target.detachFromTarget` werden vor
`debugPipeClosed` und `controllerObservationClosed` nur über bereits gebundene
Fähigkeiten versucht. Danach sind ausschließlich identitätsgebundene
irreversible Fähigkeiten `wait`, `terminate`, `close`, Entfernung exakt
gebundener temporärer Artefakte und geschlossene Post-Cleanup-Verifikation
zulässig. Neue Prozesse, stdin, freie IPC, CDP-/Pipe-Schreiben,
Browserkommandos, Produktrequests, Wiederöffnung, freie Metadatenabfragen und
PID-Persistenz sind verboten.

### Statusachsen und fünf Findings

```text
observerGate = PASS | FAIL | UNPROVEN

finding =
  static-rejection-reproduced-after-http200 |
  original-failure-not-reproduced |
  network-signature-diverged |
  observer-invalid |
  inconclusive

causeStatus = CAUSE_NOT_PROVEN
```

Die Ableitung besitzt Präzedenz:

1. Bestätigte Integritäts-, Kommando-, Envelope-, Requestbudget-, Freeze-,
   Ablauf- oder Cleanupverletzung ergibt `FAIL/observer-invalid`.
2. `U`, fehlende oder mehrdeutige Pflichtbeobachtung, unbestätigter
   Integritätscheck, unvollständiges Replay oder Cleanup ergibt ohne
   bestätigte Verletzung `UNPROVEN/inconclusive`.
3. `static-rejection-reproduced-after-http200` verlangt `PASS`,
   `EQUIVALENT`, einen Stimulus, exakt
   `OPTIONS-204-POST-200-loadingFinished` und
   `static-redacted-rejection/match`.
4. `original-failure-not-reproduced` verlangt dieselben Voraussetzungen und
   `fulfilled/not-applicable`.
5. Eine eindeutig beobachtete abweichende Produktnetzsignatur darf nur bei
   intaktem Observer, genau einem Stimulus und `EQUIVALENT`
   `PASS/network-signature-diverged` ergeben.
6. `other-rejection/mismatch` bei ansonsten erwarteter Netzsequenz bleibt
   `PASS/inconclusive`.
7. Jede andere Kombination ist `inconclusive`.

Jeder `PASS` und jeder nicht-inkonklusive Befund verlangt genau einen
Stimulus. Ein vor dem Stimulus geschlossener Versuch ist ausschließlich
`UNPROVEN/inconclusive` oder bei bestätigtem `V`
`FAIL/observer-invalid`. Nach `U` gelten ohne spätere Verletzung:

```text
captureWindowState = not-started
observerGate = UNPROVEN
finding = inconclusive
causeStatus = CAUSE_NOT_PROVEN
mainWorldEvaluationCount = zero
transportFactoryCallCount = zero
defaultTransportCalls = zero
sequence = incomplete
```

Ein Replay-`mismatch` macht den Observer nicht allein ungültig, verhindert
aber jedes historische Finding. Reproduktion ist kein Ursachennachweis.
`adr0029OverallGate` bleibt vor und nach der Diagnose `FAIL`.

### Recordgrammatik, Redaction und Materialisierung

Alle Records sind gewöhnliche geschlossene Nicht-Array-Records mit
ausschließlich aufzählbaren Own-Data-Properties. Arrays besitzen feste
Reihenfolge und Kardinalität. Zahlen sind endlich, nichtnegativ und
erforderlichenfalls Safe Integers. Symbole, Accessors, Funktionen, BigInts,
`undefined`, `NaN`, Infinity und `toJSON` sind verboten. Der Finalrecord wird
frisch erzeugt und tief eingefroren. Die Foundation persistiert oder
serialisiert ihn nicht.

Nicht gespeichert werden insbesondere Benutzer- oder Rechnername,
persönliche Profilpfade, Profilinstanzkennungen, PIDs, vollständiger
User-Agent, Debugport, rohe Kommandozeile oder Flags, HAR, rohe CDP-Ereignisse,
Hüllen- oder Routingmetadaten, Session-, Target-, Frame-, Loader-, Request-,
Command- oder RemoteObject-IDs, rohe Zeitpunkte, Header, Request-ID,
Requesttimestamp, Request-/Responsebody, Fehlergrund, Stack,
Exceptiondetails, Preview, private Netzwerkdetails, GoldenDawn-, Vault- oder
Credentialdaten.

Repository-, Index- und Residuechecks erfolgen unmittelbar vor dem
Finalrecord. Die einzige danach zulässige observererzeugte Ausgabe ist der
eine sanitierte Finalrecord; sie ist keine Residue. Logs, Rohdaten,
Zwischenrecords und temporäre Manifeste bleiben verboten.

### Bewusste Adaptergrenze

Die pure Foundation implementiert ausdrücklich kein Debug-Pipe-Framing,
keinen Byte- oder Messageparser, UTF-8-Decoder, JSON-Parser,
Duplicate-Key-Nachweis, Prozesslauncher, Browser-, Vite- oder Gatewayadapter,
Dateisystem- oder Recordwriter. Sie kann ausschließlich ihre frisch
konstruierte controller-eigene geschlossene Outputprojektion bestätigen, nicht
den unvertrauenswürdigen Eingabegraphen oder dessen Proxy-, Parser-, Raw-Byte-
und Materialisierungsprovenienz. Die pure Foundation allein kann keine reale
`observerGate: PASS`-Evidenz erzeugen. Bounded-`JSON.parse`-, No-Reviver-,
Raw-Byte-, Duplicate-Key- und Materialisierungsprovenienz bleiben bis zu einem
späteren hashgebundenen Adapter unbewiesen und müssen dort intern aus
gebundenem Parser-, Byte- und Capabilityledger abgeleitet werden; ein frei
gelieferter Provenienzboolean bleibt verboten.

Die Reihenfolge bleibt:

1. ADR 0032 dokumentieren und mergen.
2. Nur die pure netzwerkfreie effects-as-data-Foundation implementieren und
   testen.
3. Raw-Pipe-, Parser-, Queue-, Ressourcen-, Cap-/Timer-, Adapter-, Launcher-
   und Hashbindung in einem eigenen ADR entscheiden und anschließend
   netzwerkfrei implementieren.
4. Erst danach einen sichtbaren Diagnoselauf separat autorisieren.
5. Anschließend erst über Produktänderung oder einen neuen ADR-0029-Lauf
   entscheiden.

Vor Schritt 4 darf kein realer `BrowserTransportDiagnosticRecord`
materialisiert werden. Dieser Vertrag autorisiert keine Runtimeoperation und
ändert weder `overallGate: FAIL` noch `causeStatus: CAUSE_NOT_PROVEN`.

## Browser Runtime Evidence Record / ADR 0029

[ADR 0029](decisions/0029-browser-runtime-evidence-gate.md) ergänzt ADR 0020
und ADR 0028, operationalisiert die fortgeltenden ADR-0026-/ADR-0027-
Runtimeanforderungen und ersetzt keinen ADR. Der folgende Vertrag beschreibt
den geschlossen persistierbaren Record eines jeweils gesondert autorisierten
Messlaufs. Der erste und einzige Record
`docs/evidence/browser-runtime-evidence.chrome-stable-windows-01.json` bindet
Chrome Stable `151.0.7922.174` unter Windows 11 Home 25H2 an
`chrome-stable-win-t0-01`; sein Gesamtgate ist `FAIL`. ADR 0029 selbst bleibt
bytegleich und war weiterhin ausschließlich der vorausgehende
Dokumentationsslice.

### Geltung und geschlossene Rootform

Ein `BrowserRuntimeEvidenceRecord` gilt für genau einen Messlauf, genau ein
Browserziel und genau ein vor dem ersten Request vollständig gebundenes
Basistupel `T₀`. Jedes Objekt besitzt ausschließlich die nachfolgend genannten
aufzählbaren Own-Data-Properties. Zusätzliche Keys, frei benannte Maps sowie
freie `metadata`-, `notes`-, `details`- oder Blobfelder sind ungültig. Arrays
sind kanonisch geordnet, duplikatfrei und auf ihre jeweilige Pflichtmenge
begrenzt.

```text
BrowserRuntimeEvidenceRecord = {
  schemaVersion,
  recordType,
  measurementRunId,
  observedAt,
  timeZone,
  baseContextId,
  baseContext,
  vectors,
  pnaLnaClassification,
  gates,
  overallGate,
  cleanupConfirmed,
  remainingLimits
}
```

| Feld | Geschlossener Vertrag |
| --- | --- |
| `schemaVersion` | Ganzzahl, exakt `1` |
| `recordType` | exakt `browser-runtime-evidence` |
| `measurementRunId` | lokales ASCII-Label `[a-z0-9-]{1,32}`; nicht aus Benutzer-, Rechner-, Profil-, Request- oder Zeitwerten abgeleitet |
| `observedAt` | kanonischer RFC-3339-Zeitpunkt der Bindung von `T₀`; niemals der SyncRequest-Timestamp |
| `timeZone` | exakt `{ id, utcOffset }`; sanitierter IANA-Zonenname und `Z` oder `±HH:MM` |
| `baseContextId` | eindeutiges lokales ASCII-Label `[a-z0-9-]{1,32}` für dieses vollständige `T₀` |
| `baseContext` | exakt die unten definierte sanitierte `T₀`-Form |
| `vectors` | exakt drei Einträge in der Reihenfolge `positive-default`, `negative-origin`, `redirect-error` |
| `pnaLnaClassification` | exakt die unten definierte getrennte CORS-/PNA-/LNA-Klassifikation |
| `gates` | exakt die zehn benannten Pflichtgates |
| `overallGate` | exakt `PASS`, `FAIL` oder `UNPROVEN` |
| `cleanupConfirmed` | boolesche, aus allen Vektoren und Cleanupchecks abgeleitete Laufgesamtbestätigung |
| `remainingLimits` | exakt die unten festgelegte kanonische Aussagegrenzenliste |

### Vollständiges Basistupel `T₀`

`observedAt`, `timeZone`, `baseContextId` und `baseContext` bilden gemeinsam
das unveränderliche `T₀`. Vektorzeiten sind keine stillen Ersatzwerte und
werden nicht als zweite Baseline gespeichert.

```text
BaseContextT0 = {
  repository,
  hostRuntime,
  operatingSystem,
  node,
  browser,
  profile,
  networkEnvironment,
  initialState,
  bindingComparisonProfile,
  frontend,
  transportRequest,
  gateway
}

repository = { commit, state }
hostRuntime = { executionClass }
operatingSystem = { family, edition, architecture, version, build, patch }
node = { version }
browser = {
  product, channel, version, engine, engineBuild,
  executionMode, privateMode
}
profile = {
  lifecycle, extensions, startParameters, featureFlags,
  enterprisePolicies
}
networkEnvironment = { proxy, vpn }
initialState = {
  serviceWorker, permission, preflightCache, siteCache
}
frontend = {
  topLevelUrl, serializedOrigin, contextKind, isSecureContext
}
transportRequest = {
  factoryProfile, compositionProfile, requestProfile,
  requestEqualityMethod, initialUrl, initialScheme, initialHost,
  initialPort, initialPath, requestInitProfile
}
gateway = {
  listenerHost, listenerPort, portEnvironmentValue,
  allowedOrigin, endpoint, responderProfile
}
```

Die Feldwerte sind geschlossen:

- `repository.commit` ist Lower-Hex mit exakt 40 Zeichen;
  `repository.state` ist `clean`, `dirty` oder `unknown`.
- `hostRuntime.executionClass` ist `local-disposable`, `local-dedicated` oder
  `unknown`; ein Rechnername ist verboten.
- `operatingSystem.family` ist `windows`, `macos` oder `linux`;
  `architecture` ist `x64`, `arm64` oder `x86`. Edition, Version, Build und
  Patch sind sanitierte ASCII-Produktwerte von 1 bis 64 Zeichen ohne Pfad,
  Benutzer- oder Rechnerbezug.
- `node.version` ist eine sanitierte kanonische Semver von 1 bis 32 Zeichen.
- `browser.product` ist `chrome`, `edge`, `firefox` oder `safari`; `channel`
  ist `stable`, `beta`, `dev`, `canary`, `esr`, `release` oder
  `technology-preview`; `engine` ist `blink`, `gecko` oder `webkit`.
  Vollversion und Enginebuild sind sanitierte ASCII-Versionswerte von 1 bis
  64 Zeichen. `executionMode` ist ausschließlich `visible`; `privateMode` ist
  boolesch.
- `profile.lifecycle` ist `fresh-disposable`, `reused` oder `unknown`;
  `extensions` ist `none`, `present-sanitized` oder `unknown`.
  `startParameters`, `featureFlags` und `enterprisePolicies` sind jeweils
  `none-effective`, `effective-non-bypassing`, `security-bypassing` oder
  `unknown`. Diese Klassifikation speichert keine freien Parameterwerte.
- `networkEnvironment.proxy` und `.vpn` sind jeweils `inactive`,
  `active-sanitized` oder `unknown`.
- `initialState.serviceWorker` ist `absent`, `present` oder `unknown`;
  `permission` ist `prompt`, `granted`, `denied`, `unsupported` oder
  `unknown`; `preflightCache` und `siteCache` sind `empty-confirmed`,
  `not-empty` oder `unknown`.
- `bindingComparisonProfile` ist exakt
  `ephemeral-exact-effective-context-comparison-without-retention`. Für alle
  Bindungsfelder, deren persistierte Form aus Datenschutzgründen nur eine
  Klassifikation enthält, bindet der spätere Lauf vor dem ersten Request
  zusätzlich den tatsächlich wirksamen Wert flüchtig und vergleicht ihn nach
  jedem Vektor exakt. Dazu gehören insbesondere Erweiterungszustand,
  Startparameter, Featureflags, Enterprise-Richtlinien, Proxy, VPN,
  Service-Worker-, Permission- und Cachezustand. Die zugrunde liegenden
  Rohwerte, Listen und Pfade werden nach dem Vergleich verworfen und niemals
  in den Evidence-Record übernommen.
- `frontend.topLevelUrl` und `.serializedOrigin` sind die exakt autorisierten
  lokalen Frontendwerte ohne Userinfo, Query oder Fragment. Zulässig sind nur
  Loopbackhost und der vorab freigegebene lokale Frontendport; Rechnername und
  sonstiger privater Netzraum sind ausgeschlossen. `contextKind` ist
  `top-level`, `frame` oder `worker`; der positive Pfad verlangt `top-level`.
  `isSecureContext` ist der tatsächliche boolesche Browserwert.
- `transportRequest.factoryProfile` ist exakt `real-default-factory`,
  `compositionProfile` exakt `transport-only` und `requestProfile` exakt
  `synthetic-v1-syncTest-empty-payload`. `requestEqualityMethod` ist exakt
  `ephemeral-full-value-comparison-without-retention`: Request-ID,
  Requesttimestamp und Body werden nur flüchtig für den Gleichheitsvergleich
  verwendet und nicht in den Record übernommen. `initialUrl` ist exakt
  `http://127.0.0.1:8787/api/sync-test`, `initialScheme` exakt `http`,
  `initialHost` exakt `127.0.0.1`, `initialPort` die Ganzzahl `8787` und
  `initialPath` exakt `/api/sync-test`. `requestInitProfile` ist exakt
  `adr-0028-fixed` und
  bindet die unveränderte transportlokale Methoden-, CORS-, Credential-,
  Redirect-, Referrer-, Cache- und Content-Type-Projektion.
- `gateway.listenerHost` ist exakt `127.0.0.1`, `listenerPort` die Ganzzahl
  `8787` und `portEnvironmentValue` der primitive String `"8787"`.
  `allowedOrigin` ist genau ein
  geschlossenes Objekt `{ value, relationToFrontend }`; `value` ist unter
  `T₀` exakt die sanitierte `frontend.serializedOrigin` und
  `relationToFrontend` exakt `matches-frontend-origin`. `endpoint` ist exakt
  `http://127.0.0.1:8787/api/sync-test` und `responderProfile` unter `T₀`
  exakt `production-gateway`.

`file:`, `about:blank`, DevTools als eigener Origin, ein verborgenes Iframe,
ein Worker oder ein anderer Ersatzkontext darf nicht als GoldenDawn-Top-Level-
Kontext erscheinen. Sicherheitsdeaktivierende Konfiguration ist erfassbar,
ergibt aber Gate-`FAIL`; ein fehlender oder `unknown`-Wert hält das betroffene
Gate `UNPROVEN`.

### Vektoren und geschlossenes Delta

Jeder Vektor besitzt exakt folgende Keys:

```text
VectorEvidence = {
  vectorId,
  baseContextId,
  allowedDeltaFields,
  changedDeltaFields,
  expectedDelta,
  observedDelta,
  expectation,
  observation,
  gateIds,
  status,
  noOtherBindingFieldsChanged,
  restoreConfirmed,
  cleanupConfirmed
}

ExpectedDeltaEntry = { field, baseValue, vectorValue }
ObservedDeltaEntry = {
  field, baseValue, vectorValue, comparisonBasis,
  observationState, result
}
```

`observationState` ist ausschließlich `observed`, `not-observed` oder
`ambiguous`; `result` ausschließlich `match`, `mismatch` oder `unproven`.
`comparisonBasis` ist `recorded-sanitized-value` oder
`ephemeral-exact-value-without-retention`.
`status` ist ausschließlich `PASS`, `FAIL` oder `UNPROVEN`.

Die einzige Allowlist für beabsichtigte `Δᵥ`-Felder lautet in dieser
Reihenfolge:

```text
gateway.allowedOrigin
gateway.responderProfile
```

Die Wertdomäne des ersten Feldes ist exakt
`{ value, relationToFrontend }`. `value` ist eine sanitierte exakte lokale
Origin ohne Userinfo, Query, Fragment, Rechnername oder privaten Netzraum;
`relationToFrontend` ist `matches-frontend-origin` oder
`mismatches-frontend-origin` und muss aus `value ===
frontend.serializedOrigin` korrekt abgeleitet sein. Der Origin-Negativvektor
bindet seinen erwarteten abweichenden `value` vor dem Lauf. Dieses eine
zusammengesetzte Recordfeld repräsentiert ausschließlich den tatsächlichen
Wert von `GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN` samt seiner daraus
abgeleiteten Relation; es führt kein zweites Runtime-Delta ein. Die Wertdomäne des
zweiten Feldes ist `production-gateway` oder
`redirect-fixture-with-local-sentinel`. Das Redirectfixture, seine
Redirectantwort und der gebundene Null-Request-Sentinel bilden ein einziges
geschlossenes Responderprofil und dürfen nicht als mehrere Kontextdeltas
ausgegeben werden.

`redirect-fixture-with-local-sentinel` bedeutet exakt: derselbe Listener,
initiale Endpoint und gewöhnliche CORS-Semantik wie unter `T₀`; genau ein
gültiger `OPTIONS` am initialen Pfad mit `204`; danach genau ein `POST` am
initialen Pfad; darauf genau eine vollständig gesendete leere
`307 Temporary Redirect`-Response mit
`Location: http://127.0.0.1:8787/__goldendawn-adr-0029-redirect-sentinel`;
und null Requests jeder Methode am Sentinelpfad. Ein Listener-, Preflight-,
CORS- oder Vorabfehler erfüllt dieses Profil nicht und kann die kausale
Redirectkontrolle nicht auf `PASS` setzen.

| Vektor | Bindung und exakt zulässiges Delta | Erwartung | Zugeordnete Gates |
| --- | --- | --- | --- |
| `positive-default` | `baseContextId` referenziert `T₀`; `allowedDeltaFields` und `expectedDelta` sind leer; für `PASS` sind auch `changedDeltaFields` und `observedDelta` leer | `positive-success` | `contextBinding`, `secureContextMixedContent`, `exactLoopback`, `ordinaryCorsPreflight`, `pnaLnaPermission`, `normalSyntheticTransport`, `responseHeaderFiltering` |
| `negative-origin` | `allowedDeltaFields` enthält genau `gateway.allowedOrigin`; `expectedDelta` bindet Baseline `{ value: frontend.serializedOrigin, relationToFrontend: matches-frontend-origin }` und den vorab festgelegten abweichenden sanitisierten Originwert mit `relationToFrontend: mismatches-frontend-origin`. Für Vektor-`PASS` müssen `changedDeltaFields` und `observedDelta` genau dieses Feld und exakt diese Werte bestätigen. Browser, Profil, Frontend, `transportRequest` und alle übrigen Gatewayfelder bleiben identisch zu `T₀`. | `cors-blocked-before-post` | `negativeOrigin` |
| `redirect-error` | `allowedDeltaFields` enthält genau `gateway.responderProfile`; `expectedDelta` bindet `production-gateway` zu `redirect-fixture-with-local-sentinel`. Für Vektor-`PASS` müssen `changedDeltaFields` und `observedDelta` genau dieses Feld und exakt diese Werte bestätigen. Browser, Profil, Frontend, vollständiges `transportRequest` einschließlich initialer URL, Host, Port und Pfad sowie alle übrigen Gatewayfelder bleiben identisch zu `T₀`. | `closed-redirect-failure` | `redirectControl` |

`observation` ist ausschließlich `positive-success`,
`cors-blocked-before-post`, `closed-redirect-failure`, `unexpected-success`,
`unexpected-post`, `unexpected-sentinel-request` oder `ambiguous`.

Alle positiven Beobachtungen erfolgen exakt unter `T₀`. Ein Negativvektor
kopiert `T₀` nicht, sondern referenziert dessen `baseContextId`.
`allowedDeltaFields` und `expectedDelta` enthalten exakt das vorab festgelegte
`Δᵥ`. `changedDeltaFields` ist dagegen die kanonisch geordnete Liste aller
tatsächlich und eindeutig beobachteten Änderungen. Seine geschlossene
Felddomäne besteht ausschließlich aus den durch die vorstehende
`BaseContextT0`-Grammatik festgelegten Punktpfaden; `gateway.allowedOrigin`
wird dabei als das definierte zusammengesetzte Konfigurationsfeld atomar
behandelt. Freie oder unbekannte Feldnamen sind unzulässig. Dadurch kann die
Liste neben dem erwarteten Delta auch jede unbeabsichtigte Abweichung benennen,
ohne sie nachträglich zu erlauben.

`observedDelta` enthält die Vereinigung aus erwarteten und tatsächlich
beobachteten Änderungen. Bei einem tatsächlich geänderten Feld ist
`observationState: observed`; bei fehlender oder mehrdeutiger Wirkung ist der
`vectorValue` `null` und der Zustand `not-observed` beziehungsweise
`ambiguous`. Für beabsichtigte Deltas werden die exakten sanitisierten Werte
mit `comparisonBasis: recorded-sanitized-value` erfasst. Bei einer
unbeabsichtigten Änderung eines nur klassifiziert gespeicherten Feldes bleiben
`baseValue` und `vectorValue` auf seine erlaubten sanitisierten Recordwerte
begrenzt; `comparisonBasis: ephemeral-exact-value-without-retention` hält fest,
dass der flüchtige Exaktvergleich abwich, ohne den Rohwert zu persistieren.
`result` bindet den Vergleich als `match`, `mismatch` oder `unproven`. Nur für
ein Vektor-`PASS` stimmen erlaubte, tatsächliche, erwartete und beobachtete
Deltas exakt überein.

`noOtherBindingFieldsChanged` bestätigt, dass alle übrigen Bindungswerte
wertidentisch zu `T₀` blieben. Das schließt Browser-, Versions-, Profil-,
Frontend-, Gateway- und vollständige `transportRequest`-Bindung sowie die
flüchtig exakt verglichenen wirksamen Kontextwerte ein. Für den tatsächlichen
Request erfolgt der vollständige Wertevergleich ebenfalls flüchtig; der Record
speichert ausschließlich das Gleichheitsergebnis, niemals Request-ID,
Timestamp, Body oder die redigierten Kontextrohwerte.

Nach `negative-origin` muss `gateway.allowedOrigin` einschließlich Wert und
Relation exakt auf das Objekt aus `T₀` zurückgestellt sein. Nach
`redirect-error` müssen Fixture und Sentinel
vollständig entfernt und das Produktions-Gatewayprofil aus `T₀`
wiederhergestellt sein. `restoreConfirmed` und `cleanupConfirmed` werden je
Vektor separat geführt. Der positive Vektor setzt beide Werte nur dann auf
`true`, wenn er keinen abweichenden oder verbleibenden vektorlokalen Zustand
hinterließ.

### Getrennte PNA-/LNA-Klassifikation

`pnaLnaClassification` besitzt exakt folgende Keys und Werte:

```text
{
  ordinaryCorsSeparated,
  sourceAddressSpace,
  targetAddressSpace,
  pnaRequestHeader,
  pnaResponseHeader,
  lnaModel,
  permissionName,
  permissionBefore,
  prompt,
  userActivation,
  outcome,
  persistence,
  reset,
  pathAdjustmentRequired
}
```

- `ordinaryCorsSeparated` ist boolesch.
- Quell- und Zieladressraum sind jeweils `public`, `local`, `loopback` oder
  `unknown`.
- PNA-Request- und Responseheader sind jeweils `present`, `absent` oder
  `unknown`.
- `lnaModel` ist `permission`, `context-exempt`, `not-implemented` oder
  `unknown`.
- `permissionName` ist `local-network-access`, `local-network`,
  `loopback-network`, `none-observed` oder `unknown`.
- `permissionBefore` ist `prompt`, `granted`, `denied`, `unsupported` oder
  `unknown`; `prompt` ist `shown`, `not-shown` oder `unknown`;
  `userActivation` ist `required`, `not-required` oder `unknown`.
- `outcome` ist `allowed`, `denied`, `context-exempt`, `not-implemented` oder
  `unknown`.
- `persistence` ist `not-tested`, `persisted`, `not-persisted` oder `unknown`;
  `reset` ist `confirmed`, `failed`, `unproven` oder `not-authorized`.
- `pathAdjustmentRequired` ist `none`, `header`, `permission`, `policy`,
  `product` oder `unknown`.

`context-exempt`, `not-implemented`, `not-tested` und `not-authorized` sind
Beobachtungsklassifikationen, niemals ein vierter Gatestatus. Historische PNA-
Header dürfen `present` oder `absent` sein; erforderlich ist ihre eindeutige,
vom gewöhnlichen CORS-Preflight getrennte Beobachtung. Ein benötigter neuer
Header, eine benötigte Permission, Policy- oder Produktänderung ergibt `FAIL`.

Für `pnaLnaPermission` gilt zusätzlich die folgende zwingende Cross-Field-
Ableitung:

- `lnaModel: not-implemented` oder `unknown`, `outcome: not-implemented` oder
  `unknown` sowie eine nicht eindeutig trennbare Policy-, Cache- oder
  Permissionwirkung ergeben `UNPROVEN`.
- `outcome: denied` auf dem unveränderten positiven Pfad oder
  `pathAdjustmentRequired` mit `header`, `permission`, `policy` oder `product`
  ergeben `FAIL`. Das gilt auch für einen erst durch Permissiongewährung,
  stilles Gewähren, Policy oder Sicherheitsbypass funktionsfähigen Pfad.
- Ein Gate-`PASS` kann ausschließlich eine vollständig belegte
  `lnaModel: context-exempt`-/`outcome: context-exempt`-Beobachtung mit
  `permissionName: none-observed`, `prompt: not-shown`,
  `userActivation: not-required`, `pathAdjustmentRequired: none`, bekannten
  Quell- und Zieladressräumen sowie eindeutig als `present` oder `absent`
  klassifizierten PNA-Headern stützen. Dieses `PASS` gilt nur für `T₀` und
  behauptet weder einen LNA-Permission-Schutzpfad noch einen öffentlichen
  HTTPS-Origin.

### Exakt zehn Gates und ihre Pflichtchecks

```text
gates = {
  contextBinding,
  secureContextMixedContent,
  exactLoopback,
  ordinaryCorsPreflight,
  pnaLnaPermission,
  normalSyntheticTransport,
  responseHeaderFiltering,
  negativeOrigin,
  redirectControl,
  cleanupRedaction
}

GateEvidence = { gateId, status, layers, checks }
Check = {
  checkId, expected, observationState, observed, result
}
```

`gateId` muss dem jeweiligen Rootkey entsprechen. `status` besitzt nur die
drei Gatewerte. `layers` ist keine frei wählbare Teilmenge, sondern muss je
Gate exakt der folgenden kanonisch geordneten Liste entsprechen:

| Gate | Exakte unabhängige Beobachtungsebenen |
| --- | --- |
| `contextBinding` | `javascript`, `browser-network`, `gateway-process`, `user-permission` |
| `secureContextMixedContent` | `javascript`, `browser-network` |
| `exactLoopback` | `javascript`, `browser-network`, `gateway-process` |
| `ordinaryCorsPreflight` | `browser-network`, `gateway-process` |
| `pnaLnaPermission` | `browser-network`, `user-permission` |
| `normalSyntheticTransport` | `javascript`, `browser-network`, `gateway-process` |
| `responseHeaderFiltering` | `javascript`, `gateway-process` |
| `negativeOrigin` | `javascript`, `browser-network`, `gateway-process` |
| `redirectControl` | `javascript`, `browser-network`, `gateway-process` |
| `cleanupRedaction` | `javascript`, `browser-network`, `gateway-process`, `user-permission` |

Jede aufgeführte Ebene muss unabhängig beobachtet und darf nicht aus einer
anderen Ebene abgeleitet werden. Fehlt eine notwendige Ebenenbeobachtung oder
ist sie nicht trennbar, kann das Gate höchstens `UNPROVEN` sein; ein
beobachteter Ebenenwiderspruch oder eine Grenzverletzung ergibt `FAIL`.
`expected` und `observed` sind keine freien JSON-Werte: `checkId` bindet ihre
nachfolgend festgelegte boolesche, numerische oder Enumdomäne. Jeder Check
kommt in seinem Gate genau einmal und in der angegebenen Reihenfolge vor.

| Gate | Pflichtchecks und erwartete Werte |
| --- | --- |
| `contextBinding` | `binding.complete=true`; `binding.consistent=true`; `repository.clean=true`; `browser.visible=true`; `profile.freshDisposable=true`; `profile.privateMode=true`; `securityBypass.absent=true` |
| `secureContextMixedContent` | `window.isSecureContext=true`; `loopbackTreatment=allowed` aus `allowed\|blocked\|upgraded\|unknown`; `browserConsole.securityClassification=no-block` aus `no-block\|mixed-content-block\|other-security-block\|unknown`; `targetAddressSpace.required=false` |
| `exactLoopback` | `request.initialUrl=fixed-endpoint`; `request.finalUrl=fixed-endpoint`, jeweils aus `fixed-endpoint\|other\|unknown`; `request.redirected=false`; `routeMechanism=direct-127.0.0.1` aus `direct-127.0.0.1\|localhost\|ipv6\|dns\|proxy\|https\|remote\|redirect\|unknown` |
| `ordinaryCorsPreflight` | `preflight.sequence=OPTIONS-POST`; `gateway.optionsCount=1`; `gateway.postCount=1`; `preflight.origin=exact-frontend-origin`; `preflight.requestMethod=POST`; `preflight.requestHeaders=includes-content-type-no-unapproved`; `preflight.status=204`; `preflight.allowOrigin=exact-frontend-origin`; `preflight.allowMethods=post-only`; `preflight.allowHeaders=content-type-only`; `preflight.vary=origin-only`; `preflight.allowCredentials=absent` |
| `pnaLnaPermission` | `ordinaryCorsSeparated=true`; `sourceAddressSpace.classified=true`; `targetAddressSpace.classified=true`; `pnaRequestHeader.classified=true`; `pnaResponseHeader.classified=true`; `lnaModel.classified=true`; `permissionName.classified=true`; `permissionBefore.classified=true`; `prompt.classified=true`; `userActivation.classified=true`; `outcome.classified=true`; `pathAdjustmentRequired=none` aus `none\|header\|permission\|policy\|product\|unknown`; zusätzlich gelten die vorstehende Cross-Field-Ableitung und ihre einzige `PASS`-Form |
| `normalSyntheticTransport` | `transport.path=real-default-factory`; `request.profile=synthetic-v1-syncTest-empty-payload`; `composition.profile=transport-only`; `response.httpStatus=200`; `response.ok=true`; `response.redirected=false`; `response.finalUrl=fixed-endpoint`; `response.type=cors`; `response.correlation=valid` |
| `responseHeaderFiltering` | `js.contentType=application-json-utf8`; `js.contentLength.classification=canonical-decimal-within-16384`; `js.contentLength.value` ist eine Ganzzahl von 0 bis 16.384; `js.cacheControl=no-store`; `js.contentEncoding=null`; `server.xContentTypeOptions=present`; `server.vary=present`; `server.allowOrigin=present`; `js.xContentTypeOptionsVisibility=filtered`; `js.varyVisibility=filtered`; `js.allowOriginVisibility=filtered` |
| `negativeOrigin` | `nonDeltaBindings.unchanged=true`; `browser.blocked=true`; `responseBody.readable=false`; `gateway.postCount=0`; `fallback.used=false` |
| `redirectControl` | `nonDeltaBindings.unchanged=true`; `fixture.optionsCount=1`; `fixture.preflightStatus=204`; `fixture.preflightMatchedT0=true`; `fixture.postCount=1`; `fixture.redirectStatus=307`; `fixture.redirectLocation=fixed-local-sentinel`; `fixture.redirectResponseSent=true`; `transport.closedFailure=true`; `sentinel.requestCount=0`; `finalUrl.invented=false` |
| `cleanupRedaction` | `processes.stopped=true`; `profileHarness.removed=true`; `permissionSiteState.cleared=true`; `networkRecordings.removed=true`; `environment.restored=true`; `ports.free=true`; `repository.restored=true`; `runtimeResidue.absent=true`; `redaction.confirmed=true` |

Die exakten Domänen aller nicht booleschen und nicht rein numerischen Checks
lauten:

```text
loopbackTreatment = allowed | blocked | upgraded | unknown
browserConsole.securityClassification =
  no-block | mixed-content-block | other-security-block | unknown
request.initialUrl = fixed-endpoint | other | unknown
request.finalUrl = fixed-endpoint | other | unknown
routeMechanism =
  direct-127.0.0.1 | localhost | ipv6 | dns | proxy | https |
  remote | redirect | unknown
preflight.sequence = OPTIONS-POST | other | not-observed | unknown
preflight.origin = exact-frontend-origin | other | absent | unknown
preflight.requestMethod = POST | other | absent | unknown
preflight.requestHeaders =
  includes-content-type-no-unapproved | other | absent | unknown
preflight.allowOrigin = exact-frontend-origin | other | absent | unknown
preflight.allowMethods = post-only | other | absent | unknown
preflight.allowHeaders = content-type-only | other | absent | unknown
preflight.vary = origin-only | other | absent | unknown
preflight.allowCredentials = absent | present | unknown
pathAdjustmentRequired = none | header | permission | policy | product | unknown
transport.path = real-default-factory | other | unknown
request.profile = synthetic-v1-syncTest-empty-payload | other | unknown
composition.profile = transport-only | sync-service | ui-main | unknown
response.finalUrl = fixed-endpoint | other | unknown
response.type = cors | other | unknown
response.correlation = valid | invalid | unknown
js.contentType = application-json-utf8 | other | null | unknown
js.contentLength.classification =
  canonical-decimal-within-16384 | over-limit | noncanonical | missing | unknown
js.contentLength.value = non-negative-integer | null
js.cacheControl = no-store | other | null | unknown
js.contentEncoding = null | present | unknown
server.xContentTypeOptions = present | absent | unknown
server.vary = present | absent | unknown
server.allowOrigin = present | absent | unknown
js.xContentTypeOptionsVisibility = visible | filtered | unknown
js.varyVisibility = visible | filtered | unknown
js.allowOriginVisibility = visible | filtered | unknown
fixture.redirectLocation = fixed-local-sentinel | other | absent | unknown
```

Nichtnegative Counts sind Ganzzahlen. `observationState` und `result` verwenden
dieselben geschlossenen Werte wie bei Deltabeobachtungen. Ein unbekannter
Check, ein unzulässiger Wert oder ein zusätzliches Feld macht den Record für
das betroffene Gate nicht beweiskräftig.

Check-, Gate- und Vektorstatus sind keine frei gesetzten Behauptungen, sondern
werden zwingend abgeleitet:

- Ein Check besitzt `result: match` genau dann, wenn
  `observationState: observed` gilt und der beobachtete Wert seine feste
  Erwartung erfüllt. Ein erlaubter `unknown`- beziehungsweise `null`-
  Unbestimmtheitssentinel sowie `not-observed` oder `ambiguous` ergeben
  ausschließlich `unproven`. Für die reinen Kontextinvalidierungschecks
  `binding.complete`, `binding.consistent` und
  `nonDeltaBindings.unchanged` ergibt auch ein beobachtetes `false` zunächst
  `unproven`; nur eine zusätzlich beobachtete Grenzverletzung kann daraus
  `FAIL` machen. Jeder andere eindeutig beobachtete Gegenwert ergibt
  `mismatch`.
- Ein Gate besitzt `PASS` genau dann, wenn sämtliche Pflichtchecks
  `observed`/`match` sind, die exakten unabhängigen `layers` belegt sind und
  alle für das Gate festgelegten Cross-Field-Invarianten bestehen. Mindestens
  ein `mismatch`, ein beobachteter Ebenenwiderspruch, eine ausdrücklich als
  `FAIL` definierte Cross-Field-Konstellation oder ein bekannter Restore-/
  Cleanupfehler ergibt `FAIL`. Gibt es keinen solchen `FAIL`-Grund, aber
  mindestens ein `unproven`, eine fehlende beziehungsweise untrennbare Ebene,
  eine `UNPROVEN`-Cross-Field-Konstellation oder strukturell unvollständige
  Evidenz, ergibt das Gate `UNPROVEN`.
- Ein Vektor besitzt `PASS` genau dann, wenn seine Root-
  `baseContextId` gilt, `allowedDeltaFields` und `expectedDelta` seinem festen
  Profil entsprechen, `changedDeltaFields` exakt die erwartete tatsächliche
  Änderung enthält, jeder erwartete und beobachtete Deltaeintrag
  `observed`/`match` ist, `observation` exakt `expectation` entspricht, alle
  zugeordneten Gates `PASS` sind und `noOtherBindingFieldsChanged`,
  `restoreConfirmed` sowie `cleanupConfirmed` jeweils `true` sind. Eine
  beobachtete Abwehrverletzung, ein unerwarteter Request oder Erfolg sowie ein
  bekannter Restore-/Cleanupfehler ergibt `FAIL`. Ein falscher oder
  unbeabsichtigter Delta- beziehungsweise sonstiger Bindungswert ohne
  beobachtete Grenzverletzung ergibt `UNPROVEN`; dasselbe gilt für jede übrige
  fehlende oder mehrdeutige Bedingung.

### Aggregation

Die Aggregation ist fail-closed:

1. Eine belegte Lauf- oder Grenzverletzung ergibt für das betroffene Gate
   `FAIL`. Fehlende, mehrdeutige oder strukturell unvollständige Evidenz ergibt
   `UNPROVEN`.
2. Eine zusätzliche oder unbeabsichtigte Kontextabweichung ergibt
   `UNPROVEN`; verletzt sie beobachtbar die entschiedene Grenze, ergibt sie
   `FAIL`.
3. Mindestens ein Pflicht-`FAIL` ergibt `overallGate: FAIL`.
4. `overallGate: PASS` ist ausschließlich zulässig, wenn die positiven Gates
   1 bis 7 exakt unter `T₀` bestehen, die Gates 8 und 9 ausschließlich unter
   ihren allowlisteten `Tᵥ` bestehen, alle zehn Gates und alle drei Vektoren
   `PASS` besitzen, alle Vektoren dieselbe `baseContextId` referenzieren,
   `noOtherBindingFieldsChanged`, `restoreConfirmed` und `cleanupConfirmed`
   jeweils `true` sind und der Top-Level-Wert `cleanupConfirmed` ebenfalls
   `true` ist.
5. Jede andere Konstellation ergibt `overallGate: UNPROVEN`.
6. Ein bekannter Cleanupfehler ergibt Gate 10 und Gesamtgate `FAIL`; ein
   fehlender oder mehrdeutiger Cleanupnachweis ergibt jeweils `UNPROVEN`.
7. Ein nachweislich fehlgeschlagener Restore oder vektorlokaler Cleanup ergibt
   für den betroffenen Negativvektor `FAIL`; ist nur die Bestätigung fehlend
   oder mehrdeutig, bleibt er `UNPROVEN`.
8. Top-Level-`cleanupConfirmed` ist nur dann `true`, wenn alle
   vektorlokalen Cleanupwerte und sämtliche Checks aus `cleanupRedaction`
   `true` sind. `permissionBefore` muss mit `initialState.permission`, jeder
   Delta-Basiswert mit `T₀` und jede `baseContextId` mit der Rootreferenz
   übereinstimmen. Ein belegter Widerspruch ist `FAIL`, fehlende Beweisbarkeit
   `UNPROVEN`.

Es gibt kein `N/A`. Ein nicht ausgeführtes Browserziel bleibt `UNPROVEN`; ein
Record-`PASS` gilt nicht für ein anderes Produkt, eine andere Vollversion,
einen anderen Channel, Enginebuild, Betriebssystem- oder Origin-Kontext.

### Redaction und verbleibende Grenzen

Verboten sind Benutzer- und Rechnername, persönliche Profilpfade,
vollständiger User-Agent, Cookies, Tokens, Credentials, HAR- oder
Netzwerkdumps, frei kopierte Rohheader, Konsolen- oder Fehlerfreitext,
Gatewaylogs, Request-ID, Requesttimestamp, Request- oder Responsebody, private
Netzwerkdetails sowie PromptVault-, LearningHub-, LichtwaldLog- oder
Vaultinhalte. Zulässig sind nur die fest definierten Headerklassifikationen,
booleschen Werte, Counts, sanitisierten Produktwerte und Enums dieses Vertrags.

`remainingLimits` enthält immer exakt und in dieser Reihenfolge:

```text
other-browser-product
other-browser-version
other-browser-channel
other-engine
other-operating-system
other-origin-or-context
public-https-origin
local-process-identity-or-trust
authentication
authorization
metadata-freedom
wire-octets
compression-absence
privacy-or-private-data-suitability
exactly-once-delivery
freshness
replay-protection
idempotency
global-abuse-or-resource-limits
browser-composition
browser-e2e
```

Diese Liste ist keine offene Notizliste. Sie begrenzt die Aussage selbst eines
späteren `PASS` und darf weder gekürzt noch durch freie Texte erweitert werden.

### Aktueller Instanzstand

Der Schema-1-Record `chrome-stable-win-01` enthält exakt die drei
Pflichtvektoren und zehn Gates. Nur `positive-default` wurde gestartet. Unter
dem vollständig gebundenen `T₀` wurden ein gewöhnlicher `OPTIONS 204`, danach
ein vollständig beantworteter `POST 200` und die erwarteten
JavaScript-sichtbaren Responsewerte beobachtet; das öffentliche
BrowserSyncTransport-Promise wies dennoch statisch redigiert zurück. Dieser
belegte Ebenenwiderspruch setzt `normalSyntheticTransport` auf `FAIL` und damit
`overallGate` auf `FAIL`. Weil Schema 1 weder einen freien Promisecheck noch
einen zusätzlichen positiven Fehler-Observationwert zulässt, bleibt die nicht
beobachtete Korrelation `unknown`/`unproven` und der Vektor
`positive-default` selbst `UNPROVEN`; es wird weder eine ungültige Korrelation
noch eine Fehlerursache erfunden.

`pnaLnaPermission` bleibt wegen des nicht klassifizierbaren Zieladressraums
`UNPROVEN`. `negative-origin` und `redirect-error` wurden nach der Stopregel
nicht ausgeführt; ihre Beobachtungen und Restores bleiben `UNPROVEN`, während
das nachweisliche Fehlen vektorlokaler Rückstände und der vollständige
Gesamtcleanup bestätigt sind. Die übrigen Gatewerte lauten in kanonischer
Reihenfolge `PASS`, `PASS`, `PASS`, `PASS`, `UNPROVEN`, `FAIL`, `PASS`,
`UNPROVEN`, `UNPROVEN`, `PASS`. Der Record öffnet weder Browserkomposition
noch Browser-E2E und gilt nicht für einen anderen Browser-, Versions-, OS-,
Origin- oder Kontextwert.

## Aktuelle Browser SyncTransport Validator Integrity Boundary / ADR 0028

[ADR 0028](decisions/0028-browser-sync-transport-validator-integrity-boundary.md)
ersetzt ADR 0027 formal und übernimmt dessen beide Korrekturen vollständig.
Alle nicht ausdrücklich geänderten ADR-0026-/ADR-0027-Regeln gelten fort. ADR
0026 bleibt unverändert mit seinem bestehenden Status „Ersetzt durch ADR
0027“; der historische ADR-0027-Body ab `## Kontext` bleibt unverändert.

ADR 0028 dokumentierte einen bestätigten, damals noch nicht behobenen Produktfehler:
Die beiden erforderlichen `validateSyncRequest`-Aufrufe verwenden live
manipulierbare Laufzeitfunktionen. Die bestehende terminale Transportprüfung
bestätigt anschließend Shape, normalen Prototyp, Freeze und
Snapshotidentitäten, aber keine unabhängigen festen v1-Werte. Wenn beide
Contractvalidatorausführungen kompromittiert positiv melden, kann sie deshalb
auch einen unverändert gebliebenen vertragswidrigen Snapshotwert bestätigen.
Kontrollierte, netzwerkfreie Proben ließen so vertragswidrige Versionen,
Aktionen, Quellen und Request-IDs bis zu Serialisierung, Controller, Timer und
Fetch-Seam gelangen. Die damalige grüne Suite mit 1604/1604 Tests bewies die
Schließung dieser Lücke nicht.

Die feste v1-Wire-Policy ist nun implementiert und schließt die
Transportlücke. Der Contractvalidator selbst wurde nicht gehärtet. Weder
`src/contracts/syncContract.js` noch seine Exports, BrowserSyncTransport-API,
Seams, Dependencies, Endpoint, Caps, n8n-Bundle, Manifest oder Generator
wurden geändert. Es existiert weiterhin kein realer Browser- oder externer
Netzwerkpfad;
private Daten und produktive Systeme waren von den Proben nicht betroffen.

### Verbindliche Requestfreigabe und feste v1-Wire-Policy

Die implementierte Requestfreigabe besitzt exakt diese Reihenfolge:

```text
descriptorbasierter Snapshot → frischer interner Graph → validateSyncRequest #1 → Deep Freeze → validateSyncRequest #2 → bestehende terminale Shape-/Freeze-Prüfung → neue feste v1-Wire-Policy → Stringify → UTF-8-Encoding → Controller → Timer → Fetch
```

Der gleiche frische interne Graph bleibt exakt zweimal Input von
`validateSyncRequest`; ein dritter Aufruf bleibt verboten. Beide
Contractvalidierungen und ihre Resultprofile bleiben notwendig, sind für die
Wirefreigabe aber nicht mehr allein hinreichend. Ausschließlich das bisherige
absolute Verbot jedes zusätzlichen transportlokalen Validierungspfads wird
durch genau eine private, nicht exportierte feste v1-Wire-Policy unmittelbar
vor `JSON.stringify` ersetzt. Jeder weitere generische, importierte oder
alternative Validatorpfad bleibt verboten.

Die Policy liest ausschließlich den internen tief eingefrorenen Graphen und
den bereits verwendeten primitiven Referenzzeitstring über bei
Modulevaluation erfasste Intrinsics. Callerroot und Callerpayload werden nicht
erneut gelesen. Die Policy verwendet keine live aufgelösten oder importierten
Regex-, Array-, Set-, Map-, Iterator-, String-, Date-, Number-, Math-, Object-,
Reflect- oder Validator-Allowlist-Oberflächen und keine persistierbaren
transportprivaten Regex-/Collection-Allowlists.

Genau einmal bestätigt die feste Policy ausschließlich:

- `version === "1.0"`, `action === "syncTest"` und
  `source === "goldendawn-os"`;
- eine primitive `requestId` mit 5 bis einschließlich 64
  UTF-16-Codeeinheiten, exaktem Präfix `req_`, ausschließlich einem
  ASCII-alphanumerischen ersten Zeichen danach und anschließend nur
  ASCII-alphanumerischen Zeichen, `_` oder `-`;
- einen primitiven `timestamp` mit exakt 24 UTF-16-Codeeinheiten, den festen
  ASCII-Trennzeichen des Formats `YYYY-MM-DDTHH:mm:ss.sssZ` und ausschließlich
  ASCII-Dezimalziffern an allen übrigen Positionen;
- tatsächliche Kalender- und Zeitgültigkeit sowie identische kanonische
  UTC-Rückprojektion über erfasste native Date-, Number-, Apply- und
  Construct-Intrinsics;
- höchstens 300.000 ms Abstand zur bereits verwendeten primitiven
  Referenzzeit;
- exakt sechs normale, aufzählbare und eingefrorene Own-Data-Properties,
  normale erfasste Prototypketten und kein unzulässiges eigenes `toJSON`;
- ein exakt leeres, normales und eingefrorenes Payload mit der frischen
  internen Payloadidentität.

Der Zeitvergleich ist nur interne Konsistenz. Da Requesttimestamp und
derzeitige Referenz identisch sind, beweist er weder unabhängige Frische noch
Uhrvertrauenswürdigkeit, Replayabwehr, Idempotenz oder Deduplizierung. Jede
Abweichung scheitert mit dem bestehenden statischen Transportfehler vor
transportgesteuertem Stringify, Encoding, Controller, Timer und Fetch. Eine
spätere neue Version, Aktion oder Quelle öffnet diesen Transport nicht
automatisch, sondern benötigt eine eigene Entscheidung und einen eigenen
Implementierungs- und Mutationsnachweis.

Der kausale Mutationsnachweis zeigt, dass die aktive Policy denselben
erfolgreichen Validatorbypass vor Stringify und Fetch stoppt, der bei gezielt
neutralisiertem Policy-Callsite exakt einen Fetch erreicht. Die Verifikation
besteht mit 423/423, 466/466, 735/735 und 1755/1755 Tests bei `Δ = 151` und
jeweils 0 Fehlschlägen, Abbrüchen, Skips und Todos. Build und Bundlecheck
bestätigen weiterhin exakt 46 Browsermodule und keinen n8n-Bundle-Drift.

Die Policy verhindert keine beliebigen eigenen Nebenwirkungen eines zuvor
ausgeführten kompromittierten Same-Realm-Validator-Hooks. Bereits ausgeführte
Wirkung kann nicht zurückgenommen werden; Same-Realm ist keine Sandbox.

### Unveränderte Content-Length-Entscheidung

ADR 0028 ändert keine Responseheader- oder Content-Length-Regel:

- Eine fehlende beziehungsweise `null` gelesene `Content-Length` scheitert
  während der Headerprüfung vor `content-encoding`, Bodyproperty, Reader und
  Chunkzugriff.
- `16.384` bleibt die inklusive öffentlich erreichbare Grenze; deklarierte
  `16.385` scheitert während der Headerprüfung.
- Ein 16.385-Byte-Chunk bei deklarierter Länge 16.384 überschreitet notwendig
  zugleich die deklarierte Restlänge und den absoluten Cap. Der spätere Test
  muss vor Kopie, weiterer Allokation und weiterem Read abbrechen.
- Dieser Fall ist kein isolierter öffentlicher Nachweis allein des absoluten
  Caps. Daraus folgen keine Aussagen über Wire-Oktette, Kompression,
  Browserdekompression oder bereits erfolgte Browser-, Engine-, OS- oder
  Netzwerkallokationen.

### Promise-/Host-Restgrenze

Für Fetch-, Read- und zulässige Cleanup-Promise-Kandidaten gelten weiterhin:

- keine freie `.then`-Auflösung und kein `Promise.resolve`;
- keine Anwendung der erfassten nativen `Promise.prototype.then`-Methode vor
  vollständig bestandenem Promiseprofil;
- keine Übernahme, Protokollierung oder Emission des fremden Rejectiongrunds
  durch den Transport;
- ausschließlich der statisch redigierte öffentliche Methodenfehler.

Ein bereits abgelehntes, ungültig profiliertes Fetch-, Read- oder Cleanup-
Promise kann später dennoch ein hostweites `unhandledrejection`-
beziehungsweise `unhandledRejection`-Ereignis mit seinem ursprünglichen Grund
auslösen. Eintritt, Zeitpunkt, Häufigkeit und Prozessfortsetzung sind
hostübergreifend nicht garantiert; insbesondere wird kein Ereignis bereits
beim Return zwingend behauptet. Bei einem malformed Cleanup-Promise kann der
öffentliche Methodenaufruf erfolgreich enden, während der Hostkanal getrennt
auftritt. Produktive Host- und Seamwerte müssen die festgelegten nativen
Promiseprofile erfüllen. Diese Restgrenze wird später isoliert host- und
versionsgebunden charakterisiert.

### Aktivierungsreihenfolge

ADR 0028 ist implementiert und die vollständige mutationswirksame Matrix
besitzt ihr netzwerkfreies `PASS`. ADR 0029 definiert das an `T₀` und die
allowlisteten Negativdeltas gebundene Runtimegate. Sein einmaliger Chrome-151-
Lauf bleibt mit Gesamt-`FAIL`, PNA/LNA und den nicht ausgeführten
Negativvektoren `UNPROVEN` sowie Cleanup `PASS` dokumentiert; die Ursache ist
`CAUSE_NOT_PROVEN`. ADR 0032 ersetzt ADR 0031 formal, übernimmt dessen
fortgeltende Regeln und totalisiert Capture-, Timing-, Projektions- und
Setupgrenze. Als nächster Slice folgt nur die reine netzwerkfreie
effects-as-data-Implementierung und Prüfung der Diagnosefoundation. Danach
folgen ein eigener Adapter-ADR und dessen getrennte netzwerkfreie
Implementierung. Zielbrowser, `T_replay`, Observer, der einzelne Request,
Benutzerinteraktion und Cleanup benötigen erst anschließend eine neue
ausdrückliche Autorisierung. Browserkomposition und lokaler Browser-End-to-End-`syncTest`
bleiben bis zu einem späteren vollständig neuen ADR-0029-Gesamt-`PASS`
geschlossen. Eine angenommene Entscheidung, eine implementierte Policy oder
die isolierte Transportexistenz öffnet keines dieser Gates automatisch.

Die folgenden ADR-0027- und ADR-0026-Abschnitte bewahren den damaligen
Entscheidungs- und Vorimplementierungsstand historisch unverändert.

## Historischer Browser SyncTransport Contract / ADR 0027

[ADR 0027](decisions/0027-browser-sync-transport-proof-boundaries.md) ersetzt
ADR 0026. Der erste Implementierungsversuch wurde vor jeder Dateiänderung hart
gestoppt; Working Tree, Index sowie
`src/transports/browserSyncTransport.js` und
`tests/browserSyncTransport.test.js` blieben dabei unverändert. Es erfolgte
kein Browser-, Netzwerk- oder Gatewayzugriff. Der Stop
belegt keine Produktlücke, sondern zwei widersprüchliche beziehungsweise mit
öffentlichen JavaScript-Mitteln nicht erfüllbare Nachweisanforderungen:

1. Die historische Erzeugungsrealm fremd gelieferter echter nativer Promises,
   `Uint8Array`-Views und `ArrayBuffer` lässt sich nach einer bereits vor der
   Übergabe vollständig passend vorgenommenen Umprototypisierung nicht
   beweisen.
2. Die private Requestgrenze von 65.536 UTF-8-Bytes ist unter dem geschlossenen
   SyncContract v1 über `sendSyncRequest` nicht bis zu ihren realen
   Grenzwerten erreichbar.

Die Architektur benötigt für diese Korrektur keine zusätzliche API,
Dependency oder Produktionsseam. Die Implementierung bleibt bis zum Merge von
ADR 0027 pausiert. Der unmittelbar folgende ADR-0026-Block bleibt als
historischer Entscheidungsstand bytegleich erhalten; für den aktuellen Vertrag
ist ausschließlich ADR 0027 zusammen mit den von ihm unverändert übernommenen
ADR-0026-Regeln normativ.

### Unverändert übernommener Transportvertrag

Sämtliche nicht ausdrücklich ersetzten Entscheidungen aus ADR 0026 gelten
unverändert fort. Dazu gehören insbesondere:

- Modulort, einziger Export, Factory-, API- und Arityvertrag;
- exakt die vier Composition-Seams `fetchRequest`, `createAbortController`,
  `setDeadlineTimer` und `clearDeadlineTimer`;
- die feste URL `http://127.0.0.1:8787/api/sync-test`;
- der einmalige descriptor-basierte Requestsnapshot, der daraus neu erzeugte
  disjunkte Requestgraph und dessen zweimalige Validierung vor und nach Freeze;
- genau eine Serialisierung und UTF-8-Messung, die private Requestgrenze von
  65.536 Bytes sowie die exakte RequestInit- und Headerpolicy;
- höchstens ein Fetch, kein Retry, kein Redirect-Follow, kein Fallback und kein
  zweiter Versuch;
- die native Promise-Brand-, Constructor- und Species-Prüfung, die
  5.000-ms-Eventloopdeadline und der First-Terminal-Owner;
- Abort-, Timer-, Reader-Cancel- und Releasegrenzen;
- die fail-fast Response- und Headerreihenfolge sowie die öffentlich
  erreichbare Responsegrenze von 16.384/16.385 browserexponierten Bytes;
- Nullchunk-, Buffer-, EOF- und Kopierregeln;
- strikte UTF-8-Decodierung mit sichtbarer U+FEFF-BOM-Semantik und genau ein
  natives `JSON.parse` ohne Reviver;
- statische Redaction, die unveränderte SyncService-Verantwortung und die
  unmittelbare Übergabe ausschließlich des einmal geparsten unvertrauenswürdigen
  Werts;
- fehlende Browserkomposition, das getrennte PNA-/LNA-/Mixed-Content-
  Runtimegate und das Verbot vorgezogener Provider-, Modell-, Credential- oder
  privater Datenpfade.

Diese Regeln werden durch ADR 0027 weder neu interpretiert noch gelockert.

### Beobachtbares natives Promiseprofil statt Realmprovenienz

Für fremd gelieferte Fetch-, Read- und zulässige Cleanup-Promise-Kandidaten
wird weder eine Erzeugungsrealm noch eine historische Constructor- oder
Subclassprovenienz behauptet. Zulässig ist ausschließlich ein Kandidat, der
zum Prüfzeitpunkt alle folgenden beobachtbaren Anforderungen erfüllt:

- echtes natives Promise-Brandprofil;
- exakt der bei Modulevaluation erfasste lokale `Promise.prototype` und die
  vollständig erfasste lokale Prototypkette bis `null`;
- vollständig leere Own-Key-Menge und keine eigene `constructor`-Property;
- unveränderte erfasste Deskriptoren von
  `Promise.prototype.constructor` und `Promise[Symbol.species]` einschließlich
  der erfassten Constructor- und Species-Getteridentitäten;
- Verarbeitung ausschließlich durch Anwendung der erfassten nativen
  `Promise.prototype.then`-Referenz mit dem Kandidaten als Receiver.

Ein gewöhnliches unverändertes Cross-Realm-Promise scheitert weiterhin an der
direkten Prototypidentität. Wurde ein echtes Cross-Realm-Promise oder eine
echte native Promise-Subclass bereits fixture- beziehungsweise callerseitig
vollständig auf das lokale beobachtbare Promiseprofil umprototypisiert und
verbleibt kein beobachtbares Subclassmerkmal, ist seine historische Herkunft
mit den erlaubten öffentlichen Prüfungen nicht mehr unterscheidbar. Ein solcher
Kandidat darf nicht unter der falschen Behauptung einer bewiesenen
Erzeugungsrealm abgelehnt werden. Daraus folgt keine pauschale Zulassung
beliebiger Cross-Realm-Promises.

Fremde Thenables, Proxies und Fakes ohne natives Promise-Brandprofil,
zusätzliche Own Keys oder Symbole, eigene `constructor`-Accessors,
unverändert sichtbare Subclassprototypen, mutierte Constructor- oder Species-
Deskriptoren, fremde Getter- oder Konstruktoridentitäten, freie `.then`-Reads
und `Promise.resolve`-Assimilation bleiben ausgeschlossen. Der Transport
verändert niemals den Prototyp eines fremden Kandidaten. Nur das vom Transport
über den erfassten lokalen Konstruktor selbst erzeugte äußere Promise ist
transport-eigen und lokal erzeugt. Realm ist kein Authentisierungs-,
Autorisierungs-, Identitäts-, Datenschutz- oder Vertrauensbeweis.

### Beobachtbares View-/Bufferprofil statt Realmprovenienz

Für fremde Readerchunks wird weder eine Erzeugungsrealm noch eine historische
`Uint8Array`-/`ArrayBuffer`-Subclassprovenienz behauptet. Zulässig ist
ausschließlich ein Kandidat mit:

- echtem nativen `Uint8Array`-Brandprofil und echtem nativen
  `ArrayBuffer`-Brandprofil;
- zum Prüfzeitpunkt exakt den erfassten lokalen View-/Bufferprototypidentitäten
  und ihren vollständigen lokalen Ketten;
- einem festen, nicht geteilten, nicht detached Backing-Buffer;
- `resizable === false`, sofern diese Eigenschaft unterstützt und prüfbar ist;
- einer sicheren positiven ByteLength und sämtlichen bisherigen Restlängen-,
  Deklarations- und Responsecap-Prüfungen.

Unveränderte Cross-Realm-Views oder -Buffer scheitern weiterhin an der
Prototypidentität. Wird nur die View oder nur ihr Buffer passend
umprototypisiert, bleibt der Kandidat unzulässig. Wurden eine echte fremde View
und ihr echter fester fremder Backing-Buffer bereits vor Übergabe vollständig
passend umprototypisiert, ist ihre historische Erzeugungsrealm mit öffentlichen
Prüfungen nicht mehr unterscheidbar. Der Transport nimmt selbst keine solche
Umprototypisierung vor.

Proxy und Fake, `SharedArrayBuffer`, Growable SharedArrayBuffer, resizable oder
detached `ArrayBuffer`, malformed Buffer, nur teilweise passende
Prototypoberflächen, Nullchunk, falsche Länge und jede Überschreitung der
deklarierten Länge oder des Responsecaps bleiben fail-closed ausgeschlossen.
Akzeptierte Bytes werden weiterhin unmittelbar und ohne verbleibende
Fremdidentität in den wirklich transport-eigenen lokalen Zielbuffer kopiert.
Eine anschließende Mutation oder Wiederverwendung des Fremdchunks darf diese
Kopie nicht verändern. Realm ist auch hier kein Authentisierungs-,
Autorisierungs-, Identitäts- oder Vertrauensbeweis.

### Erreichbare Requestgröße und private Defense-in-Depth-Grenze

Der produktive private Requestcap bleibt unverändert bei höchstens 65.536
UTF-8-Bytes. Byte 65.537 wird vor Controller, Timer und Fetch abgelehnt. Der
Wert bleibt privat, nicht injizierbar und besitzt weder Testexport noch
Cap-Parameter oder zusätzliche Composition-Seam.

Unter dem aktuellen geschlossenen SyncContract v1 ist diese reale Capgrenze
über `sendSyncRequest` jedoch nicht erreichbar. Version, Aktion und Quelle sind
feste ASCII-Werte, `payload` ist exakt leer, der kanonische Timestamp umfasst
exakt 24 ASCII-Zeichen und `requestId` ist einschließlich `req_` auf insgesamt
höchstens 64 erlaubte ASCII-Zeichen begrenzt. Die festen Bestandteile umfassen
129 Bytes; der größte gültige, kanonisch projizierte und in der festen
Feldreihenfolge serialisierte v1-Request umfasst daher exakt 193 UTF-8-Bytes.
Eine insgesamt
65 Zeichen lange `requestId` ist vertragswidrig und scheitert bereits bei der
Validierung vor Stringify, Encoding, Controller, Timer und Fetch.

Die 193 Bytes ersetzen den produktiven Cap von 65.536 Bytes nicht. Der private
Cap bleibt Defense-in-Depth und benötigt bei jeder künftigen
Contracterweiterung eine neue Erreichbarkeits- und Grenzprüfung. Es wird kein
öffentlich verhaltensseitig erreichbarer 65.536/65.537-Requestgrenztest
behauptet. Davon getrennt bleiben die echte Gateway-Raw-Wire-Grenze von
65.536/65.537 Bytes und die öffentlich erreichbare Browser-Responsegrenze von
16.384/16.385 Bytes unverändert.

### Späterer mutationswirksamer Testvertrag

Die spätere netzwerkfreie Unit-Suite muss den öffentlichen Kontrollpfad mit
einer `requestId` aus insgesamt exakt 64 erlaubten ASCII-Zeichen, den festen
übrigen Contractwerten, einem kanonischen Timestamp und exakt leerem Payload
prüfen. Der frisch projizierte JSON-Body muss exakt 193 UTF-8-Bytes umfassen und
bei vollständig bestandenen Doubles bis zu genau einem Fetch gelangen. Eine
insgesamt 65 Zeichen lange `requestId` muss vor Stringify, Encoding,
Controller, Timer und Fetch scheitern.

Die aktive Verdrahtung und inklusive Vergleichssemantik des privaten Caps wird
ausschließlich über temporäre Source-Mutationskopien des späteren
Transportmoduls belegt:

1. Eine temporäre Modulkopie mit privatem Cap `193` lässt denselben maximal
   gültigen 193-Byte-Request zu.
2. Eine getrennte temporäre Modulkopie mit privatem Cap `192` lehnt ihn
   statisch vor Controller, Timer und Fetch ab.
3. Wird die Capprüfung entfernt, umgangen oder falsch verglichen, muss
   mindestens eine Gegenprobe rot werden.
4. Alle temporären Kopien werden vollständig bereinigt; der eingecheckte
   Produktionscode bleibt unverändert.

Dieser Harness belegt ausschließlich die aktive Cap-Verdrahtung, die korrekte
`<=`-/`>`-Semantik und die Position vor Controller, Timer und Fetch. Er belegt
keinen öffentlich erreichbaren 65.536/65.537-Grenzfall. Contractmutation,
Serialisierung eines unvalidierten Callers, Validierung hinter der Capprüfung,
Testexport, injizierbarer Encoder, Cap-Parameter, zusätzliche Factory- oder
Composition-Seam und Produktionsänderungen nur zugunsten eines Tests bleiben
verboten.

Die Cross-Realm-Regressionen verwenden ausschließlich `node:vm`, native lokale
Intrinsics und Doubles. Positive Begrenzungsproben umfassen lokale native
Promises, vollständig passend umprototypisierte echte Cross-Realm-Promises und
Promise-Subclasswerte ohne verbleibendes beobachtbares Subclassmerkmal sowie
eine vollständig passend umprototypisierte echte Cross-Realm-View zusammen mit
ihrem echten festen Backing-Buffer. Negative Proben umfassen die unveränderten
Cross-Realm-Werte, nur teilweise umprototypisierte View-/Bufferpaare, fremde
Thenables, Proxy/Fake, sichtbare Subclass-, Constructor- oder Species-
Abweichungen sowie Shared, growable, resizable, detached, Null-, Längen- und
Capfehler. Fulfillment wird kontrolliert verarbeitet, Rejection statisch
redigiert und die unmittelbare Kopie durch anschließende Quellmutation geprüft.
Der Transport darf in keiner Probe `Object.setPrototypeOf` auf Eingabewerte
anwenden. Globale Mutationen laufen seriell, werden in `finally` vollständig
restauriert und benötigen weder Skip noch Todo.

Die Korrektur entfernt ausschließlich unbeweisbare Provenienz- und
Erreichbarkeitsbehauptungen. Sie entfernt keine wirksame Brand-, Shape-,
Promise-, Constructor-, Species-, Buffer-, Copy-, Deadline-, Größen- oder
Redactionprüfung. Same-Realm und Deep Freeze bleiben keine Sandbox; bereits vor
Modulevaluation kompromittierte Intrinsics, Enginekompromittierung, OOM und
Prozessabbruch bleiben außerhalb der Garantie. Es entsteht weiterhin kein
Browser-, Gateway-, Provider- oder privater Datenfluss und keine KI-, Modell-,
Workflow-, Credential-, Storage-, Logging- oder Telemetriewirkung.

Die enge Phase-0-/Tor-A-Arbeitshypothese bleibt eine technische Vorprüfung und
wird nicht zu einer Rechts-, Compliance- oder allgemeinen
Sicherheitsklassifikation erweitert. Eine neue ADR-Bewertung ist erforderlich,
wenn Realm als Identitäts- oder Vertrauenssignal dienen soll, ein anderer
Promise- oder Buffervertrag, eine erweiterte öffentliche API oder Composition
benötigt wird, der Contract die aktuell erreichbaren 193 Bytes erweitert, der
private Requestcap geändert oder entfernt werden soll oder Endpoint,
Fetchpolicy, Deadline, Responsecap, CORS beziehungsweise Fehlersemantik
geändert werden sollen.

Als damals nächster Slice durfte ausschließlich die isolierte und netzwerkfreie
BrowserSyncTransport-Implementierung gemäß ADR 0027 begonnen werden; sie ist
inzwischen umgesetzt und geprüft. Reales
Fetch, Browser- oder Gatewaystart, PNA-/LNA-/Mixed-Content-Runtimeevidenz,
Browserkomposition, Browser-End-to-End-`syncTest`, globale Missbrauchs-,
Parallelitäts-, Queue- und Prozessgrenzen sowie Provider bleiben getrennt und
gesperrt. Nur ein späterer kontext- und versionsgebundener Runtime-`PASS` darf
die Browserkomposition öffnen.

## Entschiedener Browser SyncTransport Contract / ADR 0026

ADR 0026 ergänzt ADR 0017, ADR 0020, ADR 0023 und ADR 0025, ersetzt keine
bestehende Entscheidung und verändert weder SyncContract, SyncService-Port,
Local SyncGateway noch SyncAgent. Der folgende Vertrag ist entschieden, aber
noch nicht implementiert oder in `src/main.js` komponiert.

### Geplantes Modul, Factory und API

Der einzige geplante Modulpfad lautet:

```text
src/transports/browserSyncTransport.js
```

Das Modul erfasst bei erfolgreicher Evaluation private Referenzen auf die
benötigten Reflection-, Apply-, Freeze-/Frozen-, JSON-, TextEncoder-/
TextDecoder-, Typed-Array- und ArrayBuffer-Funktionen, die relevanten
Prototypidentitäten sowie seine nativen Browserdefaults. Für Promise werden
der native Same-Realm-Konstruktor, `Promise.prototype`, `Promise.prototype.then`,
`Symbol.species`, die ursprünglichen Own-Deskriptoren von
`Promise.prototype.constructor` und `Promise[Symbol.species]`, die ursprüngliche
Species-Getteridentität und die vollständigen Promise-/Object-Ketten bis `null`
erfasst. Typed-Array-Buffer-/ByteLength-/Kopier- sowie ArrayBuffer-Brand-/
ByteLength-/optionale Resizable-Intrinsics werden ebenfalls erfasst. Post-import ersetzte
Globale dürfen die zugesicherten Pfade deshalb nicht umleiten. Das Modul
exportiert ausschließlich `createBrowserSyncTransport`. Jeder bestandene
Factoryaufruf liefert eine frische gewöhnliche und eingefrorene API mit exakt:

```js
{
  sendSyncRequest
}
```

`sendSyncRequest(syncRequest)` besitzt genau einen formalen Parameter,
akzeptiert exakt ein Argument und liefert auf jedem Methodenpfad sofort ein
echtes natives Promise mit exakt dem bei Modulevaluation erfassten Same-Realm-
Promise-Prototyp. Falsche Arity rejectet vor Argumentinspektion, Composition-
Dependency-Zugriff oder -Aufruf, Timer oder Netzwerk mit dem einheitlichen
redigierten Methodenfehler. Import und Factory starten weder Fetch, Timer,
Listener noch Request- oder Runtimeverarbeitung; die Factory prüft und erfasst
nur synchron ihre Composition-Funktionen, ohne sie aufzurufen.

`createBrowserSyncTransport(composition)` besitzt einen formalen Parameter.
Nur ein wirklich argumentloser Aufruf verwendet private Wrapper um die bei
Modulevaluation erfassten nativen Browserfunktionen. Explizites `undefined`,
zusätzliche Argumente sowie leere, partielle, accessor-, symbol-,
zusatzfeldhaltige oder nichtgewöhnliche Container werden synchron mit einem
statischen `TypeError` abgelehnt. Ein expliziter Aufrufwert muss ein
gewöhnlicher exakter Vier-Felder-Record mit ausschließlich aufzählbaren Own-
Data-Funktionen `fetchRequest`, `createAbortController`, `setDeadlineTimer` und
`clearDeadlineTimer` sein. Seine vollständige Own-Key-Menge wird exakt einmal
erfasst; danach werden die vier Deskriptoren in fester Reihenfolge jeweils
exakt einmal erfasst. Anschließend wird keine Composition-Property erneut
gelesen, und die Funktionen werden während der Factoryerzeugung nicht
aufgerufen. Fehlende oder
ungeeignete native Defaults scheitern ebenfalls bereits synchron an der
Factory. Jeder solche Factoryfehler verwendet ausschließlich
`TypeError("Ungültige BrowserSyncTransport-Komposition.")`. Ihre exakten
späteren Seam-Aufrufe lauten
`fetchRequest(fixedEndpoint, freshRequestInit)`,
`createAbortController()`, `setDeadlineTimer(onDeadline, 5000)` und
`clearDeadlineTimer(timerHandle)`, jeweils mit `undefined` als Receiver.
`freshRequestInit` ist pro zulässigem Aufruf ein frischer, nicht geteilter,
eingefrorener Null-Prototyp-Record mit festen Policywerten, vorbereitetem Body
und internem AbortSignal. Andere Seams sind unzulässig; insbesondere bleiben
JSON, Encoding, Reflection, Freeze, Promise und Typed Arrays nicht injizierbar.
Endpoint, Deadline, Requestlimit und Responselimit sind nicht injizierbare
private Modulwerte. Die Aussage „Seam höchstens einmal aufgerufen“ beweist nicht,
dass eine bösartige injizierte Funktion intern nur einen Netzwerk- oder
Timerprozess auslöst. Der bestehende Port bleibt ohne Result-
Envelope oder zweites Argument exakt:

```js
syncTransport.sendSyncRequest(syncRequest)
```

### Fester Endpoint und Runtimekoordination

Der einzige Zielwert ist:

```text
http://127.0.0.1:8787/api/sync-test
```

Scheme, IPv4-Literal, Port und Pfad sind fest. Nicht zulässig sind
`localhost`, IPv6, relative URLs, DNS, Discovery, Portscan, alternative Ziele,
Redirect-Follow, Fallbacks oder Werte aus UI, Request, Payload, Query, DOM,
Storage oder Environment.

ADR 0020 behält seine variable, defaultlose Server-Runtimekonfiguration. Für
den späteren Browserpfad setzt der Operator ausdrücklich:

```powershell
$env:GOLDENDAWN_SYNC_GATEWAY_PORT = '8787'
```

`GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN` bleibt getrennt und muss exakt der
tatsächlichen lokalen Frontend-Origin entsprechen. Sie ist nicht das Ziel.
Der Browsertransport setzt keine Origin; `Origin`, `Host` und `Content-Length`
bleiben browserverwaltet.

### Autoritativer Request-Snapshot und Requestprojektion

Nach bestandener Arity wird der unveränderte Callergraph genau einmal in einen
autoritativen descriptor-basierten Snapshot überführt:

1. `Reflect.ownKeys` für den Root exakt einmal aufrufen und exakt die sechs
   Stringkeys `version`, `action`, `source`, `requestId`, `timestamp`,
   `payload` belegen; Symbole und jedes weitere oder fehlende Feld scheitern.
2. Danach den Rootprototyp exakt einmal erfassen und als den gewöhnlichen
   erfassten Object-Prototyp bestätigen.
3. Die sechs Own-Property-Deskriptoren in genau der festen Reihenfolge
   `version`, `action`, `source`, `requestId`, `timestamp`, `payload` jeweils
   exakt einmal erfassen. Nur aufzählbare Data-Properties sind
   zulässig; kein Propertywert wird später vom Caller erneut gelesen.
4. Die Payloadidentität ausschließlich aus dem bereits erfassten `payload`-
   Rootdescriptor übernehmen, ohne die Rootproperty erneut zu lesen.
5. Die Payload-Own-Keys exakt einmal erfassen; die Keyliste muss leer sein.
6. Danach den Payloadprototyp exakt einmal erfassen und als den gewöhnlichen
   erfassten Object-Prototyp bestätigen.
7. Nach dieser Reihenfolge keinen Caller- oder Payload-Key, -Prototyp,
   -Descriptor oder -Propertywert erneut lesen. Der Snapshot ist ausschließlich
   die intern erfasste Menge aus Own-Key-Ergebnissen, Prototypidentitäten,
   Deskriptoren, fünf primitiven Strings und der belegten exakt leeren Payload;
   er ist kein zweites Requestobjekt.
8. Aus den erfassten fünf primitiven Feldwerten und einer frischen exakt leeren
   Payload einen disjunkten gewöhnlichen Sechs-Felder-Graphen erzeugen. Weder
   Callerroot noch Callerpayload werden übernommen, verändert, eingefroren oder
   direkt serialisiert.
9. Ausschließlich diesen einen frischen Graphen mit identischen Root- und
   Payloadidentitäten gegen denselben erfassten primitiven Timestamp genau
   einmal vor seinem Deep Freeze und genau einmal nach seinem Deep Freeze
   vollständig validieren. Callerroot, Callerpayload und ein separates
   Snapshotobjekt sind nie Validatorinput; es gibt genau zwei Aufrufe, keinen
   dritten Aufruf und keinen alternativen Validierungspfad. Die Differenz null belegt
   kanonische Form und Snapshot-Selbstkonsistenz, nicht unabhängige Frische,
   Browserzeitvertrauen oder Replay-Schutz. Die operative Frischeprüfung bleibt
   beim Gateway; eine Browserclock-Seam existiert nicht.
10. Root und
   Payload müssen terminal exakte aufzählbare Own-Data-Properties, tatsächlichen
   Frozen-Zustand und jeweils die Prototypkette
   `capturedObjectPrototype → null` besitzen. Root, Payload und der erfasste
   Object-Prototyp dürfen keine eigene `toJSON`-Property tragen; fremde
   verschachtelte Identitäten dürfen nicht verbleiben.
11. Das erfasste native `JSON.stringify` exakt einmal ohne Replacer aufrufen und
   ausschließlich einen primitiven String akzeptieren.
12. Das erfasste `TextEncoder.prototype.encode` exakt einmal mit dem korrekten
   erfassten Encoderreceiver aufrufen. Das Ergebnis muss einen echten brand-
   geprüften, nicht abgeleiteten `Uint8Array` mit exakt erfasstem Prototyp
   darstellen. Höchstens 65.536 Bytes sind zulässig; 65.537 scheitern vor
   Controller, Timer und Fetch.

Diese Snapshotgrenze schließt Validate-then-Reread- und ABA-Pfade für stabile
gewöhnliche Datenwerte. Es gibt keinen Merge, generischen Clone, Stringify-/
Parse-Roundtrip, Trim, Normalisierung, Reparatur oder Bereinigung vor der
maßgeblichen Prüfung. Post-import ersetztes globales `JSON.stringify`,
`TextEncoder`, Reflection, Apply, Freeze/Frozen, Promise oder Typed-Array-
Verhalten und nachträglich installierte relevante Prototype-`toJSON`-
Properties dürfen den zugesicherten Pfad nicht umleiten. Bereits vor
Modulevaluation kompromittierte Primordials, Modulcode oder Engine, OOM und
Prozessabbruch bleiben außerhalb der Garantie. Same-Realm und Deep Freeze sind
keine Sandbox.

### Fetch-Vertrag

Nach vollständig bestandener Requestgrenze wird höchstens einmal die erfasste
beziehungsweise ausdrücklich injizierte Fetchfunktion mit exakt diesen
Optionen aufgerufen:

```text
method: POST
mode: cors
credentials: omit
cache: no-store
redirect: error
referrerPolicy: no-referrer
keepalive: false
Content-Type: application/json; charset=utf-8
body: exakt der einmal serialisierte defensive Request
signal: ausschließlich das frische interne AbortSignal des pro Aufruf
        erzeugten AbortControllers
```

Nach erfolgreicher Serialisierung wird über die Controller-Seam genau ein
frischer AbortController erzeugt. Seine Signalidentität und Abortmethode werden
jeweils einmal aufgelöst und mit dem Controllerreceiver gespeichert; ein Throw
oder eine nicht funktionale Abortmethode scheitert vor RequestInit, Timer und
Fetch. Das Signal bleibt ansonsten eine opake Identität ohne separate Brand-,
Typ-, Eigentums- oder Freezegarantie; eine native Fetch-Brandablehnung wird
statisch redigiert. Erst danach wird der folgende Record gebaut.

Der übergebene `freshRequestInit` ist ein pro zulässigem Methodenaufruf
frischer, eingefrorener Null-Prototyp-Record mit exakt den zehn aufzählbaren
Own-Data-Eigenschaften `method`, `mode`, `credentials`, `cache`, `redirect`,
`referrerPolicy`, `keepalive`, `headers`, `body`, `signal`. `headers` ist ein
frischer eingefrorener Null-Prototyp-Record mit exakt einer aufzählbaren
Own-Data-Eigenschaft `Content-Type`. Das Signal bleibt die vom frischen
internen Controller gelieferte Identität; der Vertrag behauptet weder Eigentum
noch Frozen-Zustand dieses fremden Browserwerts.

`Content-Type` ist der einzige anwendungsseitig gesetzte Header. Es gibt keine
Authorization, Cookies, Credentials, Secret- oder Providerheader, frei
konfigurierbaren Header, Caller-`AbortSignal`, kein zweites Methodenargument,
Retry, Backoff, Redirect, Alternativziel oder einen zweiten Transportversuch.

Ein Fetch-Aufruf beweist nicht genau einen HTTP-Wirevorgang. CORS kann einen
Preflight auslösen; Netzwerk-Retransmissionen und bereits begonnene
Serververarbeitung bleiben möglich.

### Deadline-, Abort- und Cleanupvertrag

Die feste Per-Call-Deadline beträgt exakt `5.000 ms`. Nach bestandener lokaler
RequestInit-Vorbereitung werden die bereits erfassten Controller-, Signal- und
Abortwerte nicht erneut aufgelöst oder ersetzt. Die Frist beginnt unmittelbar vor dem Fetch-Aufruf und
umfasst ausschließlich asynchrones Fetch- und Response-Streaming-Warten. Nach
vollständigem Streamabschluss wird sie vor der synchronen UTF-8-Decodierung und
dem synchronen JSON-Parsing disarmed und bereinigt. Sie ist deshalb keine harte
Echtzeit-, CPU-, Decode- oder Parsegrenze; Eventloopverzögerung kann ihren
beobachteten Eintritt verschieben. Frühere Fehlerpfade erzeugen keinen Timer.

Ein expliziter First-Terminal-Owner kann nur von `active` zu `success`,
`transportFailure` oder `deadline` wechseln. Der erste Übergang besitzt das
Methoden-Promise. Ruft `setDeadlineTimer` den Callback synchron auf, gewinnt
`deadline`, Fetch wird nullmal aufgerufen und ein erst anschließend gelieferter
Timerhandle wird dennoch genau einmal mit `clearDeadlineTimer` bereinigt.
Wirft die Timerregistrierung, gewinnt `transportFailure` nur, wenn die Deadline
nicht bereits synchron gewonnen hat. Fetch-Throw oder ungeeignete
Rückgabewerte gewinnen ebenfalls nur aus dem noch aktiven Zustand und werden
redigiert. Unmittelbar vor dem tatsächlichen Fetch-Seam-Aufruf wird intern
`fetchStarted` gesetzt.

Fetch, Reader-Reads und zulässige Cleanupwerte müssen echte Same-Realm-Native-
Promises sein. Unmittelbar vor jeder Anwendung des erfassten
`Promise.prototype.then` und ohne fremden Zwischenhook werden am Kandidaten
exakt der erfasste Promiseprototyp, eine leere Own-Key-Menge ohne eigene
`constructor`, die unveränderte Promise-/Object-Kette, der ursprüngliche
`Promise.prototype.constructor`-Datendescriptor mit nativer
Konstruktoridentität sowie der ursprüngliche `Promise[Symbol.species]`-
Accessordescriptor mit Species-Getteridentität bestätigt. Erst danach wird
`then` mit dem Kandidaten als Receiver angewendet. Brand-, Constructor-,
Species-, Descriptor- oder Applyfehler scheitern; `Promise.resolve`, freie
`.then`-Reads und fremde Thenables bleiben ausgeschlossen.

Alle installierten Fulfillment- und Rejectionhandler sind kontrolliert, fangen
beherrschte Throws intern und geben auf jedem Pfad ausschließlich primitives
`undefined` zurück, niemals Response-, Reader-, Chunk-, Parsed-, Sentinel- oder
Exceptionwerte. Späte Handler prüfen zuerst den terminalen Owner, verarbeiten
nach verlorenem Rennen nichts weiter und geben ebenfalls `undefined` zurück.
Der unbenutzte Folgepromise assimiliert dadurch keinen Fremdwert.

Jeder nach `fetchStarted` gewinnende Zustand `transportFailure` oder `deadline`
abortiert den Controller höchstens einmal nicht blockierend best effort mit
richtigem Receiver. Das gilt für synchronen Fetchthrow, ungültiges
Promiseprofil, Fetch-Rejection, Non-200, Redirect, falsche finale URL, falschen
Response-Typ, Responsegetter-/Snapshot-, Header-, Body-, `getReader`- oder
Methodenauflösungsfehler sowie sämtliche späteren Reader-, Chunk-, Cap-, EOF-,
Release-, UTF-8-, JSON- und Handoff-Fehler. Vor Fetch und bei Erfolg bleibt Abort nullmal.
Nach Readerübernahme werden zusätzlich Cancel und Release je höchstens einmal
versucht; vorher wird keine Body-Cleanupmethode aufgelöst. Die Deadline-
Rejection wartet auf keinen Cleanup- oder Fremdpromise. Späte Settlements
werden konsumiert und können keine Verarbeitung oder zweiten Abschluss starten.

Jeder erhaltene Timerhandle wird terminal genau einmal bereinigt; frühere
Pfade greifen nullmal auf Timerfunktionen zu. Es gibt keine späte Erfüllung,
unbehandelte Rejection, Wiederholung oder zweiten Fetch. Abort beweist weder
Nichtübertragung noch fehlende Serververarbeitung. Es gibt keine Exactly-once-,
Rücknahme-, Replay-, Deduplizierungs- oder Idempotenzgarantie. Die Per-Call-
Grenze ersetzt keine globalen Rate-, Parallelitäts-, Queue-, Prozess-, CPU-
oder Heaplimits.

### HTTP-200- und Response-Streamingvertrag

Ausschließlich HTTP-Status exakt `200` darf einen Kandidaten öffnen. Jeder
andere Status – einschließlich `400`, `403`, `404`, `405`, `413`, `415`,
`417`, `431`, `500` sowie jedes andere `2xx`, `3xx`, `4xx` oder `5xx` – ist
ein Transportfehler. Die Prüfung endet sofort nach `status`; spätere
Responsefelder, Header und Bodymethoden werden nullmal gelesen, der Body wird
nicht geparst oder interpretiert und der Controller höchstens einmal abortiert.

Ein `200`-Kandidat verlangt:

- `redirected === false`;
- finale URL exakt `http://127.0.0.1:8787/api/sync-test`;
- `response.type === "cors"`; `basic`, `default`, `opaque`, `opaqueredirect`,
  `error` und jeder andere Wert werden abgelehnt;
- `Content-Type` exakt `application/json; charset=utf-8`;
- browserexponiertes `Content-Encoding` exakt `null`;
- einen vorhandenen browserexponierten kanonischen dezimalen
  `Content-Length`-Wert, syntaktisch `0` oder `[1-9][0-9]*`;
- deklarierte Länge höchstens 16.384;
- einen geeigneten Browserstream und kontrollierten Reader;
- höchstens 16.384 tatsächlich gelesene Bytes;
- exakte Gleichheit von deklarierter und tatsächlicher Länge.

Die Responsewerte werden fail-fast in der festen Reihenfolge `status`,
`redirected`, `url`, `type`, `headers`, `body` jeweils genau einmal gelesen und
unmittelbar geprüft. Ein Throw oder ungeeigneter Wert stoppt; alle späteren
Felder werden nullmal gelesen. Nach geeignetem `headers` wird die Headerfunktion
`get` genau einmal aufgelöst. Mit dem richtigen Receiver wird zuerst
`content-type` genau einmal gelesen und sofort geprüft, nur dann
`content-length`, und nur dann `content-encoding`. Erst nach allen drei
bestandenen Headerprüfungen wird `body` gelesen. Jeder frühe Fehler setzt die
späteren Headeraufrufe und den Bodyread auf null.

`Content-Encoding` ist kein automatisch CORS-safelisted Responseheader und der
aktuelle Gateway exponiert ihn nicht zusätzlich. Der Transport beobachtet nur
das CORS-gefilterte `Headers`-Objekt. `null` bedeutet ausschließlich „im
gefilterten Browserheadersobjekt nicht sichtbar“ und unterscheidet nicht
zwischen tatsächlicher Wire-Abwesenheit und vorhandenem, aber verborgenem
Header. Ein browserexponierter Nicht-null-Wert ist inkompatibel. Weder
Wire-Abwesenheit noch fehlende Browserdekompression werden behauptet; Gateway
und CORS-Header bleiben in diesem Slice unverändert. Ein beweiskräftiger
sichtbarer Nachweis benötigt einen neuen Entscheidungsslice mit zusätzlicher
Expose-Policy.

Am geeigneten Body wird `getReader` exakt einmal über die erfasste sichere
Anwendung mit dem Body als richtigem Receiver aufgerufen. Am resultierenden
Reader werden `read`, `cancel` und `releaseLock` jeweils exakt einmal aufgelöst
und ausschließlich mit dem Reader als richtigem Receiver angewendet. `abort`
wird ausschließlich mit dem gespeicherten Controllerreceiver angewendet. Reads
erfolgen streng seriell und jedes native Promise wird über die erfasste
Promise-Prototypfunktion beobachtet. Für jedes Ergebnis werden Prototyp und
Own-Key-Menge genau einmal erfasst; die vollständige Keysequenz muss exakt
`['value', 'done']` entsprechen. Anschließend folgen in fester Reihenfolge je
genau einmal die Deskriptoren `done` und `value`. Danach werden nur diese
Snapshotwerte verwendet. Das Ergebnis muss ein gewöhnlicher exakter Zwei-
Felder-Record mit aufzählbaren Own-Data-Properties sein. Beobachtbare Proxy-
Traps oder Snapshotinkonsistenzen scheitern; eine universelle Erkennung
transparenter Record-Proxies wird nicht behauptet. `done: false` verlangt einen
echten brand-geprüften, nicht abgeleiteten `Uint8Array` mit exakt dem erfassten
Prototyp und einer über erfasste Intrinsics bestimmten sicheren positiven
Ganzzahl-ByteLength. `byteLength === 0` scheitert unmittelbar nach diesem Read;
es gibt keine Kopie und keinen zweiten Read, danach folgen Abort und Cleanup.
Da jeder akzeptierte Nicht-EOF-Chunk mindestens ein Byte beiträgt, sind bei der
deklarierten Grenze höchstens 16.384 solche Reads möglich. Eine zusätzliche
konfigurierbare Readgrenze wird nicht eingeführt. `done: true` verlangt
`value: undefined`.

Die backing-buffer-Identität des Chunks wird ausschließlich über die erfasste
native Typed-Array-Buffer-Intrinsic mit richtigem Receiver ermittelt. Sie muss
einen echten festen Same-Realm-`ArrayBuffer` mit exakt dem erfassten
`ArrayBuffer.prototype` ergeben. `SharedArrayBuffer`, Growable SharedArrayBuffer,
Proxy, fremder Buffer, detached Buffer, malformed Buffer, falscher
Bufferprototyp und, sofern prüfbar, resizable Buffer werden abgelehnt. ByteLength und Kopie verwenden nur erfasste Typed-Array-/ArrayBuffer-
Intrinsics. Der Transport allokiert genau einen festen, nicht geteilten eigenen
Zielbuffer mit exakt der deklarierten Länge. Zwischen letzter Bufferprüfung und
sofortiger Kopie liegt kein fremder Hook. Vor jeder Kopie wird geprüft, ob der
gesamte Chunk in die verbleibende Kapazität passt; eine fremde Chunkidentität
wird nie retained. Byte 16.385 beendet den Pfad vor weiterer Allokation, Kopie
oder einem weiteren Read. Erfolg verlangt
EOF und exakte Gleichheit von deklarierter und tatsächlich kopierter Länge,
cancelt nullmal und ruft `releaseLock` genau einmal erfolgreich auf. Ein
Release-Throw verhindert Erfolg. Fehler und Deadline versuchen `cancel` und
`releaseLock` jeweils höchstens einmal nicht blockierend best effort; ihre
Throws oder zulässigen nativen Promise-Rejections werden konsumiert und dürfen
den statischen Terminalfehler nicht ersetzen. Der Transport
verwendet weder `response.text()` noch `response.json()` noch ein
unbeschränktes `arrayBuffer()`.

Erst nach vollständigem, begrenztem und längengleichem Empfang sowie
erfolgreicher Lockfreigabe wird der Deadlineowner disarmed und jeder erhaltene
Timer genau einmal bereinigt. Danach wird das erfasste
`TextDecoder.prototype.decode` genau einmal mit dem korrekten erfassten
Decoderreceiver, `fatal: true` und `ignoreBOM: true` aufgerufen. Eine BOM bleibt
dadurch als U+FEFF sichtbar; sie wird weder entfernt, getrimmt noch repariert.
Der unveränderte primitive String wird danach genau einmal mit dem bei
Modulevaluation erfassten nativen `JSON.parse` ohne Reviver geparst. Es gibt
keine zweite Decodierung, kein zweites Parsing, keine Normalisierung, Reparatur
oder Bereinigung.

Das 16.384-Byte-Limit zählt ausschließlich vom Browserstream exponierte,
möglicherweise bereits decodierte Bytes. Es begrenzt keine vorherige Browser-,
Betriebssystem- oder Netzwerkallokation, beweist keine ursprünglichen Wire-
Oktette und verhindert nicht, dass der Browser vorher transparent dekomprimiert
hat. Die Content-Length-Prüfung gilt ausschließlich dem browserexponierten,
gegebenenfalls bereits normalisierten Headerwert. Seine Gleichheit mit der
kopierten Bytezahl ist ein enger Kompatibilitäts- und Konsistenzcheck für den
kanonischen Gatewaypfad, kein allgemeiner Kompressions-, Wire- oder
Originalschreibweisenbeweis.

### Fulfillment, Rejection und SyncService-Zuordnung

Der Transport führt keinen Fulfillment-Result-Envelope ein. Ein bestandener
Pfad erfüllt ausschließlich mit dem einmal geparsten, weiterhin
unvertrauenswürdigen JSON-Wert. Primitive Parsed-Werte sind zulässig. Ein
Objekt muss exakt den erfassten Object-Prototyp, ein Array exakt den erfassten
Array-Prototyp und beide die vollständige erwartete Prototypkette bis `null`
besitzen. Die erfassten Object- und Array-Prototypen dürfen keine eigene
`then`-Property besitzen. Am Top-Level wird eine eigene `then`-Property nur in
der exakten Data-Property-Form mit nicht aufrufbarem Wert zugelassen; Accessor-
oder aufrufbare Data-Properties werden abgelehnt. Der geschlossene Wert erfüllt unmittelbar das
bereits erzeugte native Methoden-Promise über dessen kontrollierten Resolver
und wird nicht über `Promise.resolve`, freien `.then`-Zugriff oder
Thenableassimilation geführt. Der Settlementhandler gibt den Parsed-Wert selbst
niemals zurück, fängt jeden beherrschten Handoff-Throw als Transportfehler und
endet wie alle anderen Handler ausschließlich mit primitivem `undefined`.
Der Transport validiert, korreliert und projiziert keine normale SyncResponse
und erzeugt keine Gateway- oder SyncContract-Response.

Alle beherrschten Methodenfehler aus Arity, Requestprüfung, Projektion,
Freeze/Revalidierung, Serialisierung, Fetch, CORS, Netzwerk, Deadline, Abort,
Redirect, URL, HTTP-Status, Header, Content-Length, Stream, Größenlimit, UTF-8
oder JSON-Parsing rejecten ausschließlich mit demselben statischen,
gewöhnlichen und tief eingefrorenen exakten Datenrecord
`{ code: "BROWSER_SYNC_TRANSPORT_FAILED", message: "Der lokale Browser-SyncTransport ist fehlgeschlagen." }`.
Er enthält keine URL, keinen StatusText, keine Header, keinen Raw Body, keine
Request-ID, keine Dependency-, Browser-, Validator- oder Exceptiondetails und
wird nicht geloggt; native Errorobjekte oder Stacks werden nicht ausgegeben.
Der synchrone statische Factory-`TypeError` für ungültige Composition oder
fehlende Browserdefaults liegt bewusst außerhalb dieses Promisefehlers.

| Transportbeobachtung | Unverändertes SyncService-Ergebnis |
| --- | --- |
| Fetch-, CORS-, Netzwerk-, Deadline-, Abort-, Non-200-, Header-, Cap-, UTF-8- oder JSON-Fehler | `transportFailed` |
| parsebares HTTP-200-JSON mit falscher Shape oder Korrelation | `invalidResponse` |
| irrtümlich unter HTTP `200` gelieferte frühe Gateway-Response | `invalidResponse` |
| gültige korrelierte normale Erfolgsresponse | `syncResponseReceived` |
| gültige korrelierte normale Contract-Fehlerresponse | äußerer Service-Result `ok: true`; fachlicher Erfolg ausschließlich über `syncResponse.success` |

Gateway-Fehler werden nie in normale SyncResponses umgeschrieben.

### Vertrauens-, Daten- und Tor-A-Grenze

Browser, UI, Same-Origin-JavaScript, Caller, Fetch- und Responsewerte bleiben
unvertrauenswürdig. Eine erlaubte Origin kann kompromittiert sein. Loopback,
Host, Origin und CORS sind weder Authentisierung, Autorisierung noch
Calleridentität. Lokale Nicht-Browser-Prozesse können den Endpoint direkt
ansprechen, Originwerte nachbilden oder Port 8787 belegen. Diese fehlende
Identität ist nur für das exakt leere synthetische und nebenwirkungsfreie
`syncTest` vertretbar.

`source`, `requestId`, `timestamp` und Origin können private Bedeutung tragen.
Leeres Payload und `dataOrigin: "synthetic"` beweisen weder semantische
Nicht-Privatheit noch Datenschutz, Herkunft oder Serveridentität. Der Transport
liest PromptVault, LearningHub, LichtwaldLog und GoldenDawn-Vault nicht und
besitzt kein Storage, Logging, Telemetrie, Background Sync, Provider-, Modell-,
Workflow- oder Cloudziel. Browserextensions, kompromittierter Anwendungscode,
Service Worker und vollständige Same-Realm-Kompromittierung sind keine
beherrschte Sandbox.

Die Anwendung selbst setzt weder Cookie, Credential, Authorization, Referrer,
privaten Payload noch Provider-Secret. Ein Browser kann trotzdem Origin, User-
Agent, Accept/Accept-Language, Sec-Fetch-*, Client Hints und PNA/LNA-Metadaten
an den lokalen Port senden. `credentials: "omit"` und
`referrerPolicy: "no-referrer"` verhindern diese browserverwalteten Metadaten
nicht und sind keine Anonymitäts- oder Datenschutzgarantie.

Die isolierte Implementierung und ihre mutationswirksame Unit-Suite unter
`tests/browserSyncTransport.test.js` bleiben netzwerkfrei und verwenden nur
Doubles. Vor einer Browserkomposition oder einem Browser-End-to-End-
`syncTest` muss ein getrennter realer Evidence-Slice ein an Betriebssystem,
Browser und Browserversion, tatsächliche Frontend-Origin und -Kontext sowie den
festen Endpoint gebundenes `PASS` erbringen. Zu prüfen sind CORS/Preflight,
Private/Local Network Access, Browser-/Benutzerberechtigungen, Secure Context
und Mixed Content, das exakte Ziel `127.0.0.1`, Redirectverhalten,
sichtbare und blockierte Responseheader einschließlich Content-Length, finale
URL, `response.type`, Browserunterschiede und nötige Benutzerfreigaben. Das
`PASS` bleibt kontext- und versionsgebunden und ist keine allgemeine
Browsergarantie. Erfordern reale Browser dafür neue Header, Permissions oder
CORS-Policies, bleiben Komposition und End-to-End-Slice geschlossen, bis ADR
0020/0026 in einem neuen Slice ergänzt sind. Es gibt keinen Fallback.

ADR 0026 ist rein dokumentarisch. Der aktuelle Tor-A-Befund gilt ausschließlich
diesem Dokumentationsslice mit seinem festen regelbasierten Entwurf. Vor Merge
der isolierten Implementierung werden deren tatsächlicher Code, Browser-APIs,
Dependencies und Datenflüsse erneut auf fehlende Modelle, modell-, lern- oder
statistikbasierte Inferenz, Training, Lernen oder Adaptieren, Provider,
Workflows, private Payloads, Telemetrie, Persistenz und fachliche Nebenwirkungen
geprüft. Browserkomposition und reale menschliche Interaktion
erhalten ein eigenes vollständiges scopegebundenes Gate. Jeder Befund bleibt
nur eine enge vorläufige Nicht-KI-Arbeitshypothese, keine Rechtsberatung,
Gesamtprojektklassifikation oder Compliancegarantie.

Remote-/HTTPS-/zweite Ziele, Port-/URL-/Umgebungswahl, Redirect, Fallback,
Retry, Hintergrundaufruf, Caller-Signal, Cookie, Credential, Authorization,
Secret, nicht leeres oder privates Payload, neue Aktion, Provider, Modell,
Workflow, Tool, Logging, Telemetrie, Persistenz, Service Worker, Background
Sync, Authentisierung, Autorisierung, Replay, Idempotenz, systemweite
Betriebsgrenzen, Hosting oder Fremdnutzung benötigen eine neue Entscheidung.

## Öffentliche API der SyncGateway Request Boundary Foundation

`src/gateways/syncGatewayRequestBoundary.js` exportiert ausschließlich:

```js
createSyncGatewayRequestBoundary({
  generateGatewayRequestId = defaultCryptoGatewayRequestIdGenerator,
  getCurrentTimestamp = defaultUtcClock,
} = {})
```

Die Factory liefert eine eingefrorene gewöhnliche API mit exakt einer eigenen
aufzählbaren Dateneigenschaft:

```js
{
  processSyncRawBody
}
```

`processSyncRawBody(rawBody)` arbeitet bewusst synchron. Die Methode ist kein
HTTP-Handler und akzeptiert weder Request-, Response-, Header-, Stream-,
Buffer-, Blob-, ArrayBuffer- noch Transportobjekte. Sie erwartet exakt einen
bereits vollständig materialisierten Raw-Body-Wert.

Bei fehlenden oder zusätzlichen Argumenten werden die Argumentwerte weder
inspiziert noch konvertiert. In diesem Pfad gibt es keinen Aufruf von
`validateSyncRawBodySize`, kein Parsing und keinen Clock- oder
Generatorzugriff. Bei exakt einem Argument wird der Wert dagegen unverändert an
`validateSyncRawBodySize(rawBody)` übergeben. Nicht primitive Stringwerte
werden nicht über `String`, `toString`, `valueOf` oder
`Symbol.toPrimitive` konvertiert und ihre Properties werden nicht absichtlich
gelesen.

### Exakter Boundary-Result

Jeder Aufruf liefert synchron ein tief eingefrorenes gewöhnliches Objekt mit
exakt denselben fünf eigenen aufzählbaren Dateneigenschaften:

```js
{
  ok,
  status,
  syncRequest,
  gatewayErrorResponse,
  error
}
```

Ein akzeptierter Request verwendet exakt:

```js
{
  ok: true,
  status: "syncRequestAccepted",
  syncRequest: "<defensiver tief eingefrorener Sechs-Felder-Snapshot>",
  gatewayErrorResponse: null,
  error: null
}
```

`ok: true` bedeutet ausschließlich, dass die lokale Boundary einen vollständig
gültigen SyncRequest erzeugt hat. Es wurde nichts gesendet und kein
`SyncAgent` ausgeführt.

Eine beherrschte Eingabeablehnung verwendet exakt:

```js
{
  ok: false,
  status: "syncRequestRejected",
  syncRequest: null,
  gatewayErrorResponse: "<gültige defensive frühe Gateway-Fehlerresponse>",
  error: null
}
```

Das ist eine gültige SyncContract-Gateway-Fehlerresponse und kein lokaler
Programmfehler. Lokale Boundary-Fehler verwenden ausschließlich:

| Status | Code | Exakte Meldung |
| --- | --- | --- |
| `invalidInvocation` | `invalidSyncGatewayBoundaryInvocation` | `Die Sync-Gateway-Grenze erwartet genau einen Raw-Body-Wert.` |
| `boundaryFailed` | `syncGatewayBoundaryFailed` | `Die Sync-Anfrage konnte an der Gateway-Grenze nicht sicher verarbeitet werden.` |

Dabei sind `syncRequest` und `gatewayErrorResponse` exakt `null`; `error`
besitzt exakt `code` und `message`. Lokale Error-Records enthalten keine
Causes, Details, Stacks, Validatorfehlerlisten, Rohwerte oder fremden
Exceptionmeldungen. Sie sind keine SyncContract-Responses und erfinden weder
eine `gateway_`-ID noch einen Handler oder eine Verarbeitungskette.

### Fail-closed Verarbeitungsreihenfolge

Die verbindliche Reihenfolge lautet:

```text
materialisierten Raw-Body-Wert begrenzen
→ String exakt einmal ohne Reviver parsen
→ Parsed-Wert mit bestehendem SyncContract validieren
→ defensive Sechs-Felder-Projektion erzeugen
→ Projektion mit derselben Referenzzeit validieren
→ tief einfrieren
→ finalen Snapshot mit derselben Referenzzeit erneut validieren
```

Die Boundary prüft zuerst die exakte Argumentanzahl und danach mit
`validateSyncRawBodySize` den unveränderten Wert. `rawBodyTooLarge` besitzt
Vorrang vor JSON-Syntax und wird ohne Parsing abgelehnt. Nur nach bestandener
Raw-Body-Prüfung wird `JSON.parse(rawBody)` exakt einmal, mit exakt einem
Argument und ohne Reviver aufgerufen.

Das Parse-Ergebnis bleibt unvertrauenswürdig. Nach Erfassung einer
kontrollierten Referenzzeit wird zuerst der unveränderte Parsed-Wert über
`validateSyncRequest(parsedRequest, capturedTimestamp)` validiert.
Zusätzliche Felder dürfen deshalb nicht entfernt werden, bevor diese
maßgebliche geschlossene Contractprüfung vollständig bestanden ist.

Nur dann entsteht descriptor-basiert eine neue gewöhnliche Projektion aus
exakt:

```js
{
  version,
  action,
  source,
  requestId,
  timestamp,
  payload
}
```

Die fünf primitiven Werte werden unverändert übernommen; `payload` ist
zwingend ein frisches exakt leeres gewöhnliches Objekt. Die Projektion wird mit
derselben Referenzzeit validiert, anschließend tief eingefroren und als finaler
Snapshot erneut mit derselben Referenzzeit validiert.

Der Parsed-Wert wird weder verändert noch normalisiert, eingefroren, direkt
zurückgegeben, geloggt oder persistiert. Parsed-Wert und Ausgabe teilen keine
mutablen Recordidentitäten. Es gibt keinen Stringify-/Parse-Roundtrip, kein
`Object.assign`, keinen Spread aus dem Parsed-Record, kein Deep-Merge und
keinen generischen Deep-Clone. Wird ein zuvor gültig validierter Parsed-Wert
während Projektion, Freeze oder erneuter Validierung unerwartet inkonsistent,
ist dies `boundaryFailed` und kein Client-`VALIDATION_ERROR`.

### Statische Fehlerzuordnung

Die Boundary verwendet ausschließlich vorhandene SyncContract-Konstanten,
`SYNC_CONTRACT_VALIDATION_ERROR_CODES`,
`SYNC_CONTRACT_RESPONSE_ERROR_PROFILES`, `validateSyncRawBodySize`,
`validateSyncRequest` und `validateSyncGatewayErrorResponse`.

| Ursache | Ausgegebenes Gateway-Profil |
| --- | --- |
| `rawBodyTooLarge` | `PAYLOAD_TOO_LARGE` |
| anderer regulärer Raw-Body-Validierungsfehler | `VALIDATION_ERROR` |
| nativer `JSON.parse`-Throw | `INVALID_JSON` |
| exakt alleiniger Requestfehler `unsupportedVersion` | `UNSUPPORTED_VERSION` |
| exakt alleiniger Requestfehler `unknownAction` | `UNKNOWN_ACTION` |
| sonstiger oder kombinierter Requestfehler | `VALIDATION_ERROR` |

Ein übergroßer und zugleich syntaktisch ungültiger String ergibt
`PAYLOAD_TOO_LARGE`, ohne Parsing auszuführen. `UNSUPPORTED_VERSION` und
`UNKNOWN_ACTION` werden nur dann ausgegeben, wenn der jeweilige Fehlercode der
einzige Request-Contractfehler ist. Gemischte Fehlerbilder werden nicht zum
detaillierten Validierungs-Oracle, sondern bleiben `VALIDATION_ERROR`.

`invalidReferenceTimestamp` ist immer ein interner Clockfehler und führt zu
`boundaryFailed`. Dasselbe gilt für Projektions-, Freeze-, Validator- oder
Builderinkonsistenzen nach zuvor erfolgreicher Requestvalidierung.
`FORBIDDEN` wird nicht erzeugt, weil keine Authentisierung, Autorisierung oder
vertrauenswürdige Herkunft existiert. `SERVICE_UNAVAILABLE` und
`INTERNAL_ERROR` werden nicht als frühe Boundary-Profile erfunden.
Clientwerte, Parsermeldungen und Validatorfehlerlisten werden nie in die
Response übernommen.

### Clock und Gateway-ID

Der Standard-Clockpfad liefert einen kanonischen UTC-Zeitstempel. Ein
injizierter Clockwert muss ein primitiver String sein. Es gibt keine
Konvertierung, Reparatur oder Promise-/Thenable-Auflösung.

Für einen akzeptierten Request oder eine tatsächlich ausgegebene
Gateway-Fehlerresponse wird die Clock jeweils exakt einmal ausgewertet.
Derselbe Wert dient als `referenceTimestamp` für die Requestvalidierung und
bei einer Ablehnung zugleich als Response-`timestamp`. Ein ungültiger
Referenzzeitstempel führt lokal zu `boundaryFailed` und nie zu einer
Client-`VALIDATION_ERROR`.

Der Standard-Gateway-ID-Generator verwendet ausschließlich:

```text
gateway_ + crypto.randomUUID()
```

`crypto.randomUUID()` wird exakt einmal mit dem vorgesehenen Receiver
aufgerufen. Es gibt keinen `Math.random`-, Timestamp-, Zähler- oder fest
codierten Fallback. Der Generator wird nur aufgerufen, wenn tatsächlich eine
Gateway-Fehlerresponse benötigt wird, und bei `syncRequestAccepted` nie.
Nicht funktionale oder werfende Generatorpfade sowie nicht primitive oder
syntaktisch ungültige Werte führen statisch redigiert zu `boundaryFailed`.
Ungültige Werte werden weder gespiegelt noch konvertiert.

Syntaktische `gateway_`- und `req_`-IDs beweisen keine sichere Herkunft,
Identität, Berechtigung, Kollisionsfreiheit oder Replay-Sicherheit.

### Exakte frühe Gateway-Fehlerresponse der Boundary

Eine beherrschte Eingabeablehnung erzeugt pro Aufruf eine neue Response mit
exakt:

```js
{
  version: "1.0",
  success: false,
  requestId: "<kontrollierte gateway_-ID>",
  action: null,
  handledBy: null,
  timestamp: "<einmal erfasste kontrollierte UTC-Zeit>",
  data: null,
  error: {
    code: "<zugeordnetes statisches Gateway-Profil>",
    message: "<bestehende statische Profilmeldung>",
    retryable: false,
    details: []
  },
  warnings: [],
  meta: {
    durationMs: 0,
    processedBy: []
  }
}
```

`durationMs: 0` ist ein statischer, nicht gemessener Foundation-Wert und keine
Timing- oder Telemetrieaussage. `error`, `details`, `warnings`, `meta`
und `processedBy` werden bei jedem Aufruf frisch erzeugt. Zwei Ablehnungen
teilen keine ausgabeseitigen Record- oder Arrayidentitäten; insbesondere wird
kein geteiltes Contract-Profilobjekt direkt ausgegeben.

Die vollständige Response wird vor und nach Deep Freeze mit
`validateSyncGatewayErrorResponse` validiert. Bei einem unerwarteten Builder-,
Generator-, Clock- oder Validatorfehler wird keine Teilresponse ausgegeben,
sondern ein lokaler `boundaryFailed`-Result. Die Response spiegelt niemals eine
eingehende `req_`-ID, setzt niemals `handledBy: "SyncAgent"` oder
`processedBy: ["SyncAgent"]` und behauptet keine Agentenverarbeitung.

### JSON- und Wire-Grenzen

`validateSyncRawBodySize` prüft nur einen bereits materialisierten
JavaScript-String und dessen berechnete UTF-8-Länge. Der String wurde zu diesem
Zeitpunkt bereits alloziert und möglicherweise bereits aus Wire-Bytes
dekodiert. Die Prüfung ist keine HTTP-Bytebegrenzung, kein Schutz vor
vorheriger Body-Allokation, keine DoS-Garantie und keine produktive
Webhook-Durchsetzung.

ADR 0019 konkretisierte die damals vorgesehene reale Reihenfolge getrennt pro
Hop. Der lokale Gateway-Hop, der modellfreie SyncAgent-Kern und ihre durch ADR
0025 entschiedene lokale Komposition sind inzwischen implementiert; die
Browserkomposition fehlt weiterhin:

```text
HTTP-Request am lokalen Gateway:
Methode, festen Pfad, Content-Type-, Content-Encoding- und Origin/CORS-Regeln prüfen
→ rohe Bodybytes während des Streamings auf 65.536 begrenzen
→ kontrolliert genau einmal als UTF-8 dekodieren
→ ausschließlich diese Boundary einmal parsen, validieren und projizieren lassen
→ ausschließlich die validierte defensive Projektion synchron und höchstens einmal
  an den logisch getrennten lokalen SyncAgent übergeben
→ Request defense-in-depth erneut validieren und feste Aktions-Allowlist anwenden
→ syncTest vollständig lokal, deterministisch, synthetisch und providerfrei beantworten
→ normale SyncResponse lokal erzeugen, vollständig validieren und korrelieren
→ nur den exakten ADR-0024-Erfolg in einen frischen disjunkten Responsegraphen
  projizieren, absichern und als HTTP 200 ausgeben

später optional hinter dem lokalen SyncAgent:
für eine separat freigegebene Provider-Capability eine neue minimierte Projektion erzeugen
→ niemals Browser-Raw-Body, Browserheader, URL, Query oder Originalserialisierung weitergeben
```

Der Browsercaller ist am lokalen Hop nicht authentisiert. Der erste
synthetische Flow besitzt keine Bodysignatur. Eine Signatur über exakte Raw
Bytes und relevante Header wäre nur nach einer neuen Entscheidung für einen
späteren privaten oder schreibenden Flow vor Decodierung und Parsing zu prüfen.

`JSON.parse` wird exakt einmal ohne Reviver verwendet. Parserexceptions
können intern sensible Textausschnitte enthalten und werden vollständig
verworfen. Der Raw Body wird weder zurückgegeben noch geloggt, persistiert oder
weitergereicht. Es gibt kein Trimmen, keine BOM-Entfernung,
Unicode-Normalisierung oder Reparatur.

JSON mit doppelten Membernamen folgt bewusst der nativen ECMAScript-
`JSON.parse`-Semantik: Das letzte Vorkommen bestimmt den geparsten Wert. Die
Foundation behauptet deshalb weder duplikatfreies noch kanonisches JSON. Sie
führt keinen eigenen Parser, Reviver oder Duplicate-Key-Scanner ein. Die durch
ADR 0025 implementierte Gateway-Komposition stellt für den lokalen Hop sicher,
dass nur dieses eine Parse-Ergebnis ausgewertet wird. Der lokale SyncAgent
erhält ausschließlich die defensive Projektion und parst den ursprünglichen
Browser-Raw-Body nicht erneut. Ein späterer Provider darf
weder diesen Raw Body noch Browserheader oder Originalserialisierung erhalten;
eine adaptereigene Parsergrenze wäre gesondert für
die neu erzeugte minimierte Providerprojektion zu entscheiden.

`__proto__` entsteht bei nativem JSON-Parsing als eigene Dateneigenschaft und
verändert `Object.prototype` nicht. Als Zusatzfeld wird es zusammen mit
`constructor`, `prototype` und allen anderen unbekannten Feldern vom
geschlossenen Request-Vertrag fail-closed abgelehnt.

### Laufzeit-, Sicherheits- und Datenschutzgrenzen

`source: "goldendawn-os"` bleibt eine syntaktische Klassifikation und kein
Authentisierungs-, Herkunfts-, Routing- oder Berechtigungsnachweis. Eine gültige
eingehende `req_`-ID ist nur syntaktisch gültig. Die Timestamp-Toleranz ist
kein Replay-, Idempotenz- oder Deduplizierungsschutz. Der exakt leere Payload
verhindert das vorgesehene Inhaltsfeld. `source`, `requestId` und `timestamp`
bleiben Metadaten und können private Bedeutung codieren; Contract und leeres
Payload beweisen weder ihre semantische Nicht-Privatheit noch Datenschutz.

Die Boundary liest, persistiert oder exportiert keine Daten aus PromptVault,
LearningHub oder LichtwaldLog. Eine gültige Projektion bedeutet ausschließlich
Contractakzeptanz und keinen ausgeführten Sync. Diese Aussage beschreibt die
Boundary isoliert: Sie selbst bleibt kein HTTP-Handler oder Transport. Die
darauf aufsetzende lokale HTTP-Foundation reicht einen bestandenen String an
sie weiter und übergibt ausschließlich die akzeptierte defensive Projektion
synchron an den injizierten lokalen SyncAgent. Sie übergibt nichts an einen
Provider. Weil der Browsertransport fehlt und der lokale Pfad den Prozess nicht
verlässt, entsteht kein Browser- oder externer Datenfluss.

Injizierte Clock- und Generator-Functions sowie Function-Proxies sind
vertrauenswürdige ausführbare Same-Realm-Konfiguration. Reflection und
manipulierte globale Laufzeitfunktionen können fremden Code ausführen, werfen,
blockieren oder Seiteneffekte auslösen. Beobachtbare Fehler werden redigiert;
bereits ausgelöste Wirkungen können weder verhindert noch rückgängig gemacht
werden.

Natives `JSON.parse` ohne Reviver erzeugt aus JSON selbst keine Proxies,
Accessors, Symbole, Functions oder Thenables. Manipulierte Same-Realm-Intrinsics
bleiben außerhalb einer vollständigen Sandboxgarantie. Deep Freeze schützt nur
die neu erzeugten gewöhnlichen Snapshots und ist keine Sandbox. Eine
universelle Proxy-/Thenable-Erkennung und die Behauptung, die Boundary könne
niemals werfen, blockieren oder beliebigen Dependency-/Runtime-Code
kontrollieren, werden nicht eingeführt.

## Öffentliche API des Local Model-free SyncAgent Core

`src/agents/syncAgent.js` exportiert ausschließlich die Factory:

```js
createSyncAgent({
  getCurrentTimestamp = defaultUtcClock,
} = {})
```

Jede erfolgreich abgeschlossene Factory-Erzeugung liefert einen frischen
gewöhnlichen und eingefrorenen API-Record mit exakt:

```js
{
  processSyncRequest
}
```

`processSyncRequest(syncRequest)` ist synchron, besitzt genau einen formalen
Parameter und akzeptiert exakt ein Argument. Der Result liegt unmittelbar vor
und ist weder Promise noch Thenable. Es gibt keinen generischen `execute`-Pfad
und kein separates Aktions-, Handler-, Provider-, Modell-, Workflow-,
Endpoint- oder Payloadargument. Die Clock ist die einzige Dependency.

Bei erfolgreicher Modulevaluation werden unmittelbar nach den Imports private
Referenzen auf `Object.freeze`, `Object.isFrozen`, `Object.getPrototypeOf`,
`Object.getOwnPropertyDescriptor`, `Object.hasOwn` und `Reflect.ownKeys` sowie
die gewöhnliche `Object.prototype`-Identität erfasst. Die erfassten Reflection-
Referenzen verwendet ausschließlich der terminale Verifier für Factory-API,
lokale Errorrecords sowie Failure- und Success-Results; er verwendet keine live
Array-Prototypmethoden oder Iteratoren. Die erfasste Freeze-Referenz friert
diese Records ein. Die erfasste Frozen-Referenz prüft sämtliche tatsächlichen
Freeze-Zustände, einschließlich der internen Request- und Response-Snapshots.

### Exakter lokaler SyncAgent-Result

Jeder beherrschte Aufruf liefert einen frischen gewöhnlichen und tief
eingefrorenen Record mit exakt vier eigenen aufzählbaren Dateneigenschaften:

```js
{
  ok,
  status,
  syncResponse,
  error
}
```

Ein erfolgreicher Aufruf liefert ausschließlich:

```js
{
  ok: true,
  status: "syncResponseCreated",
  syncResponse: {
    version: internalRequest.version,
    success: true,
    requestId: internalRequest.requestId,
    action: internalRequest.action,
    handledBy: "SyncAgent",
    timestamp: capturedTimestamp,
    data: {
      status: "ok",
      dataOrigin: "synthetic"
    },
    error: null,
    warnings: [],
    meta: {
      durationMs: 0,
      processedBy: ["SyncAgent"]
    }
  },
  error: null
}
```

`durationMs: 0` ist ein statischer ungemessener Foundation-Wert. Der Kern
liest dafür weder die Clock ein zweites Mal noch einen Timer oder
`performance` aus.

Lokale Fehler verwenden ausschließlich diese drei Profile:

| Status | Code | Exakte Meldung |
| --- | --- | --- |
| `invalidInvocation` | `invalidSyncAgentInvocation` | `Der lokale SyncAgent erwartet genau einen SyncRequest.` |
| `syncRequestRejected` | `syncAgentRequestRejected` | `Die Sync-Anfrage wurde vom lokalen SyncAgent abgelehnt.` |
| `agentFailed` | `syncAgentFailed` | `Die Sync-Anfrage konnte vom lokalen SyncAgent nicht sicher verarbeitet werden.` |

Bei jedem Fehler sind `ok: false` und `syncResponse: null`; `error` enthält
exakt `code` und `message`. Result- und Error-Records werden nicht zwischen
Aufrufen geteilt. Sie enthalten keine Request-ID, Rohwerte, Validatorfehler,
Exception-, Stack-, Cause- oder Dependencymeldungen, Gateway-Fehlerprofile,
`handledBy` oder `processedBy`. Lokale Fehler sind keine SyncContract-
Responses und behaupten keine Verarbeitung durch `SyncAgent`.

Vor der Ausgabe wird jeder terminale Record descriptor-basiert geprüft. Ein
Success-Result muss einen gewöhnlichen Objektprototyp und exakt die vier eigenen
aufzählbaren Dateneigenschaften `ok`, `status`, `syncResponse` und `error`
besitzen. Dabei gelten exakt `ok: true`, `status: "syncResponseCreated"`, die
Identität der final validierten und eingefrorenen Response sowie `error: null`;
der Result muss mit der erfassten Frozen-Referenz tatsächlich eingefroren sein.

Ein lokaler Errorrecord muss einen gewöhnlichen Objektprototyp, exakt die
eigenen aufzählbaren Dateneigenschaften `code` und `message`, ausschließlich
die statischen Werte des ausgewählten Profils und einen bestätigten
Freeze-Zustand besitzen. Zusatz-, Symbol-, Accessor-, Stack-, Cause- oder
Rohfehlerfelder sind ausgeschlossen. Der zugehörige Failure-Result bestätigt
entsprechend den gewöhnlichen Prototyp, exakt `ok`, `status`, `syncResponse` und
`error`, `ok: false`, den exakten Profilstatus, `syncResponse: null`, die
Identität des zuvor geprüften frischen Errorrecords und seinen eigenen
Freeze-Zustand. Eine nach erfolgreichem Import ersetzte globale terminale
Reflection-, `Object.freeze`- oder `Object.isFrozen`-Funktion kann deshalb keine
mutable oder korrumpierte terminale API, keinen Errorrecord und keinen Result
erzeugen.

### Clock-, Projektions- und Validierungsreihenfolge

Die verbindliche synchrone Reihenfolge lautet:

```text
exakt ein Argument prüfen
→ Clock exakt einmal als primitiven String erfassen
→ unveränderten Caller-Request validieren
→ descriptor-basiert einen frischen Sechs-Felder-Request projizieren
→ Projektion mit derselben Referenzzeit validieren
→ Projektion tief einfrieren
→ gefrorene Projektion mit derselben Referenzzeit final validieren
→ feste lokale Erfolgsresponse erzeugen
→ Response gegen den internen Request validieren
→ Response tief einfrieren
→ gefrorene Response final gegen denselben internen Request validieren
→ tief eingefrorenen Success-Result ausgeben
```

Bei falscher Argumentanzahl werden weder Argumente inspiziert noch Clock oder
andere Laufzeitwerte ausgewertet. Bei exakt einem Argument wird die Clock
genau einmal aufgerufen. Throw, Nichtfunktionalität oder ein anderer Wert als
ein primitiver String führen zu `agentFailed`; es gibt keine Konvertierung,
Promise-/Thenable-Auflösung oder Reparatur. Eine nichtkanonische Referenzzeit
beziehungsweise `invalidReferenceTimestamp` hat auch in einem gemischten
Requestfehlerbild Vorrang und führt zu `agentFailed`, nicht zu
`syncRequestRejected`.

Die drei Requestvalidierungen betreffen in dieser Reihenfolge den
unveränderten Caller-Request, die frische Projektion vor Freeze und dieselbe
Projektion nach Freeze. Erst nach bestandener Originalvalidierung werden die
sechs Pflichtfelder aus eigenen aufzählbaren Dateneigenschaften anhand ihrer
Deskriptoren übernommen. Der interne Request ist ein neuer gewöhnlicher Record
mit einem neuen exakt leeren `payload`; Caller-Records werden weder behalten,
verändert noch eingefroren. Es gibt kein Trimmen, Merge, Spread aus dem
Caller-Record, `Object.assign`, Stringify-/Parse-Roundtrip oder generisches
Cloning. Gewöhnliche und vom Contract unterstützte Null-Prototyp-Requests sind
zulässig.

Nach der finalen Requestvalidierung prüft die private Aktions-Allowlist
ausschließlich `syncTest`. Die Erfolgsresponse wird nur aus dem stabilen
internen Request, den festen privaten Policywerten `syncTest`, `SyncAgent` und
`synthetic` sowie der einmal erfassten Clock erzeugt. Diese Werte werden nicht
positionsabhängig aus Contractlisten abgeleitet. Die Response wird vor und nach
ihrem vollständigen Deep Freeze jeweils gegen denselben internen Request
validiert. Die internen Request- und Response-Prüfungen lösen ihre Reflection
absichtlich live auf; auch ihre Freezes lösen `Object.freeze` live auf. Ihr
tatsächlicher Freeze-Zustand wird ausschließlich mit der beim Import erfassten
`Object.isFrozen`-Referenz geprüft. Ein beobachteter Reflection- oder Freeze-
Throw, Freeze-No-op, eine Freeze-Mutation oder jede andere unsichere Validator-,
ABA-, Proxy-, Descriptor-, Projektions-, Revalidierungs- oder
Korrelationsinkonsistenz führt statisch redigiert zu `agentFailed`; eine
Teilresponse wird nie ausgegeben. Dieser Kern erzeugt keine normale Contract-
Fehlerresponse.

### Isolation und fehlende Komposition

Der Modulimport startet keine Verarbeitung. Die Factory ruft die aufgelöste
Clockfunktion nicht auf und startet selbst keine Timer-, Listener-, Netzwerk-,
HTTP-, DNS-, IPC-, Datei-, Storage-, Log-, Telemetrie- oder Provideraktivität.
Ihre Parameterdestrukturierung löst jedoch die vertrauenswürdige
Composition-Property `getCurrentTimestamp` auf. Ein Accessor oder Proxy im
übergebenen Composition-Container kann deshalb bei der Factory-Erzeugung
ausgeführt werden oder werfen; dieser Vorgang liegt außerhalb des Methoden-
Resultvertrags. Erst ein Aufruf von `processSyncRequest` mit exakt einem
Argument ruft die aufgelöste Clockfunktion genau einmal auf. Der Kern liest
keine Bestände aus PromptVault, LearningHub, LichtwaldLog oder GoldenDawn-Vault
und lädt keinen Provider, kein Modell und keinen Workflow. Er ist nicht in
`src/main.js`, aber für den engen lokalen `syncTest`-Pfad in den lokalen
HTTP-Prozess komponiert.

Der vorhandene lokale Gatewaypfad übergibt seine akzeptierte defensive
Projektion nach ADR 0025 synchron höchstens einmal an den Kern. Nur ein exakter
ADR-0024-Erfolg wird als frische defensive Normalresponse mit HTTP `200`
ausgegeben. ADR 0027 ersetzte ADR 0026 und entschied ausschließlich den
korrigierten BrowserSyncTransport-Vertrag. Dessen isolierte Implementierung mit
mutationswirksamer Unit-Suite ist inzwischen abgeschlossen, weiterhin ohne
`src/main.js`-Komposition. Der lokale Browser-End-to-End-Fluss bleibt
geschlossen; Provider, externe Datenflüsse und weitere Aktionen bleiben
spätere getrennte Slices.

Same-Realm-Reflection und Deep Freeze sind keine Sandbox. Proxy-Traps oder
manipulierte Intrinsics können vor einer beobachtbaren Ablehnung bereits
Seiteneffekte auslösen; der Kern kann diese weder verhindern noch rückgängig
machen, stoppt die weitere Verarbeitung aber fail-closed und redigiert
beobachtbare Fehler. Nicht garantiert werden bereits vor der Modulevaluation
kompromittierte Primordials, veränderter Modulcode oder lexikalische Bindungen,
eine kompromittierte JavaScript-Engine, OOM oder Prozessabbruch sowie beliebig
koordinierte Manipulation sämtlicher Reflection-Intrinsics.

## Implementierter Kompositionsvertrag / ADR 0025

ADR 0025 ergänzt ADR 0023 und erfüllt das von ADR 0024 verlangte
Entscheidungsgate, ohne SyncContract oder Schema zu ändern. Der anschließende
Implementierungsslice setzt den Vertrag um. Produktions-Kompositionsroot ist
ausschließlich `server/startLocalSyncGateway.js`. Dort wird nach gültiger
Runtime-Konfiguration genau eine lokale SyncAgent-Instanz pro HTTP-Server-
Factory erzeugt und als erforderliche
`syncAgent`-Dependency ohne versteckten Agentendefault injiziert. Der bestehende
Boundary-Default bleibt unverändert. Eine fehlende, nicht funktionale oder
werfend aufgelöste `syncAgent.processSyncRequest`-Methode verhindert den
Serveraufbau vor dem Listener; die öffentliche Gateway-API bleibt exakt
`{ start, stop }`.

Nur die exakte von der Boundary akzeptierte defensive Sechs-Felder-
Requestidentität darf `processSyncRequest` synchron, mit genau einem Argument
und pro akzeptiertem Requestpfad höchstens einmal erreichen. Raw Bytes, Raw
Body, decodierter String, Parsed-JSON-Original, HTTP-Metadaten und -objekte,
Fehlerresults, Gateway-Fehlerresponses, Secrets und private Modulwerte werden
nicht übergeben. Es gibt keinen Retry, Fallback oder dynamischen Handler. Das
Gateway verwendet weder `await` noch `Promise.resolve` und führt keine Promise-
oder Thenable-Assimilation beziehungsweise -Auflösung durch; eine geerbte oder
nur durch einen Proxy-`get`-Trap virtuell angebotene `then`-Property wird nicht
eigens gelesen. Eine portable universelle Proxy- oder Thenable-Erkennung und
eine Parallelitäts- oder Exactly-once-Garantie werden nicht behauptet.

Das Agentenresultat bleibt unvertrauenswürdige Eingabe. Zulässig ist nur der
tief eingefrorene exakte Vier-Felder-Erfolg:

```js
{
  ok: true,
  status: "syncResponseCreated",
  syncResponse,
  error: null
}
```

Gewöhnlicher Prototyp, exakt vier eigene aufzählbare Dateneigenschaften, das
Fehlen von Zusatz-, Symbol- und Accessorfeldern, die festen äußeren Werte sowie
der tatsächliche tiefe Freeze-Zustand müssen descriptor-basiert bestehen. Ein
Throw, echter Promise, Result mit zusätzlicher eigener `then`-Property,
anderweitig malformed Result, lokaler ADR-0024-Fehlerresult oder mutabler
Result wird nicht als normale Response akzeptiert. Virtuelle
`then`-Properties werden nicht assimiliert und bestimmen den synchronen
Kontrollfluss nicht. Auch eine abstrakt contractgültige normale Fehlerresponse
mit `success: false` gehört nicht zum festen ADR-0025-Erfolgsprofil.

Die unveränderte Agent-SyncResponse wird zuerst vollständig gegen denselben
Boundary-Request validiert. Erst danach entsteht descriptor-basiert ein
frischer gewöhnlicher Graph ohne fremde verschachtelte Identitäten mit exakt
den zehn Feldern `version`, `success`, `requestId`, `action`, `handledBy`,
`timestamp`, `data`, `error`, `warnings` und `meta`. Zulässig ist ausschließlich
das feste Profil `version: "1.0"`, `success: true`, korrelierte `requestId`,
`action: "syncTest"`, `handledBy: "SyncAgent"`, der validierte unveränderte
Agent-Response-Zeitstempel, `data: { status: "ok", dataOrigin: "synthetic" }`,
`error: null`, `warnings: []` und
`meta: { durationMs: 0, processedBy: ["SyncAgent"] }`.

Für die terminale Gateway-Projektion erfasst
`server/localSyncGatewayHttpServer.js` unmittelbar bei erfolgreicher
Modulevaluation mindestens `Object.prototype`, `Array.prototype`,
`Object.getPrototypeOf`, `Object.getOwnPropertyDescriptor`, `Object.hasOwn`,
`Object.freeze`, `Object.isFrozen`, `Reflect.ownKeys`, `Array.isArray` und
`JSON.stringify` sowie jede weitere terminal benötigte Intrinsic privat.
Projektion, Shape-, Prototype-, Freezeprüfung und Vorabserialisierung lösen
ausschließlich diese erfassten Referenzen auf.

Der frische Graph wird gegen denselben Request revalidiert, mit der erfassten
Freeze-Referenz vollständig tief eingefroren, über die erfasste Frozen-Referenz
auf den tatsächlichen Freeze-Zustand geprüft und als identischer gefrorener
Graph final revalidiert. Nach dieser letzten möglicherweise
unvertrauenswürdigen Reflection bestätigt der erfasste terminale Verifier
unmittelbar vor der Serialisierung erneut exakte Own-Data-Properties, erlaubte
primitive beziehungsweise frische verschachtelte Werte, für jeden Record exakt
den erfassten `Object.prototype`, für jedes Array exakt den erfassten
`Array.prototype` und für Root, jeden verschachtelten Record und jedes Array
über die erfasste `Object.isFrozen`-Referenz den weiterhin tatsächlichen
Freeze-Zustand. Danach muss die erfasste `Object.getPrototypeOf`-Referenz exakt
`capturedGetPrototypeOf(capturedArrayPrototype) === capturedObjectPrototype`
und anschließend exakt
`capturedGetPrototypeOf(capturedObjectPrototype) === null` bestätigen. Erst
nach beiden bestandenen Identitätsprüfungen darf zunächst der erfasste
`Array.prototype` und danach der erfasste `Object.prototype` auf das Fehlen
einer eigenen `toJSON`-Property geprüft werden; Datenproperty und Accessor
werden gleichermaßen fail-closed abgelehnt.

Terminal zulässig sind ausschließlich die vollständigen Ketten
`Response-Record → capturedObjectPrototype → null` und
`Response-Array → capturedArrayPrototype → capturedObjectPrototype → null`.
Eine allgemeinere oder dynamisch erweiterbare Prototypkette wird nicht
akzeptiert.

Danach wird ohne weiteren absichtlichen Aufruf eines unvertrauenswürdigen Hooks
die erfasste `JSON.stringify`-Funktion exakt einmal angewendet. Nur ein
primitiver String ist zulässig. Terminale Inkonsistenz, Throw oder anderer
Rückgabewert ergibt vor Responsebesitz das bestehende statische
`500 gatewayFailed`-Profil, dessen bereits bei Modulevaluation materialisierter
primitiver Body verwendet wird; der ungeeignete Graph wird nicht erneut
serialisiert und kein Sentinel gelangt in Body, Result oder Consoleoutput.
Eine Abweichung der Prototypketten-Invarianten wird bereits vor diesem
Serialisierungsschritt erkannt: Die erfasste Erfolgsserialisierung wird für den
Request nullmal aufgerufen, der kompromittierte Graph nicht serialisiert und
ausschließlich das statische `500 gatewayFailed` ausgegeben. Fremde Werte,
Bodyinhalte, Sentinels oder Exceptiontexte gelangen weder in Response, Result
noch Consoleoutput; eine zweite Response entsteht nicht.
Post-import ersetzte globale Serialisierungs-, Reflection-, Freeze- oder
Frozen-Funktionen beeinflussen diese Grenze nicht. Vor Modulevaluation
kompromittierte Primordials oder Modulcode, eine kompromittierte Engine, OOM
und Prozessabbruch bleiben außerhalb der Garantie; Same-Realm und Deep Freeze
sind keine Sandbox.

Es gibt keine Reparatur, Normalisierung, Defaultbefüllung, Bereinigung vor
Originalprüfung oder Übernahme fremder Exceptiontexte. Das Gateway serialisiert
weder den Agent-Wrapper noch eine Agent-eigene Objekt- oder Arrayidentität.
`handledBy`, `processedBy` und `dataOrigin` sind nur
Vertragsklassifikationen, keine Identitäts-, Herkunfts-, Datenschutz-,
Deployment- oder Provenienznachweise.

Die HTTP-Zuordnung ist implementiert:

| Pfad | Agentaufrufe | HTTP-Ergebnis |
| --- | ---: | --- |
| frühe HTTP-/Wire-/Header-/Origin-/Framing-/UTF-8-Ablehnung | 0 | bestehendes statisches lokales Profil |
| Boundary-Throw, lokaler Boundaryfehler oder malformed Boundaryresult | 0 | `500 gatewayFailed` |
| vollständig validierte frühe Gateway-Fehlerresponse | 0 | `400`, nackte Gateway-Fehlerresponse |
| akzeptierter Request und exakter Agentenerfolg | 1 | `200`, ausschließlich defensive normale SyncResponse |
| Agent-Throw, Promise beziehungsweise asynchroner oder malformed Agentresult | 1 | `500 gatewayFailed` |
| `invalidInvocation`, `syncRequestRejected` oder `agentFailed` | 1 | `500 gatewayFailed` |
| ungültige, unkorrelierte, mutable oder ungeeignete SyncResponse | 1 | `500 gatewayFailed` |
| Projektions-, terminaler Shape-/Prototype-/Prototypketten-/Freeze-/`toJSON`-, Revalidierungs- oder Vorabserialisierungsfehler | 1 | `500 gatewayFailed`; vor Responsebesitz festgestellt |

Eine Agentenablehnung wird nicht zu HTTP `400`; neue `502`-, `503`- oder
`504`-Profile entstehen nicht. Das Gateway bleibt alleiniger Owner von HTTP-
Response, Status, Headern, CORS, Serialisierung, Socket und Cleanup. Prüfung,
Projektion, Freeze, finale Revalidierung, terminale erfasste Shape-/Prototype-/
Prototypketten-/`toJSON`-Prüfung und erfolgreiche erfasste Vorabserialisierung
müssen vor der Responseübernahme abgeschlossen sein. Requestbezogene
Agentenfehler sind keine fatalen Serverfehler.

Dieser Vertrag ist implementiert. Der frühere statische
`503 upstreamUnavailable`-Annahmepfad und sein Serverprofil sind entfernt; nur
der vollständig erfolgreiche komponierte Pfad ergibt HTTP `200`. Sämtliche
beherrschten Agent-/Responsefehler bleiben beim bestehenden statischen
`500 gatewayFailed`. ADR 0027 ersetzte ADR 0026 und entschied ausschließlich
den korrigierten BrowserSyncTransport-Vertrag. Die isolierte
Transportimplementierung und ihre mutationswirksame Unit-Suite sind inzwischen
abgeschlossen; Browserkomposition und End-to-End-Fluss bleiben geschlossen,
Betriebsgrenzen und Provider weitere spätere Slices.

Die Phase-0-Einordnung bleibt ausschließlich eine enge vorläufige Nicht-KI-
Arbeitshypothese für diesen deterministischen, modellfreien lokalen Slice und
ist weder Rechtsberatung noch Gesamtklassifikation oder Compliance-Siegel.
Die fokussierte Local-SyncGateway-Suite besteht mit 67/67 Tests, die kombinierte
serielle Suite aus SyncContract, SyncService, Request Boundary, SyncAgent und
Local SyncGateway mit 312/312 Tests und die vollständige serielle Gesamtsuite
mit 1332/1332 Tests. Alle Läufe besitzen 0 Fehlschläge, 0 Skips und 0 Todos;
der Produktions-Build transformiert weiterhin exakt 46 Browsermodule und der
schreibfreie Bundle-Check meldet keinen Drift.

## Öffentliche API der Local SyncGateway Raw-Wire and HTTP Foundation

Die lokale Foundation besteht aus drei getrennten ES-Modulen und einem
expliziten Paket-Script. Ein Import startet keinen Listener:

```text
server/
├── localSyncGatewayRuntimeConfig.js
├── localSyncGatewayHttpServer.js
└── startLocalSyncGateway.js

npm run gateway:local
```

`server/localSyncGatewayRuntimeConfig.js` exportiert ausschließlich
`readLocalSyncGatewayRuntimeConfig(environment = process.env)`. Jeder
Rückgabewert ist ein eingefrorener exakter Vier-Felder-Result:

```js
{
  ok,
  status,
  config,
  error
}
```

Die Runtime akzeptiert nur die beiden verpflichtenden Variablen
`GOLDENDAWN_SYNC_GATEWAY_PORT` und
`GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN`. Der Port muss als positive
Dezimalzahl zwischen `1` und `65535` vorliegen. Die Origin muss eine
vollständige, exakt kanonische HTTP(S)-Origin ohne Credentials, Pfad, Query
oder Fragment sein; als Host sind nur `localhost`, `127.0.0.1` und `[::1]`
zulässig. Erfolg verwendet exakt `ok: true`,
`status: "runtimeConfigurationAccepted"`, die auf
`{ port, allowedOrigin }` begrenzte eingefrorene `config` und `error: null`.
Jede fehlende, unlesbare oder ungeeignete Konfiguration ergibt exakt
`ok: false`, `status: "runtimeConfigurationRejected"`, `config: null` und
ausschließlich den folgenden Fehler:

```text
invalidLocalSyncGatewayRuntimeConfiguration
Die lokale SyncGateway-Runtime-Konfiguration ist ungültig.
```

Der Runtime-Port `0` ist ausdrücklich unzulässig. Nur die direkt verwendbare
Serverfactory akzeptiert `port: 0`, damit Tests einen vom Betriebssystem
gewählten freien Loopback-Port verwenden können.

`server/localSyncGatewayHttpServer.js` exportiert ausschließlich den
eingefrorenen Grenzwertrecord `LOCAL_SYNC_GATEWAY_HTTP_LIMITS` und:

```js
createLocalSyncGatewayHttpServer({
  port,
  allowedOrigin,
  syncAgent,
  syncGatewayRequestBoundary = createSyncGatewayRequestBoundary(),
  createTextDecoder = defaultStrictUtf8TextDecoderFactory,
  onFatal = () => {},
  useTestTimeoutPolicy = false,
} = {})
```

`syncAgent` ist erforderlich und besitzt keinen Default. Seine
`processSyncRequest`-Methode wird bei der Factory-Komposition genau einmal
sicher aufgelöst und mit demselben Receiver erfasst; die Requestverarbeitung
liest sie nicht erneut. Eine ungültige Komposition wirft ausschließlich den statischen `TypeError`
`Die lokale SyncGateway-Komposition ist ungültig.`. Die Factory liefert eine
eingefrorene API mit exakt den beiden argumentlosen, Promise-basierten Methoden
`start` und `stop`. Jeder Lifecycle-Result besitzt exakt
`{ ok, status, host, port, error }`. `started` trägt ausschließlich den festen
Host `127.0.0.1` und den tatsächlich gebundenen Port; `stopped` trägt
`host: null`, `port: null` und `error: null`. Fehler tragen ebenfalls keine
Host- oder Portangabe:

| Status | Code | Statische Meldung |
| --- | --- | --- |
| `alreadyStarted` | `localSyncGatewayAlreadyStarted` | `Das lokale SyncGateway wurde bereits gestartet.` |
| `startFailed` | `localSyncGatewayStartFailed` | `Das lokale SyncGateway konnte nicht gestartet werden.` |
| `notStarted` | `localSyncGatewayNotStarted` | `Das lokale SyncGateway wurde noch nicht gestartet.` |
| `alreadyStopped` | `localSyncGatewayAlreadyStopped` | `Das lokale SyncGateway wurde bereits gestoppt.` |
| `stopFailed` | `localSyncGatewayStopFailed` | `Das lokale SyncGateway konnte nicht kontrolliert gestoppt werden.` |

Der Listening-Abschluss behandelt den gesamten Zugriff auf `server.address()`
als Teil des noch nicht erfolgreichen Starts. Funktionsaufruf, Resultprüfung
und das jeweils einmalige Lesen der Eigenschaften `address` und `port` liegen
gemeinsam in der bestehenden Fehlerbehandlung. Wirft einer dieser Zugriffe,
wird kein Wert nach außen gegeben und `start()` bleibt nicht offen: Die
Instanz durchläuft den irreversiblen Start-Cleanup und liefert ausschließlich
den statischen `startFailed`-Result. Ein solcher Startfehler ruft `onFatal`
nicht auf.

Zusätzlich muss der aus `address.port` gelesene Wert ein Safe Integer zwischen
`1` und `65535` sein. Für einen angeforderten Produktionsport ungleich `0`
muss er exakt mit diesem Port übereinstimmen. Ausschließlich bei Factory-Port
`0` darf ein anderer, vom Betriebssystem gewählter Wert gemeldet werden, der
aber ebenfalls vollständig im Bereich `1` bis `65535` liegen muss. `0`, `-1`,
`65536` und ein abweichender gültiger Produktionsport sind kontrollierte
Startfehler mit demselben Cleanup und ohne `onFatal`.

Ein Serverfehler nach einem erfolgreichen Start verwirft den gebundenen Port
sofort, wechselt fail-closed in den fehlgeschlagenen Zustand, schließt den
Listener defensiv und zerstört alle verfolgten Sockets. Operative Guards an den
Request-, Empfangs-, Decoder- und Boundary-Stufen verhindern danach jede
weitere Verarbeitung. Der Fehlerwert, interne Exceptions und Stacks werden
weder in eine Response übernommen noch geloggt.

`onFatal` ist ausschließlich der payloadlose Kompositionsport für diesen
Serverfehler nach erfolgreichem Start. Er wird höchstens einmal aufgerufen;
synchrone Throws und zurückgegebene Rejections werden konsumiert. Der Port
erweitert die eingefrorene öffentliche API nicht, die exakt `{ start, stop }`
bleibt.

`server/startLocalSyncGateway.js` prüft den direkten Modulstart, liest erst
dann die Runtime-Konfiguration, komponiert den Server und behandelt `SIGINT`
und `SIGTERM` über `stop`. Seine Console-Ausgaben sind statisch; Requestwerte,
Raw Bodies, Header, Origins, URLs, Ports, Secrets, Exceptions und Stacks werden
nicht geloggt. Nach `onFatal` entfernt der Prozesseinstieg beide Signalhandler,
setzt `process.exitCode = 1`, versucht den Cleanup idempotent und gibt genau
einmal ausschließlich
`Das lokale SyncGateway wurde nach einem internen Serverfehler beendet.` aus.

### Feste lokale Route und HTTP-Policy

Das Gateway unterstützt ausschließlich HTTP/1.1. Ein als HTTP/1.0 geparster
Request wird mit dem statischen lokalen Profil `invalidHttpRequest` abgelehnt,
bevor `rawHeaders` projiziert, ein UTF-8-Decoder erzeugt oder die Boundary
aufgerufen wird.

Unabhängig davon besitzt jede Factoryinstanz eine eigene Request-Admission pro
physischem Socket. Dieser Zustand ist ausdrücklich vom Response-Owner getrennt.
Die Ereignisse `request`, `checkContinue` und `checkExpectation` durchlaufen
als allerersten Anwendungsschritt dasselbe Gate. Nur das erste Requestereignis
eines Sockets wird zugelassen. Jedes weitere Ereignis beansprucht den
terminalen Response-Owner, pausiert und zerstört den Socket ohne zweite
Response, noch bevor HTTP-Version, Headerprojektion, Decoder oder Boundary
ausgewertet werden.

Der Listener bindet unabhängig von Eingaben ausschließlich an `127.0.0.1`.
Die einzige Route ist exakt `/api/sync-test`; Querystrings, absolute URLs und
andere Pfade ergeben `404`. `Host` muss genau einmal vorliegen. Bei gebundenem
Port `80` werden ausschließlich `127.0.0.1` und explizit `127.0.0.1:80`
akzeptiert; für jeden anderen Port gilt ausschließlich die exakte Autorität
`127.0.0.1:<tatsächlich gebundener Port>`. Der fachliche Request verwendet
ausschließlich `POST`; `OPTIONS` dient nur dem kontrollierten Preflight. Andere
Methoden einschließlich `CONNECT` ergeben `405` mit `Allow: POST, OPTIONS`,
Upgrade-Versuche `400` und HTTP-Erwartungen `417`.

Der Node-Server setzt intern ausdrücklich `requireHostHeader: false`. Dies ist
keine Lockerung der Hostpflicht oder der portabhängigen Allowlist. Die Option
deaktiviert nur Nodes eigene vorgezogene HTTP/1.1-`400`-Antwort. Im ansonsten
regulären Requestpfad, sofern keine frühere fail-closed Target- oder
Sonderpfadablehnung greift, wird jeder regulär parsebare fehlende, doppelte
oder falsche Host nach der Request-Admission unter dem anwendungsseitigen
Response-Owner von der vorhandenen Raw-Header-Policy geprüft. Diese Fälle
ergeben den eigenen statischen `invalidHttpRequest`-Envelope einschließlich
kontrolliertem `Content-Length`; Decoder und Boundary bleiben unberührt.
Falsches Target, `CONNECT` und Erwartungen behalten ihre früheren fail-closed
Antworten `404`, `405` beziehungsweise `417`; die Option öffnet keinen
akzeptierenden Pfad.

Die Implementierung wertet `rawHeaders` aus. Mehr als 32 Headerfelder werden
an der Anwendungsschwelle als `431` abgelehnt; der Node-Parser verwendet dafür
einen Sentinel von 33 Feldern. Duplikate der sicherheitsrelevanten Header
`Host`, `Origin`, `Content-Type`, `Content-Encoding`, `Content-Length`,
`Transfer-Encoding`, `Connection`, `Expect`, `Upgrade`,
`Access-Control-Request-Method`, `Access-Control-Request-Headers` und `Trailer`
werden fail-closed abgelehnt. Doppelte Medienformatheader ergeben im
`POST`-Pfad ein `415` statt eines generischen `400`.

Jeder regulär behandelte `POST`- oder `OPTIONS`-Request auf der festen Route mit
gültigem Host benötigt genau eine Origin, die dem konfigurierten String exakt
entspricht. Nur dann dürfen Antworten `Access-Control-Allow-Origin` mit genau
diesem Wert und `Vary: Origin` tragen. Es gibt weder `*`, unkontrolliertes Echo
noch `Access-Control-Allow-Credentials`. CORS und Loopback beweisen weiterhin
weder Identität noch Authentisierung oder Autorisierung.

Ein bestandener Preflight verlangt exakt `POST` und exakt `Content-Type` als
angeforderten Header. Er erlaubt keinen Body, Content-Type,
Content-Encoding, Transfer-Encoding, Expect-, Upgrade- oder Trailerpfad;
`Content-Length` darf fehlen oder exakt `0` sein und `Connection` nur fehlen,
`close` oder `keep-alive` enthalten. Erfolg ist HTTP `204` ohne Body mit
`Access-Control-Allow-Methods: POST` und
`Access-Control-Allow-Headers: Content-Type`; Decoder und Boundary werden in
diesem Pfad nicht aufgerufen.

Ein `POST` verlangt genau einen Content-Type `application/json`, optional mit
genau `charset=utf-8`; Groß-/Kleinschreibung und zulässige horizontale
Whitespace um Separatoren sind unkritisch. `Content-Encoding` darf fehlen oder
einmal `identity` sein. Komprimierte oder andere Encodings werden nicht
dekodiert. `Connection` darf fehlen oder einmal `close` beziehungsweise
`keep-alive` sein. Preflight-, Expect-, Upgrade- und Trailerheader sind im
POST-Pfad unzulässig. `Content-Length` und `Transfer-Encoding` schließen sich
gegenseitig aus; Transfer-Encoding ist ausschließlich als einmaliges
`chunked` zulässig. Ein deklarierter zu großer Body wird früh als `413`, ein
fehlerhafter, doppelter oder von der tatsächlichen Bytezahl abweichender
Längenwert als `400` abgelehnt.

### Lokale Ressourcen- und Wire-Grenzen

Der exportierte Grenzwertrecord enthält exakt:

| Feld | Wert | Wirkung |
| --- | ---: | --- |
| `maxHeaderSize` | `8192` | Node-Parsergrenze für Headerbytes |
| `maxHeaderFields` | `32` | anwendungsseitige Headerfeldgrenze; Feld 33 ist nur Parser-Sentinel |
| `headersTimeoutMs` | `5000` | endliche Headerzeit |
| `requestTimeoutMs` | `10000` | endliche Requestzeit |
| `socketTimeoutMs` | `10000` | endliche Socket-Inaktivität; ein nicht mehr kontrollierbarer Socket wird geschlossen |
| `connectionsCheckingIntervalMs` | `100` | fester maximaler Prüftakt für Node-Header- und Requestfristen bei responsivem Eventloop |
| `keepAliveTimeoutMs` | `1000` | kurze Keep-Alive-Zeit |
| `maxRequestsPerSocket` | `1` | höchstens ein Request pro Socket |

Die anwendungsseitige Request-Admission ist die maßgebliche Durchsetzung des
Ein-Request-Limits, auch wenn Node für ein Protokoll- oder Pipelineprofil kein
`dropRequest` auslöst. `maxRequestsPerSocket: 1` und der synchrone
`dropRequest`-Handler bleiben zusätzliche Defense-in-Depth. Der Handler
beansprucht den terminalen Response-Owner und zerstört den Socket, ohne eine
zusätzliche Node- oder Gateway-Response zu erzeugen.

Node prüft die absoluten Header- und Requestfristen mit diesem festen Intervall.
Regelmäßig eintreffende Teilbytes verlängern diese Fristen nicht. Bei
responsivem Eventloop wird ihr Ablauf daher spätestens im nächsten Prüftakt,
also höchstens `100` ms nach der nominellen Produktionsfrist, erkannt.
Eventloop- oder Betriebssystem-Scheduling kann den tatsächlich beobachteten
Verbindungsabschluss zusätzlich verzögern; eine stärkere Wall-Clock-Garantie
wird nicht behauptet.

Die Factory akzeptiert `useTestTimeoutPolicy: true` ausschließlich zusammen mit
`port: 0`. Diese enge Testinjektion setzt Header-, Request-, Socket- und
Prüftaktwerte fest auf `250`, `500`, `500` und `25` ms; andere Werte können
nicht injiziert werden. Sie ist über keine Runtime- oder Umgebungsvariable
erreichbar und kann keinen Produktionslistener mit Port `1` bis `65535`
abschwächen. Jeder andere Wert als exakt `false` beziehungsweise die genannte
Testkombination wird als ungültige Komposition abgelehnt.

Geschützte Antworten setzen zusätzlich `Connection: close`. Diese Grenzen
begrenzen den lokalen Node-Prozess, sind aber keine vollständige Kernel-,
Vorallokations- oder DoS-Garantie und kein Ersatz für die weiterhin geplanten
mehrschichtigen Rate Limits.

Die tatsächliche Bodygrenze verwendet keine zweite Zahl, sondern importiert
`SYNC_CONTRACT_MAX_RAW_BODY_BYTES` als kanonische Grenze von 65.536 Bytes aus
dem SyncContract. `Content-Length` ist nur ein frühes Signal. Jeder tatsächlich
empfangene Buffer-Chunk wird mit `chunk.byteLength` gezählt. Chunks werden nur
solange in der begrenzten Anwendungsliste gehalten, wie die Gesamtlänge
höchstens 65.536 Bytes beträgt. Sobald der nächste Chunk Byte 65.537 erreichen
würde, wird die Liste geleert, der Request pausiert und `413` gesendet; der
vollständige übergroße Body wird nicht mit `Buffer.concat` materialisiert. Der
aktuelle Node-Chunk kann zu diesem Zeitpunkt bereits alloziert sein, und die
Foundation behauptet keine Kontrolle über Kernel- oder Node-Vorallokation.

Erst nach vollständig beendetem und längenkonsistentem Empfang wird der
begrenzte Body einmal zusammengefügt. Die Decoderfactory muss einen Decoder mit
`fatal: true`, `ignoreBOM: true` und funktionalem `decode` liefern. `decode`
wird über den vollständigen Buffer exakt einmal aufgerufen. Ungültiges UTF-8
ergibt den lokalen HTTP-Fehler `400`; es gibt keine stückweise
Stringkonvertierung, Normalisierung, Trimmung oder Reparatur.

`ignoreBOM: true` bewahrt eine gültige führende UTF-8-BOM als U+FEFF im
resultierenden String. Sie wird nicht entfernt. Der unveränderte String gelangt
exakt einmal an `processSyncRawBody`; das HTTP-Modul besitzt keinen eigenen
JSON-Parser. Eine führende U+FEFF-BOM scheitert deshalb an der nativen
`JSON.parse`-Semantik der bestehenden Boundary und wird als deren
`INVALID_JSON`-Gateway-Response über HTTP `400` ausgegeben.

### Lokaler HTTP-Fehlervertrag und Boundary-Ausnahme

Vom Gateway selbst erzeugte lokale JSON-Ablehnungen verwenden ausschließlich
den exakten Envelope `{ ok: false, status, error: { code, message } }` mit den
folgenden statischen Profilen:

| HTTP | `status` | `error.code` | `error.message` |
| ---: | --- | --- | --- |
| `400` | `invalidHttpRequest` | `invalidLocalSyncGatewayHttpRequest` | `Die lokale SyncGateway-HTTP-Anfrage ist ungültig.` |
| `403` | `originRejected` | `localSyncGatewayOriginRejected` | `Die Anfrage ist für diese lokale Origin nicht erlaubt.` |
| `404` | `routeNotFound` | `localSyncGatewayRouteNotFound` | `Die angeforderte lokale SyncGateway-Route ist nicht verfügbar.` |
| `405` | `methodNotAllowed` | `localSyncGatewayMethodNotAllowed` | `Die HTTP-Methode ist für das lokale SyncGateway nicht erlaubt.` |
| `413` | `payloadTooLarge` | `localSyncGatewayPayloadTooLarge` | `Die lokale SyncGateway-Anfrage überschreitet die zulässige Größe.` |
| `415` | `unsupportedMediaType` | `localSyncGatewayUnsupportedMediaType` | `Medientyp oder Inhaltskodierung der lokalen SyncGateway-Anfrage wird nicht unterstützt.` |
| `417` | `expectationRejected` | `localSyncGatewayExpectationRejected` | `Die HTTP-Erwartung wird vom lokalen SyncGateway nicht unterstützt.` |
| `431` | `requestHeadersTooLarge` | `localSyncGatewayRequestHeadersTooLarge` | `Die HTTP-Header der lokalen SyncGateway-Anfrage überschreiten die zulässige Größe.` |
| `500` | `gatewayFailed` | `localSyncGatewayFailed` | `Die lokale SyncGateway-Anfrage konnte nicht sicher verarbeitet werden.` |

JSON-Antworten setzen `Content-Type: application/json; charset=utf-8`, die
exakte Byte-Länge, `Cache-Control: no-store`,
`X-Content-Type-Options: nosniff` und `Connection: close`. HTTP `204` ist der
bodyfreie Preflight-Erfolg; HTTP `200` trägt ausschließlich die defensiv
projizierte normale SyncResponse des komponierten lokalen `syncTest`.
Pro physischem Socket kann genau ein Anwendungs- oder Raw-Socket-Pfad den
Responsebesitz übernehmen. Nach dieser Übernahme schreibt insbesondere
`clientError` keine zweite Statuszeile oder Response; der Pfad darf den Socket
höchstens noch schließen. Ein Parserfehler vor jeder anderen Übernahme kann
dagegen genau eine kontrollierte Raw-Response erwerben. Auch ein Throw beim
Schreiben gibt den Responsebesitz nicht für einen zweiten Schreibversuch frei.
Jeder Raw-Socket-Pfad versucht seine statische redigierte Response best effort
zu schreiben und zerstört den Socket nach dem akzeptierten Write
beziehungsweise im Fallback unmittelbar. Asynchrone Schreibfehler werden
redigiert konsumiert und führen ausschließlich zum idempotenten Destroy. Ist
der Response-Owner bereits vergeben, wird nichts geschrieben und der Socket
sofort zerstört. Eine vollständige Zustellung auf einem bereits beschädigten
Socket wird nicht garantiert.
Ein Node-Parser- oder Socketpfad, der keine kontrollierte JSON-Antwort mehr
zulässt, wird fail-closed beendet. Im ansonsten regulären Requestpfad, sofern
keine frühere fail-closed Target- oder Sonderpfadablehnung greift, gehört ein
regulär parsebarer fehlender, doppelter oder falscher HTTP/1.1-Host
ausdrücklich nicht zu diesem laufzeiteigenen Pfad: Durch
`requireHostHeader: false` läuft er nach Admission unter demselben
Response-Owner in den statischen lokalen `invalidHttpRequest`-Envelope. Er
erhält keine CORS-Freigabe, spiegelt keine Eingabe und ruft Decoder oder
Boundary nicht auf.
Dasselbe gilt für abgelaufene Header-, Request- oder Socketpfade: Abhängig vom
Node-Parserzustand kann ein kontrollierter Verbindungsabschluss oder eine
minimale laufzeiteigene Timeoutantwort erfolgen; ein eigener JSON-Envelope wird
dort nicht garantiert.

Eine kontrollierte Boundary-Ablehnung ist die einzige Ausnahme vom lokalen
Envelope. Das HTTP-Modul validiert die bereits erzeugte
`gatewayErrorResponse` nochmals mit `validateSyncGatewayErrorResponse` und
serialisiert ausschließlich diese unveränderte Contractresponse mit HTTP
`400`. Sie wird nicht in einen lokalen HTTP-Fehler umgeschrieben. Ein
akzeptierter Boundary-Request muss exakt die sechs kanonischen eigenen
Dateneigenschaften besitzen, den bestehenden Requestvalidator bestehen und am
Root sowie am leeren Payload eingefroren sein. Erst dann wird exakt diese
Identität synchron höchstens einmal an den injizierten SyncAgent übergeben.
Nur der exakte tief eingefrorene ADR-0024-Erfolg wird gegen denselben Request
validiert, in einen frischen disjunkten Zehn-Felder-Responsegraphen projiziert,
erneut validiert, tief eingefroren, terminal verifiziert, exakt einmal vorab
serialisiert und mit HTTP `200` ausgegeben. Ein Boundary-Throw,
lokaler `boundaryFailed`-Result oder eine ungeeignete beziehungsweise nicht
vollständig eingefrorene Projektion ergibt den lokalen
`gatewayFailed`-Envelope mit HTTP `500`.

Damit bleiben drei Ebenen ausdrücklich getrennt:

1. lokale HTTP- und Runtimefehler behaupten keine Contract- oder
   Agentenverarbeitung;
2. frühe `gateway_`-Fehler sind vollständig gültige, aber nicht normal
   korrelierte SyncContract-Responses;
3. normale `req_`-korrelierte SyncResponses entstehen im lokalen SyncAgent-
   Kern und erreichen ausschließlich über den implementierten ADR-0025-
   Kompositionspfad die HTTP-Grenze.

Die Foundation implementiert keinen Browser-SyncTransport, keinen ausgehenden
HTTPS-Request, Cloud-Endpunkt, n8n-Workflow, Authentisierungsheader, Secret,
keine Persistenz, Requestlogs, Telemetrie, Rate Limits oder `src/main.js`-
Komposition. Ausschließlich der leere synthetische `syncTest` besitzt den
lokalen SyncAgent-/Normalresponse-Pfad. PromptVault, LearningHub, LichtwaldLog
und GoldenDawn-Vault werden weder gelesen noch exportiert. Der Loopback-
Listener ist ein lokaler Sicherheits-Hop, kein allgemeines Backend und kein
externer Datenfluss.

## Öffentliche API der Generated n8n Boundary Bundle Foundation

Die einzigen fachlich kanonischen Quellen bleiben:

```text
src/contracts/syncContract.js
src/gateways/syncGatewayRequestBoundary.js
```

Der Entry `scripts/n8n/syncGatewayBoundaryBundleEntry.js` exponiert aus diesen
Modulen nur die erlaubte Factory. Er ist eine kleine explizit gepflegte,
manifestierte nichtfachliche Glue- und Quelldatei. Der Generator
`scripts/n8n/generateSyncGatewayBoundaryBundle.js` ist gepflegtes
Repository-Tooling und erzeugt daraus die beiden reproduzierbar generierten
Derivate Bundle und Manifest:

```text
artifacts/n8n/syncGatewayRequestBoundary.bundle.js
artifacts/n8n/syncGatewayRequestBoundary.bundle.manifest.json
```

Contract und Boundary bleiben die einzigen fachlich kanonischen Quellen.
Entry und Generator sind keine fachlichen Kopien und selbst keine generierten
Derivate.

Nach dem statischen Header sind die Artefaktbytes selbst genau ein
seiteneffektfreies, direkt bindbares JavaScript-Expression-IIFE ohne
Top-Level-`var` oder Globalmutation. `"use strict";` ist der erste Prolog im
IIFE-Body und kein Top-Level-Statement; nach dem Ausdruck folgt kein separates
Semikolon-Statement. Das vollständige Artefakt kann deshalb unverändert
unmittelbar hinter `const boundaryBundle =` eingesetzt werden. Seine
Auswertung liefert eine gewöhnliche, eingefrorene API mit exakt diesem eigenen
aufzählbaren Feld:

```js
{
  createSyncGatewayRequestBoundary
}
```

Die Factory besitzt unverändert die kanonische Signatur:

```js
createSyncGatewayRequestBoundary({
  generateGatewayRequestId,
  getCurrentTimestamp,
} = {})
```

Ihr Result ist weiterhin eine gewöhnliche, eingefrorene API mit exakt:

```js
{
  processSyncRawBody
}
```

`processSyncRawBody` bleibt synchron, akzeptiert exakt ein Argument und liefert
denselben tief eingefrorenen exakten Fünf-Felder-Result wie die kanonische
Boundary. Argument-, Größen-, Parse-, Validierungs-, Projektions-, Freeze-,
Clock-, Generator-, Redaction- und Identitätssemantik ändern sich nicht. Das
Bundle ist deshalb kein eigener Contract und kein alternatives
Normalisierungs- oder Fehlerprofil.

Das Auswerten des IIFE ruft die Factory oder Boundary nicht automatisch auf.
Das Artefakt benötigt weder ESM- noch CommonJS-Imports und besitzt kein
`import`, `export`, `require()`, `eval()` oder `new Function()`. Es greift nicht
auf Netzwerk, Dateisystem, Prozesse, Environment, Credentials oder Secrets zu,
erzeugt keine Consoleausgabe oder Telemetrie und mutiert keinen globalen
Namespace. Es erfindet keine n8n-Webhook-, `$json`-, `$input`-, `items`- oder
sonstige Eingabeform.

Die Artefaktgrenze beginnt ausschließlich bei einem bereits materialisierten
JavaScript-Wert. Ein überhaupt beibehaltener Cloudadapter verlangte nach
Schema 1 einen neuen ADR, eine neue Evidenz-Schemaversion sowie eigene
Spezifikations- und Kompositionsfreigaben und müsste Raw-Wire-Zählung und
strikte UTF-8-Decodierung vornehmen. Weder Bundle noch lokale Parität belegen
ursprüngliche Wire-Oktette oder Provider-Preallocation-Schutz.

### Generator- und Checkvertrag

Die expliziten Befehle lauten:

```text
npm run bundle:n8n:generate
npm run bundle:n8n:check
```

Der Generate-Modus schreibt ausschließlich das erwartete Bundle und das
zugehörige Manifest. Der Checkmodus berechnet die erwarteten Bytes im Speicher,
verändert keine Projektdatei und endet bei Drift mit einem Fehlercode.
Identische Eingaben erzeugen unabhängig vom absoluten Arbeitsverzeichnis
byteidentische Ausgaben. Rolldown verwendet `strict: true` und
`attachDebugInfo: "none"`, sodass keine potenziell pfadabhängigen
`//#region …`-/`//#endregion`-Direktiven entstehen. Der Generator validiert
den exakten Modulgraphen und die vollständige bekannte Wrapperform, entfernt
fail-closed nur den deklarativen Wrapper und bearbeitet fachlichen Code nicht
textuell. Contract, Boundary und Entry werden jeweils exakt einmal über einen
sicheren FileHandle gelesen. SHA-256 und die Vite-Virtualmodule werden aus
demselben danach unveränderlichen In-Memory-Snapshot erzeugt; der Bundler liest
die Live-Quellen nicht erneut. Ein ABA-Wechsel der Arbeitsbaumdateien kann
deshalb nicht unbemerkt andere Bundler- als Manifestbytes liefern. Bundle und
Manifest sind UTF-8 ohne BOM, verwenden
ausschließlich LF, besitzen einen finalen Zeilenumbruch und enthalten weder
Source Map noch Zeit-, Zufalls-, Locale-, Host- oder Pfadwerte.

Der Generate-Modus verifiziert vor jedem Write den kanonischen
Repository-Root, den Zielordner und beide festen Outputpfade auf Containment,
von Node erkannte symbolische Links und Junctions sowie
`realpath`-Abweichungen. Unklare oder herausführende Pfade werden fail-closed
abgelehnt. Unvorhersagbar benannte, exklusiv angelegte Tempdateien liegen im
verifizierten Zielordner; Identität und Bytes werden geprüft. Anschließend wird
zuerst das Artefakt und zuletzt das Manifest individuell ersetzt, das Paar
erneut geprüft und weiterhin identitätsgleich zuordenbare Tempdateien werden
bereinigt. Ein kontrollierter Abbruch zwischen beiden Replaces hinterlässt ein
vom Checkmodus erkanntes Mischpaar. Dies ist keine atomare Paartransaktion und
keine Power-Loss- oder Single-Writer-Garantie. Die portable Node-API attestiert
nicht jeden Windows-Reparse-Tag; Schutz gegen einen bösartigen gleichzeitigen
Reparse-Austausch wird nicht behauptet.

### Integritätsmanifest

`artifacts/n8n/syncGatewayRequestBoundary.bundle.manifest.json` besitzt eine
feste Manifestschema-Version und eine feste Propertyreihenfolge. Es enthält den
repository-relativen Artefaktpfad mit SHA-256 über die exakten Artefaktbytes und
anschließend diese feste geordnete Quellenfolge mit dem SHA-256-Hash der jeweils
exakten Bytes:

```json
{
  "schemaVersion": 1,
  "artifact": {
    "path": "artifacts/n8n/syncGatewayRequestBoundary.bundle.js",
    "sha256": "<64 lowercase hexadecimal characters>"
  },
  "sources": [
    {
      "path": "src/contracts/syncContract.js",
      "sha256": "<64 lowercase hexadecimal characters>"
    },
    {
      "path": "src/gateways/syncGatewayRequestBoundary.js",
      "sha256": "<64 lowercase hexadecimal characters>"
    },
    {
      "path": "scripts/n8n/syncGatewayBoundaryBundleEntry.js",
      "sha256": "<64 lowercase hexadecimal characters>"
    }
  ]
}
```

1. `src/contracts/syncContract.js`;
2. `src/gateways/syncGatewayRequestBoundary.js`;
3. `scripts/n8n/syncGatewayBoundaryBundleEntry.js`.

Das Manifest enthält keine Uhrzeit, absoluten oder temporären Pfade, Hostnamen
oder maschinenabhängigen Werte. Zusammen mit dem Checkmodus macht es Drift der
manifestierten Dateien erkennbar; erst ein erfolgreicher Check belegt deren
byteidentische Konsistenz zum Prüfzeitpunkt. Es ist keine signierte Herkunfts-
oder Deploymentattestierung. Der Generator ist gepflegtes Tooling und kein
manifestiertes fachliches Quellmodul; seine Review- und Lockfilegrenze wird
nicht durch die drei Quellenhashes ersetzt.

## Öffentliche API der n8n Cloud Ingress & Runtime Evidence Gate Foundation

Die n8n-Cloud-Evidence-Foundation ist ein ausschließlich synthetischer,
standardmäßig netzwerkinaktiver Prüfpfad. Sie besteht aus:

```text
scripts/n8n/n8nCloudIngressProbe.js
scripts/n8n/n8nCloudIngressProbeObserver.js
tests/n8nCloudIngressProbe.test.js
docs/evidence/n8n-cloud-ingress-runtime-evidence.template.json
```

Der kanonische und vorgesehene technische Operator-Laufweg ist
`npm run probe:n8n:cloud:test -- --vector <probeId>`. Das Paket-Script bindet
exakt `node scripts/n8n/n8nCloudIngressProbe.js --run`; die nach `--`
weitergereichte Option wählt genau einen Vektor. Import, bloße Factory-
Erzeugung, Tests, Build, Dev-Server und Bundle-Check binden keinen Real-HTTPS-
Transport. Ein direkter CLI-Start endet statisch und ohne Netzwerkzugriff,
wenn `--run`, exakt eine syntaktisch gültige `--vector`-Option, eine
allowlist-validierte ID oder die vollständig gültige Runtimekonfiguration
fehlt. Das Kommando beschreibt nur die technische API und erteilt keine
Freigabe. Es darf erst nach dem vollständigen ADR-/Schema-Vorabgate und der
eigenen ausdrücklichen Freigabe genau dieses einzelnen One-shots verwendet
werden.

Das Modul `scripts/n8n/n8nCloudIngressProbe.js` exportiert genau die für den
lokalen Katalog-, Lauf- und Evidenzvertrag benötigten Konstanten und
Funktionen:

| Export | Exakter Vertrag |
| --- | --- |
| `N8N_CLOUD_INGRESS_PROBE_ENV` | eingefroren; exakt `{ endpoint: 'GOLDENDAWN_N8N_CLOUD_PROBE_ENDPOINT', secret: 'GOLDENDAWN_N8N_CLOUD_PROBE_SECRET' }` |
| `N8N_CLOUD_INGRESS_PROBE_LIMITS` | eingefroren; exakt `{ timeoutMs: 5000, responseBytes: 16384, endpointCharacters: 2048, secretCharacters: 512 }` |
| `N8N_CLOUD_INGRESS_PROBE_GATES` | eingefrorene geordnete Liste exakt `['PASS', 'FAIL', 'UNPROVEN']` |
| `N8N_CLOUD_INGRESS_PROBE_STRICT_UTF8_OUTCOMES` | eingefrorene geordnete Liste exakt `['validExact', 'invalidRejected', 'validMismatch', 'invalidAccepted', 'unavailable']` |
| `N8N_CLOUD_INGRESS_PROBE_AUTHORIZATION_HEADER_PRESENCES` | eingefrorene geordnete Liste exakt `['absent', 'present', 'unavailable']` |
| `N8N_CLOUD_INGRESS_PROBE_CONTENT_ENCODING_OUTCOMES` | eingefrorene geordnete Liste exakt `['match', 'mismatch', 'unavailable']` |
| `N8N_CLOUD_INGRESS_PROBE_VECTOR_IDS` | eingefrorene geordnete Liste der unten festgelegten 32 Probe-IDs |
| `getN8nCloudIngressProbeVectors()` | materialisiert die 32 Vektoren in fester Reihenfolge als frische Buffer und liefert eine eingefrorene Liste |
| `readN8nCloudIngressProbeRuntimeConfig()` | akzeptiert keine Argumente, liest ausschließlich die beiden benannten Werte aus `process.env` und liefert einen eingefrorenen Success- oder statisch redigierten Fehlerresult |
| `createN8nCloudIngressProbe({ requestHttps, runtimeConfig, probeId, scheduleTimeout, cancelTimeout })` | erfordert eine bereits validierte Runtimekonfiguration, eine allowlist-validierte Vektor-ID und einen explizit injizierten Transport; besitzt keinen Real-HTTPS-Default oder -Fallback und liefert die eingefrorene One-shot-API `{ run }` |
| `aggregateN8nCloudIngressProbeGates(gates)` | aggregiert ausschließlich nach der unten festgelegten `FAIL`-/Vollständigkeitspräzedenz |
| `createN8nCloudIngressEvidenceTemplate()` | erzeugt die geschlossene, unbelegte Schema-1-Evidenz mit 32 `UNPROVEN`-Vektoren und getrennten festen sowie variablen Statusfeldern |
| `validateN8nCloudIngressEvidence(value)` | validiert Form, Metadaten, feste Vektoridentität, Nullsemantik und Gatekonsistenz; liefert exakt `{ ok, errors }` |
| `runN8nCloudIngressProbeCli({ args, resolveHttpsRequest, stdout, stderr, scheduleTimeout, cancelTimeout } = {})` | expliziter One-shot-CLI-Adapter; validiert Argumentform, Runtimekonfiguration und ID vollständig, löst erst danach Real-HTTPS auf, schreibt nur sanitisiertes JSON beziehungsweise eine statische Fehlermeldung und liefert einen Exitcode |

Eine Runtimekonfiguration ist nur gültig, wenn `endpoint` eine nicht leere
`https:`-Test-URL ohne Userinfo, Query, Fragment oder ASCII-Steuer-/Leerzeichen
ist und einen kanonischen Pfad der Form
`/webhook-test/<segment>[/<segment>…]` besitzt. Jedes nicht leere Suffixsegment
besteht ausschließlich aus ASCII-Buchstaben, Ziffern, Bindestrich oder
Unterstrich. Prozentkodierungen, rohe oder kodierte Backslashes,
Steuerzeichen, leere Segmente sowie `.` und `..` sind unzulässig. Production-
URL-Pfade und jede andere Endpointart werden vor Auflösung oder Zugriff auf den
realen Transport abgelehnt. Das Wegwerfsecret muss 32 bis 512 druckbare ASCII-
Zeichen aus dem Bereich `!` bis `~` besitzen. Beide Werte stammen
ausschließlich aus der Runtimeumgebung. Sie sind kein CLI-Argument, werden
nicht in Evidenz übernommen und erscheinen weder in Erfolgs- noch
Fehlerausgaben.

Der Config-Reader liefert bei Erfolg exakt
`{ ok: true, config: { endpoint, secret } }`; der äußere Result und `config`
sind eingefroren. Bei Ablehnung liefert er ausschließlich den unten
dokumentierten statischen `invalidRuntimeConfig`-Fehlerresult.

`createN8nCloudIngressProbe(...)` liefert ausschließlich bei explizit
injiziertem Transport eine eingefrorene gewöhnliche API mit exakt:

```js
{
  run
}
```

`run()` akzeptiert keine Argumente, ist Promise-basiert und konsumiert die bei
der Factoryerzeugung bereits allowlist-validierte `probeId` höchstens einmal.
Er sendet ausschließlich diesen Vektor in genau einem HTTPS-Request und lehnt
jeden zweiten Aufruf derselben Factory ohne weiteren Transportzugriff ab. Es gibt keinen
Katalog-Sweep, kein Autoregister, keinen Redirect-Follow, Retry, zweiten
Versuch, parallelen Probe oder Production-URL-Pfad. Der erste und jeder weitere
One-shot benötigen jeweils ihre eigene ausdrückliche Freigabe. Erst danach muss
der Operator den temporären Test-Webhook für genau diesen Vektor manuell
registrieren beziehungsweise erneut in Listening versetzen und einen neuen
CLI-Aufruf starten. Jeder Request verwendet
`Content-Type: application/octet-stream`, `Accept: application/json`, den
eigenen Header `X-GoldenDawn-Probe-Id`, `Connection: close` sowie die für den
Vektor festgelegten Authorization-, Content-Encoding- und Framingfelder.

Jeder von `getN8nCloudIngressProbeVectors()` materialisierte Katalogeintrag
besitzt exakt diese neun eigenen Felder:

```js
{
  probeId,
  body,
  expectedByteLength,
  expectedSha256,
  expectedStrictUtf8Outcome,
  contentEncoding,
  authMode,
  framing,
  gateKind,
}
```

Der Eintrag selbst ist eingefroren; `body` bleibt ein frischer Buffer für den
unmittelbaren Request und wird bei jedem neuen Katalogaufruf neu aufgebaut.
`gateKind` ist ausschließlich `normal`, `compressed`, `authNegative` oder
`authCorrect` und wählt die unten dokumentierte fail-closed Einzelbewertung;
es ist keine Tenant- oder Aktivierungsentscheidung.

### Fester 32-Vektor-Katalog

Die Reihenfolge der folgenden Tabelle ist Vertragsbestandteil. Die Spalte
„Bytes“ beschreibt die lokalen unveränderten Ausgangsbytes; Escape-Sequenzen
stehen für die genannten Bytes und werden nicht als literaler Backslashtext
gesendet.

| Kategorie | `probeId` | Exakte lokale Bytes beziehungsweise Bildung | Länge | erwartetes `strictUtf8Outcome` | Transportvariante |
| --- | --- | --- | ---: | --- | --- |
| Inhalt | `valid-sync-test-json` | UTF-8 von `{"version":"1.0","action":"syncTest","source":"goldendawn-os","requestId":"req_probe_00000000-0000-4000-8000-000000000000","timestamp":"2026-08-19T00:00:00.000Z","payload":{}}` | 175 | `validExact` | Standard |
| Inhalt | `invalid-json` | UTF-8 von `{"version":"1.0",}`; der Observer parst es nicht als JSON | 18 | `validExact` | Standard |
| Inhalt | `ascii` | UTF-8 von `GoldenDawn ASCII probe v1\n` | 26 | `validExact` | Standard |
| Inhalt | `multibyte-utf8` | UTF-8 von `Grüße aus dem Lichtwald` | 25 | `validExact` | Standard |
| Inhalt | `four-byte-utf8` | UTF-8 von `GoldenDawn 🌅 probe` | 21 | `validExact` | Standard |
| Inhalt | `utf8-bom` | `EF BB BF` gefolgt von UTF-8 von `GoldenDawn BOM probe v1` | 26 | `validExact` | Standard |
| Inhalt | `unicode-nfc` | UTF-8 von NFC `Café` mit U+00E9 | 5 | `validExact` | Standard |
| Inhalt | `unicode-nfd` | UTF-8 von `Cafe` gefolgt von U+0301 | 6 | `validExact` | Standard |
| Inhalt | `crlf-trailing-whitespace` | UTF-8 von `line-one\r\nline-two\r\n  ` | 22 | `validExact` | Standard |
| Inhalt | `embedded-nul` | UTF-8 von `Golden`, Byte `00`, UTF-8 von `Dawn` | 11 | `validExact` | Standard |
| ungültiges UTF-8 | `invalid-utf8-c3-28` | `C3 28` | 2 | `invalidRejected` | Standard |
| ungültiges UTF-8 | `incomplete-utf8-e2-82` | `E2 82` | 2 | `invalidRejected` | Standard |
| ungültiges UTF-8 | `overlong-utf8-c0-af` | `C0 AF` | 2 | `invalidRejected` | Standard |
| ungültiges UTF-8 | `isolated-utf8-continuation` | `80` | 1 | `invalidRejected` | Standard |
| Bytegrenze | `body-65535-bytes` | 65.535 Wiederholungen von `41` | 65.535 | `validExact` | Standard |
| Bytegrenze | `body-65536-bytes` | 65.536 Wiederholungen von `41`; vollständiger A-Präfix des nächstgrößeren Fixtures | 65.536 | `validExact` | Standard |
| Bytegrenze | `body-65537-bytes` | 65.537 Wiederholungen von `41`; erweitert das 65.536-Byte-Fixture um exakt ein A-Byte | 65.537 | `validExact` | Standard |
| Bytegrenze | `multibyte-65536-bytes` | 32.768 Wiederholungen von UTF-8 `C3 A4` | 65.536 | `validExact` | Standard |
| Content-Encoding | `content-encoding-absent` | UTF-8 von `GoldenDawn-content-encoding-probe-v1` | 36 | `validExact` | kein `Content-Encoding` |
| Content-Encoding | `content-encoding-identity` | exakt derselbe 36-Byte-Sentinel wie `content-encoding-absent` | 36 | `validExact` | `Content-Encoding: identity` |
| Content-Encoding | `content-encoding-gzip` | Base64 `H4sIAAAAAAAACnPPz0lJzXNJLM/TTc7PK0nNK9FNzUvOT8nMS9ctKMpPStUtMwQATfMEoiQAAAA=`; dekomprimiert zum gemeinsamen 36-Byte-Sentinel | 56 | `invalidRejected` | `Content-Encoding: gzip` |
| Content-Encoding | `content-encoding-deflate` | Base64 `eJxzz89JSc1zSSzP003OzytJzSvRTc1Lzk/JzEvXLSjKT0rVLTMEAP9XDZk=`; dekomprimiert zum gemeinsamen 36-Byte-Sentinel | 44 | `invalidRejected` | `Content-Encoding: deflate` |
| Content-Encoding | `content-encoding-br` | Base64 `GyMA+AXqZDFdELpNyTbfjEY7IkoyBUkQgmHpYrs0nj+AqHwBxRk=`; dekomprimiert zum gemeinsamen 36-Byte-Sentinel | 38 | `invalidRejected` | `Content-Encoding: br` |
| Content-Encoding/Expansion | `compressed-expands-65537` | Base64 `H4sIAAAAAAACCu3BgQAAAADDILb5S/0gVQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMANrYbBPgEAAQA=` | 98 | `invalidRejected` | `Content-Encoding: gzip`; dekomprimiert 65.537 Bytes |
| Header Authentication | `auth-missing` | UTF-8 von `GoldenDawn-auth-probe-v1` | 24 | `validExact` | kein `Authorization` |
| Header Authentication | `auth-wrong` | exakt derselbe Auth-Body | 24 | `validExact` | falscher Bearerwert |
| Header Authentication | `auth-correct` | exakt derselbe Auth-Body | 24 | `validExact` | genau ein korrekter Bearerwert |
| Header Authentication | `auth-duplicate-equal` | exakt derselbe Auth-Body | 24 | `validExact` | zwei gleiche `Authorization`-Felder |
| Header Authentication | `auth-duplicate-conflicting-correct-first-wrong-last` | exakt derselbe Auth-Body | 24 | `validExact` | korrekter, danach falscher `Authorization`-Wert |
| Header Authentication | `auth-duplicate-conflicting-wrong-first-correct-last` | exakt derselbe Auth-Body | 24 | `validExact` | falscher, danach korrekter `Authorization`-Wert |
| HTTP-Framing | `framing-content-length` | UTF-8 von `GoldenDawn-framing-probe-v1` | 27 | `validExact` | exaktes `Content-Length` |
| HTTP-Framing | `framing-chunked` | exakt derselbe Framing-Body | 27 | `validExact` | `Transfer-Encoding: chunked`, kein `Content-Length` |

„Standard“ bedeutet: kein `Content-Encoding`, genau ein korrektes
`Authorization: Bearer <Wegwerfsecret>` und `Content-Length` über die exakte
Vektorbytelänge. Die Credential- und Framingvarianten werden als rohe
Headerpaare aufgebaut, damit insbesondere doppelte Authorization-Felder nicht
vor dem Request stillschweigend in ein Objekt zusammengeführt werden.

`expectedByteLength` und `expectedSha256` stammen ausschließlich aus demselben
lokal materialisierten Vektorbuffer: Die Länge ist dessen `byteLength`, der
Digest ist SHA-256 über genau diese Bytes in lowercase Hex. Bei den vier
komprimierten Vektoren beziehen sich beide Werte auf die codierten Wire-Bytes,
nicht auf deren dekomprimierten Inhalt. Die fest eingecheckte
`docs/evidence/n8n-cloud-ingress-runtime-evidence.template.json` spiegelt diese
32 Längen und Digests in derselben Reihenfolge. Der Evidenzvalidator lehnt
abweichende IDs, Reihenfolge, Länge oder Digest ab; keine Runtimeantwort darf
einen Erwartungswert liefern oder überschreiben.

### Standalone-Code-Node-Observer

`scripts/n8n/n8nCloudIngressProbeObserver.js` ist nach seinem Kommentar exakt
ein importfreies Expression-IIFE. Seine Auswertung ist inert und liefert eine
asynchrone Observerfunktion. Der menschenprüfbare Inhalt wird im temporären
n8n-Code-Node unverändert so gebunden und aufgerufen:

```js
const observeProbe = <unveränderter Inhalt von n8nCloudIngressProbeObserver.js>
return await observeProbe.call(this, $input)
```

Die Funktion akzeptiert exakt ein Argument. Sie liest nur aus dem ersten Item
die eigenen aufzählbaren Dateneigenschaften
`json.headers['x-goldendawn-probe-id']` und akzeptiert dort ausschließlich eine
der 32 festen IDs. Erst danach ruft sie für einen beobachtbaren Vektor exakt
einmal `this.helpers.getBinaryDataBuffer(0, 'data')` auf. Ein unbekannter,
fehlender, accessorbasierter oder strukturell ungeeigneter Probe-Identifier
endet vor dem Helperaufruf mit einer statisch redigierten Exception.

Der Observer rekonstruiert die Erwartungsbytes unabhängig vom lokalen Runner,
vergleicht Länge und jedes Byte manuell und klassifiziert die empfangenen Bytes
mit `TextDecoder('utf-8', { fatal: true, ignoreBOM: true })`. Er prüft die
Runtime-Semantik zusätzlich mit BOM- und ungültiger UTF-8-Selbstprobe. Durch
`ignoreBOM: true` bleibt U+FEFF im decodierten Text erhalten. Es gibt keine
NFC-/NFD-, Zeilenenden-, Whitespace- oder sonstige Normalisierung.

Das Result ist exakt ein n8n-Item und besitzt genau diese sechs eigenen
aufzählbaren JSON-Felder:

```js
[
  {
    json: {
      probeId,
      exactMatch,
      receivedByteLength,
      strictUtf8Outcome,
      authorizationHeaderPresence,
      contentEncodingOutcome,
    },
  },
]
```

| `strictUtf8Outcome` | Bedeutung |
| --- | --- |
| `validExact` | Der erwartete gültige UTF-8-Vektor wurde fatal decodiert und der Text einschließlich BOM, Normalisierungsform und Whitespace stimmt exakt. |
| `invalidRejected` | Der erwartete ungültige UTF-8-Vektor löste beim fatalen Decoder einen Throw aus. |
| `validMismatch` | Ein als gültig erwarteter Vektor wurde nicht exakt decodiert oder vom fatalen Decoder abgelehnt. |
| `invalidAccepted` | Ein als ungültig erwarteter Vektor wurde ohne Throw decodiert. |
| `unavailable` | Die erforderliche sichere `TextDecoder`-Semantik war nicht nachweisbar oder die beobachtete Eingabe lag außerhalb der Observergrenze. |

`authorizationHeaderPresence` ist ausschließlich `absent`, `present` oder
`unavailable`. Es klassifiziert nur, ob der standardisierte Webhook-Headerrecord
eine eigene `authorization`-Dateneigenschaft enthält; der Wert wird nie
ausgegeben. `contentEncodingOutcome` ist ausschließlich `match`, `mismatch`
oder `unavailable` und vergleicht die beobachtete Headerklassifikation mit der
für den Vektor erwarteten Kodierung. Beide Felder sind von Byte- und
UTF-8-Vergleich getrennt.

`exactMatch` bleibt ein davon unabhängiger exakter Bytevergleich. Selbst wenn
die UTF-8-Klasse zufällig der Erwartung entspricht, führt `exactMatch: false`
im Runner zu `FAIL`. Der Observer gibt keine Roh-, Text-, Hex-, Base64- oder
Hashdaten aus und besitzt keine Netzwerk-, Logging-, Credential-,
SyncContract-, Boundary-, Bundle- oder SyncAgent-Logik.

### Runnerresult, hostile Responses und Gateaggregation

Ein erfolgreicher argumentloser `run()`-Aufruf liefert einen eingefrorenen
äußeren Result mit exakt diesen drei eigenen Feldern:

```js
{
  ok: true,
  vectorGate: 'PASS' | 'FAIL' | 'UNPROVEN',
  evidence: { /* geschlossenes Schema 1 */ },
}
```

Ein nicht ausführbarer Messlauf liefert stattdessen ausschließlich:

```js
{
  ok: false,
  error: {
    code: 'probeFailed',
    message: 'Die n8n-Cloud-Probe wurde statisch redigiert abgebrochen.',
  },
}
```

Eine ungültige Runtimekonfiguration verwendet getrennt den statischen Code
`invalidRuntimeConfig` und die Meldung
`Die n8n-Cloud-Probe-Konfiguration ist ungültig.`. Der CLI-Adapter gibt den
sanitisierten Success-Result nur als JSON aus und liefert ausschließlich bei
`vectorGate: 'PASS'` Exitcode `0`; `FAIL`, `UNPROVEN` und lokale Fehler liefern
Exitcode `1`. Dieser Wert betrifft ausschließlich den einen ausgewählten
Vektor und ist weder Tenant-Gesamtstatus noch Produktaktivierungsnachweis.

Der Runner selbst ergänzt keine behaupteten Tenant-, Build-, Workflow-,
Execution-Count- oder Settingsdaten. Sein Evidenzentwurf behält deshalb die
Nullable-Bindungsfelder, beide Counts und Settings auf `null` sowie
`cleanupConfirmed: false`. Nur der ausgewählte Vektoreintrag enthält die
HTTP-/Observerbeobachtung; die anderen 31 Einträge bleiben `UNPROVEN`.
Ein solcher Einzellauf kann einen bekannten Widerspruch mit `FAIL`-Präzedenz in
den jeweils betroffenen Test-URL-Tenant- oder Providerstatus propagieren. Er
kann aber niemals einen dieser vollständigen Aggregatstatus auf `PASS` setzen;
ohne bekannten Widerspruch bleiben beide `UNPROVEN`.
`stableOssCompatibility` und `activationDecision` bleiben `FAIL`. Ein Feld
`overallGate` existiert in Schema 1 nicht.

Eine HTTP-Response ist unvertrauenswürdige Eingabe. Für eine Observerresponse
akzeptiert der Runner nur einen gewöhnlichen Record mit exakt den sechs eigenen
aufzählbaren Dateneigenschaften `probeId`, `exactMatch`,
`receivedByteLength`, `strictUtf8Outcome`, `authorizationHeaderPresence` und
`contentEncodingOutcome`, ohne Symbole oder Accessoren.
`probeId` muss exakt mit dem ausgehenden Vektor übereinstimmen,
`exactMatch` muss boolesch, `receivedByteLength` ein nicht negativer Safe
Integer und jedes Outcome ein Wert seines geschlossenen Enums sein.
Zusätzliche oder fehlende Felder, fremde IDs, falsche Typen, Symbole,
Accessoren, ungültiges JSON oder nicht fatal decodierbares Response-UTF-8
werden nicht teilweise übernommen.

Die Einzelvektoren werden exakt so bewertet:

Bei jeder übernommenen erfolgreichen und eindeutig zugeordneten `2xx`-
Observerresponse kann nur `authorizationHeaderPresence: absent` das Header-
Teilgate bestehen lassen. `present` ist `FAIL`; `null` beziehungsweise
`unavailable` ergeben mindestens `UNPROVEN`. Ein anderer bekannter
Widerspruch behält `FAIL`-Vorrang.

| Beobachtung | Vektorgate |
| --- | --- |
| Redirectstatus `300` bis `399` | immer `FAIL`; der Redirect wird nicht verfolgt |
| negativer Auth-Vektor mit `2xx`, einem Observer-/Workflow-Count größer `0`, `uniqueVectorAttribution: false` oder widersprechenden Observerdaten | `FAIL` |
| negativer Auth-Vektor mit Status `400`, `401` oder `403` | nur mit gebundenen `observerCallCount: 0`, `workflowExecutionCount: 0`, `uniqueVectorAttribution: true` und ohne Observerwiderspruch `PASS`; andernfalls `UNPROVEN` |
| `auth-correct` mit `2xx`, exakt bestandener Observerprüfung, Counts `1`/`1`, eindeutiger Attribution und `authorizationHeaderPresence: absent` | `PASS` |
| `auth-correct` mit `authorizationHeaderPresence: present`, mehrdeutiger Attribution, mehrfacher Ausführung oder anderem bekannten Widerspruch | `FAIL` |
| `auth-correct` mit `authorizationHeaderPresence: null` beziehungsweise `unavailable` oder fehlenden Counts | `UNPROVEN` |
| komprimierter Vektor mit Status `400` oder `415` | nur mit gebundenen Counts `0`/`0`, eindeutiger Attribution und ohne Observerwiderspruch `PASS`; Status allein ist `UNPROVEN` |
| komprimierter Vektor mit `2xx` | exakter Body allein reicht nicht; `PASS` verlangt zusätzlich eindeutige Attribution, `authorizationHeaderPresence: absent`, erwartetes UTF-8-Outcome und `contentEncodingOutcome: match`; ein bekanntes `present` oder ein Byte-/Dekompressionswiderspruch ist `FAIL`, `null`/`unavailable` ist `UNPROVEN` |
| sonstiger Vektor mit `2xx`, geschlossener Observerresponse, eindeutiger Attribution, `authorizationHeaderPresence: absent`, `exactMatch: true`, exakter Länge sowie exakt erwartetem UTF-8- und Content-Encoding-Outcome | `PASS` |
| sonstiger Vektor mit `2xx` und bekanntem vorhandenen Authorization-Header, Byte-, Längen-, UTF-8-, Content-Encoding- oder Attributionswiderspruch | `FAIL` |
| Timeout, Request-/Responsefehler, Abort, Teilresponse, Response über 16.384 Bytes, nicht-`2xx` außerhalb Redirect oder unbekannte/malformed Response | `UNPROVEN` |

Die reine Aggregation besitzt exakt folgende Präzedenz:

```text
mindestens ein FAIL       -> FAIL
alle Vektoren PASS        -> PASS
sonst                     -> UNPROVEN
```

Diese Aggregation ist nur für eine vollständige Evidenzsammlung aller 32
Vektoren maßgeblich. Eine leere, unbekannte oder gemischte Gateliste ist nicht vollständig und
damit `UNPROVEN`, sofern sie kein `FAIL` enthält. `FAIL` kann nicht durch
andere bestandene Vektoren kompensiert werden; `UNPROVEN` wird nie in einen
Teilerfolg normalisiert. Jeder CLI-Lauf unternimmt für genau einen Vektor
höchstens einen Requestversuch ohne Retry und belegt keine atomare
Exactly-once-Zustellung oder -Ausführung. Ein einzelnes Vektor-`PASS` kann
niemals den Tenant-Gesamtstatus auf `PASS` setzen oder die Aktivierung öffnen.

### Geschlossener persistierbarer Evidenzvertrag

`docs/evidence/n8n-cloud-ingress-runtime-evidence.template.json` und
`createN8nCloudIngressEvidenceTemplate()` besitzen bei `schemaVersion: 1`
exakt folgende eigenen Top-Level-Felder; weitere Schlüssel, Symbole oder
Accessoren werden abgelehnt:

| Feld | Typ und Nullsemantik |
| --- | --- |
| `schemaVersion` | exakt die Zahl `1`, niemals `null` |
| `endpointKind` | exakt `test`; Schema 1 beschreibt ausschließlich eine n8n-Test-URL |
| `tenantAlias` | `null` oder 8 bis 64 Zeichen; beginnt alphanumerisch, danach nur alphanumerisch, `_` oder `-`; darf nicht aus Domain, URL, Benutzer oder Credential ableitbar sein |
| `observedAt` | `null` oder streng strukturierter und kalendergültiger ISO-Zeitpunkt mit Sekunden, optional drei Millisekundenstellen und explizitem `Z` beziehungsweise zulässigem Offset; keine `Date.parse()`-Normalisierung |
| `timezone` | `null`, exakt `UTC` oder ein IANA-artiger Zonenname mit mindestens einem `/` |
| `plan` | `null` oder ein nicht leerer sanitiserter Labelwert bis 80 Zeichen; darf unbekannt oder nicht veröffentlichbar bleiben |
| `region` | `null` oder ein nicht leerer sanitiserter Labelwert bis 80 Zeichen; darf unbekannt oder nicht veröffentlichbar bleiben |
| `n8nBuild` | `null` oder ein nicht leerer sanitiserter Build-/Versionslabelwert bis 120 Zeichen |
| `webhookNodeTypeVersion` | `null` oder eine endliche positive Zahl |
| `secretFreeWorkflowSha256` | `null` oder exakt 64 lowercase Hexzeichen über die vorab geprüfte secretfreie Workflowdefinition |
| `executionDataSettings` | geschlossener Fünf-Felder-Record gemäß folgender Tabelle |
| `vectors` | exakt 32 geschlossene Vektorergebnisse in Katalogreihenfolge |
| `testUrlTenantMeasurementStatus` | exakt `PASS`, `FAIL` oder `UNPROVEN`; reine 32-Vektor-Test-URL-Messung plus vollständige Tenant-/Build-/Workflowbindung |
| `stableOssCompatibility` | in Schema 1 unveränderlich `FAIL` |
| `providerExecutionEvidenceStatus` | exakt `PASS`, `FAIL` oder `UNPROVEN`; getrennte Ausführungsdaten-, Credential- und Providerbelegbewertung |
| `productionUrlMeasurementStatus` | in Schema 1 unveränderlich `UNPROVEN`; es existiert kein Production-URL-Messpfad |
| `activationDecision` | in Schema 1 unveränderlich `FAIL`; niemals `PASS` |
| `redactedProviderReference` | `null` oder ein sanitiserter nicht geheimer Verweis bis 160 Zeichen |
| `cleanupConfirmed` | boolesch; die Vorlage enthält `false` |

Die fünf erlaubten `executionDataSettings` sind exakt:

| Feld | Erlaubte Werte | Gatebedeutung bei vollständiger Bindung |
| --- | --- | --- |
| `saveDataErrorExecution` | `null`, `all` oder `none` | nur `none` ist `PASS`; `all` ist `FAIL`; `null` ist `UNPROVEN` |
| `saveDataSuccessExecution` | `null`, `all` oder `none` | nur `none` ist `PASS`; `all` ist `FAIL`; `null` ist `UNPROVEN` |
| `saveManualExecutions` | `null`, `true` oder `false` | nur `false` ist `PASS`; `true` ist `FAIL`; `null` ist `UNPROVEN` |
| `executionDataPruning` | `null`, `enabled` oder `disabled` | nur `enabled` ist `PASS`; `disabled` ist `FAIL`; `null` ist `UNPROVEN` |
| `readTimeRedaction` | `null`, `enabled`, `disabled` oder `unavailable` | nur `enabled` ist `PASS`; `disabled` ist `FAIL`; `null` und `unavailable` sind `UNPROVEN` |

`readTimeRedaction: 'enabled'` beschreibt ausschließlich eine beobachtete
Redaction beim Lesen. Sie beweist weder, dass das Secret nicht in
Runtimeausgaben gelangte, noch dass es nicht gespeichert wurde. Deshalb
bleiben eine maßgebliche Providerattestierung im redigierten Verweis und die
übrigen sicheren Settings auch bei aktivierter Read-time-Redaction zwingend.

Jedes Vektorergebnis besitzt ausschließlich:

```js
{
  probeId,
  expectedByteLength,
  observedByteLength,
  expectedSha256,
  httpStatus,
  observerCallCount,
  workflowExecutionCount,
  uniqueVectorAttribution,
  exactMatch,
  strictUtf8Outcome,
  authorizationHeaderPresence,
  contentEncodingOutcome,
  gate,
}
```

`probeId`, `expectedByteLength` und `expectedSha256` müssen an der jeweiligen
Position exakt den lokal materialisierten Katalogwerten entsprechen.
`observedByteLength`, `httpStatus`, `observerCallCount` und
`workflowExecutionCount` sind `null` oder Werte ihrer geschlossenen
Zahlengrenzen; insbesondere dürfen die beiden Counts nie aus einem HTTP-Status
erfunden werden. `uniqueVectorAttribution` und `exactMatch` sind `null` oder
boolesch. Die drei Outcome-Felder sind `null` oder Werte ihrer jeweils
geschlossenen Enums; `gate` ist ein Wert des Gate-Enums.
`null` bedeutet ausschließlich „nicht beobachtet“ beziehungsweise „noch nicht
gebunden“; es ist kein erwarteter Wert, kein Wildcard und kein Teil-PASS. Bei
einer bestandenen Credential-Ablehnung bleiben die Observermessfelder
absichtlich `null`, weil der Observer gerade nicht erreicht werden durfte;
die separaten gebundenen Counts müssen dort dennoch `0`/`0` sein.

Sobald für einen `2xx`-Pfad eine geschlossene erfolgreiche Observerresponse
übernommen wurde, muss jeder nicht-nullische `observerCallCount` und
`workflowExecutionCount` exakt `1` sein. Ein bekannter Wert `0` oder größer als
`1` ist ein Widerspruch und ergibt `FAIL`. Bei normalen und komprimierten
erfolgreichen Observerpfaden darf `null` weiterhin „noch nicht separat
gebunden“ bedeuten, soweit das Einzelgate Counts nicht zwingend verlangt. Die
strengere `auth-correct`-Regel verlangt unverändert 1/1; frühe eindeutig
gebundene Auth- oder Compression-Ablehnungen mit `400`, `401`, `403` oder `415`
dürfen weiterhin 0/0 verwenden. Der HTTP-Status allein erzeugt keinen Count.

`testUrlTenantMeasurementStatus` folgt der festen `FAIL`-/Vollständigkeits-
Aggregation über alle 32 Vektoren. `PASS` verlangt zusätzlich
`tenantAlias`, `observedAt`, `timezone`, `n8nBuild`,
`webhookNodeTypeVersion` und `secretFreeWorkflowSha256`; `plan` und `region`
dürfen mangels veröffentlichbarer Information `null` bleiben.

`providerExecutionEvidenceStatus` ist davon getrennt. Bekannte unsichere
Settings, ein `authorizationHeaderPresence: present` auf irgendeinem
erfolgreichen eindeutig zugeordneten Observerpfad, widersprüchliche Counts oder
mehrdeutige Attribution führen mit `FAIL`-Präzedenz zu `FAIL`. `PASS` verlangt
exakt `none`/`none`/`false`/`enabled`/`enabled`, auf jedem solchen
Observerpfad `authorizationHeaderPresence: absent`, einen gebundenen
erfolgreichen `auth-correct`-Vektor zusätzlich mit Counts `1`/`1` und
eindeutiger Attribution, eine zulässige redigierte Providerreferenz,
`cleanupConfirmed: true` sowie nicht-nullische `tenantAlias`,
`observedAt`, `timezone`, `n8nBuild`, `webhookNodeTypeVersion` und
`secretFreeWorkflowSha256`. `plan` und `region` dürfen `null` bleiben. Fehlt
mindestens eine der sechs Pflichtbindungen, ist der Providerstatus ohne
bekannten Widerspruch `UNPROVEN`; `null` oder `unavailable` auf einem
erfolgreichen Observerpfad verhindern ebenfalls `PASS`. Die genannte `FAIL`-
Präzedenz bleibt auch bei unvollständiger Bindung erhalten. Andere fehlende
Werte und `readTimeRedaction: unavailable` bleiben ebenfalls `UNPROVEN`.

Die fünf Statusfelder bleiben absichtlich separat. Schema 1 besitzt kein
`overallGate`; weder ein einzelnes noch alle Test-URL-Vektor-`PASS` ändern das
feste `stableOssCompatibility: 'FAIL'`, das feste
`productionUrlMeasurementStatus: 'UNPROVEN'` oder die unveränderliche
`activationDecision: 'FAIL'`.

Die eingecheckte Vorlage behauptet keine Cloudmessung: alle bindenden und
beobachteten Nullable-Felder einschließlich `readTimeRedaction` stehen auf
`null`, alle Vektorgates, `testUrlTenantMeasurementStatus` und
`providerExecutionEvidenceStatus` stehen auf `UNPROVEN`,
`stableOssCompatibility` und `activationDecision` auf `FAIL`,
`productionUrlMeasurementStatus` auf `UNPROVEN` und `cleanupConfirmed` ist
`false`. Webhook-URL, Tenantdomain, Credential-ID,
Secret, Authorization-Wert oder -Header, Request-/Responsebody sowie Binär-,
Hex- oder Base64daten sind in diesem Evidenzschema verboten.

### Aktueller Nachweis- und Aktivierungsstatus

In diesem Slice wurde kein externer Endpoint kontaktiert und kein Cloud-Tenant
verändert. Der konkrete Test-URL-Tenantstatus und die Provider-Ausführungsevidenz
bleiben daher verbindlich `UNPROVEN`; die Production-URL wird nicht gemessen.

Der am `2026-08-19` aktuelle öffentliche Stable-Quellstand `n8n@2.35.4` am
Commit `d2ce3c084c228622c2ffe7c245d25870430e18a9` zeigt dagegen, dass der
Body-Reader `gzip` vor der Raw-Body-Materialisierung gunzippt und `deflate`
inflated. Damit ist die Kompatibilität mit dem geforderten unveränderten
`gzip`-/`deflate`-Wire-Byte-Erhalt für genau diesen Quellstand `FAIL`. Derselbe
Commit zeigt, dass Header Authentication den erfolgreichen Wert nicht aus
`req.headers` entfernt und der Standard-Webhook-Output `req.headers`
weitergibt; das Gate „Header-Auth-Secret nicht im Standard-Webhook-Output“ ist
für diesen Quellstand ebenfalls `FAIL`.

Der ebenfalls commitgebundene Lifecycle-Quellanker ist
[`packages/cli/src/webhooks/test-webhooks.ts`](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/webhooks/test-webhooks.ts).
Er wird nur als Quellanker für die Test-Webhook-Lifecycleprüfung verwendet;
hier werden daraus keine unüberprüften Symbol- oder Zeilenbehauptungen
abgeleitet.

Diese beiden Aussagen sind ausschließlich commitgebundene Beobachtungen des
öffentlichen OSS-Codes. Sie sind weder dokumentierte Plattformgarantie noch
Messung oder Buildattestierung eines konkreten n8n-Cloud-Tenants; aus ihnen
wird insbesondere kein Ergebnis für `br` oder unbeobachtbare Providergrenzen
abgeleitet. `stableOssCompatibility` und `activationDecision` bleiben in
Schema 1 unveränderlich `FAIL`; `productionUrlMeasurementStatus` bleibt
unveränderlich `UNPROVEN`. Eine spätere Änderung eines dieser festen Werte
verlangt einen neuen ADR und eine neue Evidenz-Schemaversion. ADR 0022 ergänzte
und blockierte damit ADR 0019, ohne ihn selbst zu ersetzen. ADR 0023 ersetzt
ADR 0019 nun, ohne diese Evidenz oder ihre festen Werte zu verändern.

Die Evidence-Foundation bindet weder das generierte n8n-Boundary-Bundle noch
SyncContract, SyncGateway Request Boundary oder SyncAgent ein. Sie
implementiert keinen produktiven Webhook und aktiviert keinen Cloudtransport.
Das lokale SyncGateway ist nach ADR 0025 mit dem lokalen SyncAgent komponiert:
Ein akzeptierter SyncRequest erreicht ihn synchron höchstens einmal; nur der
exakte defensive Erfolg ergibt die frisch projizierte normale SyncResponse mit
HTTP `200`. Browser-SyncTransport und Browser-End-to-End-Fluss fehlen weiterhin.

## Implementierter Request-Umschlag der SyncContract Foundation

Der aktuelle Validator akzeptiert ausschließlich einen `syncTest`-Request mit
exakt sechs eigenen aufzählbaren Dateneigenschaften. Die Reihenfolge der
JSON-Felder ist nicht semantisch; zusätzliche Felder werden fail-closed
abgelehnt.

```json
{
  "version": "1.0",
  "action": "syncTest",
  "source": "goldendawn-os",
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "timestamp": "2026-08-03T12:00:00.000Z",
  "payload": {}
}
```

### Felder des Request-Umschlags

| Feld | Typ | Pflicht | Regel |
| --- | --- | --- | --- |
| `version` | String | ja | exakt `1.0` für diesen Vertrag |
| `action` | String | ja | exakt `syncTest` |
| `source` | String | ja | exakt `goldendawn-os` |
| `requestId` | String | ja | ASCII, Präfix `req_`, 5 bis 64 Zeichen |
| `timestamp` | ISO-8601-String | ja | kanonisch `YYYY-MM-DDTHH:mm:ss.sssZ` |
| `payload` | Objekt | ja | exakt leeres Plain- oder Null-Prototyp-Objekt |

Der aktuelle Request besitzt kein vorgesehenes Inhalts- oder Freitextfeld;
`payload` ist exakt `{}`. Der Contract-Kern liest, persistiert oder exportiert
keine privaten lokalen Bestände. Die Request Boundary übernimmt bei einem
gültigen Parsed-Wert ausschließlich die bereits validierten primitiven Werte
und erzeugt ein frisches leeres Payload-Objekt. Der lokale HTTP-Handler führt
diesen String bis zu genau dieser Boundary und übergibt ausschließlich ihre
akzeptierte defensive Projektion an den lokalen SyncAgent. Da der Browser-
SyncTransport fehlt und die lokale ADR-0025-Komposition den Prozess nicht
verlässt, ist weiterhin kein Browser- oder externer Datenfluss umgesetzt.

`context`, Client-Modus, Locale, Clientversion, Endpoint- oder Agentenauswahl
sind keine Felder dieses Vertrags. Ein deklarativer Client-Modus dürfte auch
später weder Umgebung, Endpoint noch Berechtigungen bestimmen; diese Auswahl
liegt an der serverseitigen Grenze.

### Regeln für die Vertragsversion

- Version `1.0` wird als String übertragen.
- Eine nicht unterstützte Version erzeugt im aktuellen Validator den statischen
  Code `unsupportedVersion`; die aktuelle Request Boundary bildet daraus nur
  dann das redigierte Response-Profil `UNSUPPORTED_VERSION`, wenn dies der
  einzige Requestfehler ist.
- Der implementierte Validator akzeptiert in Version `1.0` keine unbekannten
  oder optional hinzugefügten Felder.
- Pflichtfelder, Feldbedeutungen und Datentypen werden nicht stillschweigend
  geändert.
- Breaking Changes benötigen eine neue Hauptversion und aktualisierte Beispiele.

### Regeln für Aktionen

- Aktionen sind case-sensitive; die implementierte Allowlist enthält exakt
  `syncTest`.
- Der Client wählt keinen Agenten. `handledBy` ist kein Request-Feld.
- Unbekannte Aktionen werden abgelehnt; die aktuelle Request Boundary bildet
  daraus nur bei exakt alleiniger Ursache das statische Profil
  `UNKNOWN_ACTION`.

### Regeln für Quellen

Die implementierte Quellen-Allowlist enthält exakt:

| Kontext | `source` |
| --- | --- |
| GoldenDawn-Vertragsrequest | `goldendawn-os` |

`source: "goldendawn-os"` ist ausschließlich eine syntaktische Klassifikation
innerhalb dieses Objektvertrags. Der Wert beweist weder Authentisierung noch
technische Herkunft, Identität oder Berechtigung. Eine spätere Wire-Grenze muss
vertrauenswürdige Herkunft aus serverseitigem Transport- und
Authentisierungskontext ableiten; Routing und Autorisierung dürfen niemals
allein auf `source` beruhen.

Interne Quellen wie `SyncAgent`, `TestAgent` oder `DataAgent` sind geplanten
Agentenverträgen vorbehalten und werden vom aktuellen Validator abgelehnt.

### Regeln für Request-IDs

- Das Feld ist für jeden regulären Request verpflichtend. Der aktuelle
  Validator prüft nur seine syntaktische Struktur.
- Format: Präfix `req_` plus mindestens ein ASCII-Buchstabe oder eine Ziffer;
  danach sind ASCII-Buchstaben, Ziffern, `_` und `-` erlaubt.
- Empfohlene Erzeugung im Browser: `req_${crypto.randomUUID()}`.
- Gesamtlänge: mindestens 5 und höchstens 64 Zeichen.
- Die syntaktische Gültigkeit garantiert keine Kollisionsarmut. Der spätere
  GoldenDawn-ID-Generator ist für eine kollisionsarme Erzeugung verantwortlich.
- Eine ID wird im gesamten Agentenfluss beibehalten.
- Fehlende, falsch präfixierte, nicht-ASCII- oder überlange IDs werden
  abgelehnt. Nach erfolgreicher Auflösung der Portmethode wertet die
  SyncService Foundation den kontrollierten Generator während des Request-
  Builds genau einmal aus, besitzt aber keinen globalen Kollisions- oder
  Idempotenzspeicher.
- Die Request Boundary übernimmt eine eingehende `req_`-ID nur in einen
  vollständig gültigen defensiven Request-Snapshot. Bei einer Ablehnung
  spiegelt sie diese ID niemals, sondern verwendet eine neue kontrollierte
  `gateway_`-ID.

### Regeln für Zeitstempel

- Request- und Response-Zeitstempel verwenden kanonisches ISO 8601 in UTC mit
  Millisekunden und `Z`.
- Beispiel: `2026-08-03T12:00:00.000Z`.
- `validateSyncRequest` erhält die Referenzzeit explizit im selben kanonischen
  Format. Das inklusive Fenster beträgt `±300000 ms`; exakt an beiden Grenzen
  ist der Request gültig.
- Diese Struktur- und Zeitprüfungen beweisen weder die semantische Herkunft von
  `requestId` und `timestamp` noch, dass sie keine privaten oder
  nutzergenerierten Informationen codieren.
- Der implementierte vertrauenswürdige Request-Builder erzeugt `requestId` über
  einen kontrollierten ID-Generator und `timestamp` über eine kontrollierte
  Clock. Beide Werte dürfen niemals aus privaten oder nutzergenerierten
  Inhalten abgeleitet werden.
- Die Request Boundary erfasst ihre kontrollierte Referenzzeit für einen
  akzeptierten Request oder eine ausgegebene frühe Gateway-Fehlerresponse
  jeweils exakt einmal. Die Toleranzprüfung ist kein Replay-, Idempotenz- oder
  Deduplizierungsschutz.
- Reine Kalenderdaten verwenden `YYYY-MM-DD`.
- Kalenderdaten werden nicht unnötig über `new Date("YYYY-MM-DD")` geparst.

### Geplanter Kontext späterer Verträge

Der folgende Kontext ist **nicht implementiert** und wird vom aktuellen
SyncContract-Validator als unbekanntes Feld abgelehnt. Er bleibt lediglich eine
Planungsnotiz für spätere, neu zu versionierende Agentenverträge:

```json
{
  "mode": "private",
  "locale": "de-DE",
  "clientVersion": "0.3.0"
}
```

| Feld | Typ | Erlaubte Werte |
| --- | --- | --- |
| `mode` | String | `private`, `demo` |
| `locale` | String | für Version 1 primär `de-DE` |
| `clientVersion` | String | gültige Anwendungsversionsangabe |

`mode` ist auch später keine Berechtigung. Die tatsächliche Datenquelle wird
serverseitig durch getrennte Workflows und Konfigurationen bestimmt.

### Größen- und Längenlimits

| Element | Limit für Version 1 |
| --- | --- |
| bereits vorliegender roher Request-String | maximal 65.536 UTF-8-Bytes, inklusive |
| größter gültiger kanonisch projizierter Browser-v1-Requestbody | exakt 193 UTF-8-Bytes bei insgesamt 64 erlaubten ASCII-Zeichen in `requestId` |
| privater BrowserSyncTransport-Requestcap | maximal 65.536 UTF-8-Bytes, inklusive; im geschlossenen v1-Vertrag öffentlich nicht bis zur Capgrenze erreichbar |
| tatsächlicher lokaler Gateway-Raw-Wire-Request | maximal 65.536 Bytes, inklusive; Byte 65.537 wird während des Empfangs abgebrochen |
| browserexponierter Responsebody | maximal 16.384 Bytes, inklusive; Byte 16.385 wird vor Kopie abgelehnt |
| `action` | exakt `syncTest` |
| `requestId` | 5 bis 64 ASCII-Zeichen |
| kurzer Titel | maximal 160 Zeichen |
| kurze Beschreibung | maximal 500 Zeichen |
| Lernzusammenfassung | maximal 12.000 Zeichen |
| einzelne Nutzerantwort | maximal 4.000 Zeichen |
| Array von Lernzielen | maximal 20 Einträge |
| Array von Antworten | maximal 10 Einträge |
| Fehlermeldung für Clients | maximal 500 Zeichen |

`validateSyncRawBodySize` akzeptiert ausschließlich einen bereits vorhandenen
String, misst dessen berechnete UTF-8-Länge und serialisiert niemals ein Objekt.
Die SyncGateway Request Boundary ruft diesen Helper vor dem Parsing auf. Der
String wurde dann aber bereits alloziert und möglicherweise bereits aus
Wire-Bytes dekodiert. Weder Helper noch Boundary begrenzen deshalb die
tatsächlich empfangenen HTTP-Bytes, verhindern vorherige Body-Allokation oder
setzen ein produktives Webhook- beziehungsweise DoS-Limit durch. Die übrigen
Zeilen der Tabelle sind Planungsgrenzen späterer LearningTest-Verträge.

Die vier Request-/Responsegrenzen in der Tabelle sind voneinander getrennt.
Für den isoliert implementierten BrowserSyncTransport ergibt der geschlossene
v1-Contract aus festen ASCII-Werten für Version, Aktion und Quelle, einem
kanonischen Timestamp, exakt leerem Payload und höchstens 64 erlaubten
ASCII-Zeichen in `requestId` einen maximalen serialisierten Body von exakt 193
UTF-8-Bytes. Eine insgesamt 65 Zeichen lange `requestId` scheitert
vertragsseitig vor Stringify, Encoding, Controller, Timer und Fetch. Der
private Browsercap von 65.536 Bytes bleibt unverändert Defense-in-Depth und
wird nicht durch 193 ersetzt. Er ist von der real durchgesetzten Gateway-Raw-
Wire-Grenze 65.536/65.537 und der erreichbaren Response-Streaminggrenze
16.384/16.385 zu unterscheiden.

Die historisch durch ADR 0019 entschiedene, durch ADR 0020 implementierte und
durch ADR 0023 beibehaltene lokale Wire-Grenze muss nach frühen Methoden-,
Pfad-, Header-, Origin-/CORS- und Transportkontrollen die tatsächlich
empfangenen Raw Bytes während des Streamings auf 65.536 begrenzen und bei Byte
65.537 vor vollständiger Bodymaterialisierung abbrechen. Erst danach werden die
Bytes kontrolliert genau einmal in einen String dekodiert, eine gültige BOM als
U+FEFF erhalten und der String ausschließlich durch die Boundary exakt einmal
ohne Reviver geparst, validiert und projiziert. Die lokale Agentenpolicy wertet
erst die validierte Aktion aus. Jede spätere Providerwahl stammt ausschließlich
aus vertrauenswürdiger lokaler Composition.

Der vor ADR 0022 vorgesehene synthetische n8n-Cloudflow ist durch ADR 0023 als
Pflichttopologie abgelöst und kein verpflichtender Kernhop mehr. Ein optionaler
n8n-Adapter bleibt gesperrt. ADR 0023 entscheidet weder Header Authentication,
Bearer-Secret, konkreten Headernamen, JWT, HMAC, asymmetrisches Verfahren,
Credentialformat noch Rotationsmechanismus; der Header-Auth-/Execution-Data-
Befund aus ADR 0022 bleibt ein Blocker, keine gewählte Lösung. Falls eine
spätere private oder schreibende
Aktion eine Bodysignatur erfordert, müsste sie über genau die relevanten Raw
Bytes und Header vor Decodierung und JSON-Parsing geprüft werden.
`JSON.parse` ohne benutzerdefinierten Reviver erzeugt aus JSON gewöhnliche
Datenwerte; es erzeugt keine Proxies, Accessors, Symbole, Functions oder
Thenables.

## Implementierter Response-Umschlag

Eine erfolgreiche `syncTest`-Response besitzt exakt diese zehn Felder:

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "action": "syncTest",
  "handledBy": "SyncAgent",
  "timestamp": "2026-08-03T12:00:00.245Z",
  "data": {
    "status": "ok",
    "dataOrigin": "synthetic"
  },
  "error": null,
  "warnings": [],
  "meta": {
    "durationMs": 245,
    "processedBy": ["SyncAgent"]
  }
}
```

### Felder des Response-Umschlags

| Feld | Typ | Regel |
| --- | --- | --- |
| `version` | String | exakt wie der korrelierte Request, aktuell `1.0` |
| `success` | Boolean | `true` für Erfolg, `false` für normalen Fehler |
| `requestId` | String | exakt wie im korrelierten Request |
| `action` | String | exakt wie im korrelierten Request, aktuell `syncTest` |
| `handledBy` | String | exakt `SyncAgent` |
| `timestamp` | ISO-8601-String | kanonischer UTC-Zeitpunkt mit Millisekunden |
| `data` | Objekt oder `null` | bei Erfolg exakt `{ status: "ok", dataOrigin: "synthetic" }`, sonst `null` |
| `error` | Objekt oder `null` | bei Erfolg `null`, sonst exaktes statisches Fehlerprofil |
| `warnings` | Array | aktuell exakt leer |
| `meta` | Objekt | exakt `durationMs` und `processedBy` |

`dataOrigin: "synthetic"` ist ausschließlich eine validierte
Vertragsklassifikation. Der Wert beweist weder die tatsächliche Herkunft der
Werte noch ihre Freiheit von privaten Informationen oder allgemeine
Datenschutzkonformität.

Version, Aktion und `requestId` werden von `validateSyncResponse` exakt gegen
den vollständig strukturvalidierten korrelierten Request geprüft. Weil diese
Funktion keine Referenzzeit erhält, wiederholt sie die Freshness-Prüfung des
Requests nicht. Es gibt keine partielle oder normalisierte Korrelation.

### Sichere Response-Metadaten

```json
{
  "durationMs": 842,
  "processedBy": ["SyncAgent"]
}
```

- `durationMs` ist eine sichere Ganzzahl im inklusiven Bereich `0..300000`.
- `processedBy` ist für normale Responses exakt `["SyncAgent"]` und für frühe
  Gateway-Fehler exakt `[]`.
- Stacktraces, Credential-IDs und Airtable-interne Details werden nicht an den
  Client zurückgegeben.

## Fehlervertrag

### Normal korrelierter Fehler

```json
{
  "version": "1.0",
  "success": false,
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "action": "syncTest",
  "handledBy": "SyncAgent",
  "timestamp": "2026-08-03T12:00:00.245Z",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Die Anfrage entspricht nicht dem Sync-Vertrag.",
    "retryable": false,
    "details": []
  },
  "warnings": [],
  "meta": {
    "durationMs": 12,
    "processedBy": ["SyncAgent"]
  }
}
```

Normale Fehler korrelieren Version, Aktion und `requestId` exakt mit dem
Request. Sie erlauben nur diese statischen Profile:

| Code | Exakte Meldung | `retryable` |
| --- | --- | --- |
| `VALIDATION_ERROR` | `Die Anfrage entspricht nicht dem Sync-Vertrag.` | `false` |
| `SERVICE_UNAVAILABLE` | `Der Sync-Dienst ist vorübergehend nicht verfügbar.` | `true` |
| `INTERNAL_ERROR` | `Die Anfrage konnte nicht verarbeitet werden.` | `false` |

### Früher Gateway-Fehler

Fehler vor einem gültig korrelierbaren Request verwenden ein getrenntes Profil
mit `version: "1.0"` und `success: false`. Die aktuelle Request Boundary
erzeugt dafür eine neue kontrollierte `requestId`; sie beginnt mit `gateway_`,
enthält danach mindestens ein ASCII-alphanumerisches Zeichen und anschließend
nur ASCII-Buchstaben, Ziffern, `_` oder `-`; die syntaktische Mindestlänge ist
damit 9, die Höchstlänge 64 Zeichen. `action`, `handledBy` und `data` sind `null`;
`warnings` und `error.details` sind leer, `meta.processedBy` ist `[]`.
Auch hier garantiert das Format weder Kollisionsarmut, vertrauenswürdige
Herkunft, Identität, Berechtigung noch Replay-Schutz.

```json
{
  "version": "1.0",
  "success": false,
  "requestId": "gateway_example_001",
  "action": null,
  "handledBy": null,
  "timestamp": "2026-08-03T12:00:00.010Z",
  "data": null,
  "error": {
    "code": "INVALID_JSON",
    "message": "Die Anfrage enthält kein gültiges JSON.",
    "retryable": false,
    "details": []
  },
  "warnings": [],
  "meta": {
    "durationMs": 0,
    "processedBy": []
  }
}
```

| Code | Exakte Meldung | `retryable` |
| --- | --- | --- |
| `INVALID_JSON` | `Die Anfrage enthält kein gültiges JSON.` | `false` |
| `VALIDATION_ERROR` | `Die Anfrage entspricht nicht dem Sync-Vertrag.` | `false` |
| `UNSUPPORTED_VERSION` | `Die Vertragsversion wird nicht unterstützt.` | `false` |
| `UNKNOWN_ACTION` | `Die angeforderte Aktion wird nicht unterstützt.` | `false` |
| `PAYLOAD_TOO_LARGE` | `Die Anfrage überschreitet die zulässige Größe.` | `false` |
| `FORBIDDEN` | `Die Anfrage ist in diesem Kontext nicht erlaubt.` | `false` |

`validateSyncGatewayErrorResponse` prüft dieses Profil ohne einen korrelierten
Request. Es ist keine normale SyncAgent-Response und behauptet keine
Verarbeitung durch einen Agenten. Die aktuelle Boundary verwendet für jede
ausgegebene frühe Response ausschließlich den statischen, nicht gemessenen Wert
`durationMs: 0`, validiert die vollständige Response vor und nach Deep Freeze
und spiegelt niemals eine eingehende `req_`-ID.

Das Contract-Profil erlaubt weiterhin `FORBIDDEN` für eine spätere
authentisierende Grenze. Die aktuelle transportneutrale Boundary erzeugt diesen
Code ausdrücklich nicht. Sie emittiert nur `INVALID_JSON`,
`VALIDATION_ERROR`, `UNSUPPORTED_VERSION`, `UNKNOWN_ACTION` und
`PAYLOAD_TOO_LARGE`. `SERVICE_UNAVAILABLE` und `INTERNAL_ERROR` gehören
zum normalen korrelierten Response-Profil und werden ebenfalls nicht als frühe
Boundary-Fehler erfunden.

### Geplante Fehlercodes späterer Verträge

Die folgenden breiteren Codes sind nicht Teil der implementierten
SyncContract-Profile. Sie bleiben Zielplanung für LearningTest-, DataAgent- und
Transport-Slices:

| Code | Bedeutung | Retry |
| --- | --- | --- |
| `UNAUTHORIZED` | Authentisierung fehlt oder ist ungültig | nein |
| `NOT_FOUND` | Angeforderte Ressource existiert nicht | nein |
| `CONFLICT` | Fachlicher Konflikt | nein |
| `IDEMPOTENCY_CONFLICT` | Request-ID wurde anders verwendet | nein |
| `RATE_LIMITED` | Aufruflimit wurde überschritten | ja, verzögert |
| `TEST_GENERATION_FAILED` | TestAgent konnte keinen gültigen Test erzeugen | bedingt |
| `TEST_EVALUATION_FAILED` | TestAgent konnte nicht valide bewerten | bedingt |
| `DATA_READ_FAILED` | DataAgent konnte nicht lesen | bedingt |
| `DATA_WRITE_FAILED` | DataAgent konnte nicht schreiben | bedingt |
| `UPSTREAM_TIMEOUT` | Externes System antwortet nicht rechtzeitig | ja |

Der aktuelle Slice führt keine Retries aus. `retryable` ist ausschließlich ein
statischer Wert des Fehlerprofils und keine Retry-Automatik.

### Geplante HTTP-Statuszuordnung späterer Transporthops

Der transportneutrale Kern kennt keine HTTP-Statuscodes. Auch die inzwischen
implementierte lokale HTTP-Foundation verwendet bewusst ihren engeren, oben
festgelegten lokalen Fehlervertrag. Die folgende historische Tabelle bleibt
ausschließlich breitere Planung für spätere Browser-, Cloud- und Agentenhops:

| HTTP | Verwendung |
| --- | --- |
| `200` | erfolgreiche Aktion oder erfolgreicher idempotenter Retry |
| `400` | ungültiges JSON, Umschlag oder unbekannte Aktion |
| `401` | fehlende oder ungültige Authentisierung |
| `403` | authentisiert, aber Aktion nicht erlaubt |
| `404` | Ressource nicht gefunden |
| `409` | Fach- oder Idempotenzkonflikt |
| `413` | Payload zu groß |
| `422` | aktionsspezifische Payload fachlich ungültig |
| `429` | Rate Limit erreicht |
| `500` | unerwarteter interner Fehler |
| `502` | ungültige Antwort eines Upstream-Dienstes |
| `503` | Dienst vorübergehend nicht verfügbar |
| `504` | Upstream-Timeout |

### Transport- und Fehlerfluss nach ADR 0023

Die obige breite HTTP-Tabelle bleibt unverbindliche Zielplanung. ADR 0019
führte selbst keine neuen HTTP-Status- oder Contractzusagen ein. Der danach
implementierte lokale HTTP-Handler besitzt nun die getrennte exakte Zuordnung
`200`, `204`, `400`, `403`, `404`, `405`, `413`, `415`, `417`, `431` und
`500`; sie erweitert oder verändert den SyncContract nicht.

Der SyncService akzeptiert unverändert ausschließlich eine defensiv projizierte,
vollständig validierte normale SyncResponse, die Version, Aktion und `req_`-ID
exakt mit dem internen Request korreliert. Eine gültige normale
Contract-Fehlerresponse bleibt außen `ok: true`; ihr fachlicher Misserfolg steht
ausschließlich in `syncResponse.success: false`.

Der durch ADR 0027 als Ersatz für ADR 0026 entschiedene, isoliert
implementierte und produktiv noch nicht komponierte Clienttransport
behandelt ausschließlich HTTP `200` als parsebaren Responsekandidaten und
rejectet insbesondere diese Fälle statisch redigiert als Transportfehler:

- jeden Non-200-Status einschließlich einer nackten frühen `gateway_`-Response
  unter HTTP `400`;
- Redirect-, URL-, Header-, Content-Length-, Stream-, Größen-, UTF-8- und
  JSON-Fehler;
- Fetch-, CORS-, Netzwerk-, Deadline- oder Abortfehler;
- lokale oder spätere Provider-Authentisierungsfehler;
- lokale interne Gatewayfehler;
- ungeeignete, nicht normal korrelierte oder nicht sicher projizierbare
  lokale Agenten- oder spätere Providerresponses.

Keiner dieser Fälle wird zu einer normalen SyncAgent-Response umgeschrieben.
Transportablehnungen vor einem gültigen Request behaupten keine
Agentenverarbeitung. Fremde Meldungen, Header, URLs, Raw Bodies, Tokens,
Validatorlisten oder Stacks werden nicht an den Browser gespiegelt.

Der lokale Listener besitzt die oben dokumentierten endlichen Header-,
Request-, Socket- und Keep-Alive-Grenzen sowie höchstens einen Request pro
Socket. ADR 0027 übernimmt zusätzlich unverändert die feste
5.000-ms-Per-Call-Deadline
des isoliert implementierten Browsertransports ausschließlich für dessen asynchrones
Fetch- und Streamwarten. Die synchrone Decodierungs- und Parsephase liegt nach
Disarm und Timerbereinigung außerhalb dieser Eventloopfrist. Sie ist
implementiert, bildet aber keine harte Echtzeitgrenze und ersetzt keine globale
Betriebsgrenze. Provider-Timeouts, automatische Retries, Rate
Limits, Replay-, Idempotenz- und Deduplizierungsmechanismen bleiben
unimplementiert. Timestamp-Toleranz ist kein Replay-Schutz; `requestId` ist
keine Idempotenz- oder Deduplizierungsgarantie.

## Warnungsvertrag

Die implementierte SyncContract Foundation akzeptiert ausschließlich
`warnings: []`. Strukturierte Warnungen sind erst für spätere Verträge geplant:

```json
{
  "code": "RESULT_NOT_SAVED",
  "message": "Die Bewertung wurde erstellt, aber noch nicht gespeichert."
}
```

Geplante Warnungen für spätere Version-1-Aktionen:

| Code | Verwendung |
| --- | --- |
| `RESULT_NOT_SAVED` | Testergebnis konnte nicht gespeichert werden |
| `PARTIAL_CONTEXT_USED` | Test wurde mit reduziertem Lernkontext erstellt |
| `DEMO_MODE` | Ergebnis stammt aus der synthetischen Demo-Umgebung |

Warnungen enthalten keine Secrets, Stacktraces oder vollständigen externen
Fehlermeldungen.

## Vertrag für syncTest

### Request für syncTest

```json
{
  "version": "1.0",
  "action": "syncTest",
  "source": "goldendawn-os",
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "timestamp": "2026-08-03T12:00:00.000Z",
  "payload": {}
}
```

`payload` ist exakt leer und kein vorgesehenes Inhalts- oder Freitextfeld.
Freier Text, Echo-Verhalten, Kontext und Client-Modus sind nicht erlaubt. Der
Contract-Kern führt keinen Sync aus und liest, persistiert oder exportiert
keine privaten lokalen Anwendungsbestände. Die SyncService Foundation kann den
kontrolliert aufgebauten Request ausschließlich an ihren injizierten Port
übergeben. Die SyncGateway Request Boundary kann einen vollständig gültigen
geparsten Request ausschließlich als neue defensive Projektion akzeptieren.
Der lokale HTTP-Handler kann einen bestandenen Wire-Request bis zu dieser
Boundary führen und bei Akzeptanz synchron höchstens einmal an den lokalen
SyncAgent übergeben. Nur der abgesicherte exakte Erfolg antwortet mit HTTP
`200`. Ohne Browser-SyncTransport entsteht daraus weiterhin kein Browser- oder
Provideraufruf.

### Response für syncTest

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "action": "syncTest",
  "handledBy": "SyncAgent",
  "timestamp": "2026-08-03T12:00:00.105Z",
  "data": {
    "status": "ok",
    "dataOrigin": "synthetic"
  },
  "error": null,
  "warnings": [],
  "meta": {
    "durationMs": 0,
    "processedBy": ["SyncAgent"]
  }
}
```

## Geplante LearningTest- und DataAgent-Verträge

Alle folgenden Abschnitte ab `learningTest.create` beschreiben weiterhin nur
den Zielzustand späterer Versionen. Sie sind nicht in `src/contracts/syncContract.js`
implementiert, werden von dessen aktuellen Allowlists nicht akzeptiert und
begründen weder einen Netzwerkfluss noch einen operativen `TestAgent` oder
`DataAgent`. Ihre Beispiele können vor Implementierung eine neue
Vertragsversion oder einen neuen ADR erfordern.

## Vertrag für learningTest.create

### Request zum Erstellen eines Lerntests

```json
{
  "version": "1.0",
  "action": "learningTest.create",
  "source": "goldendawn-os",
  "requestId": "req_0ef9a490-a541-46d6-b8e6-50fd0a156ed7",
  "timestamp": "2026-07-11T12:10:00.000Z",
  "context": {
    "mode": "private",
    "locale": "de-DE",
    "clientVersion": "0.5.0"
  },
  "payload": {
    "topicId": "topic_synthetic_patterns_001",
    "title": "Synthetische Musterkarten",
    "learningContext": {
      "summary": "Die unabhängig erfundenen Karten beschreiben neutrale Muster und Blickwinkel.",
      "learningObjectives": [
        "Zwei erfundene Muster vergleichen können",
        "Eine neutrale Beobachtung umformulieren können"
      ],
      "sourceRefs": [
        {
          "id": "demo_node_perspectives",
          "label": "Synthetische Textkarte: Zwei Blickwinkel"
        }
      ]
    },
    "settings": {
      "questionCount": 1,
      "passingScore": 1,
      "language": "de-DE"
    }
  }
}
```

### Validierung der Test-Erstellung

| Feld | Regel |
| --- | --- |
| `topicId` | stabiler String, maximal 80 Zeichen |
| `title` | 1 bis 160 Zeichen |
| `summary` | 1 bis 12.000 Zeichen |
| `learningObjectives` | 1 bis 20 eindeutige Einträge |
| `sourceRefs` | maximal 20 Referenzen, keine Secrets |
| `questionCount` | Ganzzahl von 1 bis 10, Standard 5 |
| `passingScore` | Ganzzahl von 1 bis `questionCount` |
| `language` | für Version 1 `de-DE` |

Der TestAgent erzeugt intern Bewertungskriterien. Diese Kriterien werden über
den SyncAgent vom DataAgent als `learningTestDefinition` gespeichert und nicht
an das Dashboard ausgegeben. Schlägt diese notwendige Speicherung fehl, gilt
`learningTest.create` als fehlgeschlagen, da der Test später nicht zuverlässig
bewertet werden könnte.

### Response mit öffentlicher Testdefinition

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_0ef9a490-a541-46d6-b8e6-50fd0a156ed7",
  "action": "learningTest.create",
  "handledBy": "TestAgent",
  "timestamp": "2026-07-11T12:10:02.400Z",
  "data": {
    "test": {
      "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
      "topicId": "topic_big_data_001",
      "title": "Big Data – Grundlagen",
      "instructions": "Beantworte alle Fragen in eigenen Worten.",
      "settings": {
        "questionCount": 1,
        "maxScore": 1,
        "passingScore": 1,
        "language": "de-DE"
      },
      "questions": [
        {
          "questionId": "qst_1",
          "type": "freeText",
          "prompt": "Welche vier V beschreiben Big Data und was bedeuten sie?",
          "maxPoints": 1
        }
      ],
      "createdAt": "2026-07-11T12:10:02.000Z"
    },
    "persistence": {
      "status": "saved",
      "recordId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea"
    }
  },
  "error": null,
  "warnings": [],
  "meta": {
    "durationMs": 2400,
    "processedBy": ["SyncAgent", "TestAgent", "DataAgent"]
  }
}
```

Die Antwort enthält weder Musterlösungen noch Bewertungskriterien.

## Vertrag für learningTest.evaluate

### Request zur Bewertung

```json
{
  "version": "1.0",
  "action": "learningTest.evaluate",
  "source": "goldendawn-os",
  "requestId": "req_d28bd3c9-3218-498d-a4af-88327fd2dc5a",
  "timestamp": "2026-07-11T12:20:00.000Z",
  "context": {
    "mode": "private",
    "locale": "de-DE",
    "clientVersion": "0.5.0"
  },
  "payload": {
    "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
    "answers": [
      {
        "questionId": "qst_1",
        "answer": "Volume, Variety, Velocity und Veracity beschreiben Datenmenge, Vielfalt, Geschwindigkeit und Vertrauenswürdigkeit."
      }
    ]
  }
}
```

### Validierung der Bewertung

- `testId` ist verpflichtend und maximal 64 Zeichen lang.
- Jede erwartete `questionId` darf höchstens einmal vorkommen.
- Unbekannte Fragen werden abgelehnt.
- Eine Antwort ist ein String mit maximal 4.000 Zeichen.
- Die Zahl der Antworten darf die Zahl der Testfragen nicht überschreiten.
- Der Server bestimmt `attemptNumber`; der Client darf sie nicht frei setzen.
- Die gespeicherte Testdefinition bestimmt Maximal- und Bestehenspunktzahl.

### Modell eines Testergebnisses

```json
{
  "resultId": "trs_95058ab2-cdc9-4790-bded-381947949b02",
  "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
  "topicId": "topic_big_data_001",
  "attemptNumber": 1,
  "score": 1,
  "maxScore": 1,
  "passingScore": 1,
  "passed": true,
  "feedback": "Die vier V wurden sicher verstanden und korrekt erklärt.",
  "answerFeedback": [
    {
      "questionId": "qst_1",
      "points": 1,
      "maxPoints": 1,
      "correct": true,
      "feedback": "Alle vier V wurden korrekt erklärt."
    }
  ],
  "completedAt": "2026-07-11T12:20:03.000Z"
}
```

`passed` wird serverseitig aus `score >= passingScore` abgeleitet und nicht vom
Client übernommen.

### Response mit gespeichertem Ergebnis

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_d28bd3c9-3218-498d-a4af-88327fd2dc5a",
  "action": "learningTest.evaluate",
  "handledBy": "TestAgent",
  "timestamp": "2026-07-11T12:20:03.400Z",
  "data": {
    "result": {
      "resultId": "trs_95058ab2-cdc9-4790-bded-381947949b02",
      "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
      "topicId": "topic_big_data_001",
      "attemptNumber": 1,
      "score": 1,
      "maxScore": 1,
      "passingScore": 1,
      "passed": true,
      "feedback": "Die Grundlagen sind sicher verstanden.",
      "answerFeedback": [],
      "completedAt": "2026-07-11T12:20:03.000Z"
    },
    "persistence": {
      "status": "saved",
      "recordId": "trs_95058ab2-cdc9-4790-bded-381947949b02"
    }
  },
  "error": null,
  "warnings": [],
  "meta": {
    "durationMs": 3400,
    "processedBy": ["SyncAgent", "TestAgent", "DataAgent"]
  }
}
```

### Response bei erfolgreicher Bewertung ohne Speicherung

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_d28bd3c9-3218-498d-a4af-88327fd2dc5a",
  "action": "learningTest.evaluate",
  "handledBy": "TestAgent",
  "timestamp": "2026-07-11T12:20:03.400Z",
  "data": {
    "result": {
      "resultId": "trs_95058ab2-cdc9-4790-bded-381947949b02",
      "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
      "topicId": "topic_big_data_001",
      "attemptNumber": 1,
      "score": 1,
      "maxScore": 1,
      "passingScore": 1,
      "passed": true,
      "feedback": "Die Bewertung wurde erstellt.",
      "answerFeedback": [],
      "completedAt": "2026-07-11T12:20:03.000Z"
    },
    "persistence": {
      "status": "failed",
      "recordId": null,
      "errorCode": "DATA_WRITE_FAILED"
    }
  },
  "error": null,
  "warnings": [
    {
      "code": "RESULT_NOT_SAVED",
      "message": "Die Bewertung wurde erstellt, aber noch nicht gespeichert."
    }
  ],
  "meta": {
    "durationMs": 3400,
    "processedBy": ["SyncAgent", "TestAgent", "DataAgent"]
  }
}
```

Der Client darf das Ergebnis anzeigen, muss den Speicherstatus jedoch sichtbar
kennzeichnen und einen späteren kontrollierten Retry ermöglichen.

## Vertrag für learningTest.result.get

### Request zum Abrufen eines Ergebnisses

```json
{
  "version": "1.0",
  "action": "learningTest.result.get",
  "source": "goldendawn-os",
  "requestId": "req_33fdb3f2-dc70-4ca1-b91a-ed5f5d8d77ac",
  "timestamp": "2026-07-11T12:30:00.000Z",
  "context": {
    "mode": "private",
    "locale": "de-DE",
    "clientVersion": "0.5.0"
  },
  "payload": {
    "resultId": "trs_95058ab2-cdc9-4790-bded-381947949b02"
  }
}
```

Der SyncAgent übersetzt diese externe Aktion in einen internen
`data.record.get`-Auftrag für die Entität `learningTestResult`.

### Response mit abgerufenem Ergebnis

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_33fdb3f2-dc70-4ca1-b91a-ed5f5d8d77ac",
  "action": "learningTest.result.get",
  "handledBy": "DataAgent",
  "timestamp": "2026-07-11T12:30:00.400Z",
  "data": {
    "result": {
      "resultId": "trs_95058ab2-cdc9-4790-bded-381947949b02",
      "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
      "topicId": "topic_big_data_001",
      "attemptNumber": 1,
      "score": 1,
      "maxScore": 1,
      "passingScore": 1,
      "passed": true,
      "feedback": "Die Grundlagen sind sicher verstanden.",
      "answerFeedback": [],
      "completedAt": "2026-07-11T12:20:03.000Z"
    }
  },
  "error": null,
  "warnings": [],
  "meta": {
    "durationMs": 400,
    "processedBy": ["SyncAgent", "DataAgent"]
  }
}
```

## Interner DataAgent-Vertrag

### Erlaubte Entitäten

| Entität | Zweck | Erste Verwendung |
| --- | --- | --- |
| `systemEvent` | sichere technische Ereignisse ohne vollständige Payload | v0.4.0 |
| `learningTestDefinition` | Testfragen und serverseitige Bewertungskriterien | v0.5.0 |
| `learningTestResult` | bewertetes und angezeigtes Testergebnis | v0.5.0 |

Der DataAgent ordnet diese Entitäten serverseitig Airtable-Tabellen zu.
Base-IDs, Tabellen-IDs und frei gewählte Feldnamen sind kein Bestandteil des
Requests.

### Interner Request zum Erstellen eines Datensatzes

```json
{
  "version": "1.0",
  "action": "data.record.create",
  "source": "SyncAgent",
  "requestId": "req_d28bd3c9-3218-498d-a4af-88327fd2dc5a",
  "timestamp": "2026-07-11T12:20:03.100Z",
  "context": {
    "mode": "private"
  },
  "payload": {
    "entity": "learningTestResult",
    "record": {
      "resultId": "trs_95058ab2-cdc9-4790-bded-381947949b02",
      "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
      "topicId": "topic_big_data_001",
      "attemptNumber": 1,
      "score": 1,
      "maxScore": 1,
      "passingScore": 1,
      "passed": true,
      "completedAt": "2026-07-11T12:20:03.000Z"
    }
  }
}
```

### Interne Response des DataAgent

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_d28bd3c9-3218-498d-a4af-88327fd2dc5a",
  "action": "data.record.create",
  "handledBy": "DataAgent",
  "timestamp": "2026-07-11T12:20:03.350Z",
  "data": {
    "entity": "learningTestResult",
    "recordId": "trs_95058ab2-cdc9-4790-bded-381947949b02",
    "operation": "created"
  },
  "error": null,
  "warnings": [],
  "meta": {
    "durationMs": 250
  }
}
```

### Regeln für Datenoperationen

- Nur der SyncAgent darf interne `data.*`-Requests erzeugen.
- `entity` muss auf der internen Allowlist stehen.
- Jede Entität besitzt eine feste Feld-Allowlist.
- Unbekannte Felder werden abgelehnt und nicht stillschweigend gespeichert.
- `create` benötigt eine stabile fachliche ID und `requestId`.
- `get` benötigt genau eine fachliche ID.
- `list` verwendet Cursor-Pagination.
- `update` erlaubt nur ausdrücklich veränderbare Felder.
- Base-, Tabellen- und Credential-IDs bleiben interne Konfiguration.
- Airtable-Antworten werden in Domänenobjekte übersetzt.

### Cursor-Pagination für interne Listen

Request-Payload:

```json
{
  "entity": "systemEvent",
  "pageSize": 20,
  "cursor": null,
  "filters": {
    "eventType": "syncTest.completed"
  }
}
```

Response-Daten:

```json
{
  "records": [],
  "page": {
    "pageSize": 20,
    "nextCursor": null,
    "hasMore": false
  }
}
```

- Standardgröße: 20 Datensätze.
- Maximum: 100 Datensätze.
- Cursor sind opak und werden vom Client nicht interpretiert.
- Filterfelder und Filterwerte werden pro Entität erlaubt und validiert.
- Freie Airtable-Formeln aus Requests sind nicht erlaubt.

## Domänenmodelle

### Modell eines Systemereignisses

```json
{
  "eventId": "evt_adf8f916-19f7-4344-bc16-87ab1aebef04",
  "eventType": "syncTest.completed",
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "source": "SyncAgent",
  "success": true,
  "occurredAt": "2026-07-11T12:00:00.105Z",
  "metadata": {
    "durationMs": 105,
    "mode": "private"
  }
}
```

`metadata` verwendet eine feste Allowlist und enthält keine vollständigen
Requests, Tokens oder privaten Lerninhalte.

### Modell einer serverseitigen Testdefinition

```json
{
  "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
  "topicId": "topic_big_data_001",
  "title": "Big Data – Grundlagen",
  "settings": {
    "questionCount": 1,
    "maxScore": 1,
    "passingScore": 1,
    "language": "de-DE"
  },
  "questions": [
    {
      "questionId": "qst_1",
      "prompt": "Welche vier V beschreiben Big Data?",
      "maxPoints": 1,
      "criteria": [
        {
          "criterion": "Nennt und erklärt Volume, Variety, Velocity und Veracity.",
          "maxPoints": 1
        }
      ]
    }
  ],
  "createdAt": "2026-07-11T12:10:02.000Z"
}
```

`criteria` sind serverseitig und werden nicht an das Dashboard ausgeliefert.

### Modell des Speicherstatus

```json
{
  "status": "saved",
  "recordId": "trs_95058ab2-cdc9-4790-bded-381947949b02",
  "errorCode": null
}
```

Erlaubte Statuswerte:

| Status | Bedeutung |
| --- | --- |
| `saved` | Daten wurden bestätigt gespeichert |
| `pending` | Speicherung ist geplant, aber noch nicht bestätigt |
| `failed` | Speicherung ist fehlgeschlagen |
| `notRequired` | Aktion benötigt keine Speicherung |

Ein `pending`-Status darf nicht dauerhaft als erfolgreich gespeichert gelten.

## Idempotenz und Wiederholungen

Dieser Abschnitt beschreibt ausschließlich Zielregeln für spätere schreibende
Verträge. Der durch ADR 0023 entschiedene vollständig lokale synthetische
`syncTest` bleibt nebenwirkungsfrei, besitzt aber weder Replay-, Idempotenz-
noch Deduplizierungsschutz und führt keine automatischen Retries aus. Seine
fachliche Nebenwirkungsfreiheit rechtfertigt keine pauschale Wiederholbarkeit
anderer Aktionen oder späterer Provideraufrufe.

### Regeln für schreibende Aktionen

- Der erste erfolgreiche Request speichert `requestId`, Aktion und einen
  stabilen Fingerprint der validierten Nutzlast.
- Ein Retry mit identischen Werten liefert das bereits vorhandene Ergebnis.
- Ein Retry erzeugt keinen weiteren Versuchszähler und keinen zweiten Datensatz.
- Eine bekannte `requestId` mit abweichendem Fingerprint wird abgelehnt.
- Timeouts werden nicht automatisch als fehlgeschlagener Schreibvorgang
  interpretiert; zuerst wird der Status anhand der `requestId` geprüft.
- Der Client verwendet begrenztes exponentielles Backoff.

### Fachliche Wiederholung eines Lerntests

Eine neue fachliche Prüfung ist kein technischer Retry. Sie erhält:

- eine neue `requestId`;
- einen serverseitig erhöhten `attemptNumber`;
- ein neues `resultId`;
- weiterhin dieselbe `testId`, wenn derselbe Test erneut beantwortet wird.

## Aktuelle Request-, Wire- und lokale Agentenkernreihenfolge

Vor der implementierten Gateway-Eingangsgrenze setzt der isolierte
BrowserSyncTransport die durch ADR 0027 korrigierte Browser-Ausgangsreihenfolge
um. ADR 0028 ersetzt ADR 0027 formal und legt darüber die folgende aktuelle
normative Reihenfolge. Ihre neue feste v1-Wire-Policy ist implementiert:

1. Root-Own-Keys einmal, Rootprototyp einmal, danach die Deskriptoren `version`,
   `action`, `source`, `requestId`, `timestamp`, `payload` je einmal erfassen,
   die Payloadidentität ausschließlich aus dem erfassten Rootdescriptor
   übernehmen und anschließend Payload-Own-Keys und Payloadprototyp je einmal
   erfassen; danach keinen Caller- oder Payloadwert erneut lesen;
2. ausschließlich aus dieser internen Evidenz genau einen disjunkten
   Sechs-Felder-Requestgraphen mit frischem leerem Payload erzeugen und nur
   denselben Graphen mit derselben Timestampreferenz als Input von
   `validateSyncRequest #1` verwenden, danach tief einfrieren und exakt einmal
   als Input von `validateSyncRequest #2` verwenden; ein dritter Aufruf bleibt
   verboten, und Callerroot, Callerpayload und separates Snapshotobjekt
   erreichen den Validator nie;
3. diesen Graphen gegen exakte Prototyp-/`toJSON`-Grenzen terminal absichern;
4. unmittelbar danach genau einmal die private feste v1-Wire-Policy über den
   tief eingefrorenen internen Graphen und die bereits verwendete primitive
   Referenzzeit ausführen; sie prüft unabhängig die festen Werte `1.0`,
   `syncTest` und `goldendawn-os`, die ASCII- und Längengrenzen der Request-ID,
   den kanonischen tatsächlich gültigen UTC-Timestamp samt identischer
   Rückprojektion und höchstens 300.000 ms Abstand sowie exakte normale,
   aufzählbare, eingefrorene Sechs-Felder-/Leerpayload-Records ohne `toJSON`;
   jede Abweichung stoppt vor allen folgenden transportgesteuerten Stufen;
5. genau einmal mit erfassten Intrinsics serialisieren, über die erfasste
   Encoder-Prototypmethode streng als UTF-8 messen und auf den privaten Cap von
   65.536 Bytes begrenzen; unter dem geschlossenen v1-Vertrag ist der größte
   gültige Body exakt 193 Bytes groß und der reale Cap nur Defense-in-Depth;
6. Controller und Signal erfassen, einen exakten eingefrorenen Null-Prototyp-
   `RequestInit` bauen, danach den Timer der internen 5.000-ms-
   Eventloopdeadline mit einem First-Terminal-Owner setzen und erst danach
   höchstens einen Fetch-Seam-Aufruf zum festen Loopbackziel starten;
7. unmittelbar vor jedem erfassten nativen `then` Fetch-, Read- und zulässige
   Cleanup-Promises anhand ihres echten nativen Brandprofils, der exakt
   erfassten lokalen Prototypkette sowie der Constructor-/Species-Oberfläche
   prüfen, ohne eine historische Erzeugungsrealm zu behaupten; alle
   kontrollierten Handler geben ausschließlich `undefined` zurück;
8. `fetchStarted` unmittelbar vor Fetch setzen und jeden danach gewinnenden
   Fehler oder die Deadline mit höchstens einem Controllerabort sowie nach
   Readerübernahme höchstens einem Cancel und Release bereinigen;
9. Responsefelder in der Reihenfolge `status`, `redirected`, `url`, `type`,
   `headers` je genau einmal lesen und unmittelbar fail-fast prüfen, danach die
   browserexponierten Header `content-type`, `content-length`,
   `content-encoding` ebenso prüfen und erst anschließend `body` lesen.
   Content-Encoding `null` belegt nur gefilterte CORS-Unsichtbarkeit, weder
   Wire-Abwesenheit noch fehlende Dekompression;
10. Readerresults mit Own-Key-Sequenz `value`, `done` und Descriptorfolge
   `done`, `value` seriell prüfen; nur positive echte native Chunks mit zum
   Prüfzeitpunkt exakt passendem lokalem View-/Bufferprototypprofil auf festen,
   nicht geteilten Buffern sofort in genau einen eigenen festen Zielbuffer
   kopieren, ohne eine historische Erzeugungsrealm zu behaupten; Nullchunks und
   instabile Buffer ablehnen, auf höchstens 16.384 browserexponierte Bytes
   begrenzen, EOF und exakte Längengleichheit verlangen sowie den Readerlock
   genau einmal freigeben;
11. Deadline disarmen und Timer bereinigen, dann genau einmal fatal über die
   erfasste Decoder-Prototypmethode dekodieren und genau einmal nativ ohne
   Reviver parsen;
12. Prototypketten und ein mögliches eigenes Top-Level-`then` geschlossen
   prüfen und ausschließlich den weiterhin unvertrauenswürdigen Parsed-Wert
   unmittelbar an den unveränderten SyncService erfüllen.

Die ADR-0027-Basis dieser Reihenfolge ist isoliert implementiert und durch die
vorhandene netzwerkfreie mutationswirksame Unit-Suite geprüft. Die in Schritt 4
entschiedene feste v1-Wire-Policy ist samt kausaler ADR-0028-Matrix
implementiert; 423/423 fokussierte Tests und `Δ = 151` weisen die
Lückenschließung bei unverändertem Contractvalidator nach. Das beobachtbare Profil
ersetzt keine Brand-, Prototyp-, Constructor-, Species-, Buffer- oder
Kopierprüfung. ADR 0029 operationalisiert den dafür erforderlichen
Evidence-Record; sein Entscheidungsslice selbst führte keinen Runtimevorgang
aus. Der danach einmalig autorisierte Chrome-151-Lauf ist mit Gesamt-`FAIL`,
PNA/LNA und Negativvektoren `UNPROVEN` sowie Cleanup `PASS` dokumentiert; die
Ursache bleibt `CAUSE_NOT_PROVEN`. ADR 0032 ersetzt ADR 0031 formal und
totalisiert die davon unabhängige passive Diagnosegrenze. Als Nächstes folgt
ausschließlich ihre reine netzwerkfreie effects-as-data-
Foundationimplementierung und -prüfung; darauf folgen ein eigener Adapter-ADR
und dessen getrennte netzwerkfreie Implementierung. Erst danach kann ein
sichtbarer Diagnoselauf gesondert autorisiert werden. Produktive SyncService-/`src/main.js`-
Komposition und Browser-End-to-End-Fluss fehlen weiterhin und folgen erst nach
einem späteren vollständig neuen ADR-0029-Gesamt-`PASS`.

Die transportneutrale SyncGateway Request Boundary implementiert für einen
bereits vollständig materialisierten JavaScript-Wert:

1. exakte Argumentanzahl prüfen;
2. den unveränderten Wert mit `validateSyncRawBodySize` prüfen;
3. Übergröße ohne Parsing als `PAYLOAD_TOO_LARGE` klassifizieren;
4. nur einen bestandenen String exakt einmal nativ und ohne Reviver parsen;
5. Parser-Throws vollständig verwerfen und statisch als `INVALID_JSON`
   klassifizieren;
6. eine kontrollierte Referenzzeit höchstens einmal erfassen;
7. den unveränderten Parsed-Wert vollständig mit dem bestehenden SyncContract
   validieren;
8. erst danach eine defensive Sechs-Felder-Projektion mit frischem leerem
   Payload erzeugen;
9. Projektion validieren, tief einfrieren und final erneut validieren;
10. ausschließlich den defensiven Snapshot oder eine vollständig validierte
    frühe Gateway-Fehlerresponse ausgeben.

Die aus ADR 0019 fortgeltende lokale HTTP- und Wire-Reihenfolge bleibt durch
ADR 0023 unverändert. Die Local SyncGateway Raw-Wire and HTTP Foundation
implementiert:

1. den Listener ausschließlich an `127.0.0.1` binden;
2. jeden regulären `request`-, `checkContinue`- und `checkExpectation`-Pfad
   zuerst durch dieselbe factory-lokale Socket-Admission führen und jedes
   Folgeereignis vor jedem `rawHeaders`-Zugriff terminal beenden;
3. ausschließlich HTTP/1.1 zulassen und HTTP/1.0 vor der
   Raw-Header-Projektion statisch ablehnen;
4. mit `requireHostHeader: false` Nodes eigene Hostantwort deaktivieren und
   dabei keinen akzeptierenden Pfad öffnen;
5. das exakte Request-Target `/api/sync-test` und frühere Sonderpfade
   fail-closed behandeln; im danach verbleibenden regulären Requestpfad
   `rawHeaders`, höchstens 32 Headerfelder, die portabhängig exakte
   Loopback-Host-Autorität, Methode und exakte Origin prüfen; `OPTIONS` nur als
   bodyfreien Preflight behandeln;
6. für `POST` ausschließlich kontrolliertes `application/json` mit optionalem
   `charset=utf-8`, fehlendes oder `identity`-Encoding sowie einen
   widerspruchsfreien Längen- oder Chunked-Pfad erlauben;
7. `Content-Length` nur als frühes Signal gegen die kanonische
   65.536-Byte-Grenze prüfen;
8. die tatsächlich empfangenen Bufferbytes während des Streamings zählen, nur
   begrenzte Chunks halten und beim Übergang zu Byte 65.537 abbrechen;
9. den vollständig empfangenen begrenzten Buffer exakt einmal mit einem
   verifizierten fatalen UTF-8-Decoder und `ignoreBOM: true` dekodieren;
10. ungültiges UTF-8 fail-closed ablehnen, U+FEFF erhalten und weder Unicode
   normalisieren noch trimmen oder Inhalte reparieren;
11. ausschließlich diesen String an die bestehende SyncGateway Request Boundary
   geben und `processSyncRawBody` exakt einmal aufrufen; das HTTP-Modul parst
   kein JSON;
12. eine kontrollierte Boundary-Ablehnung ausschließlich als validierte
   `gatewayErrorResponse` über HTTP `400` ausgeben, lokale HTTP- und
   Boundaryfehler im getrennten lokalen Envelope halten;
13. ausschließlich die exakte defensive Requestidentität synchron höchstens
    einmal an den injizierten SyncAgent übergeben und nur den vollständig
    abgesicherten exakten ADR-0024-Erfolg als defensive normale SyncResponse mit
    HTTP `200` ausgeben.

ADR 0023 legt hinter dieser unveränderten Grenze die lokale Reihenfolge fest;
ADR 0024 implementiert davon den isolierten SyncAgent-Kern:

1. ausschließlich die validierte defensive Projektion an den logisch
   getrennten lokalen SyncAgent übergeben;
2. im implementierten Kern den Request defense-in-depth erneut validieren und
   gegen die feste Aktions-Allowlist `syncTest` prüfen;
3. `syncTest` dort vollständig lokal, deterministisch, synthetisch und ohne
   ModelProvider oder WorkflowProvider behandeln;
4. die normale SyncResponse dort lokal erzeugen, vollständig validieren und
   mit Version, Aktion und `requestId` korrelieren;
5. erst in separat entschiedenen späteren Capabilities eine neu erzeugte,
   minimierte Projektion an einen capability-spezifischen Provideradapter
   übergeben und dessen unvertrauenswürdigen Output lokal begrenzen,
   projizieren, validieren und korrelieren.

Die Schritte 1 bis 4 der lokalen Agentenreihenfolge sind einschließlich der
durch ADR 0025 entschiedenen Gateway-/SyncAgent-Komposition implementiert. ADR
0028 ersetzt ADR 0027 formal, übernimmt dessen beide Korrekturen und entscheidet
die inzwischen implementierte feste v1-Wire-Policy vor der Wirefreigabe. Danach
folgte das getrennte reale, kontext- und versionsgebundene
PNA-/LNA-/Mixed-Content-Browser-Runtimegate; sein gebundener Chrome-151-Lauf
bleibt Gesamt-`FAIL` mit `CAUSE_NOT_PROVEN`. Browserkomposition, Provider- und
externer Fluss bleiben geschlossen.

Der Browsercaller ist am lokalen Gateway nicht authentisiert und nicht
vertrauenswürdig. Lokale Konfiguration bestimmt Listener, Route, Origin und
Policy; der lokale SyncAgent bestimmt jede spätere Provider-, Modell-,
Workflow-, Endpoint- und Umgebungsauswahl. `source`, Request-ID, Timestamp,
Browserwerte, Requestfelder und Modelloutput dürfen diese Auswahl nicht
bestimmen. Die kleine anonyme Capability besitzt keine Berechtigung für
PromptVault, LearningHub, LichtwaldLog, Vault, Airtable, DataAgent oder
TestAgent. Browser-Raw-Body, Browserheader, URL, Query und ursprüngliche
Serialisierung enden an der lokalen Gatewaygrenze und werden niemals an einen
Provider weitergereicht.

`ModelProvider` und `WorkflowProvider` bleiben rein konzeptionelle Portklassen
ohne in diesem Slice definierte Signaturen, Methoden, Dateien oder Schemas.
OpenAI, lokale Modelle und n8n sind ausschließlich optionale spätere Adapter
hinter dem lokalen SyncAgent. Die GoldenDawn-seitige Kopie späteren
Credentialmaterials liegt ausschließlich in der vertrauenswürdigen
Laufzeitkonfiguration oder Secretverwaltung des konkreten serverseitigen
Adapters auf GD-WS01. Etwaiges providerseitiges Prüf- oder Credentialmaterial
liegt ausschließlich im Credential-/Secret-Store des Providers. Beide Seiten
sind getrennte Vertrauens- und Betriebsgrenzen. Kein Adapter darf direkt an
Browser oder SyncService antworten.
Gateway und lokaler SyncAgent sind für diesen engen Pfad komponiert; der
BrowserSyncTransport ist gemäß ADR 0027 isoliert implementiert und netzwerkfrei
geprüft. ADR 0029 entscheidet dessen getrenntes Browser-Runtime-Evidence-Gate;
der einmalige Chrome-151-Lauf ist insgesamt `FAIL`, während PNA/LNA und die
nicht ausgeführten Negativvektoren `UNPROVEN` bleiben. Produktive SyncService-/
`src/main.js`-Komposition und Browser-End-to-End-Fluss fehlen weiterhin.

CORS steuert Browserzugriffe, ersetzt aber weder Authentisierung noch
Autorisierung. Rate Limits bleiben vor dauerhaftem Betrieb für lokales Gateway,
lokalen SyncAgent und jeden späteren Provideradapter risikogerecht zu
implementieren.

`validateSyncRawBodySize` parst oder serialisiert nichts. Die aktuelle
Boundary besitzt keine tatsächlich empfangenen Bytes und schützt nicht vor
bereits erfolgter Stringallokation. Native doppelte JSON-Membernamen folgen
Last-Key-Wins; ein Duplicate-Key-Scanner oder kanonisches JSON wird nicht
eingeführt. `source` wird auch nach erfolgreicher Strukturvalidierung nicht
zum Herkunfts-, Identitäts- oder Berechtigungsnachweis.

`src/contracts/syncContract.js` und
`src/gateways/syncGatewayRequestBoundary.js` bleiben die kanonischen Quellen
für Contract und Request Boundary. `src/agents/syncAgent.js` ist die
kanonische Quelle des isolierten lokalen SyncAgent-Kerns.

Die historische n8n-Evidenz- und Artefaktgrenze bleibt erhalten. n8n Cloud
importiert nach dem datierten Plattformbefund vom 2026-08-17 keine beliebigen
externen npm-Module im Code Node; die dokumentierte Modul-Allowlist gilt nur
für Self-Hosted-Konfiguration. Das reproduzierbar generierte selbstständige
Expression-IIFE und sein Integritäts-/Paritätspfad bleiben deshalb ein
korrektes, derzeit unkomponiertes Derivat. Ein späterer optionaler n8n-Adapter
darf keine manuell gepflegte Contractkopie enthalten.

Der Stable-OSS-Befund zu Dekomprimierung und Header-Auth-Ausgabe bleibt `FAIL`,
die konkrete Tenantmessung und Production-URL bleiben `UNPROVEN`, und
`activationDecision` bleibt in Evidence-Schema 1 `FAIL`; `overallGate`
existiert dort nicht. Daraus folgt keine Wahl einer Authentisierungsmethode.
`Raw Body` ist in der neuen Architektur kein Nachweis für ursprüngliche
Browserbytes, weil n8n nur einen vom lokalen SyncAgent neu erzeugten
sanitisierten Request erhalten dürfte; die historische Option darf gleichwohl
nicht nachträglich als Wire-Byte-Garantie dargestellt werden.

ADR 0023 autorisiert keine Cloud- oder Tenantmessung. Vor jeglicher Vorbereitung
oder Ausführung einer neuen n8n-Tenantmessung müssen ein neuer n8n-Adapter-ADR
angenommen und eine neue adapterbezogene Evidenz-Schemaversion festgelegt sein.
Erst danach benötigen die Anlage eines temporären Workflows, ein
Wegwerfcredential, jeder einzelne synthetische Test-URL-One-shot sowie der
vorab definierte Cleanup und die Entfernung der Cloudartefakte jeweils eine
eigene ausdrückliche Freigabe. Jede Supportanfrage ist unabhängig davon separat
freizugeben und darf nur eine spätere Entscheidung vorbereiten; sie autorisiert
weder Workflow, Credential, Tenantvorbereitung oder -ausführung,
Adapteraktivierung noch Productionlauf. Ohne angenommenen ADR und festgelegte
Schemaversion gibt es keinen Workflow, kein Credential und keinen Test-URL-
Verkehr. Ein Production-URL-Runner oder -Messpfad existiert nicht. Ein späterer
n8n-Adapter benötigt darüber hinaus eigene Authentisierungs-, Execution-Data-,
Workflow-, Credential-, Tenant-, Integritäts-, Paritäts- und
Mutationsprüfungen. Das bestehende Bundle und Manifest bleiben unverändert und
inaktiv.

## Datenschutz- und Sicherheitsregeln

- Verträge enthalten keine Tokens, Passwörter oder Credential-IDs.
- Die SyncGateway Request Boundary gibt den Raw Body, Parserexceptions,
  Validatorfehlerlisten und fremde Dependency-Meldungen weder zurück noch
  protokolliert oder persistiert sie.
- Die Boundary liest oder exportiert keine Inhalte aus PromptVault,
  LearningHub oder LichtwaldLog. Der lokale HTTP-Handler liest diese Bestände
  ebenfalls nicht, besitzt keinen externen Upstream und führt die defensive
  Projektion nicht aus dem Prozess heraus. Die lokale Gateway-/SyncAgent-
  Komposition erzeugt keinen externen Datenfluss; der Browsertransport fehlt.
- ADR 0027 verwendet für fremde Promise-, `Uint8Array`- und `ArrayBuffer`-
  Werte ausschließlich das zum Prüfzeitpunkt beobachtbare native Brand-,
  Prototyp-, Constructor-/Species- beziehungsweise View-/Bufferprofil. Eine
  historische Erzeugungsrealm wird nicht behauptet und Realm ist keine
  Sicherheits-, Identitäts-, Berechtigungs- oder Vertrauensgrenze. Unveränderte
  Brand-, Shape-, Promise-, Buffer-, Größen-, Deadline- und Redactionprüfungen
  bleiben wirksam.
- Akzeptierte Fremdbytes werden unmittelbar in den eigenen lokalen Zielbuffer
  kopiert. Nachträgliche Mutation oder Wiederverwendung der Quelle verändert
  diese Kopie nicht; der Transport selbst prototypisiert Eingabewerte niemals
  um.
- Der lokale `syncTest` bleibt vollständig providerfrei und darf keine Daten
  aus PromptVault, LearningHub, LichtwaldLog, GoldenDawn-Vault, Airtable,
  lokalen Dateien oder Gesundheits-, Reflexions- und Lerndaten lesen oder
  exportieren.
- Ein späterer capability-spezifischer Adapter erhält ausschließlich eine vom
  lokalen SyncAgent neu erzeugte, allowlist-basierte und minimierte Projektion.
  Browser-Raw-Material, Browserheader, URL, Query und ursprüngliche
  Serialisierung werden niemals an einen Provider übertragen.
- GoldenDawn-seitige Credentialkopien gehören ausschließlich in die
  vertrauenswürdige Laufzeitkonfiguration oder Secretverwaltung des konkreten
  serverseitigen Adapters auf GD-WS01. Providerseitiges Prüf- oder
  Credentialmaterial gehört ausschließlich in den Credential-/Secret-Store des
  Providers. Beide Seiten sind getrennte Vertrauens- und Betriebsgrenzen;
  Providerablage beweist weder Redaction, Retention noch Nichtweitergabe, und
  Same-Realm-Komposition ist keine technische Secret-Isolation. Credential-
  material ist kein Vertragsfeld und darf weder SyncRequest, SyncResponse oder
  Agentenresultat noch Browser, `VITE_*`, Storage, URL, Repository,
  GoldenDawn-Vault, Workflow-Export, Testfixture, Screenshot oder Anwendungslog
  erreichen.
- Für n8n ist kein Authentisierungsverfahren entschieden. Header
  Authentication, Bearer-Secret, konkreter Headername, JWT, HMAC,
  asymmetrisches Verfahren, Credentialformat und Rotationsmechanismus bleiben
  offen; der Header-Auth-/Execution-Data-Befund aus ADR 0022 bleibt ein
  Blocker, keine gewählte Lösung. n8n verwahrt nicht transitiv OpenAI-,
  Airtable- oder lokale Modellcredentials.
- OpenAI, lokale Modelle und n8n benötigen jeweils eigene Adapter-,
  Datenminimierungs-, Outputvalidierungs-, Ressourcen- beziehungsweise Kosten-
  und Retentionentscheidungen. Dieser Slice implementiert keine
  Providerverarbeitung, Logs, Telemetrie oder Compliance-Nachweise.
- Ein exakt leerer Payload entfernt das vorgesehene Inhaltsfeld. `source`,
  `requestId` und `timestamp` bleiben Metadaten und können private Bedeutung
  codieren; Contract und leeres Payload beweisen weder ihre semantische
  Nicht-Privatheit noch Datenschutz.
- Präfixe und Timestamp-Toleranz sind kein Authentisierungs-, Herkunfts-,
  Kollisions-, Replay-, Idempotenz- oder Deduplizierungsschutz.
- Externe Clients dürfen keine Agenten-, Base- oder Tabellenziele bestimmen.
- Agentenoutput wird vor Weitergabe und Speicherung validiert.
- Lernkontext wird als Dateninhalt behandelt, nicht als Systemanweisung.
- Bewertungskriterien bleiben serverseitig.
- Demo- und private Requests verwenden getrennte serverseitige Workflows und
  Datenquellen.
- Fehlermeldungen enthalten keine vollständigen Upstream-Antworten.
- Die aktuelle lokale Foundation führt keine Requestlogs oder Telemetrie ein.
  Spätere ausdrücklich entschiedene Logs verwenden bevorzugt `requestId`,
  Aktion, Status und Dauer statt vollständiger Payloads.

## Kompatibilitäts- und Änderungsregeln

### Abwärtskompatible Änderungen

Für die aktuell strikt geschlossenen `syncTest`-Profile gibt es keine
unbekannten optionalen Felder: Jede Erweiterung muss zuerst dokumentiert,
versioniert und in Validatoren sowie Tests umgesetzt werden. Die folgenden
Regeln betreffen nur den geplanten breiteren Zielvertrag:

- neues optionales Response-Feld;
- neuer optionaler Warning-Code;
- neue Aktion innerhalb derselben Hauptversion, wenn alte Clients unverändert
  funktionieren;
- Erweiterung einer Enum nur, wenn Clients unbekannte Werte sicher behandeln.

### Breaking Changes

- Umbenennung oder Entfernung eines Pflichtfelds;
- Änderung eines Datentyps;
- Änderung der Bedeutung von `success`;
- neue Pflichtfelder;
- Änderung der ID- oder Zeitsemantik;
- Freigabe zuvor interner Aktionen für externe Clients.

Breaking Changes benötigen:

1. neue Hauptversion;
2. aktualisierte Beispiele und Validierung;
3. Migrationsnotiz;
4. Abgleich mit Architektur, Sicherheit, Roadmap und AGENTS.md;
5. manuellen Pull Request und Review.

## Implementierungsartefakte

Die drei zuerst implementierten transportneutralen `v0.3.0`-Foundations
bleiben bewusst kleine, zusammenhängende ES-Module:

```text
src/
├── contracts/
│   └── syncContract.js
├── services/
│   └── syncService.js
└── gateways/
    └── syncGatewayRequestBoundary.js
```

Diese drei Module verwenden ausschließlich JavaScript- und Plattformfunktionen.
Eine Schema-Bibliothek, neue Abhängigkeit oder ein konkreter Transport wurde in
diesen Foundations nicht eingeführt; der SyncService besitzt ausschließlich
den injizierten `sendSyncRequest`-Port und die Boundary ausschließlich Clock
und Gateway-ID-Generator als Composition-Dependencies.

ADR 0019 fügt diesem Artefaktbaum keinen lokalen Server, Transportadapter,
n8n-Bundle, Generator oder Workflow hinzu. Diese Komponenten bleiben in
getrennten späteren Slices geplant. Das beschreibt unverändert den damaligen
reinen Entscheidungsstand von ADR 0019. Der unmittelbar folgende Slice ergänzt
getrennt:

```text
server/
├── localSyncGatewayRuntimeConfig.js
├── localSyncGatewayHttpServer.js
└── startLocalSyncGateway.js
```

Das Paket-Script `gateway:local` startet ausschließlich diesen lokalen Prozess.
Der aktuelle Bundle-Slice ergänzt wiederum getrennt:

```text
scripts/n8n/
├── generateSyncGatewayBoundaryBundle.js
└── syncGatewayBoundaryBundleEntry.js

artifacts/n8n/
├── syncGatewayRequestBoundary.bundle.js
└── syncGatewayRequestBoundary.bundle.manifest.json

tests/
└── n8nSyncGatewayBoundaryBundle.test.js
```

Die Paket-Scripts `bundle:n8n:generate` und `bundle:n8n:check` erzeugen
beziehungsweise prüfen ausschließlich diese generierten Derivate. ADR 0024
ergänzt davon getrennt den lokalen Kern:

```text
src/agents/
└── syncAgent.js

tests/
└── syncAgent.test.js
```

ADR 0027 ergänzt davon getrennt ausschließlich dieses inzwischen vorhandene
Modul und seine netzwerkfreie mutationswirksame Unit-Suite:

```text
src/transports/
└── browserSyncTransport.js

tests/
└── browserSyncTransport.test.js
```

Der ADR-0028-Entscheidungsslice erzeugte kein Implementierungsartefakt. Der
anschließend getrennt ausgeführte Implementierungsslice änderte ausschließlich
den bestehenden Transport um die private feste v1-Wire-Policy und erweiterte
seine Unit-Suite um die oben beschriebene Matrix. SyncContract, n8n-Bundle,
Manifest und Generator blieben unverändert.

Es gibt weiterhin keine produktive Browsertransportkomposition, keinen
Provideradapter, n8n-Workflow, Webhook oder externen Transport. ADR 0025
implementiert ausschließlich den lokalen Gateway-/SyncAgent-Kompositionspfad;
die ADR-0027-Transportbasis und die durch ADR 0028 entschiedene feste
v1-Wire-Policy sind isoliert umgesetzt. Der
SyncAgent-Modulimport
bleibt inaktiv, während Bundle und Manifest unkomponiert und inaktiv bleiben.
Die Paketversion bleibt `0.2.2`.

## SyncContract-Testmatrix

| Fall | Erwartung |
| --- | --- |
| gültiger `syncTest`-Request | `ok: true`, keine Fehler |
| exakt `±300000 ms` Zeitabweichung | gültig; ein Millisekundenschritt darüber ungültig |
| fehlendes oder zusätzliches Feld | fail-closed mit statischem Validierungsfehler |
| unbekannte Version, Aktion oder Quelle | fail-closed mit statischem Validierungsfehler |
| ungültige, nicht-ASCII- oder überlange `req_`-ID | ungültig |
| exakt 65.536 UTF-8-Bytes | gültig; 65.537 Bytes ungültig |
| Objekt statt Raw-Body-String | ungültig; keine Serialisierung |
| gültige Erfolgsresponse | `ok: true`, als `synthetic` klassifizierte Erfolgsdaten und exakte Korrelation |
| gültiger normaler Fehler | `ok: true`, statisches Normalfehlerprofil und exakte Korrelation |
| gültiger früher Gateway-Fehler | `ok: true`, `gateway_`-ID und keine normale Korrelation |
| abweichende Response-Version, -Aktion oder -ID | ungültig |
| inkonsistente `success`-/`data`-/`error`-Felder | ungültig |
| gewöhnlicher eigener Accessor, Symbol, Zusatzfeld oder manipulierter Array | kontrollierte Ablehnung; der Validator schreibt keine Properties und liest den Accessor nicht als Wert |
| Proxy mit werfender Trap | kontrollierter Validierungsfehler, soweit die Reflection-Exception beobachtbar ist; bereits ausgelöste Seiteneffekte werden nicht rückgängig gemacht |
| transparenter oder zustandsabhängiger Proxy | Erfolg bestätigt nur die während dieses Aufrufs beobachtete Struktur; keine vollständige Proxy-Erkennung oder Seiteneffektgarantie |

## SyncService-Testmatrix

| Fall | Erwartung |
| --- | --- |
| API und argumentloser Aufruf | eingefroren, exakt `runSyncTest`, immer Promise-basiert |
| zusätzlicher Aufrufwert | `invalidInvocation`; kein Zugriff auf Argument, Generator, Clock oder Port |
| fehlende, nicht funktionale oder werfend aufgelöste Portmethode | `unavailable`; Generator und Clock werden nicht ausgewertet; kein Aufruf der Portmethode |
| gültiger Request-Build nach erfolgreicher Methodenauflösung | exakt sechs Felder; Generator und Clock jeweils einmal; Request und Payload eingefroren |
| ungültiger Generator oder Clock | `requestBuildFailed`, `requestId: null`, kein Aufruf der Portmethode und keine Konvertierung |
| synchroner Throw, Rejection oder beobachtbarer Thenable-Fehler | `transportFailed`, validierte ausgehende ID, kein Retry |
| gültige normale Erfolgsresponse | `syncResponseReceived`, defensiver tief eingefrorener Snapshot |
| gültige normale Contract-Fehlerresponse | außen `ok: true`, fachlich `syncResponse.success: false` |
| Gateway-Profil oder falsch korrelierte Response | `invalidResponse` |
| nachträgliche Mutation des Transportobjekts | keine Änderung des Service-Snapshots |
| sequenzielle und parallele Aufrufe | getrennte Records, eigene Korrelation, kein gegenseitiger Einfluss |
| gewöhnlicher Accessor oder beobachtbar werfende Proxy-Trap | statisch redigierter lokaler Fehler; keine Übernahme fremder Werte |

## Implementierte BrowserSyncTransport-Testmatrix gemäß ADR 0028

Der getrennte ADR-0028-Implementierungsslice setzt diese Erweiterung der
netzwerkfreien mutationswirksamen Suite um. Der kausale Haupttest weist die
Schließung des bestätigten Validatorbypasses nach: Mit aktiver Policy endet er
vor Stringify und Fetch, bei gezielt neutralisiertem Policy-Callsite erreicht
derselbe Bypass exakt einen Fetch.

### Validator- und Allowlist-Manipulationen

- manipuliertes `Object.getOwnPropertyDescriptor` bei tatsächlicher
  Requestversion `2.0`;
- `Array.prototype.push` als No-op;
- `Array.prototype.includes = () => true`;
- `RegExp.prototype.test = () => true`;
- `Map.prototype.has = () => false`;
- `Map.prototype.set` als No-op;
- ein leerer `Array.prototype[Symbol.iterator]`;
- persistente Vergiftung privater Regex-/Set-Objekte nach Wiederherstellung
  sichtbarer Intrinsics;
- manipulierte Date-, `toISOString`-, Number-, Math- und Stringoberflächen.

### Feste v1-Werte, Request-ID und UTC-Zeit

- Request-ID `req_` ohne Folgezeichen;
- `_` oder `-` als erstes Zeichen nach dem Präfix;
- Nicht-ASCII-Zeichen und unerlaubte ASCII-Interpunktion;
- die minimale gültige Request-ID;
- gültige 64-Zeichen- und ungültige 65-Zeichen-Grenze;
- gültiger Schalttag, ungültiger Kalendertag und Zeit-/Datumsbereichsfehler;
- exakte kanonische UTC-Rückprojektion;
- für jede Abweichung null transportgesteuerte Stringify-, Encode-,
  Controller-, Timer- und Fetch-Aufrufe;
- eine gültige Kontrolle mit exakt zwei Contractvalidatoraufrufen, genau einer
  festen v1-Wire-Policy-Prüfung und genau einem Fetch;
- keine dritte `validateSyncRequest`-Ausführung;
- ein kausaler Mutationstest, bei dem Neutralisieren oder Umgehen der Policy
  in einer temporären Quellkopie mindestens einen Validatorbypass wieder bis
  Fetch gelangen lässt.

### Intrinsics, Promise und Deadline

- post-import mutierte Promise-, Array-, `Uint8Array`-, TypedArray-,
  `ArrayBuffer`-, Object-, TextEncoder- und TextDecoder-Prototypketten;
- Constructor-/Species-Descriptorflag-Abweichungen;
- irreversibel veränderte Descriptorflags ausschließlich in einem
  wegwerfbaren Kindprozess;
- synchron ausgelöste Deadline, nach der der Timer-Seam wirft, mit null Fetch,
  Abort und Clear ohne zurückgegebenes Handle;
- isolierte Kindprozesscharakterisierung bereits abgelehnter malformed Fetch-,
  Read- und Cleanup-Promises;
- mindestens eine Promiseprobe, die bestätigt, dass die erfasste native
  `then`-Methode nicht auf den ungültig profilierten Kandidaten angewendet wird.

### UTF-8, Responseheader und Stream

- ungültige UTF-8-Sequenz, deren Ersatzdecodierung parsebares JSON ergäbe, mit
  null JSON-Parse;
- eine positive echte Multibyte-UTF-8-Probe;
- getrennt nicht coercible Responsefelder und Headerwerte mit null
  Coercion-Hooks;
- `Content-Length: null` mit null Bodyproperty-, Reader- und Chunkzugriffen;
- der 16.385-Byte-Fall bei deklarierter Länge 16.384 mit null Kopieraufrufen,
  genau einem Transportzielbuffer und keinem weiteren Read; dieser Fall
  überschreitet zugleich deklarierte Restlänge und absoluten Cap und ist kein
  isolierter öffentlicher Nachweis nur des absoluten Caps;
- stage-spezifische Erwartungen nach jeder fehlgeschlagenen
  Methodenauflösung.

Alle globalen Mutationen laufen seriell und werden im `finally` vollständig
wiederhergestellt. Irreversible oder nicht zuverlässig wiederherstellbare
Mutationen laufen ausschließlich in wegwerfbaren Kindprozessen. Temporäre
Quellkopien und Kindprozessartefakte werden vollständig bereinigt. Die Matrix
verwendet ausschließlich kontrollierte Doubles und führt keinen echten
Browser-, externen Netzwerk- oder Gatewayzugriff aus. Sie besteht mit 423/423
fokussierten Tests; gemeinsam mit dem SyncService bestehen 466/466, in den
sechs seriellen Sync-Suites 735/735 und vollständig seriell 1755/1755 Tests.
Der ausschließlich aus den Transporttests stammende Zuwachs beträgt
`Δ = 151`; alle Läufe besitzen 0 Fehlschläge, Abbrüche, Skips und Todos.

## Implementierte BrowserSyncTransport-Testmatrix gemäß ADR 0027

Der getrennt abgeschlossene Implementierungsslice legt ausschließlich
`tests/browserSyncTransport.test.js` an. Die Suite verwendet Doubles und führt
keinen echten Netzwerkrequest aus. Sie deckt die folgenden mutationswirksamen
Fälle ab; ADR 0027 ersetzt ADR 0026 und korrigiert dessen Nachweisgrenzen.
Cross-Realm-Fixtures verwenden ausschließlich `node:vm`, native lokale
Intrinsics und Doubles. Globale Mutationen laufen seriell, werden in `finally`
vollständig restauriert und benötigen weder Skip noch Todo.

### Import und Factory

- importinaktives Modul und inaktive Factory;
- Factoryaufruf mit null Argumenten;
- explizites `undefined` als ungültiges einzelnes Argument;
- zusätzliche Factoryargumente;
- exaktes Vier-Felder-Compositionrecord;
- Accessors, Symbole, zusätzliche, fehlende oder nicht funktionale Werte;
- fehlende oder unbrauchbare Browserdefaults;
- exakte frische gewöhnliche eingefrorene API;
- exakte Methodenarity.

### Requestgrenze

- exakte einmalige autoritative Snapshotbeobachtung ohne zweites Request- oder
  Snapshotobjekt;
- exakte Trap-/Reflectionreihenfolge Root-Own-Keys, Rootprototyp, Deskriptoren
  `version`, `action`, `source`, `requestId`, `timestamp`, `payload`,
  Payloadidentität ausschließlich aus dem erfassten `payload`-Descriptor,
  Payload-Own-Keys, Payloadprototyp;
- zusätzliche, fehlende und symbolische Keys;
- Accessors und Descriptor-Throws;
- stateful Proxy und ABA zwischen den einmaligen Beobachtungen;
- keine Caller-Rereads nach dem Snapshot;
- unveränderter und nicht eingefrorener Callergraph;
- descriptor-basiert exakt leeres Payload;
- ausschließlich derselbe frische Requestgraph mit identischen Root-/
  Payloadidentitäten als genau zweimaliger Validatorinput vor und nach Freeze
  mit derselben Timestampreferenz; Callerroot, Callerpayload und separates
  Snapshotobjekt nullmal, kein dritter oder alternativer Validatorpfad;
- ausschließlich interne Timestampkonsistenz ohne behauptete unabhängige
  Frische;
- `JSON.stringify` exakt einmal ohne Replacer;
- erfasste Encoder-Prototypmethode exakt einmal mit richtigem Receiver;
- maximal gültiger v1-Request mit insgesamt exakt 64 erlaubten ASCII-Zeichen
  in `requestId`, festen übrigen Contractwerten, kanonischem Timestamp und
  exakt leerem Payload; der frisch projizierte JSON-Body besitzt exakt 193
  UTF-8-Bytes und erreicht bei sonst vollständig bestandenen Doubles genau
  einen Fetch;
- insgesamt 65 Zeichen lange `requestId`; vertragsseitige Ablehnung vor
  Stringify, Encoding, Controller, Timer und Fetch;
- privater produktiver Cap unverändert `65.536`, aber kein behaupteter
  öffentlich erreichbarer `65.536`/`65.537`-Requestgrenzfall;
- temporäre Source-Mutationskopie mit privatem Cap `193`, in der derselbe
  gültige 193-Byte-Request zulässig bleibt;
- getrennte temporäre Source-Mutationskopie mit privatem Cap `192`, in der
  derselbe Request statisch vor Controller, Timer und Fetch scheitert;
- rote Gegenprobe bei entfernter, umgangener oder falsch verglichener
  Capprüfung sowie vollständige Bereinigung aller temporären Kopien ohne
  Änderung des eingecheckten Produktionscodes;
- keine Contractmutation, kein unvalidierter serialisierter Caller, keine
  Validierung hinter der Capprüfung, kein Testexport, injizierbarer Encoder,
  Cap-Parameter oder zusätzliche Composition-Seam;
- post-import mutierte JSON- und Encoder-Prototypfunktionen;
- eigene beziehungsweise geerbte `toJSON`-Mutation.

### Fetchargumente

- feste URL;
- auf vollständig zulässigem Fetchpfad exakt ein Fetch-Seam-Aufruf, auf jeder
  Vor-Fetch-Ablehnung null und niemals mehr als einer; kein Retry;
- Null-Prototyp-RequestInit mit exakt zehn Own-Data-Feldern;
- Null-Prototyp-Headersrecord mit exakt einem Own-Data-Feld;
- tatsächlicher Frozen-Zustand beider Records;
- exakt die einmal erfasste Signalidentität;
- Mutation von `Object.prototype`;
- keine Cookies, Credentials, Authorizationheader oder Referrer;
- kein Redirect, Fallback oder zweiter Versuch.

### Deadline und Promisezustand

- jeweils einmalige Controller-, Signal- und Abortauflösung;
- korrekte Receiver;
- synchron während der Timerregistrierung feuernder Deadlinecallback;
- werfende Timerregistrierung;
- synchron werfender Fetch;
- Fetch-Rejection;
- lokales natives Promise mit vollständig geschlossenem beobachtbarem Profil;
- echtes natives Cross-Realm-Promise, das fixtureseitig bereits vollständig
  auf das lokale Promiseprofil umprototypisiert wurde;
- entsprechend umprototypisierte echte native Promise-Subclass ohne
  verbleibendes beobachtbares Subclassmerkmal;
- kontrolliertes Fulfillment und statisch redigierte Rejection der positiven
  Begrenzungsproben;
- unverändertes Cross-Realm-Promise, fremdes Thenable sowie Proxy oder Fake
  trotz lokal vorgetäuschtem Prototyp;
- eigenes `constructor`-Accessorproperty auf echtem Promise, zusätzliche
  eigene Promisekeys oder Symbole und nicht umprototypisierte Subclass;
- post-import ersetzter `Promise.prototype.constructor`, Getter statt des
  Original-Datendescriptors und fremde Konstruktoridentität;
- post-import ersetztes `Promise[Symbol.species]`, fremder Species-Getter oder
  Species-Konstruktor;
- post-import ersetzte globale `Promise.prototype.then`-Property als
  Unabhängigkeits- und Hostile-Hook-Probe: Der Ersatz wird weder frei gelesen
  noch aufgerufen, die erfasste native `then`-Referenz bleibt autoritativ; die
  Probe führt keine dritte Live-Descriptor-Ablehnungsbedingung ein;
- vollständige Promiseprofilprüfung unmittelbar vor `then` für Fetch-, Read-
  und Cleanup-Promise ohne Behauptung einer historischen Erzeugungsrealm;
- keine freie `.then`-Property, keine `Promise.resolve`-Assimilation und kein
  `Object.setPrototypeOf` durch den Transport;
- alle kontrollierten und späten Settlementhandler geben auf jedem Pfad nur
  primitives `undefined` zurück; kein Sentinel-, Species-, Constructor- oder
  Exceptionleak;
- Deadline gegen nahezu gleichzeitigen Erfolg;
- Fetch ignoriert Abort;
- nie endender Fetch;
- nie endender Reader;
- Cleanup-Throw und Cleanup-Rejection;
- `fetchStarted` unmittelbar vor Fetch und höchstens ein Abort bei synchronem
  Fetchthrow, ungültigem Promiseprofil, Rejection, Non-200, Redirect, falscher
  finaler URL, falschem Response-Typ, Responsegetter-/Snapshot-, Header-, Body-,
  `getReader`-/Methodenauflösungs-, Reader-, Chunk-, Cap-, EOF-, Release-,
  UTF-8-, JSON- oder Handoff-Fehler;
- null Abort vor Fetch und bei Erfolg;
- Timer-Cancellation genau einmal;
- keine zweite Settlementwirkung.

### Response und Stream

- fail-fast Responsebeobachtungsreihenfolge und exakte Getterzahlen für jede
  frühe Ablehnung;
- Status, Redirect, URL und `Response.type`;
- einmalige Header-`get`-Auflösung, richtige Receiver und fail-fast exakte
  Aufrufzahlen für jede frühe Headerablehnung;
- exakter Content-Type;
- browserexponierte kanonische Content-Length;
- fehlende, malformed, zu große oder abweichende Content-Length;
- browserexponiertes `Content-Encoding` exakt `null` als zulässige
  CORS-gefilterte Beobachtung ohne Wire-Abwesenheits-/Dekompressionsbehauptung;
- browserexponierter Nicht-null-Wert als Fehler und keine Behauptung über einen
  verborgenen Wire-Header;
- fehlender Body;
- `getReader`, `read`, `cancel`, `releaseLock` und ihre Receiver;
- exakte Read-Resultform;
- native Iterator-Own-Key-Reihenfolge exakt `['value', 'done']`, danach
  Deskriptorreihenfolge `done`, `value`;
- einmaliger Read-Result-Own-Key-/Descriptor-Snapshot ohne Rereads sowie
  stateful, werfende und inkonsistente Record-Proxies;
- gewöhnliche lokale echte native `Uint8Array` auf einem festen, nicht
  geteilten und nicht detached `ArrayBuffer`, beide mit vollständig passendem
  beobachtbarem lokalem View-/Bufferprofil und `resizable === false`, sofern
  unterstützt und prüfbar;
- fixtureseitig vollständig passend umprototypisierte echte Cross-Realm-View
  zusammen mit ihrem echten festen Backing-Buffer;
- unveränderte fremde View, nur die View passend umprototypisiert und nur der
  Buffer passend umprototypisiert;
- Proxy oder Fake, unverändert sichtbare Subclass, detached und malformed
  Chunk;
- erster Read liefert ein lokales echtes natives Promise mit geschlossenem
  Profil und
  `{ value: new Uint8Array(0), done: false }`; Rejection nach genau diesem Read,
  keine Kopie, kein zweiter Read, keine Microtask-Starvation, Abort und Cleanup;
- SharedArrayBuffer-backed `Uint8Array`, Growable SharedArrayBuffer und, sofern
  unterstützt, resizable Buffer;
- detached Buffer, falscher Bufferprototyp, post-import ersetzte Buffer-/Typed-
  Array-Getter und unmittelbare saubere Kontrollkopie eines normalen festen
  ArrayBuffers;
- Nullchunk, falsche Länge, ungültige Bytewerte in Fake-/malformed Chunks und
  Überschreitung der deklarierten Länge oder des Responsecaps;
- sofortige Kopie in den einzigen eigenen Puffer;
- mutierter oder wiederverwendeter Fremdchunk ohne Wirkung auf die eigene
  Kopie;
- keine Umprototypisierung eines Eingabewerts durch den Transport und keine
  Behauptung einer historischen View-/Buffer-Erzeugungsrealm;
- exakt `16.384` gegenüber `16.385` exponierten Bytes;
- deklarierte gegenüber kopierter Bytezahl;
- Erfolgscleanup und Fehlercleanup.

### Terminale Verarbeitung

- strikte UTF-8-Decodierung über die erfasste Prototypmethode;
- sichtbare, nicht normalisierte BOM-Semantik;
- ungültiges UTF-8;
- `JSON.parse` exakt einmal ohne Reviver;
- post-import ersetztes `JSON.parse`, `TextDecoder.prototype.decode` und
  `Promise.prototype.then`;
- post-import ersetzte Reflection-/Apply-/Freeze- und Typed-Array-Brand-/
  Kopier-Intrinsics;
- ungültiges JSON;
- Parsed-Primitiven einschließlich `null`;
- Object- und Arrayroot;
- mutierte Object-/Array-Prototypketten;
- geerbtes `Object.prototype.then`;
- geerbtes `Array.prototype.then`;
- zulässiges eigenes nicht aufrufbares `then`;
- Accessor- oder callable-`then`;
- keine Sentinel-, Body-, Header-, Byte- oder Exceptionleaks.

### Serviceintegration

- Transportrejection wird `transportFailed`;
- erfolgreich geparste, aber malformed Response wird `invalidResponse`;
- nicht korrelierte Response wird `invalidResponse`;
- vollständig korrelierte normale Erfolgsresponse bleibt erfolgreich;
- vollständig gültige fachliche Contract-Fehlerresponse bleibt eine normale
  SyncResponse;
- keine echten Netzwerkrequests.

## SyncGateway Request Boundary-Testmatrix

| Fall | Erwartung |
| --- | --- |
| Modul und Factory | exakt ein Export; eingefrorene gewöhnliche API exakt mit `processSyncRawBody` |
| fehlendes oder zusätzliches Argument | synchroner `invalidInvocation`; keine Argumentinspektion, Größenprüfung, Parsing, Clock oder ID |
| nicht primitiver Stringwert bei exakt einem Argument | unverändert an den Größenvalidator; keine Konvertierung oder absichtliche Propertyinspektion |
| exakt 65.536 beziehungsweise 65.537 UTF-8-Bytes | Grenze inklusive akzeptiert beziehungsweise ohne Parsing als `PAYLOAD_TOO_LARGE` abgelehnt |
| 65.537 Originalbytes aus zerlegten NFC-Sequenzen | `PAYLOAD_TOO_LARGE` vor jeder Normalisierung; keine Auflösung oder Ausführung von `JSON.parse` |
| syntaktisch ungültiger String | exakt ein nativer Parseversuch ohne Reviver; statisches `INVALID_JSON` ohne Parser- oder Raw-Body-Leak |
| syntaktisch gültige Primitive, `null` oder Arrays | `VALIDATION_ERROR`, nicht `INVALID_JSON` |
| gültiger Sechs-Felder-Request | neue defensive Projektion mit frischem leerem Payload; ursprüngliche Validierung, Projektionsvalidierung, Freeze und Validierung des tatsächlich gefrorenen Snapshots in dieser Reihenfolge |
| Zusatzfeld, Accessor, Symbol oder ungeeigneter Record | ursprünglicher Parsed-Wert fail-closed abgelehnt; keine Bereinigung vor Validierung |
| alleinige falsche Version oder Aktion | `UNSUPPORTED_VERSION` beziehungsweise `UNKNOWN_ACTION` |
| gemischtes Requestfehlerbild | ausschließlich `VALIDATION_ERROR` |
| ungültige Referenzzeit oder interne Inkonsistenz | lokaler `boundaryFailed` ohne Gateway-Response |
| beherrschte Ablehnung | frische vollständige Gateway-Response, neue `gateway_`-ID, leere Verarbeitungskette und `durationMs: 0` |
| Gateway-Fehlerresponse | vollständige Responsevalidierung, Deep Freeze und Validierung des tatsächlich gefrorenen Snapshots in dieser Reihenfolge |
| akzeptierter Request | Clock einmal, Gateway-ID-Generator nie |
| abgelehnter Request | Clock einmal und Generator einmal; keine eingehende `req_`-ID gespiegelt |
| werfende Clock- oder Generator-Function beziehungsweise Function-Proxy | exakt ein Aufrufversuch; Default-`crypto.randomUUID` ebenfalls exakt einmal und ohne Fallback |
| doppelte JSON-Membernamen | native Last-Key-Wins-Semantik; kein zweiter Parser oder Duplicate-Key-Scanner |
| mehrere Aufrufe | keine geteilten Request-, Payload-, Response-, Error-, Meta- oder Arrayidentitäten; auch zweimal dasselbe `INVALID_JSON`-Profil bleibt vollständig disjunkt |
| redigierte Sentinels und Console | keine Raw-, Parser-, Validator- oder Dependencywerte in eigenen Datenfeldern oder Console-Ausgaben; auch ein gültiger Sentinel-Request bleibt auf allen sechs Console-Methoden still |

## Local Model-free SyncAgent Core-Testmatrix

| Fall | Erwartung |
| --- | --- |
| Modulimport und Factory | Modulimport startet nichts; Factory-Destrukturierung löst `getCurrentTimestamp` auf, sodass ein Composition-Accessor oder -Proxy außerhalb des Methoden-Resultvertrags laufen oder werfen kann; die aufgelöste Clockfunktion wird nicht aufgerufen und die frische gewöhnliche API bleibt exakt und eingefroren mit `processSyncRequest` |
| Methodenvertrag | `processSyncRequest.length === 1`; exakt ein Argument; immer synchron und weder Promise noch Thenable |
| fehlendes oder zusätzliches Argument | exaktes `invalidInvocation`-Profil; keine Argumentinspektion und kein Clockzugriff |
| Clock und Fehlerpriorität | bei exakt einem Argument genau ein Clockaufruf vor Requestinspektion; ungültige Referenzzeit oder Clock-Throw ergibt redigiert `agentFailed`, auch bei zugleich ungültigem Request |
| Requestvalidierung | unveränderter Eingabewert, frische descriptorbasierte Sechs-Felder-Projektion und tatsächlich tief eingefrorener Snapshot werden mit derselben Referenzzeit in dieser Reihenfolge dreimal vollständig validiert |
| Accessor, Proxy und beobachtbare Mutation | Zusatzfelder, Accessoren und werfende Reflection-Traps werden fail-closed behandelt; eine zwischen Validierungsschritten driftende Struktur oder Arity-/Accessor-Umgehung erreicht keinen Erfolg |
| Aktionsgrenze | ausschließlich `syncTest`; jede beherrschte Vertrags- oder Allowlist-Ablehnung ergibt das exakte `syncRequestRejected`-Profil |
| Erfolgsresponse | exakt die dokumentierte synthetische, normal korrelierte Response mit `handledBy: "SyncAgent"`, `processedBy: ["SyncAgent"]` und statischem `durationMs: 0` |
| interne Request-/Response-Reflection und -Freezes | Reflection und `Object.freeze` werden live aufgelöst, der tatsächliche Freeze-Zustand mit der importseitig erfassten `Object.isFrozen`-Referenz geprüft; Reflection-/Freeze-Throw, Freeze-No-op, Mutation oder Inkonsistenz ergibt redigiert `agentFailed` |
| terminale API-, Error- und Resultgrenze | importseitig erfasste Reflection-/Freeze-/Frozen-Referenzen und `Object.prototype`-Identität; descriptor-genaue gewöhnliche API, Success-, Failure- und Errorrecords mit exakten Werten und Identitäten; keine live Array-Prototypmethode oder kein Iterator; post-import ersetzte globale terminale Reflection-/Freeze-/Frozen-Funktionen erzeugen keine mutable oder korrumpierte terminale Ausgabe |
| Frische, Isolation und Redaction | mehrere Aufrufe teilen keine Result-, Request-, Payload-, Response-, Data-, Warnings-, Meta- oder Arrayidentität; Eingaben, Dependency- und Exceptiondetails werden weder übernommen noch geloggt |
| globale Instrumentierung | instrumentierte Clock-, Reflection-, Freeze-/Frozen-, Promise-/Thenable-, Console-, Netzwerk-, Storage- und private Modulpfade werden mit `concurrency: false` geprüft und im `finally` vollständig restauriert |

## Implementierte ADR-0025-Kompositionsregressionen

| Regression | Verbindliche Erwartung |
| --- | --- |
| post-import ersetztes globales `JSON.stringify` | der saubere Erfolgsweg verwendet ausschließlich die bei Modulevaluation erfasste Serialisierungsfunktion exakt einmal |
| durch unvertrauenswürdige Reflection installierte eigene `Object.prototype.toJSON`-Property | statisches `500 gatewayFailed` vor Responsebesitz; Datenproperty und Accessor werden descriptor-basiert abgelehnt |
| durch unvertrauenswürdige Reflection installierte eigene `Array.prototype.toJSON`-Property | statisches `500 gatewayFailed` vor Responsebesitz; Datenproperty und Accessor werden descriptor-basiert abgelehnt |
| eingeschobene Prototypkette | ein unvertrauenswürdiger Reflection-/Proxy-Pfad fügt zwischen dem erfassten `Array.prototype` und dem erfassten `Object.prototype` ein Objekt mit `toJSON` und privatem Test-Sentinel ein; die direkten Response-Prototyp- und Own-`toJSON`-Prüfungen beider erfasster Prototypen würden ohne die neue Kettenprüfung weiterhin bestehen |
| Ablehnung der eingeschobenen Kette | die erfasste Kettenprüfung ergibt vor Erfolgsserialisierung und Responsebesitz statisch `500 gatewayFailed`; die Erfolgsserialisierung wird nullmal aufgerufen, der kompromittierte Graph nicht serialisiert und keine zweite Response erzeugt |
| saubere Kettenkontrolle | weiterhin exakt `Response-Array → capturedArrayPrototype`, `capturedArrayPrototype → capturedObjectPrototype` und `capturedObjectPrototype → null` sowie genau ein Aufruf der erfassten Erfolgsserialisierung |
| Redaction | kein Instrumentierungs-Sentinel, fremder Body oder fremder Exceptiontext erscheint in Response, Result oder Consoleoutput; der ungeeignete Graph wird nicht erneut serialisiert |
| Nicht-Assimilation | geerbtes oder nur durch Proxy-`get` virtuell angebotenes `then` wird weder gelesen noch assimiliert und bestimmt den synchronen Kontrollfluss nicht; keine universelle Proxy-/Thenable-Erkennung wird behauptet |
| globale Instrumentierung | alle betreffenden Läufe verwenden `concurrency: false` und stellen die ursprüngliche Prototypkette, globale Funktionen sowie ursprüngliche Descriptoren im `finally` vollständig wieder her |

Der frühere ADR-0025-Korrekturslice dokumentierte ausschließlich diese
Erwartungen und implementierte weder Kompositionscode noch Tests. Der
nachfolgende Implementierungsslice setzt Vertrag und Regressionen um, ohne die
historische Aussage rückwirkend zu verändern.

## Local SyncGateway Raw-Wire and HTTP-Testmatrix

| Fall | Erwartung |
| --- | --- |
| Moduloberflächen | Runtime-Modul exportiert nur den Reader; HTTP-Modul nur Grenzwertrecord und Factory; Factory-API eingefroren und exakt `{ start, stop }` |
| erforderlicher SyncAgent | kein HTTP-Factory-Default; `processSyncRequest` bei Komposition genau einmal sicher aufgelöst und mit demselben Receiver erfasst; ungeeignete oder werfend aufgelöste Methode verhindert den Serveraufbau vor dem Listener |
| Produktionsroot | erst nach gültiger Runtime-Konfiguration exakt eine `createSyncAgent()`-Instanz erzeugt und injiziert; ungültige Konfiguration erzeugt weder Agent noch Server |
| Runtime-Konfiguration | nur Port `1` bis `65535` und exakte erlaubte Loopback-HTTP(S)-Origin akzeptiert; Port `0`, fehlende und fremde Werte statisch abgelehnt |
| Factory-Port `0` | ausschließlich direkte Testkomposition; erfolgreicher Start meldet `127.0.0.1` und einen tatsächlich gebundenen Port von `1` bis `65535` |
| Lifecycle | exakte Success- und Fehlerresults für `started`, `stopped`, `alreadyStarted`, `startFailed`, `notStarted`, `alreadyStopped` und `stopFailed` |
| Import des Starters | inert; Listener nur über expliziten Direktstart beziehungsweise `npm run gateway:local` |
| Listening-Abschluss | `server.address()`, Resultprüfung sowie jeweils ein Zugriff auf `address` und `port` vollständig kontrolliert; nur Ports `1` bis `65535`, bei Produktionsport exaktes Requested-Port-Match, bei Factory-Port `0` beliebiger Port in diesem Bereich; werfende Getter, `0`, `-1`, `65536` und ein abweichender Produktionsport führen zu statischem `startFailed`, vollständigem Start-Cleanup und keinem `onFatal`-Aufruf |
| Bindung, Route und Host | ausschließlich IPv4-Loopback und exakter Pfad; `requireHostHeader: false` zentralisiert im ansonsten regulären Requestpfad regulär parsebare Hostfehler, sofern keine frühere fail-closed Target-/Sonderpfadablehnung greift, ohne die Hostpflicht zu lockern oder einen akzeptierenden Pfad zu öffnen; fehlend, doppelt oder falsch wird dann im eigenen `invalidHttpRequest`-Envelope abgelehnt; bei simuliert gebundenem Port `80` nur `127.0.0.1` oder `127.0.0.1:80`, sonst exakt `127.0.0.1:<port>`; Query, absolute URL und Fremdpfad kontrolliert abgelehnt |
| HTTP-Version | ausschließlich HTTP/1.1; HTTP/1.0 wird statisch vor Raw-Header-Projektion, Decoder und Boundary abgelehnt |
| Request-Admission | factory-lokal und vom Response-Owner getrennt; gemeinsames erstes Gate für `request`, `checkContinue` und `checkExpectation`; jeder Folgerequest wird ohne zweite Response vor HTTP-/Headerprojektion, Decoder und Boundary beendet |
| Host-Zentralisierungsregression | bei deaktiviertem `maxRequestsPerSocket` erzeugen hostloses HTTP/1.1-`OPTIONS` und gültiger POST in einem Pipeline-Write exakt zwei Anwendungsereignisse und kein `dropRequest`; eigener statischer Envelope, höchstens eine Statuszeile sowie null Decoder- und Boundary-Aufrufe; Entfernung von `requireHostHeader: false` bricht den Nachweis |
| Admission-Regressionen | zehn gepipelinete HTTP/1.0-Keep-Alive-Requests; beim regulären HTTP/1.1-Pfad erster Request exakt einmal in Decoderfactory, Decode und Boundary mit erstem Raw Body, zweiter Request mit null `rawHeaders`-Zugriff und terminalem Response/Socket; zweite `checkContinue`-/`checkExpectation`-Ereignisse ebenfalls mit null `rawHeaders`-Zugriff, terminalem Zustand, null Decoder/Boundary; höchstens eine Statuszeile und keine Marker-Leaks; globale Instrumentierungen mit `concurrency: false` und vollständigem `finally`-Restore |
| Headergrenzen | 8192-Byte-Parsergrenze, maximal 32 Anwendungsfelder plus Feld-33-Sentinel, sicherheitsrelevante Duplikate fail-closed |
| Methoden und Sonderpfade | nur `POST` und kontrolliertes `OPTIONS`; andere Methoden/`CONNECT` mit `405`, Upgrade mit `400`, Expectations mit `417` |
| Origin und CORS | exakt eine konfigurierte Origin; kein Wildcard-/Credentialpfad und keine CORS-Freigabe für abgelehnte Origin |
| Preflight | exakter bodyfreier POST-/Content-Type-Preflight ergibt `204`; kein Decoder- oder Boundary-Aufruf |
| Medien- und Transferpolicy | nur JSON mit optional exakt UTF-8, kein Encoding außer `identity`, keine Längen-/Chunked-Ambiguität und keine Trailer |
| deklarierte und tatsächliche Länge | `Content-Length` nur frühes Signal; Abweichung `400`, deklarierte oder tatsächlich empfangene Übergröße `413` |
| 65.536/65.537 tatsächliche Bytes | Grenze inklusive akzeptiert; beim Folgebyte 65.537 Bodyliste leeren, pausieren und ohne übergroßen Gesamtbuffer `413` senden |
| UTF-8-Decoder | genau ein verifizierter `fatal: true`-/`ignoreBOM: true`-Decoderaufruf über den vollständigen begrenzten Buffer; ungültiges UTF-8 lokal `400` |
| gültige BOM | U+FEFF bleibt erhalten und erreicht die Boundary; deren einziger nativer Parse ergibt die unveränderte `INVALID_JSON`-Gateway-Response über HTTP `400` |
| Boundary-Aufruf | ausschließlich nach bestandener Wire-/Header-/Decoderpolicy und exakt einmal; kein JSON-Parser im HTTP-Modul |
| Boundary-Ablehnung | nur nochmals validierte unveränderte `gatewayErrorResponse` über HTTP `400`, kein lokaler Envelope |
| Boundary-Akzeptanz und Handoff | ausschließlich exakte defensive Boundary-Requestidentität synchron, mit genau einem Argument und höchstens einmal an den erfassten Agenten; kein Await, `Promise.resolve`, Retry oder Thenable-Assimilation |
| Agentenerfolg | nur exakter tief eingefrorener ADR-0024-Erfolg; Originalresponse gegen denselben Request validiert, frischer disjunkter Zehn-Felder-Graph projiziert, validiert, tief eingefroren, terminal verifiziert und exakt einmal vorab serialisiert; HTTP `200` ausschließlich mit diesem Graphen |
| Agent-/Responsefehler | Throw, Fehlerresult, Promise, zusätzliche eigene `then`-Property, malformed oder ungeeignete Response sowie Projektions-, Freeze-, Revalidierungs-, terminale Shape-/Prototype-/Prototypketten-/`toJSON`- oder Vorabserialisierungsfehler ergeben statisch HTTP `500 gatewayFailed`; kein `onFatal`, Serverstop, Leak oder zweite Response |
| Boundary- oder interne Inkonsistenz | lokaler statischer `gatewayFailed`-Envelope über HTTP `500`, keine fremden Details |
| lokale HTTP-Profile | exakter Drei-Felder-Envelope mit exaktem Zwei-Felder-`error`, Status, Codes, deutsche Meldungen und geschützte Responseheader für alle dokumentierten Profile |
| Responsebesitz und Parserfehler | pro physischem Socket genau ein Response-Owner; `clientError` schreibt nach Anwendungs- oder Raw-Übernahme nicht erneut; ein vorheriger Parserfehler erhält genau eine kontrollierte Raw-Response; Raw-Pfade schreiben best effort und zerstören anschließend zuverlässig |
| Pipeline-Defense-in-Depth | `maxRequestsPerSocket: 1` und `dropRequest` ergänzen die anwendungsseitige Admission; der Handler zerstört den Socket ohne zusätzliche Node- oder Gateway-Response |
| ungültige Transfer-Encoding-Wirepfade | `gzip`, `identity` und eine ungültige Liste mit Body ergeben exakt eine Statuszeile und den statisch redigierten Fehler; kein Decoder- oder Boundary-Aufruf |
| Produktionsressourcen | feste 5.000/10.000/10.000/100-ms-Header-/Request-/Socket-/Prüfwerte, 1.000 ms Keep-Alive, höchstens ein Request pro Socket und kontrolliertes Schließen ohne DoS-Garantie |
| Timeoutregression | enges, nur bei Factory-Port `0` aktivierbares 250/500/500/25-ms-Testprofil; regelmäßig tröpfelnde unvollständige Header und Teilbody werden innerhalb Frist plus Prüftakt und ausschließlich testseitiger, auf 250 ms begrenzter Timer-Scheduling-Toleranz geschlossen, ohne Decoder oder Boundary |
| Serverfehler nach Start | `boundPort` sofort verworfen, fehlgeschlagener Zustand, Listener defensiv geschlossen, Sockets zerstört, kein späterer Boundary-Aufruf und kein Exceptiondetail |
| Scope | ausschließlich lokaler leerer synthetischer `syncTest`; keine Requests an Browser-, Cloud- oder andere Upstreams; keine Secrets, private Inhalte, Persistenz, Requestlogs oder Telemetrie; Browser-SyncTransport fehlt |

Die gezielte Suite bestand unter
`node --test tests/localSyncGatewayHttpServer.test.js` mit 50/50 Tests. Die
kombinierte Suite aus Local SyncGateway, SyncGateway Request Boundary,
SyncContract und SyncService bestand mit 192/192 Tests. Die vollständige
serielle Suite bestand mit 1125/1125 Tests. Alle drei Läufe hatten 0
Fehlschläge, 0 Skips und 0 Todos. Die Gateway-Tests verwendeten ausschließlich
synthetische Werte und lokale Loopback-Kommunikation. Der Produktions-Build
war erfolgreich und transformierte weiterhin exakt 46 Browsermodule.

## Generated n8n Boundary Bundle-Testmatrix

| Fall | Erwartung |
| --- | --- |
| Artefaktoberfläche | Auswertung liefert eine gewöhnliche eingefrorene API mit exakt `{ createSyncGatewayRequestBoundary }`; Factory liefert exakt die eingefrorene `{ processSyncRawBody }`-API |
| Ladeverhalten | kein automatischer Boundary-Aufruf, keine Globalmutation, keine Consoleausgabe |
| Direkt bindbares Standalone-Format | vollständige Artefaktbytes hinter `const boundaryBundle =` unverändert bindbar; Header, Ausdrucks-IIFE, `"use strict";` als erster IIFE-Body-Prolog, kein Top-Level-Strict-Statement und kein separates Semikolon-Statement nach dem Ausdruck; keine Laufzeitimports, Source Map oder n8n-Inputannahme |
| reproduzierbare Generierung | identische Quellen erzeugen bei Wiederholung und in verschiedenen absoluten Arbeitsverzeichnissen byteidentische Bundle- und Manifestbytes |
| unveränderlicher Quellsnapshot | Contract, Boundary und Entry jeweils exakt einmal über sichere FileHandles gelesen; Hashes und Vite-Virtualmodule aus denselben Snapshotbytes; ABA-Mutation der Live-Datei beeinflusst den laufenden Build nicht |
| Checkmodus | erkennt Bundle-, Manifest- und Quelldrift; verändert keine Projektdatei |
| Manifest | feste Schema-, Property- und Quellenreihenfolge; korrekte SHA-256-Hashes über exakte Artefakt-, Contract-, Boundary- und Entrybytes |
| Pfad- und Metadatenhygiene | keine absoluten Windows-, POSIX- oder Temporärpfade, Zeit-, Zufalls-, Host- oder Localeabhängigkeit |
| sichere Generate-Ziele | kanonischer Root und Containment geprüft; von Node erkannte symbolische Links/Junctions und `realpath`-Abweichungen fail-closed; unvorhersagbar benannte exklusive Tempdateien nur im verifizierten Zielordner, Identitäts-/Byteprüfung, Artefakt-Replace vor Manifest-Replace, abschließende Paarprüfung und identitätsgebundenes Cleanup; weder atomare Paarupdates noch Power-Loss-/Single-Writer-Sicherheit, vollständige Erkennung aller Windows-Reparse-Tags oder Schutz gegen bösartige gleichzeitige Reparse-Rennen |
| Boundary-Parität | gleiche Werte, eigenen Felder, Reihenfolge, Prototypen, Null-/Arraystruktur, Freeze-, Frische- und Entkopplungsgarantien wie die kanonische Boundary |
| hostile Inputs | leere, ungültige, primitive und strukturell ungültige JSON-Werte, Zusatzfelder, Version, Aktion, Quelle, ID, Timestamp, Payload, BOM sowie Größenfälle bleiben semantisch identisch |
| Dependencies und Redaction | identische Clock-/Generatorpfade, statische Fehler, keine Rohwert-, Marker-, Exception- oder Console-Leaks |
| Mutationen | Artefaktbyte, Quelldrift, semantische Änderung und entfernte API-/Freeze-Garantie werden auf ausschließlich temporären Kopien erkannt |
| Scope | keine Cloud-, n8n-, Netzwerk-, Dateisystem-, Environment-, Credential-, Secret-, Workflow- oder Agentenkomposition |

Die Abschlussverifikation umfasst Syntaxprüfung, gezielte Bundle-Tests,
bestehende Contract-/Boundary-Tests, die kombinierte Sync-Suite, die
vollständige serielle Suite, Produktions-Build und
`npm run bundle:n8n:check`. Die erneute gezielte Bundle-Suite besteht mit
61/61 Tests; Bundle zusammen mit der SyncGateway Request Boundary besteht mit
115/115 Tests. Die kombinierte Suite aus SyncContract, SyncService, Boundary,
Local SyncGateway und Bundle besteht mit 253/253 Tests. Diese drei Läufe
besitzen 0 Fehlschläge, 0 Skips und 0 Todos. Die vollständige serielle Suite
besteht mit 1186/1186 Tests, ebenfalls mit 0 Fehlschlägen, 0 Skips und 0 Todos.
Der Produktions-Build transformiert weiterhin exakt 46 Browsermodule; der
Bundle-Check meldet keinen Drift. Das aktuelle Artefakt besitzt SHA-256
`15b84126852a597d429304d66d723a356b18537ba3910db9dd9443b3b787114f`,
die exakten Manifestdateibytes SHA-256
`87c4fa153d2af2753aaaf4d74fd515b3edae5268b9935d63faef24d10bcf593f`.

## n8n Cloud Ingress & Runtime Evidence Gate-Testmatrix

| Fall | Erwartung |
| --- | --- |
| Modulimport und Direktstart | Import und bloße Factory-Erzeugung binden keinen Real-HTTPS-Transport; kanonischer vorgesehener Operator-Laufweg ist `npm run probe:n8n:cloud:test -- --vector <probeId>`; das Package-Script bindet `node scripts/n8n/n8nCloudIngressProbe.js --run` |
| Runtimekonfiguration | ausschließlich die zwei benannten Environmentwerte; `https:` mit kanonischem `/webhook-test/<segment>[/<segment>…]`-Pfad aus nicht leeren ASCII-alphanumerischen, Bindestrich- oder Unterstrichsegmenten; keine Prozentkodierung, Backslashes oder Steuerzeichen und keine leeren oder Dot-Segmente; ungültige Werte vor Transportauflösung statisch redigiert; druckbares 32- bis 512-Zeichen-Wegwerfsecret |
| Katalogidentität | exakt 32 IDs in fester Reihenfolge; die alte widersprüchliche Auth-ID ist durch zwei orderbezogene IDs ersetzt; exakte Bytes, Längen, lowercase SHA-256-Werte und erwartete strikte UTF-8-Outcomes stimmen mit der eingecheckten Vorlage überein |
| frische Vektorbytes | jeder Katalogaufruf liefert neue Bufferidentitäten; Mutation einer vorherigen Projektion verändert keinen späteren Vektor |
| normalisierungssensitive Fixtures | BOM, NFC/NFD, CRLF, abschließender Whitespace, eingebettetes NUL, Mehrbyte- und Vierbyte-UTF-8 bleiben byteverschieden und unverändert |
| ungültige UTF-8-Fixtures | `C3 28`, `E2 82`, `C0 AF` und `80` werden als `invalidRejected` erwartet; Ersetzung oder Akzeptanz wird nicht als Erfolg gewertet |
| Bytegrenzen | 65.535, 65.536, 65.537 und der 65.536-Byte-Mehrbytefall werden aus Bufferbytes statt Zeichenlänge bestimmt |
| Beziehungsfixtures | Größenfixtures sind A-Präfix-kompatibel; alle Auth-Bodies, beide Framing-Bodies sowie Absent-/Identity-Body sind je Gruppe identisch; `gzip`, `deflate` und `br` dekomprimieren denselben Sentinel; Digest und Länge beziehen sich auf die codierten Wire-Bytes |
| Observerformat und Inaktivität | standalone importfreies Expression-IIFE; Auswertung liefert nur die asynchrone Funktion und führt weder Helper noch Netzwerk, Contract, Boundary oder Bundle aus |
| Observer-Input | ausschließlich allowlist-basierte Probe-ID aus dem ersten Item; unbekannte ID, falsche Form und Accessor scheitern statisch vor jedem Binary-Helperzugriff |
| Binary-Helper | für jeden beobachtbaren Vektor exakt ein Aufruf von `this.helpers.getBinaryDataBuffer(0, 'data')`; keine interne `binary.data`-Repräsentation |
| Observer-Parität | alle 32 unabhängig rekonstruierten Erwartungsbytes ergeben exakten manuellen Bytevergleich, richtige Länge, erwartete UTF-8-Klasse sowie geschlossene Header- und Content-Encoding-Klassifikation |
| Observer-Abweichungen | Mutation, automatische Dekomprimierung, falsche oder fehlende strikte Decodersemantik und übergroße Beobachtung werden ohne Rohdatenleak als Mismatch, falsche UTF-8-Klasse oder `unavailable` sichtbar |
| ausgehender Request | genau eine vorab allowlist-validierte ID, höchstens ein HTTPS-Requestversuch zur Test-URL `/webhook-test/`, danach Stop; kein Sweep, Retry, Redirect-Follow, zweiter Versuch, Autoregister oder Production-URL-Pfad und kein atomarer Exactly-once-Nachweis; der erste und jeder weitere Vektor benötigen jeweils eine eigene ausdrückliche Freigabe und danach manuelle Registrierung beziehungsweise erneutes Listening |
| lokaler HTTP/1.1-Wiretest | Nodes echter HTTP-Client serialisiert über einen ausschließlich an `127.0.0.1` gebundenen temporären Listener Request-Target, exakt einen aus der validierten URL abgeleiteten `Host`, beide Authorization-Duplikatreihenfolgen, Content-Length beziehungsweise chunked Framing und die tatsächlichen Bodybytes; vollständiger Socket-/Listener-Cleanup im `finally` |
| Frist und Responsegrenze | feste 5.000-ms-Deadline mit kontrollierter Zerstörung und genauem Timercleanup; höchstens 16.384 Responsebytes vor Abbruch; keine zweite Anfrage |
| geschlossene Observerresponse | exakt sechs eigene aufzählbare Dateneigenschaften und feste Typen; Zusatzfelder, Symbole, Accessoren, fremde ID, ungültiges JSON oder UTF-8 und falsche Typen ergeben keine Teilbestätigung |
| erfolgreiche `2xx`-Observercounts | nach übernommener geschlossener erfolgreicher Observerresponse ist jeder bekannte Count exakt `1`; `0` oder größer als `1` ist `FAIL`; `null` bleibt bei normalen und komprimierten Erfolgswegen zulässig, sofern das Einzelgate den Count nicht verlangt; `auth-correct` bleibt strikt 1/1 |
| Credential-Gates | negatives Auth-`2xx` ist `FAIL`; `400`/`401`/`403` allein bleibt `UNPROVEN`, `PASS` verlangt gebundene Counts `0`/`0` und eindeutige Attribution; jeder erfolgreiche eindeutig zugeordnete Observerpfad verlangt `authorizationHeaderPresence: absent`, `present` ist `FAIL`, `null`/`unavailable` ist mindestens `UNPROVEN`; `auth-correct` verlangt zusätzlich Counts `1`/`1` |
| Encoding-Gates | exakter Body allein reicht nicht; `contentEncodingOutcome` ist nur `match`, `mismatch` oder `unavailable`; ein bekannter Dekompressions-/Header-/Bytewiderspruch ist `FAIL`; `400`/`415` allein ist `UNPROVEN` und kann nur mit gebundenen Counts `0`/`0` sowie eindeutiger Attribution `PASS` sein |
| Aggregation | `FAIL` besitzt Präzedenz, vollständiges `PASS` verlangt ausschließlich `PASS`-Einträge, jeder übrige Zustand ist `UNPROVEN` |
| Runnerresult und Transportgrenze | Factory nur mit explizit injiziertem Transport; Real-HTTPS-Auflösung nur im CLI-Adapter nach vollständiger Argument-, Config- und ID-Validierung; Success exakt `{ ok, vectorGate, evidence }`; lokale Fehler statisch redigiert |
| Evidenzvorlage | exakt die 19 dokumentierten Top-Level-, fünf Settings- und 13 Vektorfelder; exakt 32 Einträge; `endpointKind: test`, Stable OSS/Activation fest `FAIL`, Production fest `UNPROVEN`, aktuelle Test-URL-/Providerstatus `UNPROVEN`, kein `overallGate` |
| Settingsgate | bekannte unsichere Speichereinstellungen oder deaktivierte Read-time-Redaction ergeben mit `FAIL`-Präzedenz unabhängig von anderen fehlenden Bindungswerten `FAIL`; fehlende Werte und `unavailable` ergeben ohne anderes `FAIL` `UNPROVEN`; nur `none`/`none`/`false`/`enabled`/`enabled` kann `PASS` ergeben |
| Providerbindung | Provider-`PASS` verlangt auf jedem erfolgreichen eindeutig zugeordneten Observerpfad `authorizationHeaderPresence: absent` sowie nicht-nullische `tenantAlias`, `observedAt`, `timezone`, `n8nBuild`, `webhookNodeTypeVersion` und `secretFreeWorkflowSha256`; `plan` und `region` dürfen `null` bleiben; fehlende Pflichtbindung oder `null`/`unavailable` auf einem Erfolgsweg ergibt ohne bekannten Widerspruch `UNPROVEN`, bekannte unsichere Setting-, Header-, Count- oder Attributionswerte behalten `FAIL`-Präzedenz |
| Read-time-Redaction-Grenze | `enabled` wird nur als Lesezeitbeobachtung behandelt und nie als Nachweis fehlender Runtime- oder Datenbankpersistenz; Providerreferenz bleibt erforderlich |
| Evidenzvalidator | zusätzliche sichtbare oder nicht aufzählbare Schlüssel, Symbole, Accessoren, werfende Proxy-Traps, erweiterte Arraycontainer, falsche Null-/Enumwerte, geänderte ID/Reihenfolge/Länge/Digest, erfundene Counts und inkonsistente Vektor-/Statuswerte werden statisch redigiert und fail-closed abgelehnt |
| CLI | ohne vollständig gültige Argumente, Runtimekonfiguration und allowlist-validierte ID keine HTTPS-Adapterauflösung und keine Anfrage; Exitcode `0` ausschließlich für `vectorGate: PASS`, sonst `1`; ein Vektor-PASS öffnet weder Tenant-Gesamtstatus noch Aktivierung |
| externe Wirkung | lokale Tests verwenden Testdoubles sowie ausschließlich für den Wiretest kontrolliertes TCP-Loopback auf `127.0.0.1`; sie öffnen keine externe DNS-, TCP-, TLS- oder HTTPS-Kommunikation und beweisen die Foundation, nicht einen Cloud-Tenant |
| Produktgrenze | kein produktiver Webhook, kein Bundle-/Boundary-Aufruf, kein SyncAgent oder Cloud-Upstream; der bestehende lokale Annahmepfad bleibt bei HTTP `503` |

Die fokussierte lokale Suite wurde mit
`node --test tests/n8nCloudIngressProbe.test.js` ausgeführt und besteht mit
26/26 Tests. Bundle und Boundary bestehen unverändert mit 115/115 Tests; die
kombinierte Sync-Suite einschließlich der Evidence-Foundation besteht mit
279/279 Tests und die vollständige serielle Gesamtsuite mit 1212/1212 Tests.
Alle vier Läufe besitzen 0 Fehlschläge, 0 Skips und 0 Todos. Beide neuen
Skripte bestehen die Syntaxprüfung, der Produktions-Build transformiert
weiterhin exakt 46 Browsermodule und der schreibfreie Bundle-Check meldet
keinen Drift.

### Verifikationsstand der Request Boundary

Die gezielte Boundary-Suite besteht mit 54/54 Tests unter dem exakt geforderten
`node --test tests/syncGatewayRequestBoundary.test.js`. Boundary plus
SyncContract bestehen mit 99/99, Boundary plus SyncContract plus SyncService
mit 142/142 und die Gesamtsuite mit 1075/1075 Tests. Alle vier Läufe besitzen 0
Fehlschläge, 0 Skips und 0 Todos.

Der Produktions-Build ist erfolgreich und transformiert exakt 46 Module.

## Contract Definition of Done

Der transportneutrale Vertrags-Slice gilt als implementiert, wenn:

- Request und Response diesem Dokument entsprechen;
- Pflichtfelder, Typen, Längen und Enums validiert werden;
- unbekannte Felder gemäß Aktionsschema kontrolliert behandelt werden;
- positive, negative, Grenzwert- und hostile-input-Fälle geprüft sind;
- statische Normal- und Gateway-Fehlerprofile exakt geprüft sind;
- keine Secrets oder internen Daten offengelegt werden;
- keine Transport-, Idempotenz- oder private Datenfunktion behauptet wird;
- README und Roadmap den tatsächlichen Implementierungsstatus zeigen;
- der Produktions-Build erfolgreich ist.

## SyncService Definition of Done

Die transportneutrale Service-Foundation gilt als implementiert, wenn:

- die öffentliche API exakt `runSyncTest` besitzt und zusätzliche Argumente
  ohne Inspektion fail-closed ablehnt;
- Request-Build, Validierung und getrennte unveränderliche Korrelation den
  dokumentierten Contract verwenden;
- die Portmethode nach vollständiger Requestvalidierung pro Aufruf höchstens
  einmal mit dem tief eingefrorenen Transportrequest aufgerufen wird;
- ausschließlich defensive, normal korrelierte SyncResponses akzeptiert und
  lokale Fehler getrennt statisch redigiert werden;
- der In-Memory-Erfolgsfluss ausschließlich in Tests lebt;
- kein konkreter Transport, Webhook, Storage, UI oder operativer Agent als
  implementiert behauptet wird;
- die relevanten Tests und der Produktions-Build real ausgeführt und erst
  danach mit ihren tatsächlichen Zahlen dokumentiert sind.

## SyncGateway Request Boundary Definition of Done

Die transportneutrale Request Boundary Foundation gilt als implementiert, wenn:

- die öffentliche API exakt die synchrone Methode `processSyncRawBody`
  besitzt und falsche Argumentanzahlen ohne Inspektion oder Dependency-Zugriff
  ablehnt;
- die Größenprüfung garantiert vor dem einzigen nativen Parse ohne Reviver
  erfolgt;
- der unveränderte Parsed-Wert vor jeder defensiven Projektion den geschlossenen
  SyncContract vollständig bestehen muss;
- Projektion und finaler tief eingefrorener Snapshot mit derselben einmal
  erfassten Referenzzeit erneut validiert werden;
- frühe Gateway-Ablehnungen exakt statisch zugeordnet, vollständig validiert
  und von lokalen Boundary-Fehlern getrennt sind;
- Clock und Generator nur in den dokumentierten Pfaden und der Generator nie
  bei einem akzeptierten Request ausgewertet werden;
- Raw Body, Parserexception, Validatorfehler und Dependencywerte nicht
  zurückgegeben, geloggt oder persistiert werden;
- Duplicate-Key-/Single-Parser- sowie materialisierte-String-/Wire-Byte-Grenze
  ausdrücklich dokumentiert sind;
- kein HTTP-Handler, konkreter Transport, Webhook, n8n, operativer Agent,
  Storage, Logging, Telemetrie oder UI als Bestandteil dieser isolierten
  Boundary Foundation behauptet wird;
- die relevanten Tests und der Produktions-Build real ausgeführt und erst
  danach mit ihren tatsächlichen Zahlen dokumentiert sind.

## Local Model-free SyncAgent Core Definition of Done

Der isolierte SyncAgent-Kern gilt als implementiert, wenn:

- die Factory exakt die eingefrorene API `{ processSyncRequest }` liefert und
  die Methode bei formaler Arity `1` exakt ein Argument synchron verarbeitet;
- die Factory-Destrukturierung die vertrauenswürdige Composition-Property
  `getCurrentTimestamp` auflöst, ein dabei ausgeführter oder werfender Accessor
  beziehungsweise Proxy außerhalb des Methoden-Resultvertrags liegt, die
  Factory die aufgelöste Clockfunktion aber nicht aufruft und selbst weder I/O,
  Timer noch einen Providerpfad startet;
- falsche Argumentanzahlen ohne Argumentinspektion und Clockzugriff das exakte
  `invalidInvocation`-Profil liefern;
- die Clock bei exakt einem Argument zuerst und genau einmal erfasst wird und
  ungültige Referenzzeiten gegenüber Requestablehnungen `agentFailed`
  priorisieren;
- unveränderter Request, frische descriptorbasierte Sechs-Felder-Projektion
  mit frischem Payload und tatsächlich eingefrorener Snapshot in dieser
  Reihenfolge dreimal vollständig validiert werden;
- ausschließlich `syncTest` lokal und providerfrei die exakte synthetische
  Normalresponse mit `durationMs: 0` erzeugt, vor und nach dem Deep Freeze
  vollständig validiert und normal korreliert wird;
- jeder Aufruf exakt einen frischen eingefrorenen Vier-Felder-Result und bei
  Fehlern ausschließlich eines der drei dokumentierten statischen, redigierten
  Profile liefert;
- bei erfolgreicher Modulevaluation erfasste Reflection-/Freeze-/Frozen-
  Referenzen und die `Object.prototype`-Identität die terminale Factory-API,
  Errorrecords, Failure- und Success-Results sowie alle tatsächlichen Frozen-
  Prüfungen absichern, während interne Request-/Response-Reflection und Freezes
  live bleiben und jeder erkannte Reflection-/Freeze-Throw, No-op oder jede
  Mutation redigiert zu `agentFailed` führt;
- Modulimport keine Verarbeitung, privaten Modulzugriffe, Storage, Netzwerk,
  Provider, Logging oder Telemetrie auslöst;
- vor Modulevaluation kompromittierte Primordials, veränderter Modulcode oder
  lexikalische Bindungen, Enginekompromittierung, OOM, Prozessabbruch und eine
  vollständig koordinierte Manipulation aller Reflection-Intrinsics
  ausdrücklich außerhalb der Garantie bleiben und Same-Realm-Ausführung sowie
  Deep Freeze keine Sandbox bilden;
- der Kern nicht in `src/main.js`, aber ausschließlich im lokalen HTTP-Prozess
  für den leeren synthetischen `syncTest` nach ADR 0025 komponiert ist; der
  BrowserSyncTransport-Vertrag wurde durch ADR 0027 als Ersatz für ADR 0026
  angenommen und seine isolierte Implementierung mit mutationswirksamer
  Unit-Suite ist abgeschlossen, während die Browserkomposition geschlossen
  bleibt;
- die relevanten Tests und der Produktions-Build real ausgeführt und erst
  danach mit ihren tatsächlichen Zahlen dokumentiert sind.

## Local SyncGateway Raw-Wire and HTTP Definition of Done

Die Produktionsmodule des lokalen HTTP-Slices sind implementiert und der Slice
ist nach erfolgreicher Abschlussverifikation vollständig abgenommen. Dabei ist
mit den oben dokumentierten tatsächlichen Ergebnissen nachgewiesen, dass:

- Runtime-Reader, Serverfactory, Grenzwertrecord und Lifecycle exakt den oben
  dokumentierten öffentlichen Oberflächen und statischen Resultprofilen
  entsprechen;
- der Runtimepfad Port `0` ablehnt, die Factory ihn nur für Tests zulässt und
  der Listener unabhängig davon ausschließlich an `127.0.0.1` bindet;
- ein gemeldeter Bound-Port nur als Safe Integer von `1` bis `65535` und für
  einen Produktionsport nur bei exakter Übereinstimmung mit dem angeforderten
  Port zum erfolgreichen Start führt;
- Pfad, Host, Methoden, Preflight, Origin, CORS, Medienformat,
  Inhaltskodierung, Länge, Transfer-Encoding und Headerduplikate fail-closed
  nach der festen Policy behandelt werden;
- `requireHostHeader: false` ausschließlich Nodes automatische Hostantwort
  deaktiviert, keinen akzeptierenden Pfad öffnet und fehlende, doppelte oder
  falsche Hosts ohne Lockerung der Allowlist nach Admission unter dem eigenen
  Response-Owner abgelehnt werden, sofern im ansonsten regulären Requestpfad
  keine frühere fail-closed Target- oder Sonderpfadablehnung greift;
- ausschließlich HTTP/1.1 unterstützt und HTTP/1.0 statisch vor
  Raw-Header-Projektion, Decoder und Boundary abgelehnt wird;
- eine factory-lokale, vom Response-Owner getrennte Admission als erster
  gemeinsamer Schritt von `request`, `checkContinue` und `checkExpectation`
  höchstens einen Request pro physischem Socket weiterverarbeiten lässt;
- beim regulären HTTP/1.1-Pipelinepfad der erste gültige Raw Body
  Decoderfactory, Decode und Boundary jeweils exakt einmal erreicht, während
  jeder zweite reguläre oder Expect-Pfad `rawHeaders` kein einziges Mal
  auswertet und terminal endet;
- bei gebundenem Port `80` nur die bare oder explizite `:80`-Loopback-Autorität
  und bei jedem anderen Port nur die exakte `:<port>`-Form akzeptiert wird;
- tatsächliche Wire-Bytes gegen die importierte kanonische Grenze gezählt und
  bei Byte 65.537 ohne Materialisierung eines übergroßen Gesamtbuffers
  abgebrochen werden;
- der begrenzte vollständige Buffer exakt einmal streng mit
  `fatal: true`/`ignoreBOM: true` dekodiert, U+FEFF erhalten und der resultierende
  String ohne HTTP-seitiges Parsing exakt einmal an die vorhandene Boundary
  gegeben wird;
- lokaler Envelope, kontrollierte Boundary-Response und spätere normale
  SyncResponse weder strukturell noch semantisch vermischt werden;
- Boundary-Akzeptanz ausschließlich die exakte defensive Requestidentität
  synchron höchstens einmal an den injizierten SyncAgent weitergibt und nur ein
  vollständig abgesicherter ADR-0024-Erfolg HTTP `200` erzeugt;
- pro physischem Socket genau ein Responsepfad den Responsebesitz erwirbt und
  `clientError` nach einer vorherigen Übernahme keine zweite Response schreibt;
- Raw-Socket-Pfade ausschließlich best effort schreiben und den Socket danach
  zuverlässig zerstören sowie `dropRequest` nur als zusätzliche
  Defense-in-Depth ohne zweite Response wirkt;
- die festen Produktionsfristen mit einem `100`-ms-Prüftakt durchgesetzt und
  die kleineren Testfristen nur durch die feste Factory-Port-`0`-Policy, nie
  durch Runtime-Konfiguration, erreichbar sind;
- der vollständige Zugriff auf `server.address()` einschließlich der
  `address`- und `port`-Eigenschaften bei einem Throw oder einem ungültigen
  beziehungsweise unerwarteten Port redigiert in denselben Start-Cleanup und
  niemals zu `onFatal` führt;
- ein Serverfehler nach erfolgreichem Start Port und Listener sofort verwirft,
  alle verfolgten Sockets zerstört und jede weitere Boundary-Verarbeitung
  sperrt;
- Header-, Headerfeld-, Request-, Socket-, Keep-Alive- und Request-pro-Socket-
  Grenzen sowie `Connection: close` tatsächlich gesetzt sind;
- keine Browser-, Cloud-, n8n-, Secret-, Provider-, private Daten-, Storage-,
  Log-, Telemetrie-, Rate-Limit- oder `src/main.js`-Komposition behauptet oder
  eingeführt wird; die einzige Agenten-/Normalresponse-Komposition bleibt der
  leere synthetische lokale `syncTest`;
- die gezielten Tests, relevante kombinierte Suites, Gesamtsuite und
  Produktions-Build real ausgeführt werden und erst danach ihre tatsächlichen
  Ergebnisse in der Dokumentation erscheinen.

## Generated n8n Boundary Bundle Definition of Done

Die Bundle Foundation gilt als implementiert, wenn:

- Contract und SyncGateway Request Boundary unverändert die einzigen
  fachlich kanonischen Quellen bleiben;
- der kleine Entry ausschließlich `createSyncGatewayRequestBoundary` exponiert;
- der Entry als explizit gepflegte manifestierte nichtfachliche Glue-Quelle,
  der Generator als gepflegtes Repository-Tooling und ausschließlich Bundle
  sowie Manifest als generierte Derivate eingeordnet bleiben;
- der Generator deterministisch das direkt bindbare Standalone-Expression-IIFE
  und Manifest erzeugt, ohne eine neue Dependency oder Source Map einzuführen;
- `"use strict";` der erste IIFE-Body-Prolog und kein Top-Level-Statement ist,
  nach dem Ausdruck kein separates Semikolon-Statement folgt und die
  unveränderten Artefaktbytes direkt hinter `const boundaryBundle =` bindbar
  sind;
- der Generate-Modus ausschließlich Artefakt und Manifest aktualisiert und der
  Checkmodus den Projektbaum nicht verändert;
- die ausgewertete eingefrorene API exakt
  `{ createSyncGatewayRequestBoundary }` und die Factory-API exakt
  `{ processSyncRawBody }` besitzt;
- das Bundle keine Laufzeitimports, Globalmutation, automatische Verarbeitung,
  n8n-Inputannahme, Netzwerk-, Datei-, Prozess-, Environment-, Credential-,
  Secret-, Log- oder Telemetriepfade besitzt;
- Manifest und Generator die feste Quellenreihenfolge und SHA-256 über die
  jeweils exakten Bytes verwenden;
- Contract, Boundary und Entry jeweils exakt einmal über sichere FileHandles
  erfasst werden und Hashing sowie Vite-Virtualmodule denselben unveränderlichen
  Snapshot einschließlich ABA-Härtung verwenden;
- kanonischer Root, Zielordner und Outputcontainment vor Writes fail-closed
  geprüft werden, von Node erkannte symbolische Links/Junctions und
  `realpath`-Abweichungen nicht als Ausgabeziele dienen, unvorhersagbar benannte
  exklusive Tempdateien im verifizierten Zielordner liegen, Identität und Bytes
  geprüft werden und Artefakt vor Manifest individuell ersetzt, das Paar
  abschließend geprüft sowie weiterhin identitätsgleiche Tempdateien bereinigt
  werden;
- dabei weder atomare Paarupdates, Power-Loss-/Single-Writer-Sicherheit,
  vollständige Erkennung aller Windows-Reparse-Tags noch Schutz gegen
  bösartige gleichzeitig ausgeführte Reparse-Rennen behauptet werden;
- wiederholte und pfadunabhängige Generierung byteidentische Ausgaben liefert;
- Parität Werte, Struktur, Prototypen, Freeze, Frische, Entkopplung,
  Dependencygrenzen, Redaction und Console-Stille gegen das kanonische Orakel
  prüft;
- temporäre Mutationen Artefakt-, Quellen-, Semantik- und API-/Freeze-Drift
  erkennen, ohne kanonische Projektdateien zu verändern;
- kein Workflow, Webhook, Transport, Credential, Secret, operativer Agent,
  Cloudaufruf oder Aktivierungsnachweis behauptet wird;
- der frühere n8n-Raw-Body-Laufzeitnachweis weder als Beweis ursprünglicher
  Browserbytes noch als Aktivierungsgate des lokalen `syncTest` dargestellt
  wird; vor jeglicher Vorbereitung oder Ausführung einer neuen n8n-
  Tenantmessung müssen ein neuer n8n-Adapter-ADR angenommen und eine neue
  adapterbezogene Evidenz-Schemaversion festgelegt sein;
- die relevanten Tests, der Checkmodus, die vollständige serielle Suite und der
  Produktions-Build real ausgeführt und erst danach mit ihren tatsächlichen
  Zahlen dokumentiert sind.

## n8n Cloud Ingress & Runtime Evidence Gate Definition of Done

Die lokale Evidence-Foundation gilt als implementiert, wenn:

- `scripts/n8n/n8nCloudIngressProbe.js` beim Import inert bleibt und
  `npm run probe:n8n:cloud:test -- --vector <probeId>` der kanonische und
  vorgesehene Operator-Laufweg ist; das Package-Script bindet exakt
  `node scripts/n8n/n8nCloudIngressProbe.js --run`, während ausschließlich der
  CLI-Adapter Real-HTTPS nach vollständiger Vorvalidierung binden darf;
- Runtimeendpoint und Wegwerfsecret ausschließlich aus den beiden
  dokumentierten Environmentnamen gelesen, der Endpoint als kanonischer
  `/webhook-test/<segment>[/<segment>…]`-Pfad mit sicheren ASCII-Segmenten vor
  Transportauflösung validiert und beide Werte in allen Result-, Fehler- und
  Ausgabepfaden statisch redigiert werden;
- die Registry exakt die dokumentierten 32 IDs einschließlich beider
  orderbezogenen widersprüchlichen Auth-Duplikatfälle, Bytefixtures, Bytezahlen,
  SHA-256-Werte, UTF-8-Erwartungen und Transportvarianten in fester Reihenfolge
  materialisiert;
- jeder lokale Erwartungsdigest über die unveränderten ausgehenden Bytes und
  bei Content-Encoding ausdrücklich über die codierten Wire-Bytes gebildet
  wird;
- die Factory ausschließlich einen explizit injizierten Transport akzeptiert
  und der reale HTTPS-Adapter erst nach vollständiger Argument-, Config- und
  ID-Validierung im CLI aufgelöst wird;
- jeder Lauf genau einen allowlist-validierten Vektor in genau einem
  HTTPS-Request nur an `/webhook-test/` sendet und danach stoppt; kein Sweep,
  Autoregister, Redirect-Follow, Retry, zweiter Versuch oder Production-URL-
  Pfad existiert und vor dem nächsten erfolgreichen Vektor ist manuelles
  erneutes Listening erforderlich;
- der unveränderte standalone Expression-IIFE-Observer genau über
  `observeProbe.call(this, $input)` gebunden werden kann, beim Laden inert ist
  und für eine allowlist-validierte ID den offiziellen Binary-Buffer-Helper
  exakt einmal aufruft;
- der Observer die 32 Erwartungsbytes unabhängig rekonstruiert, jedes Byte
  manuell vergleicht, die strikte `TextDecoder`-Semantik einschließlich
  BOM-Erhalt belegt und genau ein Item mit den sechs dokumentierten Feldern
  zurückgibt;
- Observer und Runner weder Raw Body, Text, Bytes, Hex, Base64 oder Hash einer
  Runtimebeobachtung noch Secret-, Header-, URL-, Tenant- oder
  Credentialwerte zurückgeben, persistieren oder loggen;
- hostile, unvollständige und unbekannte HTTP- beziehungsweise
  Observerresponses nur nach dem geschlossenen Sechs-Felder-Vertrag projiziert
  und ansonsten ohne Teilbestätigung als `UNPROVEN` behandelt werden;
- negative Auth-`2xx` und `authorizationHeaderPresence: present` auf jedem
  erfolgreichen eindeutig zugeordneten Observerpfad sowie ausdrückliche
  Redirect-, Attributions-, Count-, Byte-, Längen-, UTF-8- oder Content-
  Encoding-Widersprüche `FAIL` ergeben, während `null` oder `unavailable` beim
  Header ohne anderen bekannten Widerspruch mindestens `UNPROVEN` bleiben;
- bei einer übernommenen geschlossenen erfolgreichen `2xx`-Observerresponse
  jeder nicht-nullische Count exakt `1` ist, bekannte `0` oder Werte größer
  als `1` `FAIL` ergeben und `null` bei normalen und komprimierten Erfolgswegen
  zulässig bleibt, sofern das Einzelgate den Count nicht verlangt;
- Auth-Ablehnungsstatus und Encoding-`400`/`415` allein `UNPROVEN` bleiben,
  die jeweils verlangten gebundenen `0`/`0`- beziehungsweise `1`/`1`-Counts
  nie aus HTTP erfunden werden und die feste `FAIL`-/Vollständigkeits-
  Aggregation weder kompensiert noch optimistisch normalisiert wird;
- der äußere Runnerresult exakt den dokumentierten Success- beziehungsweise
  statischen Fehlervertrag `{ ok, vectorGate, evidence }` besitzt und ein
  einzelnes Vektor-`PASS` weder Test-URL-Tenantstatus noch Aktivierung öffnet;
- die eingecheckte Evidenzvorlage und ihr Builder exakt das geschlossene
  Schema 1 mit exakt 19 dokumentierten Top-Level-, fünf Execution-Settings-
  und 13 Vektorfeldern sowie der festgelegten Nullsemantik besitzen;
- der Evidenzvalidator Katalogmetadaten, Gatekonsistenz, vollständige Bindung,
  sichere Settings, Read-time-Redaction-Grenze, Providerreferenz und Cleanup
  fail-closed prüft;
- Provider-`PASS` zusätzlich nicht-nullische `tenantAlias`, `observedAt`,
  `timezone`, `n8nBuild`, `webhookNodeTypeVersion` und
  `secretFreeWorkflowSha256` verlangt, `plan` und `region` nullable bleiben und
  fehlende Pflichtbindung ohne bekannten Widerspruch `UNPROVEN` ergibt;
- bekannte unsichere Execution-Data-Einstellungen `FAIL`, fehlende oder nicht
  verfügbare Einstellungen `UNPROVEN` und nur die exakte sichere Kombination
  ein Bindungs-`PASS` ergeben;
- aktivierte Read-time-Redaction nicht als Nichtpersistenzbeweis ausgegeben
  und weiterhin durch eine zulässige redigierte Providerreferenz ergänzt wird;
- die sanitisierten Templatewerte keine behauptete Tenantmessung enthalten,
  Test-URL-Tenant- und Providerstatus ohne Lauf `UNPROVEN`,
  `stableOssCompatibility` fest `FAIL`,
  `productionUrlMeasurementStatus` fest `UNPROVEN` und
  `activationDecision` in Schema 1 unveränderlich `FAIL` bleiben und kein
  `overallGate` existiert;
- die `FAIL`-Befunde für `gzip`-/`deflate`-Wire-Byte-Erhalt und Secret im
  Standard-Webhook-Output ausschließlich als Beobachtung von `n8n@2.35.4` am
  Commit `d2ce3c084c228622c2ffe7c245d25870430e18a9`, nicht als
  Cloud-Tenantmessung oder Plattformgarantie, klassifiziert werden;
- ADR 0023 weder Cloudzugriff noch Tenantmessung autorisiert und vor jeglicher
  Vorbereitung oder Ausführung einer neuen n8n-Tenantmessung ein neuer n8n-
  Adapter-ADR angenommen sowie eine neue adapterbezogene Evidenz-
  Schemaversion festgelegt sein muss;
- erst danach die Anlage des temporären Workflows, das Wegwerfcredential, jeder
  einzelne manuelle synthetische Test-URL-One-shot sowie der vorab definierte
  Cleanup und die Entfernung der Cloudartefakte jeweils eine eigene
  ausdrückliche Freigabe benötigen;
- ohne angenommenen neuen ADR und festgelegte neue Schemaversion weder
  Workflow, Credential noch Test-URL-Verkehr zulässig ist und kein Production-
  URL-Runner oder -Messpfad existiert;
- Supportanfragen unabhängig davon separat freigegeben werden, rein informativ
  bleiben und weder Workflow, Credential, Tenantvorbereitung oder -ausführung,
  Adapteraktivierung noch Productionlauf autorisieren;
- ADR 0022 ADR 0019 historisch ergänzte und dessen Aktivierung blockierte, ihn
  aber nicht selbst ersetzte; ADR 0023 ersetzt ADR 0019, ohne die drei festen
  Stable-OSS-, Production- und Aktivierungswerte zu ändern, deren spätere
  Änderung weiterhin einen neuen ADR plus neue Schemaversion erfordert;
- weder Boundary-Bundle, SyncContract, SyncGateway Request Boundary,
  SyncAgent, produktiver Webhook noch Cloud-Upstream in den Probe-Slice
  komponiert werden und das lokale SyncGateway unverändert mit dem statischen
  `503`-Pfad endet;
- die fokussierten Tests, Syntaxprüfung, relevante bestehende Suites,
  vollständige serielle Suite und Produktions-Build real ausgeführt werden
  und erst danach ihre tatsächlichen Ergebnisse dokumentiert werden.

## Offene Vertragsentscheidungen

Vor der jeweiligen Implementierung werden noch konkret entschieden:

- exakte Fingerprint-Bildung für Idempotenz;
- technische Ablage von Idempotenzschlüsseln;
- konkrete lokale Agenten- und providerabhängige Timeoutwerte; die feste
  5.000-ms-Browsertransport-Eventloopdeadline für asynchrones Fetch-/Streamwarten
  ist durch ADR 0027 unverändert übernommen, nicht aber eine harte synchrone
  CPU-Grenze;
- konkrete lokale und providerabhängige Rate-Limits;
- Body-Binding-, Replay- und Secret-Härtung vor privaten oder schreibenden
  Aktionen;
- je capability-spezifischem ModelProvider- oder WorkflowProvider-Adapter die
  minimierte Inputprojektion, Outputgrenzen, getrennte GoldenDawn- und
  providerseitige Credentialgrenzen, Retention-, Kosten- und Ressourcenpolicy;
- für einen optionalen n8n-Adapter einen neuen angenommenen Adapter-ADR, eine
  neue festgelegte Evidenz-Schemaversion, die vollständig offene
  Authentisierungsentscheidung sowie die gebundene Execution-Data-, Workflow-
  und Tenantprüfung und erst danach die getrennte Freigabe von Workflow,
  Wegwerfcredential, jedem einzelnen Test-URL-One-shot und Cleanup;
- Validierungsstrategie ohne oder mit Schema-Bibliothek;
- maximale Aufbewahrung serverseitiger Testdefinitionen;
- Retry-UI für nicht gespeicherte Testergebnisse;
- ob `learningTest.result.list` für Version 1 benötigt wird.

Diese Punkte ändern nicht den Grundvertrag und werden nicht stillschweigend
implementiert.
