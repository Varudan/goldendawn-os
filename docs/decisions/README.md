# GoldenDawn OS – Architecture Decision Records

Dieses Verzeichnis enthält die verbindlichen Architecture Decision Records
(ADRs) von GoldenDawn OS. Ein ADR dokumentiert Kontext, Entscheidung,
Konsequenzen und Bedingungen für eine spätere Neubewertung.

## Entscheidungsübersicht

| ADR | Entscheidung | Status |
| --- | --- | --- |
| [0001](0001-vite-vanilla-js.md) | Vite und Vanilla JavaScript als Frontend-Grundlage | Angenommen |
| [0002](0002-syncagent-gateway.md) | SyncAgent als einziges externes Gateway des Dashboards | Ersetzt |
| [0003](0003-dataagent-airtable-boundary.md) | DataAgent als einzige Airtable-Schnittstelle | Angenommen |
| [0004](0004-private-demo-separation.md) | Strikte Trennung privater Daten und Demo-Daten | Angenommen |
| [0005](0005-v1-three-agent-scope.md) | Version 1 bleibt auf drei Agenten begrenzt | Angenommen |
| [0006](0006-learning-catalog-hierarchy-and-nodes.md) | Feste LearningHub-Hierarchie mit normalisierten LearningNodes | Ersetzt |
| [0007](0007-user-configured-learning-modules.md) | Nutzerkonfigurierte LearningModules mit trackbaren Kapiteln und LearningNodes | Angenommen |
| [0008](0008-learning-hub-local-content-persistence.md) | Lokale LearningHub-Inhaltsverwaltung und -Persistenz | Angenommen |
| [0009](0009-append-only-learning-progress-events.md) | Separater Lernfortschritt als append-only Ereignislog | Angenommen |
| [0010](0010-learning-artifacts-for-notes-and-summaries.md) | Getrennte LearningArtifacts für Notizen und Zusammenfassungen | Angenommen |
| [0011](0011-local-deterministic-learning-test-foundation.md) | Lokale deterministische LearningTest-Foundation | Angenommen |
| [0012](0012-one-time-learning-hub-demo-seed.md) | Einmaliger koordinierter LearningHub-Demo-Erststart | Angenommen |
| [0013](0013-lichtwald-log-local-contract.md) | Lokaler LichtwaldLog-Vertrag mit einzelner Fokusreferenz | Angenommen |
| [0014](0014-lichtwald-log-private-storage-foundation.md) | Begrenzte private LichtwaldLog-Full-Snapshot-Persistenz | Angenommen |
| [0015](0015-separated-lichtwald-log-demo-runtime.md) | Getrennte synthetische LichtwaldLog-Demo-Runtime | Angenommen |
| [0016](0016-transport-neutral-sync-contract-foundation.md) | Transportneutraler Sync-v1-Kern und künftige Transport- und Hub-Grenze | Angenommen |
| [0017](0017-transport-neutral-sync-service-foundation.md) | Transportneutrale SyncService Foundation mit kontrollierter Korrelation | Angenommen |
| [0018](0018-transport-neutral-sync-gateway-request-boundary-foundation.md) | Transportneutrale SyncGateway Request Boundary für materialisierte Raw Bodies | Angenommen |
| [0019](0019-local-sync-gateway-before-n8n-cloud.md) | Lokales SyncGateway als Sicherheitsgrenze vor n8n Cloud | Ersetzt |
| [0020](0020-local-sync-gateway-raw-wire-http-foundation.md) | Lokale SyncGateway Raw-Wire- und HTTP-Foundation | Angenommen |
| [0021](0021-generated-n8n-boundary-bundle-foundation.md) | Direkt bindbares, snapshotbasiertes n8n-Boundary-Bundle aus kanonischen Quellen und gepflegter Buildgrenze | Angenommen |
| [0022](0022-n8n-cloud-ingress-runtime-evidence-gate.md) | Tenant- und versionsgebundenes n8n Cloud Ingress & Runtime Evidence Gate | Angenommen |
| [0023](0023-local-syncagent-before-optional-external-providers.md) | Lokaler SyncAgent vor optionalen externen Providern | Angenommen |
| [0024](0024-local-model-free-syncagent-core-foundation.md) | Local Model-free SyncAgent Core Foundation | Angenommen |
| [0025](0025-local-syncgateway-syncagent-composition.md) | Local SyncGateway–SyncAgent Composition | Angenommen |
| [0026](0026-browser-sync-transport-contract.md) | Browser SyncTransport Contract | Ersetzt |
| [0027](0027-browser-sync-transport-proof-boundaries.md) | Beobachtbare Browser-SyncTransport-Nachweisgrenzen | Angenommen |

## ADR-Regeln

- ADRs werden fortlaufend nummeriert und nach Annahme nicht inhaltlich
  umgeschrieben.
- Eine geänderte Entscheidung erhält einen neuen ADR, der den alten ersetzt.
- Erlaubte Statuswerte sind `Vorgeschlagen`, `Angenommen`, `Abgelehnt` und
  `Ersetzt`.
- Wesentliche Änderungen an Stack, Agentenrollen, Datenfluss, Sicherheit oder
  Deployment benötigen einen ADR.
- Git-Commits, Pull Requests und Statusänderungen bleiben manuell bei Jan.

## Vorlage für neue ADRs

```markdown
# ADR NNNN: Kurzer Entscheidungstitel

## Status

Vorgeschlagen oder Angenommen – YYYY-MM-DD

## Kontext

Welches Problem oder welche Kräfte führen zur Entscheidung?

## Entscheidung

Welche verbindliche Entscheidung wurde getroffen?

## Konsequenzen

Welche Vorteile, Kosten und Einschränkungen entstehen?

## Erwogene Alternativen

Welche realistischen Optionen wurden verworfen und warum?

## Bedingungen für eine Neubewertung

Wann muss die Entscheidung überprüft werden?
```
