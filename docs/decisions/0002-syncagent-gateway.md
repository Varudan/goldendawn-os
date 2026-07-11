# ADR 0002: SyncAgent als einziges externes Gateway

## Status

Angenommen – 2026-07-11

## Kontext

Das Dashboard soll später mit n8n, Airtable und spezialisierten Agenten
kommunizieren. Direkte Zugriffe aus einzelnen UI-Komponenten würden
Validierung, Fehlerbehandlung, Routing und Sicherheitsregeln verteilen. Das
Frontend würde dadurch eng an externe Systeme gekoppelt.

## Entscheidung

Der Sync-Service ist die einzige externe Kommunikationsschicht des Frontends.
Er kommuniziert ausschließlich mit dem SyncAgent in n8n. Der SyncAgent:

- validiert den gemeinsamen Request-Umschlag;
- prüft die Aktions-Allowlist;
- klassifiziert und routet Anfragen;
- normalisiert Antworten und Fehler;
- erhält die `requestId` über den gesamten Agentenfluss.

Das Dashboard bestimmt keinen Fachagenten direkt. Routing erfolgt über die
validierte Aktion aus `docs/data-contracts.md`.

## Konsequenzen

Positive Auswirkungen:

- eine kontrollierte externe Systemgrenze;
- zentrale Validierung und einheitliche Fehlerantworten;
- UI bleibt unabhängig von n8n-Nodes und Airtable-Schemata;
- Agenten lassen sich intern verändern, ohne UI-Verträge neu zu verteilen;
- der Multi-Agenten-Fluss ist nachvollziehbar demonstrierbar.

Kosten und Einschränkungen:

- der SyncAgent wird zu einer kritischen Komponente;
- Fehler im Routing können mehrere Funktionen betreffen;
- ein zusätzlicher Verarbeitungsschritt erhöht geringfügig die Latenz;
- der SyncAgent benötigt klare Tests und darf keine Fachlogik ansammeln.

## Erwogene Alternativen

### Direkte UI-Aufrufe an Fachagenten

Diese Variante reduziert einen Hop, verteilt aber Verträge, Fehlerbehandlung
und Sicherheitsregeln auf mehrere Frontend-Module.

### Direkter UI-Zugriff auf Airtable

Diese Variante ist ausgeschlossen, weil Credentials und Datenmodell im Client
offengelegt oder unsicher gekoppelt würden.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn:

- der SyncAgent zum nachweisbaren Leistungsengpass wird;
- getrennte Sicherheitszonen mehrere Gateways erfordern;
- ein späteres Backend die Gateway-Rolle übernimmt;
- asynchrone Ereignisse einen zusätzlichen Event-Kanal benötigen.

## Verwandte Dokumente

- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
