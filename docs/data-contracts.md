# GoldenDawn OS – Daten- und Sync-Verträge

## Dokumentstatus

| Feld | Wert |
| --- | --- |
| Projektphase | `v0.2.0 – Local Dashboard MVP abgeschlossen` |
| Vertragsversion | `1.0` |
| PromptVault-Speicherschema | `2` |
| LearningHub-Schema | `2` |
| Agenten-Scope | SyncAgent, DataAgent und TestAgent |
| Status | Lokale PromptVault- und LearningHub-Verträge implementiert; Sync-Vertrag als Zielzustand dokumentiert |
| Letzte Aktualisierung | 2026-07-18 |

Dieses Dokument definiert den implementierten lokalen PromptVault-
Speichervertrag sowie die maschinenlesbare Sprache zwischen dem
GoldenDawn-OS-Frontend, dem SyncAgent, dem DataAgent und dem TestAgent. Es
konkretisiert die Grenzen aus `AGENTS.md`, `docs/architecture.md` und
`docs/security.md`.

Der lokale PromptVault-Vertrag gilt für den aktuellen Stand von `v0.2.0`. Die
externen Sync- und Agentenverträge beschreiben weiterhin den geplanten
Zielzustand späterer Versionen. Solange eine externe Aktion noch nicht
implementiert ist, muss sie in UI und Dokumentation als geplant gekennzeichnet
bleiben.

## Vertragsgrenzen der lokalen Module v0.2.1 und v0.2.2

Die lokalen Module `v0.2.1` und `v0.2.2` erweitern die externe
Aktions-Allowlist dieses Dokuments nicht. Der LearningHub-Schema-2-Vertrag ist
ein rein interner Datenvertrag und führt weder externe Aktionen noch einen
Storage-Key oder ein Storage-Schema ein. Die nachfolgenden
`learningTest.*`-Verträge bleiben
ausdrücklich ein Zielzustand für `v0.5.0`; die internen `DataAgent`-Verträge
sind Zielzustände für `v0.4.0` und, im Lernfluss, `v0.5.0`.

### v0.2.1 – LearningHub Local MVP

Der geplante LearningHub-Datenfluss bleibt vollständig lokal:

```text
LearningHubView
  → LearningHubController
  → LearningTestService
  → MockLearningTestProvider
```

Der `MockLearningTestProvider` verwendet vorbereitete synthetische Fragen,
arbeitet deterministisch und wird sichtbar als „Lokaler Mock-Test“
gekennzeichnet. Dieser lokale Ablauf verwendet weder `SyncAgent` noch
`TestAgent` und ist nicht mit den geplanten Aktionen `learningTest.create`,
`learningTest.evaluate` oder `learningTest.result.get` gleichzusetzen.

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
Versionshistorien gehören nicht zu Schema 2. Kapitelabschluss, Modulfortschritt
und Testkompetenz werden später getrennt modelliert.

Ein späterer separater Fortschrittsvertrag soll Kapitelzustandswechsel
append-only als unveränderliche Lernereignisse erfassen, beispielsweise
`chapter.started`, `chapter.completed` und `chapter.reopened`. Diese Ereignisse
gehören nicht zum Schema-2-Inhaltsvertrag; Schema 2 implementiert noch kein
Ereignisprotokoll. Das spätere Modell darf xAPI-inspiriert sein, beansprucht
aber keine xAPI-Konformität, verwendet noch kein LRS und behauptet kein
vollständiges Event Sourcing. Aktueller Kapitelstatus und Modulfortschritt
werden später aus den Lernereignissen abgeleitet oder als überprüfbare
Projektion bereitgestellt. Testkompetenz bleibt davon getrennt.

Der tief eingefrorene Demo-Hub enthält genau zwei Module, jedes mit mindestens
einem Kapitel. Mindestens ein Kapitel enthält mehrere LearningNodes und
mindestens eines noch keine. Seine Inhalte sind unabhängig erfunden und tragen
`dataOrigin: synthetic`; private Nutzerdaten tragen `dataOrigin: private` und
verwenden getrennte Datenquellen. Eine Migration ist nicht erforderlich, weil
keine LearningHub-Nutzerdaten nach Schema 1 persistiert wurden.

Diese Foundation definiert weder UI noch Persistenz oder Storage. Lokale
Notizen, Fortschritt und Mock-Testversuche benötigen später eigene Service-,
Storage- und Datenverträge.

### v0.2.2 – LichtwaldLog Local MVP

LichtwaldLog bleibt in `v0.2.2` ein rein lokales Modul. Seine geplanten
Einträge, lokalen CRUD-Funktionen sowie Suche und Filter führen in diesem
Schritt weder neue externe Aktionen noch einen verbindlichen Datenvertrag,
Storage-Key oder ein Storage-Schema ein. Es gibt keine Synchronisierung und
keinen Zugriff durch `SyncAgent`, `DataAgent` oder `TestAgent`.

Private lokale LichtwaldLog-Inhalte und synthetische öffentliche Demo-Daten
bleiben strikt getrennt. Agentengestützte, synchronisierte oder automatisierte
LichtwaldLog-Prozesse gehören zu einem späteren Zielzustand und sind nicht Teil
der hier beschriebenen Verträge.

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

Die folgenden Aktionen gehören zum Zielvertrag für spätere Versionen. Sie sind
in `v0.2.0` noch nicht implementiert.

| Aktion | Zweck | Primärer Handler | Schreibend |
| --- | --- | --- | --- |
| `syncTest` | Verbindung und Vertragsformat prüfen | SyncAgent | nein |
| `learningTest.create` | Lerntest erzeugen und Definition sicher speichern | TestAgent | ja |
| `learningTest.evaluate` | Antworten bewerten und Ergebnis speichern | TestAgent | ja |
| `learningTest.result.get` | Gespeichertes Testergebnis abrufen | DataAgent | nein |

Diese Allowlist ist für Version 1 geschlossen. Externe Clients dürfen keine
`data.*`-Aktionen oder frei gewählten Agentennamen übermitteln.

### Interne Aktionen zwischen Agenten

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

## Gemeinsamer Request-Umschlag

Jeder externe und interne Request verwendet dieselbe Grundstruktur:

```json
{
  "version": "1.0",
  "action": "syncTest",
  "source": "goldendawn-os",
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "timestamp": "2026-07-11T12:00:00.000Z",
  "context": {
    "mode": "private",
    "locale": "de-DE",
    "clientVersion": "0.3.0"
  },
  "payload": {}
}
```

### Felder des Request-Umschlags

| Feld | Typ | Pflicht | Regel |
| --- | --- | --- | --- |
| `version` | String | ja | exakt `1.0` für diesen Vertrag |
| `action` | String | ja | Wert aus der passenden Allowlist |
| `source` | String | ja | erlaubte Quelle, nicht frei vertrauenswürdig |
| `requestId` | String | bedingt | für alle schreibenden Aktionen verpflichtend |
| `timestamp` | ISO-8601-String | ja | UTC mit `Z` |
| `context` | Objekt | nein | nur erlaubte Kontextfelder |
| `payload` | Objekt | ja | aktionsspezifische Struktur |

### Regeln für die Vertragsversion

- Version `1.0` wird als String übertragen.
- Eine nicht unterstützte Hauptversion wird mit `UNSUPPORTED_VERSION`
  abgelehnt.
- Abwärtskompatible optionale Felder dürfen innerhalb von Version 1 ergänzt
  werden.
- Pflichtfelder, Feldbedeutungen und Datentypen werden nicht stillschweigend
  geändert.
- Breaking Changes benötigen eine neue Hauptversion und aktualisierte Beispiele.

### Regeln für Aktionen

- Aktionen sind case-sensitive.
- Externe Aktionen verwenden stabile englische Namen.
- Punktnotation trennt Domäne und Operation, beispielsweise
  `learningTest.evaluate`.
- `syncTest` bleibt aus Kompatibilitätsgründen die einzige Aktion ohne
  Domänenpräfix.
- Der Client wählt keinen Agenten. Der SyncAgent routet ausschließlich anhand
  der validierten Aktion.
- Unbekannte Aktionen erhalten `UNKNOWN_ACTION`.

### Regeln für Quellen

Erlaubte Quellen:

| Kontext | `source` |
| --- | --- |
| Dashboard an SyncAgent | `goldendawn-os` |
| SyncAgent an Fachagent | `SyncAgent` |
| TestAgent an SyncAgent | `TestAgent` |
| DataAgent an SyncAgent | `DataAgent` |

Ein externer Request darf sich nicht durch `source: "SyncAgent"` als interner
Request ausgeben. Die vertrauenswürdige Quelle wird an der Systemgrenze durch
den Workflow-Kontext bestimmt und nicht nur aus dem JSON-Feld abgeleitet.

### Regeln für Request-IDs

- Format: Präfix `req_` plus UUID oder vergleichbar kollisionsarme ID.
- Empfohlene Erzeugung im Browser: `req_${crypto.randomUUID()}`.
- Maximale Länge: 64 Zeichen.
- Eine ID wird im gesamten Agentenfluss beibehalten.
- Schreibende Aktionen ohne `requestId` werden abgelehnt.
- `syncTest` darf während der frühen Entwicklung ohne ID eintreffen; der
  SyncAgent erzeugt dann eine ID und gibt sie in der Antwort zurück.
- Gleiche `requestId` plus gleiche Aktion und gleiche Nutzlast gilt als Retry.
- Gleiche `requestId` mit abweichender Aktion oder Nutzlast ergibt
  `IDEMPOTENCY_CONFLICT`.

### Regeln für Zeitstempel

- Systemübergreifende Zeitstempel verwenden ISO 8601 in UTC.
- Beispiel: `2026-07-11T12:00:00.000Z`.
- Im verbundenen Modus wird eine Abweichung von mehr als fünf Minuten
  standardmäßig abgelehnt, sofern kein dokumentierter Queue-Modus existiert.
- Reine Kalenderdaten verwenden `YYYY-MM-DD`.
- Kalenderdaten werden nicht unnötig über `new Date("YYYY-MM-DD")` geparst.

### Regeln für den Request-Kontext

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

`mode` ist keine Berechtigung. Die tatsächliche Datenquelle wird serverseitig
durch getrennte Workflows und Konfigurationen bestimmt.

### Größen- und Längenlimits

| Element | Limit für Version 1 |
| --- | --- |
| gesamter JSON-Request | maximal 64 KiB |
| `action` | maximal 64 Zeichen |
| `requestId` | maximal 64 Zeichen |
| kurzer Titel | maximal 160 Zeichen |
| kurze Beschreibung | maximal 500 Zeichen |
| Lernzusammenfassung | maximal 12.000 Zeichen |
| einzelne Nutzerantwort | maximal 4.000 Zeichen |
| Array von Lernzielen | maximal 20 Einträge |
| Array von Antworten | maximal 10 Einträge |
| Fehlermeldung für Clients | maximal 500 Zeichen |

Alle Strings werden als UTF-8 verarbeitet. Eingaben werden validiert und für
fachliche Vergleiche bei Bedarf getrimmt, aber nicht unbemerkt inhaltlich
umgeschrieben.

## Gemeinsamer Response-Umschlag

Jede Antwort an das Dashboard verwendet diese Struktur:

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "action": "syncTest",
  "handledBy": "SyncAgent",
  "timestamp": "2026-07-11T12:00:00.245Z",
  "data": {},
  "error": null,
  "warnings": [],
  "meta": {
    "durationMs": 245
  }
}
```

### Felder des Response-Umschlags

| Feld | Typ | Regel |
| --- | --- | --- |
| `version` | String | verwendete Vertragsversion |
| `success` | Boolean | Erfolg der primären fachlichen Aktion |
| `requestId` | String | immer vorhanden |
| `action` | String | ursprüngliche externe Aktion |
| `handledBy` | String | Agent des primären fachlichen Ergebnisses |
| `timestamp` | ISO-8601-String | Zeitpunkt der Antwort in UTC |
| `data` | Objekt oder `null` | bei Erfolg aktionsspezifisch |
| `error` | Objekt oder `null` | bei Fehler strukturiert |
| `warnings` | Array | nicht-blockierende Probleme |
| `meta` | Objekt | sichere technische Metadaten |

`success` beschreibt die primäre Aktion. Bei `learningTest.evaluate` kann eine
Bewertung fachlich erfolgreich sein, obwohl die anschließende Speicherung
fehlschlägt. In diesem Fall bleibt `success: true`, während `persistence.status`
und `warnings` den Speicherfehler sichtbar machen.

### Sichere Response-Metadaten

```json
{
  "durationMs": 842,
  "processedBy": ["SyncAgent", "TestAgent", "DataAgent"]
}
```

- `durationMs` ist eine nicht-negative Ganzzahl.
- `processedBy` enthält nur Agentennamen, keine Node- oder Workflow-Interna.
- Stacktraces, Credential-IDs und Airtable-interne Details werden nicht an den
  Client zurückgegeben.

## Fehlervertrag

### Struktur eines Fehlers

```json
{
  "version": "1.0",
  "success": false,
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "action": "learningTest.evaluate",
  "handledBy": "SyncAgent",
  "timestamp": "2026-07-11T12:00:00.245Z",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Die Anfrage enthält ungültige Felder.",
    "retryable": false,
    "details": [
      {
        "field": "payload.answers",
        "reason": "Mindestens eine Antwort ist erforderlich."
      }
    ]
  },
  "warnings": [],
  "meta": {
    "durationMs": 12
  }
}
```

### Erlaubte Fehlercodes

| Code | Bedeutung | Retry |
| --- | --- | --- |
| `INVALID_JSON` | Body ist kein gültiges JSON | nein |
| `VALIDATION_ERROR` | Umschlag oder Payload ist ungültig | nein |
| `UNSUPPORTED_VERSION` | Vertragsversion wird nicht unterstützt | nein |
| `UNKNOWN_ACTION` | Aktion steht nicht auf der Allowlist | nein |
| `UNAUTHORIZED` | Authentisierung fehlt oder ist ungültig | nein |
| `FORBIDDEN` | Aktion ist in diesem Kontext nicht erlaubt | nein |
| `NOT_FOUND` | Angeforderte Ressource existiert nicht | nein |
| `CONFLICT` | Fachlicher Konflikt | nein |
| `IDEMPOTENCY_CONFLICT` | Request-ID wurde anders verwendet | nein |
| `PAYLOAD_TOO_LARGE` | Request überschreitet das Limit | nein |
| `RATE_LIMITED` | Aufruflimit wurde überschritten | ja, verzögert |
| `TEST_GENERATION_FAILED` | TestAgent konnte keinen gültigen Test erzeugen | bedingt |
| `TEST_EVALUATION_FAILED` | TestAgent konnte nicht valide bewerten | bedingt |
| `DATA_READ_FAILED` | DataAgent konnte nicht lesen | bedingt |
| `DATA_WRITE_FAILED` | DataAgent konnte nicht schreiben | bedingt |
| `UPSTREAM_TIMEOUT` | Externes System antwortet nicht rechtzeitig | ja |
| `SERVICE_UNAVAILABLE` | Benötigter Dienst ist vorübergehend nicht verfügbar | ja |
| `INTERNAL_ERROR` | Unerwarteter interner Fehler | bedingt |

`retryable: true` bedeutet nicht, dass der Client sofort oder unbegrenzt
wiederholen darf. Wiederholungen verwenden dieselbe `requestId` und eine
begrenzte Backoff-Strategie.

### HTTP-Statuszuordnung

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

## Warnungsvertrag

Warnungen blockieren das primäre fachliche Ergebnis nicht:

```json
{
  "code": "RESULT_NOT_SAVED",
  "message": "Die Bewertung wurde erstellt, aber noch nicht gespeichert."
}
```

Erlaubte Warnungen für Version 1:

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
  "timestamp": "2026-07-11T12:00:00.000Z",
  "context": {
    "mode": "private",
    "locale": "de-DE",
    "clientVersion": "0.3.0"
  },
  "payload": {
    "message": "GoldenDawn OS connection test"
  }
}
```

`payload.message` ist optional und auf 120 Zeichen begrenzt. Der SyncAgent gibt
nicht die gesamte beliebige Payload zurück.

### Response für syncTest

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "action": "syncTest",
  "handledBy": "SyncAgent",
  "timestamp": "2026-07-11T12:00:00.105Z",
  "data": {
    "status": "ok",
    "agent": "SyncAgent",
    "mode": "private",
    "receivedAt": "2026-07-11T12:00:00.032Z",
    "echo": {
      "message": "GoldenDawn OS connection test"
    }
  },
  "error": null,
  "warnings": [],
  "meta": {
    "durationMs": 105,
    "processedBy": ["SyncAgent"]
  }
}
```

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

## Validierungsreihenfolge im SyncAgent

Der SyncAgent validiert in dieser Reihenfolge:

1. HTTP-Methode und Content-Type;
2. Payload-Größe und gültiges JSON;
3. gemeinsamer Request-Umschlag;
4. unterstützte Vertragsversion;
5. vertrauenswürdiger Workflow-Kontext und erlaubte Quelle;
6. Zeitstempel und `requestId`;
7. Aktions-Allowlist;
8. aktionsspezifische Payload;
9. Modus und serverseitige Datenquellenzuordnung;
10. Idempotenzstatus vor schreibenden Aktionen.

Erst danach wird an TestAgent oder DataAgent geroutet.

## Datenschutz- und Sicherheitsregeln

- Verträge enthalten keine Tokens, Passwörter oder Credential-IDs.
- Externe Clients dürfen keine Agenten-, Base- oder Tabellenziele bestimmen.
- Agentenoutput wird vor Weitergabe und Speicherung validiert.
- Lernkontext wird als Dateninhalt behandelt, nicht als Systemanweisung.
- Bewertungskriterien bleiben serverseitig.
- Demo- und private Requests verwenden getrennte serverseitige Workflows und
  Datenquellen.
- Fehlermeldungen enthalten keine vollständigen Upstream-Antworten.
- Logs verwenden bevorzugt `requestId`, Aktion, Status und Dauer statt
  vollständiger Payloads.

## Kompatibilitäts- und Änderungsregeln

### Abwärtskompatible Änderungen

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

Wenn die Verträge implementiert werden, sollen daraus kleine prüfbare Module
entstehen:

```text
src/
└── contracts/
    ├── contractConstants.js
    ├── requestValidation.js
    ├── responseValidation.js
    └── actionSchemas.js
```

Für Version 1 werden zunächst Browser- und JavaScript-Funktionen verwendet.
Eine Schema-Bibliothek wird nur nach dokumentierter Entscheidung eingeführt.

## Vertrags-Testmatrix

| Fall | Erwartung |
| --- | --- |
| gültiger `syncTest` | `200`, `success: true`, Request-ID vorhanden |
| fehlende Version | `400`, `VALIDATION_ERROR` |
| Version `2.0` | `400`, `UNSUPPORTED_VERSION` |
| unbekannte Aktion | `400`, `UNKNOWN_ACTION` |
| übergroße Payload | `413`, `PAYLOAD_TOO_LARGE` |
| ungültiger Zeitstempel | `400`, `VALIDATION_ERROR` |
| Schreibrequest ohne `requestId` | `400`, `VALIDATION_ERROR` |
| externer `data.record.create` | `403`, `FORBIDDEN` |
| Test mit unbekannter Frage | `422`, `VALIDATION_ERROR` |
| identischer Retry | bestehendes Ergebnis, kein Duplikat |
| Request-ID mit anderer Payload | `409`, `IDEMPOTENCY_CONFLICT` |
| erfolgreiche Bewertung, Speicherfehler | `success: true`, Warning und `failed`-Status |
| Airtable-Timeout beim Lesen | `504`, `UPSTREAM_TIMEOUT` |

## Contract Definition of Done

Eine Vertragsaktion gilt erst als implementiert, wenn:

- Request und Response diesem Dokument entsprechen;
- Pflichtfelder, Typen, Längen und Enums validiert werden;
- unbekannte Felder gemäß Aktionsschema kontrolliert behandelt werden;
- positive, negative und Retry-Fälle geprüft sind;
- Fehlercode und HTTP-Status zusammenpassen;
- keine Secrets oder internen Daten offengelegt werden;
- Idempotenz für schreibende Aktionen nachgewiesen ist;
- README und Roadmap den tatsächlichen Implementierungsstatus zeigen;
- der Produktions-Build erfolgreich ist.

## Offene Vertragsentscheidungen

Vor der jeweiligen Implementierung werden noch konkret entschieden:

- exakte Fingerprint-Bildung für Idempotenz;
- technische Ablage von Idempotenzschlüsseln;
- konkrete Timeout- und Backoff-Werte;
- Validierungsstrategie ohne oder mit Schema-Bibliothek;
- maximale Aufbewahrung serverseitiger Testdefinitionen;
- Retry-UI für nicht gespeicherte Testergebnisse;
- ob `learningTest.result.list` für Version 1 benötigt wird.

Diese Punkte ändern nicht den Grundvertrag und werden nicht stillschweigend
implementiert.
