# ADR 0003: DatenAgent als einzige Airtable-Schnittstelle

## Status

Angenommen – 2026-07-11

## Kontext

Version 1 verwendet Airtable als erste strukturierte externe Datenquelle.
Airtable-Feldnamen, Tabellen, Berechtigungen und Credentials dürfen weder in
UI-Komponenten noch in Fachagenten verteilt werden. Der TestAgent soll sich auf
Prüfungslogik konzentrieren und keine Datenbankverantwortung erhalten.

## Entscheidung

Nur der DatenAgent besitzt Zugriff auf Airtable-Credentials und führt
strukturierte Lese- oder Schreiboperationen aus.

Der DatenAgent:

- akzeptiert nur erlaubte interne `data.*`-Aktionen vom SyncAgent;
- ordnet fachliche Entitäten festen Tabellen und Feldern zu;
- validiert Entitäten, Operationen und Feld-Allowlists;
- normalisiert Airtable-Antworten zu stabilen Domänenobjekten;
- verwendet `requestId` und stabile IDs für Idempotenz;
- führt in Version 1 keine autonomen Löschungen aus.

Der SyncAgent routet Datenaufträge, verwendet aber keine Airtable-Credentials.
Der TestAgent gibt Ergebnisse an den SyncAgent zurück und speichert nicht
direkt.

## Konsequenzen

Positive Auswirkungen:

- Airtable ist hinter einer klaren Schutz- und Mapping-Schicht gekapselt;
- Schemaänderungen müssen nicht in UI und TestAgent nachvollzogen werden;
- minimale Token-Rechte lassen sich zentral verwalten;
- private und Demo-Bases können getrennt konfiguriert werden;
- Datenfehler werden einheitlich behandelt.

Kosten und Einschränkungen:

- Datenzugriffe benötigen einen zusätzlichen Agentenschritt;
- der DatenAgent braucht sorgfältige Entitäts- und Felddefinitionen;
- komplexe Airtable-Operationen dürfen nicht als freie Formeln aus dem Client
  durchgereicht werden.

## Erwogene Alternativen

### Airtable-Zugriff im SyncAgent

Dies würde Routing und Datenzugriff vermischen und den SyncAgent unnötig
privilegieren.

### Airtable-Zugriff im TestAgent

Dies würde Prüfungslogik und Persistenz koppeln und die Wiederverwendung sowie
Fehlertrennung erschweren.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn:

- Airtable durch eine relationale Datenbank ersetzt wird;
- mehrere Datenquellen unterschiedliche Sicherheitsgrenzen benötigen;
- Transaktionen oder Abfragen erforderlich werden, die Airtable nicht sinnvoll
  unterstützt;
- ein späteres Backend die Datenzugriffsschicht übernimmt.

## Verwandte Dokumente

- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
