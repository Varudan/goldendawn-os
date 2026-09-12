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
| [0034](0034-browser-sync-transport-diagnostic-foundation-grammar-derivation-and-testability-boundary.md) | BrowserSyncTransport Diagnostic Foundation Grammar, Derivation and Testability Boundary | Ersetzt |
| [0035](0035-browser-sync-transport-diagnostic-foundation-join-and-internal-transition-testability-boundary.md) | BrowserSyncTransport Diagnostic Foundation Join and Internal Transition Testability Boundary | Angenommen |
| [0036](0036-browser-sync-transport-runtime-diagnostic-adapter-boundary.md) | BrowserSyncTransport Runtime Diagnostic Adapter Boundary | Angenommen – 2026-09-12, ausdrücklich durch Jan |
| [0037](0037-browser-sync-transport-diagnostic-foundation-observation-close-notification.md) | BrowserSyncTransport Diagnostic Foundation Observation-Close Notification | Angenommen |

Der unabhängige Astra-Review hat die R1–R4-Dokumentkorrektur von ADR 0036
im eng begrenzten Dokumentationsscope mit PASS abgeschlossen. Er gilt nur für
die dort gebundenen Rohbytes, nicht für ausgeführte Adapter-/Testkopiennachweise.
ADR 0036 blieb nach diesem damaligen Review vorgeschlagen und nicht annahmereif. Der unabhängige
dokumentarische Review von ADR 0037 ist ohne Befund mit PASS abgeschlossen;
Jan hat ADR 0037 am 2026-09-08 ausdrücklich angenommen.

[ADR 0037](0037-browser-sync-transport-diagnostic-foundation-observation-close-notification.md)
entscheidet `D_K4` als gezielte Ergänzung von ADR 0035 und ersetzt keinen ADR
formal. Die getrennt implementierte netzwerkfreie Foundation besitzt nun exakt
die beiden erforderlichen Portrollen `{ exchange, observationClosed }`. Die
synchrone Notification wird genau einmal unmittelbar nach `O0` und vor Cleanup
konsumiert, auch nach Exchange-Portschluss; Fehler und interne Reentranz
behalten sticky `FAIL`-Präzedenz. Der vorhandene Testexportzugang v2 bleibt
unvergrößert.

Die fokussierte Suite besteht mit 595/595 Tests (`Δ = 173`), darunter sieben
Notification-Fallklassen, 27 neue Notificationmutanten und vier
Deadlinevarianten. Die 18 Joinfälle und das Drei-Microtask-Präfix samt
strukturellem Pending-Oracle bleiben erhalten. Transport-, Service-/Transport-
und sechs Sync-Suites bestehen mit 423/423, 466/466 und 735/735 Tests, die
vollständige serielle Suite mit 2350/2350, exakt `1755 + 595`; alle Läufe haben
0 Fehlschläge, Cancellations, Skips und Todos. Der Build transformiert exakt
46 Module, der Bundlecheck ist driftfrei. Der rohe Schutz-/Hashaudit bestätigt
die unveränderten übrigen 14 gebundenen Dateien, alle ADRs, Evaluation und
Frontendmanifest; die neuen Foundation-/Testhashes stehen im
[Changelog](../../CHANGELOG.md).

Der unabhängige Daybreak-xhigh-Implementierungsreview ist mit gebundenem PASS
abgeschlossen; Jan hat die geprüften neun Fassungen anschließend unverändert
in `799e23e2f122ec2df3262af28a883616a8120327` committet. Der Review galt
ursprünglich HEAD `4dc4d6f98e0d4dd0418544b286fd1bb204597f55` plus diese
neun uncommitteten Dateien. Alle neun Berichthashes treffen die Featureblobs;
die genaue [Reviewprovenienz in ADR 0036](0036-browser-sync-transport-runtime-diagnostic-adapter-boundary.md#kontext)
überträgt das PASS weder auf den späteren Commit noch auf diesen Docs-Diff.
Die oben genannten Regressionen und Gesamttests sind Nachweise des
ADR-0037-Implementierungsslices, keine hier erneut ausgeführte Gesamtsuite.
Der Foundationabgleich von ADR 0036 ist dokumentiert. Der von Jan als
Chatbericht übermittelte unabhängige Daybreak-Blue-Latest-/xhigh-Dokumentreview
ist mit gebundenem `PASS` ohne Befund abgeschlossen. Er gilt ausschließlich
für die acht im [Changelog](../../CHANGELOG.md) gebundenen Vorannahmefassungen,
nicht für die vollständigen Hashes dieser Statusnachführung. Der frühere
R1–R4-Review bindet weiterhin ausschließlich seine damaligen ADR-0036-Bytes.
Jan hat ADR 0036 anschließend am 2026-09-12 ausdrücklich angenommen. Die
Adaptergrenze ist entschieden; Adapter und Adaptertests sind weder implementiert
noch ausgeführt. Ihr eigener netzwerkfreier Implementierungs- und Testslice
benötigt einen gesonderten Auftrag. Dieser Auftrag endet nach Statusnachführung
und Verifikation; Git-Schritte bleiben manuell bei Jan. Authentisches
adapterseitiges `A_obs` sowie Lauf-, Browser-, E2E-, Writer- und
Persistenzfreigaben fehlen weiterhin.

ADR 0036 wurde am `2026-09-06` ausschließlich als dokumentarische
Adaptergrenze vorgeschlagen und am `2026-09-12` ausdrücklich durch Jan
angenommen. Er ergänzt ADR 0035 und ersetzt keinen ADR;
der nach R1–R4 korrigierte Vorschlag arbeitet K2 konstruktiv aus und hat den
begrenzten R1–R4-Dokumentreview bestanden. Die K4-Foundationentscheidung ist
durch ADR 0037 angenommen und getrennt netzwerkfrei implementiert und geprüft.
Der gebundene unabhängige Implementierungsreview und Jans unveränderter
Featurecommit sind abgeschlossen. Der ADR-0036-Foundationabgleich ist
dokumentiert; sein unabhängiger Dokumentreview ist mit gebundenem PASS
abgeschlossen.
Er implementiert oder autorisiert weder Adapter noch Tests, Loader, Parser, Queue, Timer, Launcher,
Recordfinalizer, Writer, Runtimekomposition oder Diagnoselauf.

Entschieden sind genau ein argumentloser import- und factory-inaktiver
One-shot-Adapterexport, ein byte-owned und ABA-gebundener Foundationload, der
Effects-Port für die sieben bestehenden Intents, ein exklusiver
Windows-Chrome-Debug-Pipe, NUL-Framing, fataler UTF-8-Decode, bounded
Duplicate-Key-Scanner, genau ein nativer JSON-Parse, eine totale FIFO sowie
die unveränderten sechs Commands und drei Caps. Ein Write-Ack beweist nur
vollständige lokale Frameannahme; Cleanup-Ack nur Schritteinreihung.

Korrigiert sind: Dequeue liest keine Clock, der nachgelagerte Foundation-
Clockintent liest genau einmal denselben Wert für Foundation und Adapterledger;
Setup/Cleanup verwenden `>=`, Capture nur das FIFO-`cap-fired`; bestätigte
Verletzung hat vor Evidenzdemotion und unabhängig von
`zero|unknown|multiple|one` Stimuli `FAIL/observer-invalid`-Präzedenz. K2 ist
über zwei disjunkte temporäre Vier-Export-Kopien konstruktiv ausgearbeitet und im begrenzten R1–R4-Dokumentationsscope geprüft. `derivation-conformance` öffnet Factory plus
Gate/Finding/Finalizer und sperrt den Factoryselector synchron vor Owner, API,
Promise oder Hostzugriff. `virtual-runtime-conformance` öffnet Factory plus
produktiven Owner, vollständige Producer-Eventgrenze und einmaligen virtuellen
Capabilityinstaller. Das Capabilityprofil umfasst Entropie mit getrennten
17-/15-Byte-Reads, Clock, Process-/Environment-/Runtimequellen, Scheduler,
Pipe, Launcher und geschlossene Ressourcenoperationen; mutable Bytes, opaque
Handles, Raw-Fixtureevents und Foundationwerte sind getrennt. Beide bleiben
`adapterEvidenceEligible:false`; Selector-Poison- und Wiringmutanten sind
verpflichtende spätere Solltests. Der vorhandene ADR-0035-Testexportzugang v2
bleibt unter ADR 0037 unvergrößert.

Adaptertests bleiben am Raw-Byte-/Producerpfad und prüfen Setup/Cleanup an
`deadline-1`, `deadline`, `deadline+1`, Capture nur ereignisbasiert,
gemeinsames Clock-Sample und Materialfreigabe. Der JSON-Pfad erzeugt keine
Getter-/Proxy-Envelopes. Der getrennte ADR-0037-Foundation-Slice schließt die
bisherige Deadline-Nachweislücke: Setup und Cleanup zählen `get`,
`getPrototypeOf`, `ownKeys` und `getOwnPropertyDescriptor` am Dequeue-Envelope
getrennt. Bei `deadline-1` wird Reflection positiv erreicht; bei `deadline`
und `deadline+1` bleiben alle vier Traps null. Vier kausale Deadlinevarianten
werden erkannt; dieser Foundationnachweis ersetzt keine späteren Adaptertests.

Der Adapter baut die neun `runBinding`-Felder und alle 59 Replayoperanden
selbst, bindet Launcher und Ressourcen identitätsgebunden und leitet einen
exakt 17-feldrigen Finalrecord erst nach terminalem Cleanup frisch aus der
unveränderten Foundationprojection und seinem eigenen Ledger ab. Freie
Callerwerte, Fake-Provenienz und positive `cleanup-fact`-Booleans sind keine
Evidenz. Ein Writer und Persistenz bleiben eine getrennte spätere Grenze.

Der rohe Gateway-Port-Environmentwert ist exakt der Vier-Codeunit-String
`8787`; ausschließlich Replayoperand 53 erhält die separate Sechs-Codeunit-
Projektion mit umgebenden U+0022. Trimmen, Double-Wrap und
Ziffernormalisierung sind verboten.

Die angenommene Node-Core-Grenze besitzt weder einen Windows-Job-Owner für
Prozessnachfahren noch eine handle-relative, nicht folgende Deleteprimitive.
Nach möglichem Spawn oder Create bleiben die betroffenen Cleanupchecks daher
`UNPROVEN`; ein Root-Childexit oder Pfad-Vorcheck bestätigt keinen Erfolg.

`browser.engineBuild`, globale Portfreiheit, effektive Proxy-/VPN-/Policy-/
Extension-/Permission-/Service-Worker-/Cachewerte und unabhängige
Adapterattestierung bleiben ohne authentische Quelle ausdrücklich
`UNPROVEN`. Es gibt keinen siebten CDP-Command, Probe-Listener, zweiten Timer
oder Standardimport als vorgetäuschten ABA-Nachweis. ADR-0029-`overallGate:
FAIL`, `causeStatus: CAUSE_NOT_PROVEN`, geschlossene Browserkomposition und
fehlendes Browser-End-to-End bleiben unverändert.

Einzelne Cancelpayloads und spätere Projektionen tragen keine O0-Phasenbindung;
daraus folgt weder Injektivität noch Nicht-Injektivität der vollständigen
öffentlichen Historie. Der beschlossene bounded syntaktische Tracker kann
unter seinem Spiegelungsverbot keinen authentischen Pre-Cleanup-Zeitpunkt für
alle Pfade auswählen; ein Promisezaun kommt für Old-Cap und portlosen
Pre-Cleanup zu spät. Als minimale eindeutige Phasenbindung unter den
bestehenden Architekturgrenzen gewählt ist `D_K4`: genau eine
synchrone argumentlose und einmalige
`effectPort.observationClosed()`-Notification unmittelbar nach `O0` und vor
jedem Cleanup. Sie ist kein achter Intent, trägt keine Ursache und ist kein
informationstheoretischer Notwendigkeitsbeweis. Die sieben Fallklassen beachten
Portschluss vor `O0` bei unbeobachtbaren Observationfehlern, Old-Cap-Scan nach
`O0` und Cleanup-Ledger vor `cleanup-origin`. Die Entscheidung ist durch ADR
0037 angenommen und inzwischen getrennt mit 595/595 fokussierten Tests
implementiert und geprüft. Der gebundene unabhängige Implementierungsreview und Jans unveränderter
Featurecommit sind abgeschlossen. Der ADR-0036-Foundationabgleich ist
dokumentiert; sein unabhängiger Dokumentreview ist mit gebundenem PASS
abgeschlossen und Jan hat ADR 0036 anschließend am 2026-09-12 ausdrücklich
angenommen. Adapterimplementierung und Adaptertests fehlen weiterhin; ihr
eigener netzwerkfreier Slice benötigt einen gesonderten Auftrag.

ADR 0035 ist am `2026-09-05` angenommen, ersetzt ADR 0034 formal und keinen
weiteren ADR. ADR 0034 bleibt mit bytegleichem Hauptteil ab `## Kontext` als
historische Entscheidungsebene erhalten. Sämtliche durch ADR 0035 nicht
ausdrücklich korrigierten Regeln aus ADR 0034, ADR 0033 und ADR 0032 gelten
fort.

ADR 0035 adressiert den verbliebenen Testbarkeitswiderspruch des privaten
Pending-Joins mit der geschlossenen Testkopie v2. Genau eine zusätzliche
Exportdeklaration der bytegenauen, eindeutig benannten temporären `.mjs`-Kopie
öffnet nur die reinen Arity-1-Ableitungen `deriveCandidateObserverGate` und
`deriveCandidateFinding`, den produktiv verwendeten zustandsbehafteten
Arity-1-Konstruktor
`createBrowserSyncTransportRuntimeDiagnosticRunMachine` und die
zustandsbehaftete Arity-2-Grenze
`requestBrowserSyncTransportRuntimeDiagnosticExchange`, durch die alle sieben
Intents laufen. Damit prüft dieselbe Run-Machine ihre aktive Lease ohne
fünften Inspector-, Debug- oder Produktionsseam. Bei
`lease: observable-pending` stoppt die Grenze den zweiten internen Exchange vor
jeder Intent-, ID-, Count-, Ledger-, Cap-, Snapshot-, Cleanup-, Port- oder
Capabilitymutation beziehungsweise -anwendung. Originalmodul und öffentliche
API behalten exakt einen Export; die Kopie wird seriell über ihre kanonische
`file:`-URL importiert. Kopien und Ergebnisse bleiben `NOT_EVIDENCE` und
werden im `finally` entfernt.

Die spätere dynamische Matrix prüft `prestart`, `observation` und `cleanup`
jeweils gegen genau einen ausstehenden Exchange. Delta-Assertions belegen null
zusätzliche Intents, IDs, Port-, Send- und Capabilityaufrufe; nur
`pendingInternalExchangeViolation` erhält die Phase. Der finite Teil umfasst
exakt 18 Fälle: drei Maschinenphasen mal `fulfillment|rejection` mal
`pre-invocation|synchronous-post-invocation|observable-pending`. Ein bereits
vor dem Capabilityaufruf gesetteltes, unmittelbar nach dem ersten Rücksprung
gesetteltes oder bis nach dem zweiten Aufruf pending gehaltenes Promise wird
jeweils ohne Yield synchron vor Handlerzutritt mit dem zweiten Boundaryaufruf
verbunden; Settlement allein verändert die Lease nicht. Danach schließen die
Handler Lease und Port ohne Lesen von Payload oder Grund und leiten die
phasengenauen Prestart-, Observation- und Cleanupfolgen ab. Das davon getrennte
Forever-pending wird ausschließlich aus einer endlichen Präfixprobe mit exakt drei
Microtask-Checkpoints und einer vollständigen Transitionstabelle geschlossen;
das ist kein empirischer Unendlichkeitsbeweis und verwendet weder Uhr, Timer,
Timeout noch `Promise.race`. Getrennte kontrollierte Mutanten müssen unter
anderem einen entfernten oder verspäteten Guard, zweite Port- oder
Capabilityaufrufe, künstliches Settlement, vorzeitiges `O0` oder Cleanup,
verlorene Phasenklassifikation und die Mutation des eingefrorenen `O0`
aufdecken, ohne den Produktionssource zu verändern.

Ebenfalls verbindlich für den späteren Implementierungsslice sind drei über
den öffentlichen Effects-as-Data-Port prüfbare Regressionen: Die mit dem ersten
Endpoint-Request initialisierte Network-Clock prüft über
`lastValidBrowserNetworkTimestamp` vor jeder Stage-, Count-, Timing- oder
Sequenzmutation Endlichkeit, Nichtnegativität, sichere Umrechnung und Monotonie,
erlaubt Gleichheit und
erkennt insbesondere `10 → 12 → 11`; `NaN`, `Infinity` und unsicherer
Millisekundenüberlauf sind Pflichtfälle. Eine unkorrelierte Endpoint-Response
bei gebundener Session und exakter URL lässt nach fehlender
Request-ID-Korrelation keine unnötigen Status-, Timestamp-, Header- oder
Bodylesevorgänge zu, erfindet weder Count noch ID und hält Attribution sowie
`requestBudget.sequence` ohne künstliches `V` sticky `ambiguous`; eine spätere
korrelierte Response heilt dies nicht. Eine wohlgeformte doppelte
`Target.getTargets`-Antwort verändert weder den einzigen Send-Ack noch dessen
Operationsergebnis `one/match`: vor Evaluate folgt
`U/setup-terminal-unproven`, während Capture bleibt der Candidate bis `C`
`UNPROVEN/inconclusive`; nur eine malformed routbare Dublette vor `O0` bleibt
`V/FAIL/observer-invalid`.

ADR 0035 implementierte oder autorisierte aus sich heraus weder Foundation
noch Tests, Adapter oder Runtimevorgang; in seinem Entscheidungsslice wurden
keine Tests ergänzt. Der danach getrennt autorisierte Effects-as-Data-
Foundationimplementierungsslice ist inzwischen um ADR 0037 erweitert und
mit 595/595 fokussierten Tests netzwerkfrei geprüft. ADR 0036 ist als nach
R1–R4 korrigierte dokumentarische Adaptergrenze am 2026-09-12 ausdrücklich durch Jan angenommen; seine K2-Konstruktion
ist im begrenzten R1–R4-Dokumentationsscope geprüft. Die
`D_K4`-Foundationentscheidung ist durch ADR 0037 angenommen und umgesetzt.
Der gebundene unabhängige Implementierungsreview und Jans unveränderter
Featurecommit sind abgeschlossen. Der ADR-0036-Foundationabgleich ist
dokumentiert; sein unabhängiger Dokumentreview ist mit gebundenem PASS abgeschlossen.
Adapterimplementierung, Adaptertests und sichtbarer Diagnoselauf bleiben
geschlossen. ADR 0029, sein
Evidence-Record, `overallGate: FAIL` und
`causeStatus: CAUSE_NOT_PROVEN` bleiben unverändert. Schema, öffentliche API
und bestehende Kardinalitäten bleiben ebenfalls unverändert; öffentlich
bleiben nur `FAIL/observer-invalid` und `UNPROVEN/inconclusive` erreichbar,
Candidate-`PASS` und PASS-spezifische Findings unerreichbar.

ADR 0034 wurde am `2026-09-04` angenommen und ersetzte ADR 0033 formal. Alle
nicht ausdrücklich korrigierten Regeln aus ADR 0033 und ADR 0032 gelten fort;
ADR 0033 bleibt mit bytegleichem Hauptteil ab `## Kontext` historische
Entscheidungsebene.
ADR 0034 ersetzte keinen weiteren ADR. Prototyp-, ASCII-, Zeitzonen- und
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
`UNPROVEN/inconclusive` enthalten. Private hypothetische PASS-Ableitungen durften
im späteren Implementierungsslice ausschließlich über die beschlossene
temporäre Kopie der exakten Produktionsquellbytes geprüft werden. Ein exakt
einmal passender lexikalischer Anker darf nur testlokale Exports ergänzen; die
Kopie wird seriell importiert, im `finally` entfernt und ihre Entfernung
bestätigt. Sie bleibt `NOT_EVIDENCE`; die öffentliche Original-API belegt die
PASS-Unerreichbarkeit zusätzlich black-box. Das Foundationmodul ist inzwischen
getrennt netzwerkfrei implementiert, um ADR 0037 erweitert und mit 595/595
fokussierten Tests geprüft. Im damaligen angenommenen ADR-0034-Stand sollte ausschließlich diese
Effects-as-Data-Foundationimplementierung folgen; ADR 0035 hat zuvor die
interne Join-Testbarkeit adressiert und ADR 0034 formal ersetzt. ADR 0034 bleibt
mit bytegleichem Hauptteil ab `## Kontext` historische Entscheidungsebene.
ADR 0036 ist als eigener nach R1–R4 korrigierter Adapter-ADR am 2026-09-12 ausdrücklich durch Jan angenommen.
Seine K2-Konstruktion ist im begrenzten R1–R4-Dokumentationsscope geprüft. Die
für K4 notwendige synchrone Foundationnotification unmittelbar nach `O0` ist
durch ADR 0037 angenommen, implementiert, unabhängig mit gebundenem PASS
geprüft und durch Jan unverändert committet. Der Foundationabgleich ist
dokumentiert; sein unabhängiger Dokumentreview ist mit gebundenem PASS abgeschlossen.
Adapterimplementierung, Adaptertests und sichtbarer Diagnoselauf bleiben geschlossen. ADR
0029, sein Evidence-Record,
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
Effects-as-Data-Foundationimplementierungsslice folgen. Auch im angenommenen
ADR-0034-Stand war dieser Foundationimplementierungsslice der vorgesehene
nächste Schritt; ADR 0035 hat zuvor die verbliebene Testbarkeitslücke
adressiert und ADR 0034 inzwischen formal ersetzt. ADR 0036 entscheidet seit
Jans ausdrücklicher Annahme am 2026-09-12 die Adaptergrenze. Getrennte
Adapterimplementierung und sichtbarer Lauf bleiben bis zu ihrer jeweiligen
gesonderten Autorisierung geschlossen.

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
