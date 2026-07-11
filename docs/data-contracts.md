# GoldenDawn OS – Daten- und Sync-Verträge

## Dokumentstatus

| Feld | Wert |
| --- | --- |
| Projektphase | `v0.1.0 – Foundation` |
| Vertragsversion | `1.0` |
| Agenten-Scope | SyncAgent, TestAgent und DatenAgent |
| Status | Initialer Vertrag für Version 1 |
| Letzte Aktualisierung | 2026-07-11 |

Dieses Dokument definiert die maschinenlesbare Sprache zwischen dem
GoldenDawn-OS-Frontend, dem SyncAgent, dem TestAgent und dem DatenAgent. Es
konkretisiert die Grenzen aus `AGENTS.md`, `docs/architecture.md` und
`docs/security.md`.

Der Vertrag beschreibt den geplanten Zielzustand. Solange eine Aktion noch
nicht implementiert ist, muss sie in UI und Dokumentation als geplant
gekennzeichnet bleiben.

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

| Aktion | Zweck | Primärer Handler | Schreibend |
| --- | --- | --- | --- |
| `syncTest` | Verbindung und Vertragsformat prüfen | SyncAgent | nein |
| `learningTest.create` | Lerntest erzeugen und Definition sicher speichern | TestAgent | ja |
| `learningTest.evaluate` | Antworten bewerten und Ergebnis speichern | TestAgent | ja |
| `learningTest.result.get` | Gespeichertes Testergebnis abrufen | DatenAgent | nein |

Diese Allowlist ist für Version 1 geschlossen. Externe Clients dürfen keine
`data.*`-Aktionen oder frei gewählten Agentennamen übermitteln.

### Interne Aktionen zwischen Agenten

| Aktion | Quelle | Ziel | Zweck |
| --- | --- | --- | --- |
| `test.generate` | SyncAgent | TestAgent | Test und serverseitige Bewertungskriterien erzeugen |
| `test.evaluate` | SyncAgent | TestAgent | Antworten nach gespeicherten Kriterien bewerten |
| `data.record.create` | SyncAgent | DatenAgent | erlaubten Datensatz anlegen |
| `data.record.get` | SyncAgent | DatenAgent | erlaubten Datensatz über stabile ID lesen |
| `data.record.list` | SyncAgent | DatenAgent | erlaubte Datensätze paginiert lesen |
| `data.record.update` | SyncAgent | DatenAgent | erlaubte Felder eines Datensatzes ändern |

`data.record.delete` ist nicht Teil von Version 1. Löschungen werden nicht
autonom durch Agenten ausgeführt.

### Bewusst nicht enthaltene Verträge

- PromptVault-Synchronisation mit Airtable;
- weitere Agentenrollen;
- E-Mail-, Kalender-, GitHub- oder Gesundheitsdaten;
- Datei-Uploads oder binäre Payloads;
- Benutzerkonten und Rollenmodelle;
- öffentliche Schreibzugriffe ohne gesonderte Sicherheitsentscheidung.

PromptVault bleibt zunächst lokal. Falls später eine externe Synchronisation
beschlossen wird, läuft sie ebenfalls ausschließlich über SyncAgent und
DatenAgent und erhält eigene dokumentierte Aktionen.

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
| DatenAgent an SyncAgent | `DatenAgent` |

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
  "processedBy": ["SyncAgent", "TestAgent", "DatenAgent"]
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
| `DATA_READ_FAILED` | DatenAgent konnte nicht lesen | bedingt |
| `DATA_WRITE_FAILED` | DatenAgent konnte nicht schreiben | bedingt |
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
    "topicId": "topic_big_data_001",
    "title": "Big Data – Grundlagen",
    "learningContext": {
      "summary": "Big Data wird unter anderem durch Volumen, Vielfalt, Geschwindigkeit und Vertrauenswürdigkeit beschrieben.",
      "learningObjectives": [
        "Die vier V erklären können",
        "Cloud- und Edge-Verarbeitung unterscheiden können"
      ],
      "sourceRefs": [
        {
          "id": "course_unit_1_2",
          "label": "KI-Management – Unit 1.2"
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
den SyncAgent vom DatenAgent als `learningTestDefinition` gespeichert und nicht
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
    "processedBy": ["SyncAgent", "TestAgent", "DatenAgent"]
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
    "processedBy": ["SyncAgent", "TestAgent", "DatenAgent"]
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
    "processedBy": ["SyncAgent", "TestAgent", "DatenAgent"]
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
  "handledBy": "DatenAgent",
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
    "processedBy": ["SyncAgent", "DatenAgent"]
  }
}
```

## Interner DatenAgent-Vertrag

### Erlaubte Entitäten

| Entität | Zweck | Erste Verwendung |
| --- | --- | --- |
| `systemEvent` | sichere technische Ereignisse ohne vollständige Payload | v0.4.0 |
| `learningTestDefinition` | Testfragen und serverseitige Bewertungskriterien | v0.5.0 |
| `learningTestResult` | bewertetes und angezeigtes Testergebnis | v0.5.0 |

Der DatenAgent ordnet diese Entitäten serverseitig Airtable-Tabellen zu.
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

### Interne Response des DatenAgent

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_d28bd3c9-3218-498d-a4af-88327fd2dc5a",
  "action": "data.record.create",
  "handledBy": "DatenAgent",
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

Erst danach wird an TestAgent oder DatenAgent geroutet.

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
