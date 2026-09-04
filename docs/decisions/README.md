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
| [0027](0027-browser-sync-transport-proof-boundaries.md) | Beobachtbare Browser-SyncTransport-Nachweisgrenzen | Ersetzt |
| [0028](0028-browser-sync-transport-validator-integrity-boundary.md) | Browser SyncTransport Validator Integrity Boundary | Angenommen |
| [0029](0029-browser-runtime-evidence-gate.md) | Local Browser Runtime Evidence Gate | Angenommen |
| [0030](0030-browser-sync-transport-runtime-diagnostic-observer-boundary.md) | BrowserSyncTransport Runtime Diagnostic Observer Boundary | Ersetzt |
| [0031](0031-browser-sync-transport-diagnostic-envelope-and-observation-completion-boundary.md) | BrowserSyncTransport Diagnostic Envelope and Observation Completion Boundary | Ersetzt |
| [0032](0032-browser-sync-transport-diagnostic-determinism-boundary.md) | BrowserSyncTransport Diagnostic Capture, Timing and Projection Determinism Boundary | Ersetzt |
| [0033](0033-browser-sync-transport-diagnostic-foundation-effects-protocol-boundary.md) | BrowserSyncTransport Diagnostic Foundation Effects Protocol Boundary | Ersetzt |
| [0034](0034-browser-sync-transport-diagnostic-foundation-grammar-derivation-and-testability-boundary.md) | BrowserSyncTransport Diagnostic Foundation Grammar, Derivation and Testability Boundary | Angenommen |

ADR 0034 ist am `2026-09-04` angenommen und ersetzt ADR 0033 formal. Alle
nicht ausdrücklich korrigierten Regeln aus ADR 0033 und ADR 0032 gelten fort;
ADR 0033 bleibt mit bytegleichem Hauptteil ab `## Kontext` historische
Entscheidungsebene.
ADR 0034 ersetzt keinen weiteren ADR. Prototyp-, ASCII-, Zeitzonen- und
Core-SemVer-Grammatiken sowie I1–I8-, Replay-, Observerfeld-, Operation-,
Integrity-, Stage-, Hash- und Cleanupableitungen sind geschlossen und
totalisiert.

Die einzige öffentliche API, `schemaVersion: 1` und alle Kardinalitäten bleiben
unverändert: 17 `FoundationProjection`-Rootfelder, 59 Replayvergleiche, sieben
Effects-Intents, sechs Protocol Operations, 17 Integrity Checks, zehn Stages,
zehn Capzustände, 20 Cleanupchecks und ein öffentlicher Export. Ein fehlender
Intent ergibt nur bei sicher nie aktivierter Ressource `zero/match`, sonst
`zero/unproven`; ein Intent ohne belegbaren Sendestatus ergibt
`unknown/unproven`, ein gültiger Sende-Ack `one/match` und mindestens zwei
bestätigte Sende-Acks `multiple/mismatch`. Insbesondere beweist eine fehlende
Session-ID nach möglicherweise oder bestätigt gesendetem Attach keine
geschlossene Session; auch Connection-Close ohne korrelierten Detach-Erfolg ist
kein Closure-Beweis. Diese sendzustandsabhängige Trennung gilt symmetrisch für
Attach/Detach und Network.enable/Network.disable.

`candidateObserverGate: PASS` und PASS-spezifische Findings bleiben über die
öffentliche Foundation-API konstruktiv unerreichbar; öffentliche
Foundationresultate können nur `FAIL/observer-invalid` oder
`UNPROVEN/inconclusive` enthalten. Private hypothetische PASS-Ableitungen dürfen
im späteren Implementierungsslice ausschließlich über die beschlossene
temporäre Kopie der exakten Produktionsquellbytes geprüft werden. Ein exakt
einmal passender lexikalischer Anker darf nur testlokale Exports ergänzen; die
Kopie wird seriell importiert, im `finally` entfernt und ihre Entfernung
bestätigt. Sie bleibt `NOT_EVIDENCE`; die öffentliche Original-API muss die
PASS-Unerreichbarkeit zusätzlich black-box belegen. Das Foundationmodul ist
weiterhin nicht implementiert. Der nächste Slice ist ausschließlich seine
getrennte vollständig netzwerkfreie Effects-as-Data-Foundationimplementierung;
eigener Adapter-ADR, getrennte Adapterimplementierung und sichtbarer
Diagnoselauf bleiben nachgelagert. ADR 0029, sein Evidence-Record,
`overallGate: FAIL` und `causeStatus: CAUSE_NOT_PROVEN` bleiben unverändert.

ADR 0033 wurde am `2026-09-03` angenommen, ersetzte ADR 0032 formal und ist am
`2026-09-04` durch ADR 0034 ersetzt worden. Sein bytegleicher Hauptteil ab
`## Kontext` bleibt historische Entscheidungsebene; seine durch ADR 0034 nicht
ausdrücklich korrigierten Regeln gelten fort. ADR 0032 bleibt mit bytegleichem
Hauptteil ab `## Kontext` als historische Entscheidungsebene erhalten. Der
unabhängige Daybreak-Blue-Abschlussreview des tatsächlichen vollständigen
Working-Tree-Diffs endete mit `PASS – keine Findings`; sämtliche Nach-PASS-
Prüfungen bestanden. Die damalige Annahme implementierte weder Foundation noch
Tests und autorisierte weder Adapter noch Runtimevorgang. Im damaligen
ADR-0033-Stand sollte als Nächstes der getrennte vollständig netzwerkfreie
Effects-as-Data-Foundationimplementierungsslice folgen. Nach der Annahme von
ADR 0034 ist dieser Foundationimplementierungsslice nun der nächste Schritt.
Eigener
Adapter-ADR, getrennte Adapterimplementierung und sichtbarer Lauf bleiben bis
zu ihrer jeweiligen späteren Entscheidung beziehungsweise Autorisierung
geschlossen.

Factoryfehler des durch ADR 0034 fortgeltenden ADR-0033-Modells sind
ausschließlich synchrone statische Dependency-`TypeError`s ohne API, Promise
oder Result; `runBinding`
wird vollständig in der Factory kopiert. Nach erfolgreicher Factory liefert
jeder kontrollierte Runpfad ein lokales Promise ohne synchronen Throw. Nur der
erste Owner erhält den Capabilitytransfer; falsche Erst-Arity terminalisiert
ohne Effekt, Zweit-, Parallel- und Reentranzaufrufe bleiben inert.

Das durch ADR 0034 fortgeltende ADR-0033-Modell bindet das
`currently-observable-local-native-promise-profile` samt offenem
hostabhängigem Rejectionrest, die Lease `idle | observable-pending |
settlement-unobservable | closed` und den unterdrückenden Pending-Join. Erst
kontrollierter Handlerzutritt ist `observed-settlement` und gibt die Lease zu
`idle` frei. Synchroner `exchange`-Throw, malformed Promise-Kandidat,
Promiseprofil-Reflectionthrow oder native-Then-Throw vor Handlerzutritt setzt
mit höchster Präzedenz `lease: closed`, `portState: closed`,
`activeCapability: null`, `affectedCapState: terminal-unknown` und
`furtherExchangeCount: zero`; `activeExchange` wird gelöscht, und Cancel,
Retry sowie jeder Folge-Exchange sind verboten. Das Modell
totalisiert die intent-spezifische Evaluate-Rejection mit unbekannten Send-,
Reply-, Main-World-, Factory- und Transportcounts,
`productEvidenceComplete: false`, `truncated` und `publicSettlement: null`.
Die controllerabgeleiteten Factory- und Transportdomains lauten
`zero | one | unknown`; `unknown` ist nie callerlieferbar.
Danach ist genau ein Cancel zulässig: exakter Ack ergibt `cancelled`,
beobachtete Rejection oder malformed Ack `terminal-unknown` plus
`cleanupViolation`, unobservables Settlement das vollständige Closed-Tupel mit
lokalem portlosem Cleanup ohne zweiten Cancel oder Exchange, und ein gültiges
pending Cancel hält den Run pending; zweiter Evaluate-Send
und Capture-Dequeue bleiben verboten. Ebenfalls gebunden sind
Capture-Connection-Close, der Capzustand `fired`, der nach `O0`
unveränderliche Observation-Snapshot sowie die getrennten Cleanup-Purposes
und der Completion-Clock-Sample nach Cap-Cancel. Nur exakter Cancel-Ack erlaubt
ihn. Jeder nicht vollständig gültige Completion-Sample erzwingt
`relativeMilliseconds: null` und `timingState: unavailable`; kein provisorisches
Timing bleibt erhalten, und `receiptOrder` ist kein Timingbeweis. Unverändert bleiben exakt 59
Replayvergleiche, 20 Cleanup-IDs, `NOT_EVIDENCE`, beide Autorisierungen
`false`, das ADR-0029-`overallGate: FAIL` und
`causeStatus: CAUSE_NOT_PROVEN`.

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
