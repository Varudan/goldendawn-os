# Changelog

Dieses Changelog dokumentiert nachvollziehbare GoldenDawn-OS-Meilensteine.
Die Versionsnummern strukturieren den Projektfortschritt, sind aber keine
Zusicherung einer strikt semantischen Versionierung. Ein Eintrag allein
behauptet weder einen veröffentlichten Git-Tag noch ein veröffentlichtes
Release.

## Unveröffentlicht – v0.3.0 in Arbeit – ADR 0035 angenommen; ADR 0034 ersetzt; Chrome-Runtimegate FAIL

### BrowserSyncTransport Diagnostic Foundation Join and Internal Transition Testability Boundary – Entscheidung / ADR 0035

- ADR 0035 ist am `2026-09-05` angenommen und ersetzt ADR 0034 formal; kein
  weiterer ADR wird ersetzt. ADR 0034 bleibt mit bytegleichem Hauptteil ab
  `## Kontext` als historische Entscheidungsebene erhalten. Alle nicht
  ausdrücklich korrigierten Regeln aus ADR 0034, ADR 0033 und ADR 0032 gelten
  fort.
- Die geschlossene Testkopie v2 darf aus den bytegenauen Produktionsquellbytes
  in einer eindeutig benannten `.mjs`-Datei in einem aufgelösten
  Betriebssystem-Temporärverzeichnis außerhalb des Repositorys entstehen. Eine
  einzige lexikalisch eindeutige Exportdeklaration öffnet dort ausschließlich
  `deriveCandidateObserverGate` (Arity `1`, rein),
  `deriveCandidateFinding` (Arity `1`, rein),
  `createBrowserSyncTransportRuntimeDiagnosticRunMachine` (Arity `1`,
  zustandsbehafteter produktiver Factorypfad) und
  `requestBrowserSyncTransportRuntimeDiagnosticExchange` (Arity `2`,
  zustandsbehaftete einzige Grenze aller sieben Intents). So adressiert der
  Test dieselbe produktive Run-Machine und deren aktive Lease, ohne fünften
  Inspector-, Debug- oder Produktionsseam. Die Kopie wird ausschließlich über
  eine aus ihrem vollständig aufgelösten Pfad erzeugte `file:`-URL importiert;
  der öffentliche Originalpfad behält exakt
  einen Export.
- Die echte Exchange-Grenze unterdrückt bei `lease: observable-pending` einen
  zweiten internen Exchange vor Intentkonstruktion, Intent-ID-Erhöhung,
  Count-, Ledger-, Cap-, Snapshot- oder Cleanupmutation und vor jedem Port-
  oder Capabilityaufruf. Die dynamische Matrix treibt die normale Maschine
  getrennt in `prestart`, `observation` und `cleanup`, hält jeweils genau einen
  Exchange pending und belegt delta-basiert: keine zusätzlichen Intents, IDs,
  Port-, Send- oder Capabilityaufrufe. Ausschließlich
  `pendingInternalExchangeViolation` erhält die jeweilige Phasenklasse.
- Der finite Join-Nachweis umfasst exakt `3 × 2 × 3 = 18` Fälle aus den
  Maschinenphasen `prestart|observation|cleanup`, den Ausgängen
  `fulfillment|rejection` und den Zeitlagen `pre-invocation`,
  `synchronous-post-invocation` sowie `observable-pending`. Das Promise ist
  dabei vor dem Capabilityaufruf bereits gesettelt, wird unmittelbar nach dem
  synchronen Rücksprung der ersten Grenze gesettelt oder bleibt bis nach dem
  zweiten Boundaryaufruf pending. Der zweite Aufruf erfolgt stets im selben
  Turn ohne Yield vor Handlerzutritt; Settlement allein ist kein
  Maschinenübergang.
- Fulfillment und Rejection werden in allen 18 Fällen geprüft, ohne Payload
  oder Grund zu lesen. Danach sind Lease
  und Port geschlossen, `activeExchange` ist `null`, weitere Exchanges bleiben
  `zero` und lebende Caps werden `terminal-unknown`; die phasengenauen Folgen
  reichen vom statischen Prestartfehler ohne `O0` über sticky `V` und
  portlosen Observation-Cleanup bis zu unverändertem `O0`,
  `cleanupViolation: true` und `cleanup-terminal-failure` im Cleanup.
- Das von den 18 settelnden Fällen getrennte Forever-pending-Oracle kombiniert
  pro Phase eine endliche dynamische
  Präfixprobe mit exakt drei testlokalen Microtask-Checkpoints und die
  vollständige private Transitionstabelle. Nur gemeinsam belegen sie, dass es
  aus `observable-pending` ohne kontrollierten Handler keinen Fortschritts-,
  Snapshot-, Cleanup-, Terminalisierungs- oder Resolvepfad gibt. Es verwendet
  weder reale Uhr, Timer, Timeout noch `Promise.race`, lässt eine Zusatzprobe
  bis zum Testende pending und behauptet keine empirisch beobachtete
  Unendlichkeit.
- Der spätere mutationswirksame Nachweis lässt kontrollierte, von der
  unveränderten Konformitätskopie getrennte Mutanten insbesondere bei
  umgangenem oder verspätetem Join-Guard, zweitem Port-/Capabilityaufruf,
  künstlichem Run-Settlement, vorzeitigem `O0` oder Cleanup, verlorener
  Phasenklasse und Cleanupmutation des eingefrorenen `O0` scheitern. Mutanten
  verändern niemals den Produktionssource; alle Testkopien und Ergebnisse
  bleiben `NOT_EVIDENCE`, werden seriell importiert und im `finally`
  vollständig entfernt.
- Drei öffentliche Effects-as-Data-Regressionen werden für den späteren
  Implementierungsslice präzisiert: Die mit dem ersten Endpoint-Request
  initialisierte private Network-Clock
  `lastValidBrowserNetworkTimestamp` verlangt vor jeder Stage-, Count-, Timing-
  oder Sequenzmutation endliche, nichtnegative, sicher umrechenbare und
  monotone Werte, erlaubt
  Gleichheit, hält Timing am ersten Request gebunden und erkennt insbesondere
  `10 → 12 → 11`; `NaN`, `Infinity` und unsicherer Millisekundenüberlauf sind
  ebenfalls Pflichtfälle. Eine unkorrelierte Endpoint-Response bei gebundener
  Session und exakter URL macht Attribution und `requestBudget.sequence`
  sticky `ambiguous`, liest nach fehlender Request-ID-Korrelation keine
  unnötigen Responsefelder, erfindet weder Count noch ID und setzt ohne eigene
  Verletzung kein `V`; eine spätere korrelierte Response heilt die Unsicherheit
  nicht. Eine wohlgeformte doppelte `Target.getTargets`-Antwort lässt den
  bereits belegten einzelnen Send-Ack sowie das Operationsergebnis `one/match`
  unverändert: vor Evaluate folgt `U/setup-terminal-unproven`, während Capture
  bleibt der Candidate bis `C` `UNPROVEN/inconclusive`; nur eine malformed
  routbare Dublette vor `O0` bleibt `V/FAIL/observer-invalid`.
- ADR 0035 implementiert oder autorisiert weder Foundation noch Tests,
  Adapter oder Runtimevorgang. Es wurden keine neuen Tests ergänzt. ADR 0029,
  sein Evidence-Record, `overallGate: FAIL` und
  `causeStatus: CAUSE_NOT_PROVEN` bleiben unverändert. Schema, öffentliche API
  und die bestehenden Kardinalitäten bleiben unverändert; öffentlich bleiben
  ausschließlich `FAIL/observer-invalid` und `UNPROVEN/inconclusive`
  erreichbar, Candidate-`PASS` und PASS-spezifische Findings unerreichbar. Der
  nächste Schritt ist ausschließlich die getrennte netzwerkfreie Effects-as-
  Data-Foundationimplementierung samt fokussierter Tests; Adapter-ADR,
  Adapterimplementierung und sichtbarer Diagnoselauf bleiben geschlossen und
  nachgelagert.

### BrowserSyncTransport Diagnostic Foundation Grammar, Derivation and Testability Boundary – historische Entscheidung / ADR 0034

- ADR 0034 wurde am `2026-09-04` angenommen. Er ersetzte ADR 0033 formal und übernahm
  alle nicht ausdrücklich korrigierten Regeln aus ADR 0033 und ADR 0032; ADR
  0034 ersetzte keinen weiteren ADR. ADR 0033 bleibt mit bytegleichem Hauptteil
  ab `## Kontext` als historische Entscheidungsebene erhalten.
- Schema, API und Kardinalitäten bleiben unverändert:
  `createBrowserSyncTransportRuntimeDiagnosticObserver({ effectPort,
  runBinding })`, `schemaVersion: 1`, 17 Rootfelder der
  `FoundationProjection`, 59 Replayvergleiche, sieben Effects-Intents, sechs
  Protocol Operations, 17 Integrity Checks, zehn Stages, zehn Capzustände, 20
  Cleanupchecks und ein öffentlicher Export.
- ADR 0034 totalisiert die geschlossenen lokalen Prototyp-,
  Frische- und Deep-Freeze-Grammatiken, `printable-ascii-v1`,
  `iana-shaped-ascii-time-zone-v1`, Core-SemVer sowie die privaten I1–I8-,
  Replay-, Observerfeld-, Protocol-Operation-, Integrity-, Stage-, Hash- und
  Cleanupableitungen.
- Operations- und Ressourcenstatus werden sendzustandsabhängig getrennt: Ein
  fehlender Intent ergibt nur bei konstruktiv sicher nie aktivierter Ressource
  `zero/match`, sonst `zero/unproven`; ein Intent ohne belegbaren Sendestatus
  ergibt `unknown/unproven`, exakt ein gültiger Sende-Ack `one/match` und
  mindestens zwei bestätigte Sende-Acks `multiple/mismatch`. Eine fehlende
  Session-ID beweist nach möglicherweise oder bestätigt gesendetem
  `Target.attachToTarget` niemals eine geschlossene Session. Nur
  sicher nie gesendetes Attach erlaubt `targetSessionClosed: confirmed` und
  Detach `zero/match`; ohne bindbare Session bleiben beide unbewiesen, ein
  korrelierter exakter Detach-Erfolg bestätigt den Abschluss. Connection-Close
  ohne diesen Erfolg bestätigt ihn nicht. Dieselbe epistemische Trennung gilt
  symmetrisch für `Network.enable`, `Network.disable` und
  `networkDomainClosed`: Sicher nie gesendetes Enable bestätigt den
  Domainabschluss mit Disable `zero/match`; möglicherweise oder bestätigt
  gesendetes Enable bleibt ohne korrelierten
  exakten Disable-Erfolg unbewiesen. Bei gebundener Session und sicher nie
  gesendetem Enable bleibt der Detachversuch erforderlich.
- `candidateObserverGate: PASS` und PASS-spezifische Findings bleiben über die
  unveränderte öffentliche API konstruktiv unerreichbar; öffentliche
  Foundationresultate können nur `FAIL/observer-invalid` oder
  `UNPROVEN/inconclusive` enthalten. Die vollständigen privaten hypothetischen
  PASS-Ableitungen dürfen später ausschließlich über die beschlossene
  temporäre Kopie der exakten Produktionsquellbytes geprüft werden. Ein exakt
  einmal passender lexikalischer Anker darf nur testlokale Exports ergänzen;
  ausschließlich diese Kopie wird seriell importiert, im `finally` entfernt
  und ihre Entfernung bestätigt. Kopie und Ergebnisse bleiben `NOT_EVIDENCE`,
  permanente Testexports oder manipulierte öffentliche PASS-Projections
  unzulässig; die öffentliche Original-API muss die PASS-Unerreichbarkeit
  zusätzlich black-box belegen.
- Netzwerkfreiheit gilt für Foundationmodul, neue fokussierte Tests, Effects
  und jeden Diagnoselauf dieses Slices. Nur die unveränderte vollständige
  Repository-Regressionsprüfung darf ihre bestehenden kurzlebigen
  Loopback-Fixtures `tests/localSyncGatewayHttpServer.test.js` und
  `tests/n8nCloudIngressProbe.test.js` ausführen; neue, externe oder
  diagnostische Netzwerkaktivität bleibt verboten.
- ADR 0034 implementiert oder autorisiert weder Foundation, Tests, Adapter noch
  Runtimevorgang. ADR 0029, sein Evidence-Record, `overallGate: FAIL` und
  `causeStatus: CAUSE_NOT_PROVEN` bleiben unverändert. Die Foundation ist
  weiterhin nicht implementiert. Im angenommenen ADR-0034-Stand sollte als
  Nächstes ausschließlich ihre getrennte netzwerkfreie Implementierung folgen;
  ADR 0035 hat zuvor die verbliebene Testbarkeitslücke adressiert und ADR 0034
  inzwischen formal ersetzt. ADR 0034 bleibt mit bytegleichem Hauptteil ab
  `## Kontext` historische Entscheidungsebene. Adapter-ADR,
  Adapterimplementierung und sichtbarer Diagnoselauf bleiben nachgelagert.

### Historischer Stand: BrowserSyncTransport Diagnostic Foundation Effects Protocol Boundary – Entscheidung / ADR 0033

- ADR 0033 am `2026-09-03` als reinen Dokumentations- und Entscheidungsslice
  angenommen. Er ersetzt ADR 0032 formal und übernimmt alle dortigen Regeln,
  die er nicht ausdrücklich korrigiert. ADR 0032 bleibt mit seinem
  unveränderten Hauptteil ab `## Kontext` als historische Entscheidungsebene
  erhalten. ADR 0029, sein
  Evidence-Record, `overallGate: FAIL` und `causeStatus: CAUSE_NOT_PROVEN`
  bleiben unverändert.
- Die einzige spätere API auf
  `createBrowserSyncTransportRuntimeDiagnosticObserver({ effectPort,
  runBinding })` begrenzt: Factory-Arity `1`, geschlossene Options- und
  Portform, keine Realdefaults oder Factoryeffekte. Factoryfehler sind nur
  synchrone statische Dependency-`TypeError`s ohne API, Promise oder Result;
  `runBinding` wird dort vollständig kopiert. Die erfolgreiche Factory liefert
  eine frische tief eingefrorene `{ run }`-API; jeder kontrollierte Runpfad
  liefert ein lokales Promise und wirft nicht synchron. Der erste Run wird vor
  Arityprüfung alleiniger Owner; bei gültiger Arity erfolgt der atomare
  Transfer `capturedExchange -> activeExchange`. Falsche Erst-Arity
  terminalisiert ohne Effekt, Nicht-Owner-Aufrufe erhalten isolierte statische
  Fehler-Promises ohne Slot-, Zähler-, Effekt- oder Cleanupzugriff.
- Das pauschale Referenzverbot präzisiert: Genau die einmal
  descriptorbasiert aus `effectPort.exchange` gelesene Funktionsreferenz darf
  zeitlich disjunkt in `capturedExchange`, dann `activeExchange` gehalten
  werden. Der Container wird verworfen; Owneraufrufe verwenden nur erfasstes
  Apply, `undefined` und ein Frozen Intent. Der Owner löscht nach dem letzten
  Exchange und vor Resulterfüllung. Nicht-Owner verändern keinen Slot.
- Vier transiente Rollen geschlossen: aktueller Promise-Kandidat, aktueller
  Fulfillmentgraph jeder Ack-Art, unreflektierter Dequeuegraph während seines
  Clock-Samples und synchron benötigte allowlistete Nachfahr-/Descriptor-/
  Prototypreferenzen. Nur die festgelegte Clock-Überlappung ist zulässig;
  Nullstellen-Rejectionhandler lesen keinen Grund und der Folgepromise wird
  nicht gespeichert. Keine Inputreferenz erreicht Result, Projection,
  Snapshot oder Ledger.
- Den einzigen Effectport auf sieben geschlossene Intentarten totalisiert:
  `capability-probe`, `controller-clock-sample`, `cap-arm`, `cap-cancel`,
  `protocol-command-send`, `observation-dequeue`, `cleanup-step`. Für jeden
  Kandidaten gilt allein
  `currently-observable-local-native-promise-profile` mit exact-once OwnKeys-,
  Prototyp-, Constructor-, Species- und Then-Descriptorprüfung sowie genau
  einer erfassten nativen `then`-Anwendung. Daraus folgen keine Same-Realm-,
  Erzeugungsrealm-, Constructor-, Subclass-, Native- oder
  Proxyfreiheitsbehauptungen. Nullstellige Rejectionhandler lesen keinen Grund
  und geben wie Fulfillmenthandler nur `undefined` zurück.
- Statische Redaction ausdrücklich auf Foundation-kontrollierte Resultate und
  Handler begrenzt. Ein vor Handlerinstallation profilwidriges bereits oder
  später rejected Promise kann getrennt einen hostabhängigen
  `unhandledrejection`-/`unhandledRejection`-Restkanal mit Originalgrund
  auslösen; Eintritt, Zeitpunkt, Häufigkeit, Inhalt und Prozessfortsetzung
  werden nicht behauptet.
- Die Exchange-Lease exakt als `idle | observable-pending |
  settlement-unobservable | closed` geschlossen; nur `idle` erlaubt einen
  Portaufruf. Erst kontrollierter Handlerzutritt ist `observed-settlement` und
  gibt sie vor dem intent-spezifischen Übergang frei. Synchroner
  `exchange`-Throw, malformed Promise-Kandidat, Promiseprofil-Reflectionthrow
  oder native-Then-Throw vor Handlerzutritt ist `settlement-unobservable` und
  setzt mit höchster Präzedenz `lease: closed`, `portState: closed`,
  `activeCapability: null`, `affectedCapState: terminal-unknown` und
  `furtherExchangeCount: zero`; `activeExchange` wird gelöscht, und Cancel,
  Retry sowie jeder Folge-Exchange sind verboten. Ein gültiges pending Promise
  hält den gesamten Run pending.
- Die Pending-Join-Regel vollständig gebunden: Ein intern angeforderter zweiter
  Exchange wird vor Intent, ID, Zähler und Portaufruf unterdrückt; nur das
  Original bleibt. Sein Settlement schließt ohne nutzbares `idle`-Fenster und
  ergibt je nach Phase statischen Pre-start-Fehler, `V` mit lokalem Cleanup
  oder nach dem Snapshot ausschließlich `cleanupViolation`. Fulfillment- und
  Dequeuegraph bleiben dabei ungelesen; Forever-pending bleibt pending.
- Alle erreichbaren kontrollierten Rejection-Tupel ausschließlich als
  `observed-settlement` phasenlokal geschlossen:
  Probe und Setup-Origin-Clock enden pre-start statisch; ein nach beobachteter
  Rejection oder malformed Ack bei wieder `idle` unklarer Setup-Arm erhält
  genau einen Best-effort-Cancel, ein unobservables Arm-Settlement setzt dagegen
  das vollständige Closed-Tupel und endet ohne Cancel oder Exchange. Setup-Send,
  Setup-/Capture-Dequeue-Clock, Setup-/Capture-Dequeue und Capture-Arm setzen
  während Observation zuerst ihren spezifischen `V`-Zustand und quieszenzieren
  danach einen bekannten Cap genau einmal vor `O0`. Beobachtete Cleanup-
  Rejections ändern ausschließlich Ledger und bei offenem Port sichere
  Folgeschritte; unobservable Settlements finalisieren portlos. Eine Rejection des bereits
  laufenden Cancels erzeugt keinen zweiten Cancel. Nur unmögliche interne Tupel
  dürfen den allgemeinen Catch-all erreichen.
- Capture-Arm-Fehler getrennt totalisiert: beobachtete Rejection oder malformed
  Ack setzt `V`, Evaluate `zero` und `activation-unknown` vor dem einmaligen
  Cancel. Ein bereits am Arm unobservables Settlement setzt das vollständige
  Closed-Tupel und `V`, verbietet Cancel und weitere Portaufrufe und führt
  unmittelbar zu `O0` mit lokalem portlosem Cleanup; pending bleibt
  pending.
- `runBinding` auf neun feste Felder und exakt 59 kanonische Replayoperanden
  begrenzt. Historische Werte, Vergleichsbasis, Status, Gates, Findings,
  Counts, Provenienz, IDs und Evaluationbytes bleiben privat. ADR und Living
  Contract schreiben für alle 59 Felder Basis, historischen Wert, Typgrenze,
  Projektion und Cross-Field-Invarianten aus.
- `attemptStarted` erst nach positiver Capabilityprobe, gültigem `m_setup`,
  sicherer Setupdeadline, bestätigtem Setupcap und eingefrorener Stage 1
  festgelegt. Fehler davor erzeugen nur den statischen Foundationfehler ohne
  Projection, Snapshot oder Cleanup; bestätigte Verstöße nach
  `attemptStarted` und vor `O0` sind sticky `V`, danach bleibt der Snapshot
  unverändert und nur Cleanup darf noch fehlschlagen.
- Exact-once-Reflection für jeden geschlossenen Inputknoten, Arrayindex und
  alle allowlisteten offenen CDP-Descriptoren festgelegt; freie Propertyreads,
  Rereads, Destructuring, Spread, `hasOwn` und Inputmutation bleiben verboten.
- Den Capturecap zunächst pending gemacht und seine Aktivierung atomar allein
  an den Evaluate-Ack `sent-and-capture-cap-started` gebunden. Eine durch den
  kontrollierten Handler als `observed-settlement` beobachtete Evaluate-
  Exchange-Rejection setzt `lease: idle`, `closeClass: V` und
  `cap: activation-unknown`, beweist aber weder Send noch Nichtsenden,
  Aktivierung, Auswertung, Factory-, Transport- oder späteren Stimulus. Dann
  gelten exakt `controllerEvaluateIntentCount: one`,
  `Runtime.evaluate.observedCountClass: unknown`,
  `Runtime.evaluate.result: unproven`, `mainWorldEvaluationCount: unknown`,
  `transportFactoryCallCount: unknown`, `factoryCallCount: unknown`,
  `transportCallCount: unknown`, `evaluateReplyCountClass: unknown`,
  `productEvidenceComplete: false`, `captureWindowState: truncated` und
  `publicSettlement: null`.
- Nach dieser Evaluate-Rejection ausschließlich genau einen Cancel der
  gebundenen Arm-ID zugelassen: exakter Ack bewahrt `V` und ergibt
  `cancelled`; beobachtete Rejection oder malformed Ack ergeben
  `terminal-unknown` plus `cleanupViolation`; unobservables Settlement setzt
  das vollständige Closed-Tupel und erzwingt lokalen portlosen Cleanup ohne
  zweiten Cancel oder sonstigen Exchange; ein gültiges pending
  Cancel hält den Run pending. Zweiter Evaluate-Send und Capture-Dequeue sind
  ausgeschlossen. Der intern gebundene Rejectiondispatch über `{ phase,
  intentKind, intentId, capKind, capState }` besitzt Vorrang vor Capquieszenz,
  Snapshot und dem nur für unmögliche Tupel erlaubten Catch-all.
- Evaluate-Intent, bestätigten Send, Evaluate-Reply, Main-World-Auswertung,
  Factoryaufruf, Transportaufruf und Networkrequest getrennt. Die
  controllerabgeleiteten Domains von `factoryCallCount` und
  `transportCallCount` lauten `zero | one | unknown`; `zero` ist nur
  konstruktiv, `unknown` nie callerlieferbar. Ein unterdrückter Exchange
  erzeugt keinen Count, und ein ungelesener Ack bleibt `unknown`, nie
  `multiple`.
- Setup-, Capture- und Cleanupcap vor jeder Envelope-Reflection anhand roher
  Zeit totalisiert; Gleichheit gehört zum absoluten Cap und der Envelope bleibt
  dort ungelesen. Capture schließt nur durch das korrelierte Capereignis, nie
  durch `S && N`. Das erste Capture-Connection-Close ergibt
  `U/capture-terminal-unproven`, `truncated` und gleichnamigen
  `observationCloseReason`; bei aktivem Cap erfolgt dessen einmaliger Cancel
  vor dem Snapshot. Exakter Ack bewahrt `U`, beobachtete Fehler promovieren zu
  `V`; unobservables Settlement promoviert ebenfalls zu `V`, setzt aber das
  Closed-Tupel und lässt nach `O0` nur portlosen Cleanup zu. Pending hält den
  Run ohne Snapshot pending;
  Connection-Close und Cap folgen nur der Dequeue-Reihenfolge.
- Die Capzustände exakt als `absent | arm-pending | armed |
  pending-activation | active | activation-unknown | cancel-pending |
  cancelled | fired | terminal-unknown` festgelegt. Arm, Aktivierung,
  verarbeiteter Cap, falsche, frühe, späte und doppelte IDs sowie alle vier
  Cancelausgänge sind ohne Retry und mit höchstens einem Cancel je Arm total.
- Geschlossene Descriptor-, Ressourcen- und Networkgrenzen ergänzt:
  `targetInfos` 128, flüchtige IDs 256, CDP-URLs 2048,
  HTTP-Methodentokens 16 Codeunits und 128 Dequeues; nur vier Networkevents,
  keine Header-, Body- oder Fehlertextlesung und nur ebenenlokale Zeitrechnung.
- Den Pre-Cleanup-Snapshot `O0` als unveränderlich geschlossen: Danach bleiben
  `U`, `V`, `C`, `closeClass`, Stages 1 bis 8, Replay, Settlement,
  Requestbudget, Counts und Observationwerte eingefroren. Vor `O0` wird ein
  Clockverstoß `V`; danach wirken alle Ausgänge nur über Cleanup-Ledger,
  Checkzustände und Candidateableitung, nie rückwirkend auf den Snapshot.
  `cleanupViolation` und `cleanup-terminal-failure` entstehen ausschließlich
  auf den jeweils dafür festgelegten Pfaden.
- Cleanup in `await-cleanup-protocol-responses(openCommandIds)` und
  `await-cleanup-fact(checkId)` getrennt, ohne zufällige Checkattribution bei
  unlesbarem Routing oder Identifier. Disable-/Detach-Reihenfolge,
  Connection-Close, beliebige Antwortreihenfolge und alle zwölf externen
  Schritte sind total; `false -> failed`, `true -> unproven`. Alle 20
  unveränderten Cleanup-IDs werden ohne ausgegebenes `pending` finalisiert.
  Nach terminalen Checks 1 bis 19 erlaubt bei offenem Port nur der exakte
  abschließende Cap-Cancel den Sample
  `cleanup-completion-after-cap-cancel`; unobservables Cancel-Settlement erlaubt
  keinen weiteren Exchange. Jeder nicht vollständig gültige Completion-Sample
  setzt zwingend `relativeMilliseconds: null` und `timingState: unavailable`;
  kein alter oder provisorischer Timingwert wird erhalten, gerundet, projiziert,
  gehasht oder serialisiert, und `receiptOrder` beweist niemals gültiges Timing.
  Daraus folgen
  Check 20, Stage 10, Timing/Receipt Order und exakt `all-steps-terminal`,
  `cleanup-cap` oder `cleanup-terminal-failure`. `cleanup.result` und
  `cleanupFinalized` folgen erst der totalen Statuspräzedenz.
- Den künftigen privaten einzeiligen ASCII-Evaluationstring mit exakt 4259
  UTF-8-Bytes und SHA-256
  `a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b`
  bytegenau in ADR und Living Contract gebunden, aber nicht ausgeführt.
- Das öffentliche Result als Null-Prototyp-Record auf sieben Felder ohne
  Own-`then`, mit `NOT_EVIDENCE`,
  `runtimeAuthorized: false` und `persistenceAuthorized: false` begrenzt. Die
  17-Felder-FoundationProjection besitzt nur `candidateObserverGate` und
  `candidateFinding`, kein `recordType`, echtes `observerGate` oder `finding`;
  `foundationSha256` und sämtliche Adapterprovenienz bleiben unbewiesen.
- Die unveränderten Grenzen von exakt 59 Replayvergleichen, 20 Cleanup-IDs und
  dem 4.259 ASCII-Bytes langen Evaluationstring mit unverändertem Lower-Hex-
  SHA-256 beibehalten. Die Foundation kann kein echtes `observerGate: PASS`
  belegen; `NOT_EVIDENCE`, `runtimeAuthorized: false`,
  `persistenceAuthorized: false`, `overallGate: FAIL` und
  `CAUSE_NOT_PROVEN` bleiben zwingend.
- Weder Foundationmodul noch Tests, Adapter, Parser, Queue, Timer, Browser,
  CDP, Netzwerk, Gateway, Request oder echter Record erstellt oder ausgeführt.
  Die damalige Annahme autorisierte keinen Adapter oder
  Diagnoseruntimevorgang. ADR 0034 hat ADR 0033 inzwischen formal ersetzt; ADR
  0033 bleibt mit bytegleichem Hauptteil ab `## Kontext` historische
  Entscheidungsebene. Im angenommenen ADR-0034-Stand sollte als Nächstes die
  getrennte netzwerkfreie Effects-as-Data-Foundationimplementierung folgen;
  ADR 0035 hat zuvor die verbliebene Join-Testbarkeitslücke adressiert und ADR
  0034 inzwischen formal ersetzt. Der nächste Schritt ist ausschließlich die
  getrennte netzwerkfreie Effects-as-Data-Foundationimplementierung samt
  fokussierter Tests; Adapter-ADR, Adapterimplementierung und sichtbarer
  Diagnoselauf bleiben nachgelagert.

### BrowserSyncTransport Diagnostic Capture, Timing and Projection Determinism Boundary – Entscheidung / ADR 0032

- ADR 0032 am `2026-09-02` als reinen Dokumentations- und Entscheidungsslice
  angenommen. Er ersetzt ADR 0031 formal und übernimmt alle nicht ausdrücklich
  korrigierten ADR-0030-/ADR-0031-Regeln. ADR 0031 bleibt mit bytegleichem
  Hauptteil ab `## Kontext` historische Ebene; ADR 0030 bleibt durch ADR 0031
  ersetzt. ADR 0020, ADR 0028, ADR 0029 und der historische Evidence-Record
  bleiben unverändert.
- Schema 1 und sämtliche Kardinalitäten des
  `BrowserTransportDiagnosticRecord` unverändert gelassen: 17 Rootfelder,
  sechs CDP-Operationen, 17 Integritätschecks, neun Requestzähler plus Sequenz,
  zehn Stages, drei Clock-Domänen, exakt 20 Cleanup-IDs und fünf Findings. Die
  exakte Fortführung ohne Versionswechsel ist nur zulässig, weil weder eine
  Implementierung noch eine konforme persistierte Instanz existiert.
- Einen getrennten globalen Setupcap von exakt `6.000 ms` entschieden. Vor dem
  einzigen Send werden Cap-/Clock-Fähigkeit validiert und scharf geschaltet,
  `m_setup` exakt einmal erfasst, `t_setup := 0` gesetzt, die Deadline
  `m_setup + 6000` als konkreter Timer armiert und Stage 1 `observer-armed`
  gesetzt; erst danach wird
  `Target.getTargets` nichtblockierend gesendet. Der Setup führt
  `Target.getTargets`, `Target.attachToTarget` und `Network.enable` strikt
  sequenziell mit höchstens einem ausstehenden Kommando aus und setzt den Cap
  nie pro Kommando zurück. Scheitert die Cap-/Clock-Fähigkeit, entsteht `V`
  oder kein gültig gestarteter Versuch; die pure Foundation erzeugt nur den
  nichtblockierenden Command-Intent.
- Für jede antwortartig eingereihte Nachricht beim Dequeue vor Reflection
  `m_answer` genau einmal erfasst und roh `d := m_answer - m_setup` gebildet.
  Nur bei `d < 6000` darf die geschlossene Setupantwort-Grammatik synchron und
  begrenzt geprüft werden; bei `d >= 6000` gewinnt der Cap und der Inhalt
  bleibt ungelesen. Ungültige, negative, rückläufige oder werfende Clockwerte
  ergeben `V`. Die genaue Antwortgrammatik bleibt in ADR 0032 und im Living
  Contract normativ. Nur drei eindeutig korrelierte, erfolgreiche und
  vollständig validierte Antworten ergeben `setupReady`. Bei
  `Target.getTargets` wird zuerst die Anzahl der `page`-Kandidaten mit exakt
  gebundener URL unabhängig von `attached` bestimmt; nur bei genau einem wird
  `attached === false` geprüft und danach `targetId` gebunden. Eine Antwort
  gilt erst am verarbeiteten Setupcap oder nach irreversibler
  Verbindungsschließung als fehlend, nicht schon bei leerer Queue oder bloßem
  Noch-nicht-Eintreffen. Fehlende oder eindeutig terminal unbrauchbare
  Setupergebnisse schließen ohne Obserververstoß als `U` mit
  `UNPROVEN/inconclusive`.
- Die Abschlusslogik als `setupClosed := setupReady || U || V` und
  `observationClosed := V || U || C` totalisiert. Persistierte 10-ms-Rundung
  beeinflusst die Capentscheidung nicht; bei `elapsed >= 6000 ms` gewinnt der
  Setupcap, außer ein bereits bestätigtes sticky `V` besitzt `FAIL`-Präzedenz.
  Späte Setupantworten werden verworfen und können weder Setup noch Stimulus
  rückwirkend erzeugen.
- `Runtime.evaluate` ausschließlich nach `setupReady` und höchstens einmal
  zugelassen. Erst sein bestätigter Sendeübergang startet das getrennte
  6.000-ms-Capturefenster. `P := S && N` bezeichnet nur vorläufig vollständige
  Produktevidenz und schließt die Beobachtung nicht; ohne sticky bestätigtes
  `V` bleibt der Observer bis zum verarbeiteten `C` aktiv. So bleiben doppelte
  Evaluate-Antworten und zusätzliche budgetrelevante Requests im vollständigen
  Capturefenster sichtbar.
- Für einen Setupabschluss durch `U` verbindlich
  `captureWindowState: not-started`, `observerGate: UNPROVEN`,
  `finding: inconclusive` und
  `causeStatus: CAUSE_NOT_PROVEN` festgelegt. Evaluation, Factory und
  Transportstimulus bleiben `zero`, gegatete Downstream-Kommandos
  `zero/unproven`, nicht zuverlässig beobachtete Networkcounts `unknown` und
  die Sequenz `incomplete`. Stage 1 `observer-armed` bleibt
  `observed/match`; nur die gegateten Stages 2 bis 8 werden
  `not-observed/unproven` mit `null` für Timing und `receiptOrder`. Ein Versuch
  enthält höchstens einen Stimulus; `PASS` und jeder nicht-inkonklusive Befund
  verlangen exakt einen.
- Den Abschluss zweiphasig getrennt: zuerst ein frischer tief eingefrorener
  Pre-Cleanup-Observation-Snapshot bei `U`, `V` oder `C`, danach ein eigenes
  Cleanup-Ledger aus dem tatsächlich erreichten partiellen Setupzustand. Der
  getrennte Cleanup-Finalisierungscap bleibt `60.000 ms`, die bestehenden 20
  Cleanup-IDs bleiben unverändert und der Finalrecord wird erst nach
  Cleanupfinalisierung frisch aus beiden unveränderten Projektionen erzeugt.
  Die Gründe umfassen mindestens `setup-cap`, `setup-terminal-unproven`,
  `capture-cap` und `confirmed-violation`.
- Die exakte 10-ms-Timingfunktion und ihre Nullpunkte, die feste Stage-/Layer-/
  Clock-Matrix sowie getrennte Clock-Domänen entschieden. Die Foundation-
  Hashdomäne bindet rohe Bytes des tatsächlich geladenen späteren Pfads
  `scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js`; die
  Evaluation-Hashdomäne bindet UTF-8 ohne BOM über exakt den tatsächlich
  gesendeten primitiven `Runtime.evaluate.params.expression`-String.
- Die Main-World-Projektion auf den geschlossenen verschachtelten Baum aus
  `preTransportContext`, `execution` und optionalem `settlement` erweitert.
  Alle konsumierten untrusted CDP-Felder werden descriptorbasiert ausschließlich
  als eigene Data-Properties geprüft; beobachtbare Accessor-, Descriptor- oder
  Hüllenverletzungen werden fail-closed behandelt, ohne verbotene Inhalte zu
  lesen. Der unvertrauenswürdige Eingangsgraph erhält dadurch weder bestätigte
  Plain-Data-/Proxyfreiheit noch Parser-/Pipe-Provenienz. Nur die frische
  Controllerprojektion kann als gewöhnlich und geschlossen bestätigt werden.
- Die pure Foundation allein kann kein reales `observerGate: PASS` belegen.
  Adapterabhängige Provenienz darf erst aus identitätsgebundener Evidenz des
  späteren Adapters abgeleitet und nie als freies Bool übernommen werden.
- Die Replayrelation auf `adr-0032-causal-replay-v2` und exakt 59 Vergleiche
  totalisiert: acht Artefakte einschließlich des geschlossenen Frontend-
  Runtime-Source-Set-Manifests, separat `repository.state` und 50 kausale
  Kontextwerte einschließlich `toolchain.vite.lockfileVersion`.
- Weder Foundation, Adapter, Tests, Record, Controller, Launcher noch Browser-,
  CDP-, Netzwerk-, Gateway-, Port-, Request-, Permission- oder Profiloperation
  erstellt beziehungsweise ausgeführt. Das ADR-0029-`overallGate` bleibt vor
  und nach der Diagnose `FAIL`; `causeStatus` bleibt ausnahmslos
  `CAUSE_NOT_PROVEN`. Im damaligen ADR-0032-Stand sollte als Nächstes die reine
  netzwerkfreie effects-as-data-Foundation folgen. ADR 0033 hat ADR 0032
  inzwischen formal ersetzt und behält dessen nicht ausdrücklich korrigierte
  Regeln bei. ADR 0034 hat ADR 0033 inzwischen formal ersetzt und übernimmt
  alle nicht ausdrücklich korrigierten Regeln aus ADR 0033 und ADR 0032; ADR
  0033 bleibt historische Entscheidungsebene. Im angenommenen ADR-0034-Stand
  sollte als Nächstes die getrennte netzwerkfreie Effects-as-Data-
  Foundationimplementierung folgen. ADR 0035 hat zuvor die verbliebene Join-
  Testbarkeitslücke adressiert und ADR 0034 inzwischen formal ersetzt; der
  nächste Schritt ist ausschließlich die getrennte netzwerkfreie Effects-as-
  Data-Foundationimplementierung samt fokussierter Tests. Adapter-ADR,
  Adapterimplementierung und sichtbarer Lauf bleiben nachgelagert und
  geschlossen.

### Historischer Stand: BrowserSyncTransport Diagnostic Envelope and Observation Completion Boundary – Entscheidung / ADR 0031

- ADR 0031 am `2026-08-30` als reinen Korrektur- und Dokumentationsslice
  angenommen. Er ersetzt ADR 0030 formal und übernimmt sämtliche nicht
  ausdrücklich korrigierten ADR-0030-Regeln. ADR 0020, ADR 0028, ADR 0029,
  der historische Evidence-Record und der ADR-0030-Hauptteil bleiben
  unverändert.
- Bestätigt, dass Schema 1 des `BrowserTransportDiagnosticRecord` exakt die
  bestehenden 20 Cleanup-Check-IDs enthält. Es wird keine 21. ID ergänzt und
  keine ID entfernt, umbenannt oder umgeordnet.
- Erfolgreiche `Runtime.evaluate`-Kommandoantwort, Methodenergebnis und
  flüchtige `Runtime.RemoteObject`-Hülle getrennt. Zulässig ist ausschließlich
  die unmittelbare geschlossene Vier-Felder-By-Value-Projektion ohne Handle,
  Preview, Exceptiondetails, alternative Serialisierung, Folgeinspektion oder
  Rohpersistenz. Verbotene Hüllenfelder werden nur auf Own-Presence geprüft;
  ihre Inhalte werden nie gelesen.
- Den Profilwert auf
  `immediate-closed-by-value-primitives-via-transient-cdp-remote-object-envelope-no-handle-v1`
  korrigiert. Die drei zulässigen outcome/profile-Paare sind geschlossen;
  `relationId` und `deltaProfile` bleiben unverändert.
- Mit `S` für das gültig projizierte Settlement, `N` für das eindeutig
  POST-zugeordnete Networkterminal und `C` für das controllerlokale
  6.000-ms-Capturefenster die Abschlussformel exakt als
  `observationClosed := (S && N) || C` festgelegt. Erst der atomare
  Beobachtungsfreeze erlaubt Cleanup; der endgültige Cleanupstatus folgt
  getrennt aus allen 20 Checks. Späte Ereignisse werden verworfen.
- Eine eindeutig falsche Hüllenform, vorzeitiger Cleanup oder Änderung des
  eingefrorenen Zustands ergibt `observerGate: FAIL` und
  `finding: observer-invalid`. Eine fehlende, abgeschnittene, doppelte oder
  nicht eindeutig korrelierbare Antwort bleibt ohne bestätigte Verletzung
  `UNPROVEN`/`inconclusive`; bestätigte Verletzungen besitzen
  `FAIL`-Präzedenz.
- Weder Diagnosefoundation, Tests, Recordvorlage, Controller, Harness,
  Fixture oder Launcher erstellt noch Browser-, CDP-, Netzwerk-, Gateway-,
  Port-, Request-, Permission- oder Profiloperation ausgeführt. Das
  ADR-0029-`overallGate` bleibt `FAIL`, die Ursache `CAUSE_NOT_PROVEN`; im
  damaligen ADR-0031-Stand war der nächste Slice ausschließlich die
  netzwerkfreie Implementierung und Prüfung der passiven Diagnosefoundation.

### BrowserSyncTransport Runtime Diagnostic Observer Boundary – Entscheidung / ADR 0030

- ADR 0030 am `2026-08-30` als reinen Dokumentations- und
  Entscheidungsslice angenommen. Er ergänzt ADR 0028 und ADR 0029, ersetzt
  keinen ADR und bewertet ADR 0020 ausdrücklich erneut, ohne dessen
  Produktions-Gateway-Baseline zu ändern. ADR 0020 sowie ADR 0026 bis ADR 0029
  und der historische Evidence-Record bleiben bytegleich.
- Den unveränderten Ausgangsbefund festgehalten: `OPTIONS 204`, vollständig
  beantwortetes `POST 200`, erwartete JavaScript-sichtbare Responsewerte und
  danach statisch redigierte Transportablehnung. Das ADR-0029-Runtimegate bleibt
  `FAIL`; der Ursachenstatus bleibt `CAUSE_NOT_PROVEN`. ADR 0030 ist weder
  Ursachennachweis noch Runtime-`PASS`, Produktfreigabe, Implementierung oder
  Laufautorisierung.
- Die neue Bindung `T_replay ≡R T₀` und
  `T_diag = T_replay + Δ_observer` entschieden. `T_replay` ist eine neue
  vollständige Referenzbindung und kein observerfreier Kontrolllauf. Neue
  Run-ID, Messzeit, Repositorycommit und Wegwerfprofilinstanz werden getrennt
  gebunden; sie sind kein Observerdelta. Nur tatsächlich persistierte
  historische Klassifikationen und aus dem historischen Git-Tree ableitbare
  Einzelartefakthashes dürfen verglichen werden.
- `Δ_observer` auf einen exklusiven lokalen Pipe-Controller, genau ein
  Top-Level-Target, eine Session, eine geschlossene minimale Target-/Runtime-/
  Network-Operations-Allowlist, genau eine Main-World-Auswertung, genau eine
  argumentlose Factoryerzeugung und genau einen gültigen synthetischen
  v1-`syncTest` begrenzt. Sourceinstrumentierung, Composition-Seams,
  Runtimeoberflächenmutation, Fetch-Interception, Debugger, Profiler, Tracing,
  Responsebody-Lesen, freie Rohinspektion, Zusatzrequests und Observerausgabe
  während des Laufs bleiben verboten.
- Ausschließlich zehn externe Diagnosestufen mit ebenenlokaler
  Empfangsreihenfolge und getrennten Clock-Domänen zugelassen.
  `internalStage` und `internalOwner` bleiben `unknown`;
  `Network.loadingFinished` beweist keinen JavaScript-Streamabschluss und eine
  Nähe zur 5.000-ms-Grenze höchstens `deadline-compatible`. Absolute
  Observerneutralität wird nicht behauptet.
- Das Requestbudget auf einen Default-Transportaufruf, null Retries, null
  direkte Diagnose-Fetches, null Negativvektoren, erwartbar genau einen
  `OPTIONS` und einen `POST` sowie null Observerrequests zum Produktendpoint
  geschlossen. Ein zusätzlicher Transportaufruf oder `POST` ist ein
  Diagnosevertragsbruch; fehlende oder mehrdeutige Zuordnung bleibt ohne
  belegten Verstoß `UNPROVEN`.
- In `docs/data-contracts.md` den unabhängigen geschlossenen
  `BrowserTransportDiagnosticRecord` entschieden. Seine Achsen sind
  `observerGate: PASS | FAIL | UNPROVEN`, die fünf geschlossenen
  Diagnosefindings und ausnahmslos `causeStatus: CAUSE_NOT_PROVEN`; das
  ADR-0029-`overallGate` bleibt davor und danach `FAIL`. Der Vertrag speichert
  keine Roh-CDP-/HAR-/Header-/Body-/Fehlerdaten, Requestidentitäten,
  persönlichen Pfade, Prozess- oder Browserkennungen, privaten Netzwerkdetails
  oder GoldenDawn-/Vault-/Credentialdaten.
- In diesem Slice weder Recordvorlage noch Record, Controller, Harness,
  Fixture, Observer oder Diagnosefoundation erstellt und keine Runtimeoperation
  ausgeführt. Im damaligen ADR-0030-Stand sollte als nächster Slice
  ausschließlich die vollständig netzwerkfreie Implementierung und Prüfung der
  passiven Diagnosefoundation folgen.
  Ein sichtbarer Diagnoselauf benötigt danach eine neue ausdrückliche
  Autorisierung; Browserkomposition und Browser-End-to-End bleiben bis zu einem
  späteren vollständig neuen ADR-0029-Gesamt-`PASS` geschlossen.
- Den reinen Dokumentationsstand mit 1755/1755 Tests der vollständigen
  seriellen Suite bei 0 Fehlschlägen, Abbrüchen, Skips und Todos, dem
  Produktions-Build mit exakt 46 transformierten Modulen sowie dem
  schreibfreien driftfreien `bundle:n8n:check` regressionsgeprüft. Diese lokalen
  Prüfungen sind weder Runtime- noch Diagnoseevidenz.

### Local Browser Runtime Evidence – Chrome Stable unter Windows

- Den einmalig autorisierten, sichtbaren Chrome-Stable-Lauf unter dem
  vollständigen Basistupel `chrome-stable-win-t0-01` ausgeführt und als
  geschlossenen Schema-1-Record unter
  `docs/evidence/browser-runtime-evidence.chrome-stable-windows-01.json`
  dokumentiert. Gebunden waren Chrome `151.0.7922.174`, Windows 11 Home 25H2
  Build `26200.9168`, Node `24.19.0`, die Top-Level-Origin
  `http://127.0.0.1:5173` und der feste Gatewayendpoint auf
  `127.0.0.1:8787`.
- Im einzigen gestarteten Vektor `positive-default` genau einen gewöhnlichen
  CORS-Preflight mit `OPTIONS 204`, danach genau einen vollständig
  beantworteten `POST 200` und die erwarteten JavaScript-sichtbaren
  Responsewerte beobachtet. Das öffentliche BrowserSyncTransport-Promise wies
  dennoch mit dem statisch redigierten Transportfehler zurück. Dieser belegte
  Widerspruch der JavaScript-, Browsernetzwerk- und Gatewayebene setzt
  `normalSyntheticTransport` und damit `overallGate` auf `FAIL`; die
  Korrelation blieb unbeobachtet und der positive Vektor nach der geschlossenen
  Vektorgrammatik `UNPROVEN`.
- Den Lauf unmittelbar ohne Retry gestoppt. `negative-origin` und
  `redirect-error`, ihre Deltas und ihre Restores wurden nicht ausgeführt und
  bleiben `UNPROVEN`. Die PNA-/LNA-Klassifikation bleibt wegen unbekanntem
  Zieladressraum ebenfalls `UNPROVEN`; es wurde kein zusätzlicher Header,
  keine Permission-, Policy- oder Produktanpassung vorgenommen.
- Jan bestätigte nach dem Cleanup, dass kein Local-Network-/Loopback-Dialog
  sichtbar war und keine Browserinteraktion erfolgte. Diese Beobachtung
  beweist weder allgemeine Permissionfreiheit noch einen anderen Browser-,
  Versions-, OS-, Origin- oder Produktkontext.
- Chrome, Controller, Gateway und Vite kontrolliert beendet, alle gebundenen
  Ports freigegeben sowie temporäres Profil, Harness und sanitierte Fragmente
  entfernt. Repository und gesondert gebundener Vite-Cache entsprachen danach
  wieder exakt ihrer Baseline; Produkt-, Test-, ADR-, Paket-, Bundle- und
  Generatorquellen blieben unverändert.
- Browserkomposition und Browser-End-to-End-`syncTest` bleiben geschlossen.
  Der danach verlangte Architekturentscheidungsslice ist inzwischen mit ADR
  0030 abgeschlossen, ohne den historischen Befund oder das Gesamt-`FAIL` zu
  ändern. Ein sichtbarer Diagnose- oder Runtime-Evidence-Lauf benötigt erneut
  eine ausdrückliche Autorisierung.

### Local Browser Runtime Evidence Gate – Entscheidung / ADR 0029

- ADR 0029 am `2026-08-30` als reinen Dokumentations- und
  Entscheidungsslice angenommen. Er ergänzt ADR 0020 und ADR 0028,
  operationalisiert die fortgeltenden ADR-0026-/ADR-0027-
  Runtimeanforderungen und ersetzt keinen bestehenden ADR.
- Alle positiven Pflichtbeobachtungen an ein vollständiges unveränderliches
  Basistupel `T₀` gebunden. Die Negativvektoren verwenden ausschließlich
  `T_origin = T₀ + Δ_origin` mit absichtlich abweichender Allowed-Origin und
  `T_redirect = T₀ + Δ_redirect` mit einer ausdrücklich klassifizierten
  lokalen Redirectfixture. Jede weitere Abweichung bleibt `UNPROVEN` oder
  ergibt bei beobachteter Grenzverletzung `FAIL`.
- Zehn Pflichtgates, die getrennten JavaScript-, Browsernetzwerk-, Gateway-
  und Benutzerbeobachtungsebenen sowie die ausschließlichen Status `PASS`,
  `FAIL` und `UNPROVEN` festgelegt. Ein Gesamt-`PASS` verlangt alle positiven
  Gates exakt unter `T₀`, beide Negativkontrollen ausschließlich unter ihren
  allowlisteten Deltas, Restore auf `T₀` nach jedem Negativvektor und bestätigten
  abschließenden Cleanup.
- Den geschlossenen sanitisierten Evidence-Record mit eindeutiger
  `baseContextId`, Basistupelreferenz je Vektor, tatsächlich geänderten
  Deltafeldern, erwarteten und beobachteten Deltawerten, Ausschluss weiterer
  Bindungsabweichungen sowie `restoreConfirmed` und `cleanupConfirmed`
  normativ in `docs/data-contracts.md` definiert.
- Gewöhnlichen CORS-Preflight, historisches PNA und aktuelles
  permissionbasiertes LNA getrennt. Hersteller- und Spezifikationsquellen
  bleiben Kontext, keine Runtimeevidenz; jedes Ergebnis ist an Browserprodukt,
  Vollversion, Channel, Betriebssystem, Profil, Policies, Berechtigungen,
  Top-Level-Origin und Endpoint gebunden.
- In diesem Slice keinen Browser, Gateway, Vite-/Preview-Server, Port,
  Request, Permissionpfad, Harness, Fixture oder Evidence-Template gestartet,
  angelegt oder verändert. Produktcode, Tests, Endpoint, Header,
  Konfiguration, Komposition, Browser-E2E, private Daten, Cloud, Provider, n8n
  und Vault blieben außerhalb. Der tatsächliche Runtimegate-Status bleibt
  `UNPROVEN`; als Nächstes folgt nur ein gesondert autorisierter realer
  Runtime-Evidence-Slice.

### Browser SyncTransport Validator Integrity Boundary – Implementierung

- Die in ADR 0028 entschiedene private feste v1-Wire-Policy ausschließlich in
  `src/transports/browserSyncTransport.js` implementiert. Derselbe frische
  interne Graph erreicht den Contractvalidator weiterhin exakt zweimal vor
  und nach Deep Freeze; danach läuft die Policy nach dem bestehenden
  terminalen Profilguard und unmittelbar vor `JSON.stringify` exakt einmal.
  Ein dritter oder alternativer Validatorpfad wurde nicht ergänzt und der
  Contractvalidator selbst nicht gehärtet.
- Die Policy bindet unabhängig die festen v1-Werte, das geschlossene
  ASCII-Request-ID-Profil, den tatsächlich gültigen kanonischen UTC-Timestamp
  samt Rückprojektion und 300.000-ms-Konsistenz sowie den exakten normalen
  eingefrorenen Sechs-Felder-Graphen ohne `toJSON` und mit leerem
  eingefrorenem Payload. Damit schließt sie die bestätigte Transportlücke vor
  Stringify, Encoding, Controller, Timer und Fetch.
- Die vollständige netzwerkfreie ADR-0028-Matrix additiv in
  `tests/browserSyncTransport.test.js` umgesetzt. Sie weist die aktive Policy
  bei Validator-, Descriptor-, Collection-, Regex-, Iterator-, Date-/UTC-,
  Request-ID-, Prototype-, Constructor-/Species-, Deadline-, UTF-8-,
  Coercion-, Content-Length-, Stream- und Promise-/Host-Mutationen nach. Der
  kausale Haupttest zeigt, dass die echte Policy denselben Validatorbypass vor
  Stringify und Fetch stoppt, der bei gezielt neutralisiertem Policy-Callsite
  exakt einen Fetch erreicht.
- Die fokussierte BrowserSyncTransport-Suite besteht mit 423/423 Tests, der
  gemeinsame Lauf von SyncService und BrowserSyncTransport mit 466/466 Tests,
  die sechs seriellen Sync-Suites mit 735/735 Tests und die vollständige
  serielle Gesamtsuite mit 1755/1755 Tests. Der ausschließlich aus den
  Transporttests stammende Zuwachs beträgt `Δ = 151`; alle Läufe besitzen
  0 Fehlschläge, 0 Cancellations, 0 Skips und 0 Todos. Der Produktions-Build
  transformiert weiterhin exakt 46 Module und `bundle:n8n:check` ist
  driftfrei.
- API, Seams, Dependencies, Endpoint, Caps, SyncContract, Exports, n8n-Bundle,
  Manifest, Generator, Response-, Promise-, Buffer-, Deadline-, Cleanup-,
  Redaction- und SyncService-Regeln blieben unverändert. Der
  BrowserSyncTransport bleibt vom SyncService und von `src/main.js`
  unkomponiert; ein Browser-End-to-End-Fluss wurde nicht geschaffen.
- Phase 0/Tor A anhand der tatsächlichen Implementierung erneut bestätigt:
  keine Modelle, statistische Inferenz, Provider, Credentials, privaten
  Inhalts-Payloads, Logs, Storage oder Telemetrie. Für Implementierung und
  Nachweis erfolgte kein realer Browser-, externer Netzwerk-, Gateway-, Cloud-,
  n8n-, Provider-, Credential- oder Vaultzugriff.
- Die Promise-/Host-Restgrenze bleibt bestehen: Der Transport assimiliert
  ungültig profilierte bereits abgelehnte Fetch-, Read- oder Cleanup-Promises
  nicht und gibt ihren Grund nicht aus. Ein späterer getrennter
  `unhandledrejection`-/`unhandledRejection`-Hostkanal ist dennoch möglich;
  Eintritt, Zeitpunkt, Häufigkeit und Prozessfortsetzung werden nicht
  hostübergreifend garantiert.
- Der nachfolgende ADR-0029-Entscheidungsslice operationalisiert das reale
  kontext- und versionsgebundene Runtimegate. Seine Messung bleibt ein
  gesondert zu autorisierender Slice; Browserkomposition und Browser-End-to-
  End-`syncTest` folgen weiterhin erst nach dessen an `T₀` gebundenem `PASS`.

### Browser SyncTransport Validator Integrity Boundary – Entscheidung / ADR 0028

- ADR 0028 am `2026-08-29` als reinen Dokumentations- und
  Entscheidungsslice angenommen. ADR 0028 ersetzt ADR 0027 formal, übernimmt
  dessen beide Korrekturen vollständig und lässt sämtliche nicht ausdrücklich
  geänderten ADR-0026-/ADR-0027-Regeln fortgelten. ADR 0026 behält unverändert
  seinen direkten Verweis auf ADR 0027; in ADR 0027 wurde ausschließlich die
  Statuszeile auf ADR 0028 aktualisiert, der Body ab `## Kontext` blieb
  bytegleich.
- Einen bestätigten, damals noch nicht behobenen Produktfehler dokumentiert: Die
  beiden erforderlichen `validateSyncRequest`-Aufrufe verwenden live
  manipulierbare Laufzeitfunktionen. Die bestehende terminale Prüfung bestätigt
  Shape, Freeze und Snapshotidentität, aber keine davon unabhängigen festen
  v1-Werte. Kontrollierte netzwerkfreie Proben konnten vertragswidrige
  Versionen, Aktionen, Quellen und Request-IDs bis zu Serialisierung,
  Controller, Timer und Fetch-Seam gelangen lassen. Die damalige grüne Suite
  mit 1604/1604 Tests schließt diese Nachweislücke nicht.
- Die spätere Requestreihenfolge verbindlich präzisiert:
  `descriptorbasierter Snapshot → frischer interner Graph →
  validateSyncRequest #1 → Deep Freeze → validateSyncRequest #2 → bestehende
  terminale Shape-/Freeze-Prüfung → neue feste v1-Wire-Policy → Stringify →
  UTF-8-Encoding → Controller → Timer → Fetch`. Derselbe frische Graph bleibt
  exakt zweimal Validatorinput; ein dritter Aufruf bleibt ebenso verboten wie
  jeder weitere generische oder alternative Validatorpfad.
- Genau eine private, nicht exportierte feste v1-Wire-Policy unmittelbar vor
  `JSON.stringify` entschieden. Sie liest Properties ausschließlich aus dem
  internen tief eingefrorenen Graphen über bei Modulevaluation erfasste
  Intrinsics und verwendet daneben nur die bereits erfasste primitive
  Referenzzeit. Callerroot und Callerpayload werden nicht erneut gelesen;
  live aufgelöste oder importierte Regex-, Array-, Set-, Map-, Iterator-,
  String-, Date-, Number-, Math-, Object-, Reflect- oder Validator-Allowlist-
  Oberflächen bleiben ausgeschlossen.
- Die feste Policy ausschließlich an Version `1.0`, Aktion `syncTest`, Quelle
  `goldendawn-os`, das 5- bis 64-Codeeinheiten-ASCII-Request-ID-Profil mit
  Präfix `req_`, den exakt 24 Zeichen langen kanonischen UTC-Timestamp mit
  echter Datumsvalidität und identischer UTC-Rückprojektion, höchstens 300.000
  ms interne Zeitdifferenz sowie den exakten normalen eingefrorenen
  Sechs-Felder-Graphen ohne `toJSON` und mit leerem eingefrorenem Payload
  gebunden. Der Zeitvergleich beweist keine unabhängige Frische,
  Uhrvertrauenswürdigkeit oder Replayabwehr.
- Jede Policyabweichung muss mit dem bestehenden statischen Transportfehler vor
  transportgesteuertem Stringify, Encoding, Controller, Timer und Fetch
  scheitern. Die Policy verhindert keine eigenen Nebenwirkungen eines zuvor
  ausgeführten kompromittierten Same-Realm-Validator-Hooks; Same-Realm bleibt
  keine Sandbox. Eine neue Version, Aktion oder Quelle benötigt eine eigene
  Entscheidung und einen eigenen Implementierungsnachweis.
- Factory, Methoden-API, Arity, vier Composition-Seams, fester
  Loopbackendpoint, Snapshot, frischer disjunkter Graph, zwei
  Contractvalidatoraufrufe, private Requestgrenze 65.536, ADR-0027-Nachweis
  193/192, höchstens ein Fetch, Deadline, First-Terminal-Owner, Abort, Cleanup,
  beobachtbare Promise-/Bufferprofile, Streamcopy, striktes UTF-8, einmaliges
  JSON-Parsing, Redaction, SyncService-Korrelation und fehlende
  `src/main.js`-Komposition unverändert fortgeschrieben.
- Promise-/Host-Restgrenze explizit dokumentiert: keine freie `.then`-
  Auflösung, kein `Promise.resolve` und keine Anwendung der erfassten nativen
  `then`-Methode vor vollständig bestandenem Promiseprofil. Der Transport
  übernimmt keinen fremden Rejectiongrund; ein bereits abgelehntes ungültig
  profiliertes Fetch-, Read- oder Cleanup-Promise kann dennoch später einen
  getrennten hostabhängigen `unhandledrejection`- beziehungsweise
  `unhandledRejection`-Kanal auslösen. Eintritt, Zeitpunkt, Häufigkeit und
  Prozessfortsetzung werden nicht hostübergreifend garantiert.
- Die Responseheader- und Content-Length-Entscheidung unverändert belassen:
  fehlende beziehungsweise `null` Content-Length scheitert vor
  `content-encoding`, Body, Reader und Chunk; `16.384` bleibt inklusive,
  deklarierte `16.385` scheitert in der Headerprüfung. Ein 16.385-Byte-Chunk
  bei deklarierter Länge 16.384 verletzt zugleich Restlänge und absoluten Cap
  und muss vor Kopie, weiterer Allokation und weiterem Read abbrechen; er ist
  kein isolierter Nachweis nur des absoluten Caps.
- Die spätere mutationswirksame Testmatrix um Validator-, Reflection-,
  Collection-, Regex-, Iterator-, Date-/UTC-, Request-ID-, Prototype-,
  Constructor-/Species-, Deadline-, UTF-8-, Coercion-, Content-Length-,
  Stream- und Promise-/Host-Proben ergänzt. Eine gültige Kontrolle verlangt
  exakt zwei Contractvalidatoraufrufe, eine Policyprüfung und einen Fetch. Ein
  temporärer kausaler Mutationstest muss bei neutralisierter oder umgangener
  Policy mindestens einen Validatorbypass wieder bis Fetch lassen.
- Dieser damalige Entscheidungsslice änderte keinen Produkt- oder Testcode.
  SyncContract, Exports, n8n-Bundle, Manifest und Generator blieben
  unverändert. Der anschließend getrennt ausgeführte Implementierungsslice ist
  im vorstehenden Abschnitt dokumentiert.

### Browser SyncTransport Foundation – Implementierung

- Den gemäß ADR 0027 geschlossenen BrowserSyncTransport isoliert in
  `src/transports/browserSyncTransport.js` implementiert. Das Modul exportiert
  ausschließlich `createBrowserSyncTransport`; jede Factory liefert eine
  frische gewöhnliche und eingefrorene API exakt mit `{ sendSyncRequest }`.
  Import und Factory bleiben request-, timer- und netzwerkinaktiv.
- Composition und Requestgrenze descriptorbasiert geschlossen: Die vier Seams
  und der Callerrequest werden in fester Reihenfolge genau einmal erfasst und
  nicht erneut gelesen. Ausschließlich aus dem Snapshot entsteht ein frischer,
  disjunkter Sechs-Felder-Requestgraph; nur derselbe Graph wird mit derselben
  Timestampreferenz genau einmal vor und genau einmal nach seinem Deep Freeze
  validiert. Callergraph und Callerpayload bleiben unverändert.
- Genau einen erfassten Stringify- und Encoderaufruf, den festen Endpoint
  `http://127.0.0.1:8787/api/sync-test`, frische eingefrorene Null-Prototyp-
  Records für Header und RequestInit sowie höchstens einen Fetch-Seam-Aufruf
  ohne Retry, Redirect oder Fallback umgesetzt. Der gültige maximale v1-Request
  mit exakt 193 UTF-8-Bytes erreicht Fetch genau einmal; eine 65 Zeichen lange
  `requestId` scheitert vor Serialisierung und Nebenwirkungen. Bereinigte
  temporäre Quellkopien mit Caps 193 und 192 belegen mutationswirksam nur die
  private Request-Cap-Verdrahtung und deren Position vor Nebenwirkungen.
- Die 5.000-ms-First-Terminal-Owner-Deadline, höchstens einen nicht blockierenden
  Abort nach Fetchbeginn und best-effort Timer-, Reader- und Abortcleanup
  umgesetzt. Fetch-, Read- und zulässige Cleanup-Promises werden ausschließlich
  über die erfasste native `Promise.prototype.then`-Methode und das geschlossene
  Brand-, Prototyp-, Own-Key-, Constructor- und Speciesprofil beobachtet. Freie
  `.then`-Reads, `Promise.resolve`, Thenableassimilation und transportseitige
  Prototypänderungen bleiben ausgeschlossen.
- Response und browserexponierte Header fail-fast geprüft, akzeptierte echte
  `Uint8Array`-/feste `ArrayBuffer`-Chunks sofort in genau einen eigenen lokalen
  Puffer kopiert und die öffentliche Responsekante 16.384/16.385 Bytes getrennt
  geprüft. Nach deaktivierter Deadline folgen strikt fataler UTF-8-Decode,
  genau ein `JSON.parse` ohne Reviver und der geschlossene Parsed-Value-Handoff.
- Die mutationswirksame Unit-Suite ausschließlich in
  `tests/browserSyncTransport.test.js` ergänzt. Sie verwendet kontrollierte
  Doubles und `node:vm`-Fixtures, restauriert globale Mutationen in `finally`
  und besitzt weder reale Browser- noch Netzwerk- oder Gatewayzugriffe.
- Die fokussierte BrowserSyncTransport-Suite besteht mit 272/272 Tests,
  SyncService und BrowserSyncTransport gemeinsam mit 315/315 Tests, die sechs
  seriellen Sync-Suites mit 584/584 Tests und die vollständige serielle
  Gesamtsuite mit 1604/1604 Tests. Alle Läufe besitzen 0 Fehlschläge,
  0 Cancellations, 0 Skips und 0 Todos. Der Produktions-Build transformiert
  weiterhin exakt 46 Module; der schreibfreie `bundle:n8n:check` meldet keinen
  Drift.
- Phase 0/Tor A anhand der tatsächlichen Implementierung eng erneut bestätigt:
  kein Modell, keine statistische Inferenz, kein Provider oder Workflow, keine
  Credentials oder privaten Inhalts-Payloads, kein Logging, Storage oder
  Telemetrie und keine Rechts- oder Complianceklassifikation. Es gab keine
  reale Browser-, Netzwerk-, Gateway-, Cloud-, n8n-, Provider-, Credential-
  oder Vaultnutzung.
- Der Transport bleibt vom `SyncService` und von `src/main.js` unkomponiert;
  ein Browser-End-to-End-Fluss existiert nicht. Der nächste Slice ist
  ausschließlich das getrennte reale, kontext- und versionsgebundene
  Runtimegate für CORS/Preflight, PNA/LNA, lokale Netzwerkberechtigung und
  Secure Context/Mixed Content. Browserkomposition, End-to-End-`syncTest`,
  operative Limits und Provider bleiben spätere getrennte Slices.

### Beobachtbare Browser-SyncTransport-Nachweisgrenzen / ADR 0027

- ADR 0027 wurde am `2026-08-27` angenommen und ersetzt ADR 0026 formal. Alle
  nicht ausdrücklich korrigierten Entscheidungen von ADR 0026 gelten normativ
  fort; bei Konflikten ist ausschließlich ADR 0027 maßgeblich.
- Der erste Implementierungsversuch wurde vor jeder Dateiänderung hart
  gestoppt. Working Tree, Index sowie
  `src/transports/browserSyncTransport.js` und
  `tests/browserSyncTransport.test.js` blieben unverändert; Browser, Netzwerk
  und lokales Gateway wurden nicht angesprochen. Ursache waren zwei
  unbeweisbare beziehungsweise im gültigen Version-1-Requestraum unerreichbare
  Nachweisanforderungen, keine Produktlücke. Es entsteht keine neue API,
  Dependency oder Test-Seam; die Implementierung bleibt bis zum Merge dieser
  Entscheidung pausiert.
- Fremde Fetch-, Read- und zulässige Cleanup-Promises werden nicht mehr anhand
  einer unbeweisbaren Erzeugungsrealm- oder historischen Subclass-Provenienz
  beurteilt. Entscheidend ist ausschließlich ihr geschlossenes beobachtbares
  Profil aus echter nativer Promise-Brand, exakt lokalem erfasstem Prototyp und
  unveränderter Kette, leerer Own-Key-Menge ohne eigene `constructor`-Property,
  unveränderten Constructor-/Species-Deskriptoren und -Identitäten sowie der
  Anwendung der erfassten nativen `then`-Methode. Unveränderte Cross-Realm-
  Werte bleiben negativ; vollständig fixtureseitig umprototypisierte echte
  Cross-Realm-Promises und native Subclasses ohne beobachtbaren Rest dürfen
  positiv sein. Der Transport setzt nie Prototypen; sein äußeres Promise bleibt
  mit dem erfassten lokalen Konstruktor erzeugt.
- Streamchunks folgen derselben Nachweislogik: echte `Uint8Array`- und
  Backing-`ArrayBuffer`-Brands, exakt lokale Prototypen und Ketten sowie fester,
  nicht geteilter, nicht resizable und nicht detached Speicher. Nur eine
  vollständig vor Übergabe umprototypisierte echte View samt ihrem echten
  Buffer kann bestehen; die Änderung nur einer Seite scheitert. Akzeptierte
  Bytes werden sofort in einen tatsächlich lokalen eigenen Zielbuffer kopiert,
  sodass spätere Quellmutationen die Kopie nicht beeinflussen.
- Der private produktive Browser-Request-Cap bleibt als Defense-in-Depth bei
  65.536 Bytes; Byte 65.537 scheitert weiterhin vor Controller, Timer und
  Fetch. Der größte öffentlich gültige kanonische Version-1-Requestbody ist
  jedoch exakt 193 UTF-8-Bytes groß: 129 feste Bytes plus höchstens 64
  ASCII-Zeichen für die gesamte `requestId` einschließlich `req_`. Eine
  65-Zeichen-ID scheitert vor Stringify, Encode, Controller, Timer und Fetch.
  Dies ist getrennt von der real erreichbaren Gateway-Raw-Wire-Grenze
  65.536/65.537 und der Browser-Response-Grenze 16.384/16.385 Bytes.
- Die spätere mutationswirksame Unit-Suite führt den gültigen 193-Byte-Fall bis
  exakt einen Fetch und weist die 65-Zeichen-ID früh ab. Temporäre, danach
  entfernte Quellkopien mit Cap 193 beziehungsweise 192 sowie ein roter
  Gegenbeweis bei entferntem, umgangenem oder falsch verglichenem Check belegen
  nur aktive Verdrahtung, inklusive Vergleichssemantik und Position vor
  Nebenwirkungen. Cross-Realm-Fälle verwenden `node:vm`, native Intrinsics und
  kontrollierte Doubles, laufen seriell und stellen globale Mutationen in
  `finally` wieder her; reale Browser- und Netzwerkzugriffe, Skips und Todos
  bleiben ausgeschlossen.
- Thenables, Proxies, Fakes, zusätzliche Keys, Symbole, Accessors, sichtbare
  Subclass-Prototypen, mutierte Constructor-/Species-Zustände, freie `.then`-
  Reads und `Promise.resolve` bleiben negativ. Eine mutierte globale `.then`-
  Oberfläche dient ausschließlich als Hostile-Hook-Unabhängigkeitsnachweis:
  Die ersetzte Property wird nicht frei gelesen oder aufgerufen; die beim
  Import erfasste Methode bleibt autoritativ.
- Dieser Slice ändert ausschließlich die zehn freigegebenen
  Entscheidungs- und Living-Documentation-Pfade. Transport, Unit-Suite,
  Anwendungskomposition, Browser-End-to-End-Fluss, Gateway, n8n, Cloud,
  Provider, Credentials, Vault, Paketversion, Tag und Release bleiben
  unverändert. Kein Runtime-, Provider-, Privatdaten- oder Aktivierungsgate
  wird geöffnet. Nächster Slice bleibt die isolierte Implementierung gemäß ADR
  0027; erst danach folgt der getrennte reale Browser-Runtime-Nachweis.
- Die unveränderte technische Baseline wurde real geprüft: `1332/1332` Tests
  der vollständigen seriellen Suite bestehen bei `0` Fehlschlägen, `0` Skips
  und `0` Todos; der Produktions-Build transformiert exakt `46` Module und der
  schreibfreie n8n-Bundlecheck meldet keinen Drift.

Der folgende ADR-0026-Eintrag dokumentiert den damaligen, inzwischen durch ADR
0027 ersetzten Stand unverändert. Bei Konflikten gilt ADR 0027.

### Browser SyncTransport Contract / ADR 0026

- ADR 0026 am `2026-08-24` als reinen Dokumentations- und Entscheidungsslice
  angenommen und korrigiert. Er ergänzt ADR 0017, ADR 0020, ADR 0023 und ADR
  0025, ersetzt keine bestehende Entscheidung und verändert weder SyncContract,
  SyncService-Port, Gateway noch SyncAgent.
- Für die spätere isolierte Implementierung den Modulpfad
  `src/transports/browserSyncTransport.js`, den einzigen Export
  `createBrowserSyncTransport` und eine frische gewöhnliche eingefrorene API
  exakt mit `{ sendSyncRequest }` festgelegt. `sendSyncRequest` akzeptiert exakt
  ein Argument und gibt auf jedem Methodenpfad sofort ein echtes natives
  Promise zurück; falsche Arity scheitert redigiert vor Argument-, Dependency-,
  Timer- oder Netzwerkbeobachtung.
- Die Factorygrenze geschlossen: Nur ein wirklich argumentloser Aufruf wählt
  private Wrapper um die bei Modulevaluation erfassten Browserdefaults.
  Explizites `undefined`, Extras sowie accessor-, symbol-, partial- oder
  nichtgewöhnliche Composition-Container scheitern synchron mit statischem
  `TypeError("Ungültige BrowserSyncTransport-Komposition.")`. Own-Keys und die
  vier Own-Data-Funktionen werden jeweils einmal descriptor-basiert erfasst,
  danach nicht erneut gelesen und nicht aufgerufen. Fehlende oder ungeeignete Browserdefaults scheitern
  ebenfalls bereits an der Factory. Erfasst werden außerdem der native
  Same-Realm-Promise-Konstruktor, Promiseprototyp und `then`, `Symbol.species`,
  die ursprünglichen Constructor-/Species-Deskriptoren samt Species-Getter,
  die Promise-/Object-Ketten sowie Typed-Array-/ArrayBuffer-Intrinsics und
  Prototypen. JSON, Encoding, Reflection, Promise, Typed Arrays und ArrayBuffer
  sind keine injizierbaren Seams.
- Einen autoritativen Request-Snapshot statt eines Validate-then-Reread-Pfads
  entschieden. Die beobachtbare Reihenfolge ist exakt Root-Own-Keys einmal,
  Rootprototyp einmal, sechs Deskriptoren in der Reihenfolge `version`,
  `action`, `source`, `requestId`, `timestamp`, `payload` je einmal,
  Payloadidentität nur aus dem erfassten Descriptor, Payload-Own-Keys einmal,
  Payloadprototyp einmal. Danach wird weder Root noch Payload erneut gelesen.
  Der Snapshot ist nur die interne Reflectionmenge. Aus ihr entsteht genau ein
  frischer disjunkter Sechs-Felder-Graph; ausschließlich derselbe Graph wird
  mit derselben Timestampreferenz genau einmal vor und genau einmal nach seinem
  Freeze validiert. Caller, Callerpayload und zweites Snapshotobjekt werden nie
  Validatorinput; dritten oder alternativen Pfad gibt es nicht. Die
  Timestamp-Differenz null
  belegt nur Snapshot-Selbstkonsistenz, weder Frische noch Replay-Schutz; die
  operative Zeitprüfung bleibt Gatewayaufgabe und benötigt keine Browserclock.
- Der eine frische Requestgraph wird tief eingefroren und terminal auf exakte
  Own-Data-Felder, Root-/Payload-Prototypketten bis `null`, Frozen-Zustand,
  fehlendes eigenes `toJSON` an Root, Payload und erfasstem Object-Prototyp
  sowie fehlende fremde verschachtelte Identitäten geprüft. Erfasstes natives
  `JSON.stringify` läuft exakt einmal ohne Replacer und muss einen primitiven
  String ergeben. Erfasstes `TextEncoder.prototype.encode` läuft exakt einmal
  mit korrektem Receiver; nur ein echter, nicht abgeleiteter, brand-geprüfter
  `Uint8Array` mit exaktem Prototyp zählt. 65.536 Bytes sind zulässig, 65.537
  scheitern vor Timer oder Fetch.
- Pro zulässigem Aufruf einen frischen eingefrorenen Null-Prototyp-
  `RequestInit` mit exakt zehn aufzählbaren Own-Data-Eigenschaften und einen
  frischen eingefrorenen Null-Prototyp-Headerrecord mit ausschließlich
  `Content-Type: application/json; charset=utf-8` festgelegt. Das interne
  Signal wird weder als Eigentum noch als eingefroren behauptet. Ziel bleibt
  ausschließlich `http://127.0.0.1:8787/api/sync-test`; `localhost`, IPv6,
  Konfiguration, Discovery, Redirect, Fallback, Retry und Caller-Signal bleiben
  ausgeschlossen.
- Controller, Signal und Abortmethode werden vor Timer und Fetch einmal
  aufgelöst. Die 5.000 ms sind eine Eventloop-Deadline ausschließlich für
  asynchrones Fetch- und Streamwarten, keine harte Echtzeitgrenze und keine
  Grenze der anschließend synchronen Decodierung oder des Parsings. Ein
  expliziter `active → success | transportFailure | deadline`-Eigentümer
  entscheidet zuerst; synchroner Timer-Callback gewinnt vor Fetch, während
  später erhaltene Handles trotzdem genau einmal bereinigt werden. Timer- und
  Fetch-Throw gewinnen nur aus dem aktiven Zustand. `fetchStarted` wird direkt
  vor dem Seam-Aufruf gesetzt; jeder danach gewinnende Transportfehler oder die
  Deadline abortiert den Controller höchstens einmal nicht blockierend, auch
  bei Fetch-Throw/-Rejection und jedem späteren Response-, Header-, Body-,
  Reader-, Chunk-, Cap-, EOF-, Release-, UTF-8-, JSON- oder Handoff-Fehler. Vor
  Fetch und bei Erfolg bleibt Abort nullmal; Readercleanup kommt erst nach
  Readerübernahme hinzu.
- Vor jedem erfassten `Promise.prototype.then` auf Fetch-, Read- oder
  Cleanup-Promise werden ohne fremden Zwischenhook exakter Same-Realm-
  Promiseprototyp, leere Own-Keys ohne eigene `constructor`, unveränderte Kette,
  ursprünglicher Constructor-Datendescriptor samt Konstruktoridentität und
  ursprünglicher Species-Accessordescriptor samt Getteridentität geprüft.
  Brand-, Descriptor-, Species- oder Applyfehler scheitern. Es gibt weder
  `Promise.resolve` noch freien `.then`-Zugriff. Alle kontrollierten
  Settlementhandler fangen beherrschte Throws, prüfen bei spätem Settlement
  zuerst den Owner und geben auf jedem Pfad ausschließlich primitives
  `undefined` zurück, sodass der unbenutzte Folgepromise keinen Fremdwert
  assimiliert.
- Responsefelder werden fail-fast in der Reihenfolge `status`, `redirected`,
  `url`, `type`, `headers`, `body` jeweils genau einmal gelesen und sofort
  geprüft; ein Fehler liest alle späteren Felder nullmal. Non-200 stoppt nach
  `status`, abortiert höchstens einmal und liest weder Header noch Bodymethode.
  `headers.get` wird einmal aufgelöst; `content-type`, `content-length`,
  `content-encoding` werden nur nach bestandener Vorprüfung je einmal gelesen
  und sofort geprüft, bevor `body` gelesen wird. Nur HTTP `200`, keine
  Umleitung, exakte finale URL, Typ `cors`, exakter JSON-/UTF-8-Content-Type und
  eine kanonische browserexponierte Content-Length bis 16.384 öffnen den Body.
- Der browserexponierte Content-Encoding-Wert muss exakt `null` sein.
  `Content-Encoding` ist nicht CORS-safelisted und wird vom aktuellen Gateway
  nicht zusätzlich exponiert; `null` belegt deshalb nur gefilterte
  Unsichtbarkeit, weder Wire-Abwesenheit noch fehlende Browserdekompression.
  Ein exponierter nicht-null-Wert scheitert. Das Cap zählt browserexponierte,
  möglicherweise bereits decodierte Bytes; die Gleichheit von
  browserexponierter Content-Length und kopierten Bytes ist nur ein enger
  Gateway-Kompatibilitätscheck, kein Kompressions- oder Wire-Oktett-Beweis. Der
  aktuelle Gateway und seine CORS-Header bleiben unverändert. Ein sichtbarer
  Nachweis benötigt einen neuen Gateway-/CORS-Slice.
- `getReader` und dessen `read`, `cancel`, `releaseLock` werden jeweils nur
  einmal aufgelöst. Serielle Reads akzeptieren ausschließlich gewöhnliche
  exakte Iteratorresults. Ihre Own-Key-Sequenz wird einmal als exakt `value`,
  `done` erfasst; danach folgen die Deskriptoren je einmal in der Reihenfolge
  `done`, `value` und keine Rereads;
  beobachtbare Proxyinkonsistenzen scheitern, ohne transparente Record-Proxies
  universell erkennen zu wollen. `done: true` verlangt exakt
  `value: undefined`. `done: false` verlangt einen echten nicht abgeleiteten,
  brand-geprüften `Uint8Array` mit sicherer positiver Ganzzahl-ByteLength. Ein
  Nullchunk scheitert nach genau diesem Read ohne Kopie oder zweiten Read und
  führt zu Abort und Cleanup; dadurch sind höchstens 16.384 akzeptierte
  Nicht-EOF-Reads möglich.
- Der Chunkbuffer wird über erfasste Intrinsics als echter fester Same-Realm-
  `ArrayBuffer` mit exakt erfasstem `ArrayBuffer.prototype` geprüft.
  SharedArrayBuffer, Growable SharedArrayBuffer, Proxy, fremder Buffer,
  detached Buffer, malformed Buffer, falscher Bufferprototyp und, sofern
  prüfbar, resizable Buffer werden abgelehnt.
  Der einzige transport-eigene Zielbuffer ist ebenfalls fest und nicht
  geteilt. Zwischen letzter Prüfung und sofortiger Kopie liegt kein fremder
  Hook; die Chunkidentität wird nicht behalten. Byte 16.385 scheitert vor
  Kopie, weiterer Allokation oder weiterem Read. Erfolg verlangt EOF, exakte
  Längengleichheit, null Cancel und genau ein erfolgreiches Release; Fehler und
  Deadline versuchen Cancel/Release jeweils höchstens einmal best effort.
- Vor der synchronen Terminalphase wird der Timer disarmed und genau einmal
  bereinigt. Erfasstes `TextDecoder.prototype.decode` läuft mit korrektem
  Receiver, `fatal: true` und `ignoreBOM: true`, sodass eine BOM als U+FEFF
  sichtbar bleibt. Danach folgt genau ein erfasstes natives `JSON.parse` ohne
  Reviver, Trim, Reparatur oder Normalisierung. Primitive JSON-Werte sind
  zulässig; Objekte und Arrays müssen ihre exakten erfassten Prototypketten bis
  `null` besitzen, und die erfassten Object-/Array-Prototypen dürfen keine
  eigene `then`-Property besitzen. Ein eigenes `then` am Top-Level darf nur eine nicht
  aufrufbare Dateneigenschaft sein. Erst dieser geschlossene Wert erfüllt das
  bereits erzeugte native Promise unmittelbar; Validierung und Korrelation der
  SyncResponse bleiben unverändert beim SyncService.
- Alle beherrschten Methodenfehler rejecten mit demselben gewöhnlichen, tief
  eingefrorenen exakten Zwei-Felder-Record
  `BROWSER_SYNC_TRANSPORT_FAILED` / `Der lokale Browser-SyncTransport ist fehlgeschlagen.`,
  ohne URL, Status, Header, Body, Request-ID, Exceptiondetails oder Logging.
  Factory-`TypeError` bleibt davon getrennt. Fetch-/Wire-/Decode-/Parsefehler
  werden im Service `transportFailed`; parsebares ungeeignetes oder falsch
  korreliertes HTTP-200-JSON und frühe Gatewayresponses bleiben
  `invalidResponse`.
- Browserseitige Request-Metadaten ausdrücklich nicht verschwiegen: Die App
  setzt keine Cookies, Credentials, Authorization, Referrer, privaten Payload,
  Provider-Secrets, Logs oder Telemetrie; der Browser kann trotzdem Origin,
  User-Agent, Accept/Accept-Language, Sec-Fetch-*, Client Hints und PNA/LNA-
  Metadaten an den lokalen Port senden. `credentials: "omit"`,
  `no-referrer`, Loopback und CORS sind weder Anonymitäts-, Datenschutz-,
  Authentisierungs- noch Autorisierungsbeweise.
- Die isolierte Implementierung und ihre mutationswirksame Unit-Suite unter
  `tests/browserSyncTransport.test.js` bleiben vollständig netzwerkfrei und
  verwenden ausschließlich Doubles. Die Matrix umfasst zusätzlich exakte
  Root-/Payload-Trapfolge, nur denselben frischen Graphen als genau zweimaligen
  Validatorinput, Constructor-/Species-Mutationen und `undefined`-Handler,
  Nullchunk nach einem Read, native `value`-/`done`-Keyfolge, Shared-/Resizable-/
  Detached-Buffer, Abort jedes Post-Fetch-Fehlerprofils, null Abort vor Fetch
  und bei Erfolg, fail-fast Getter-/Headerzahlen sowie gefiltertes
  Content-Encoding `null` gegenüber exponiertem Nicht-null ohne Wireclaim. Vor Browserkomposition oder End-to-End-
  Slice muss ein getrenntes, reales und an OS, Browserversion, Frontend-Origin
  und -Kontext sowie Endpoint gebundenes Gate CORS/Preflight, Private/Local
  Network Access, Browserberechtigungen, Secure Context/Mixed Content,
  Loopbackziel, Redirect, sichtbare und blockierte Responseheader, finale URL,
  Response-Typ, Browserunterschiede und nötige Benutzerfreigaben als `PASS`
  belegen. Das Ergebnis bleibt kontext- und versionsgebunden und ist keine
  allgemeine Browsergarantie. Benötigte Header-, Permission- oder CORS-Änderungen öffnen
  ADR 0020/0026 neu; es gibt keinen Fallback.
- Den Tor-A-Befund ausschließlich auf diesen dokumentarischen Slice begrenzt.
  Vor Merge der Implementierung werden deren tatsächlicher Code, Browser-APIs,
  Dependencies und Datenflüsse erneut auf fehlende Modelle, modell-, lern- oder
  statistikbasierte Inferenz, Training, Lernen oder Adaptieren, Provider,
  Workflows, private Payloads, Telemetrie, Persistenz und fachliche
  Nebenwirkungen geprüft. Browserkomposition und reale menschliche Interaktion
  erhalten ein eigenes vollständiges scopegebundenes Gate. Das Ergebnis bleibt
  eine vorläufige Arbeitshypothese, keine Rechtsberatung oder Compliancegarantie.
- Keinen Code, Test, Fetch, Browser-, UI- oder `src/main.js`-Pfad, keinen
  Provider, Cloudfluss, private Daten, Storage, Logging, Telemetrie, Bundle,
  Evidence oder Dependency geändert. Nächster separat freizugebender Slice ist
  ausschließlich die isolierte Implementierung samt vollständiger
  mutationswirksamer Matrix in `tests/browserSyncTransport.test.js`; das reale
  Browser-Runtimegate und der Browser-End-to-End-Fluss folgen getrennt.
- Die Dokumentationsänderung mit der vollständigen seriellen Suite bei
  1332/1332 Tests, 0 Fehlschlägen, 0 Skips und 0 Todos verifiziert. Der
  Produktions-Build transformiert weiterhin exakt 46 Browsermodule, und der
  schreibfreie `bundle:n8n:check` meldet keinen Drift.

### Local SyncGateway–SyncAgent Composition – Implementierung

- Den durch ADR 0025 entschiedenen lokalen In-Process-Pfad umgesetzt.
  `server/startLocalSyncGateway.js` erzeugt nach gültiger Runtimekonfiguration
  genau eine lokale SyncAgent-Instanz pro HTTP-Server-Factory und injiziert sie
  als erforderliche Dependency; Import und ungültige Konfiguration starten
  weiterhin weder Agent noch Listener.
- Die HTTP-Factory ohne versteckten Agentendefault gehärtet. Sie löst
  `syncAgent.processSyncRequest` vor dem Serveraufbau genau einmal sicher auf
  und verwendet dieselbe Funktion mit demselben Receiver. Ausschließlich die
  exakte defensive Boundary-Requestidentität erreicht den Agenten synchron, mit
  exakt einem Argument und pro akzeptiertem Requestpfad höchstens einmal; es
  gibt weder Await, Promise-/Thenable-Auflösung, Retry noch Fallback.
- Das unvertrauenswürdige Agentenresultat gegen die exakte tief eingefrorene
  ADR-0024-Erfolgsform und dessen normale Response gegen denselben Boundary-
  Request geprüft. Nur daraus entsteht descriptor-basiert ein frischer,
  erneut validierter und tief eingefrorener Zehn-Felder-Responsegraph ohne
  übernommene fremde verschachtelte Identitäten.
- Die terminale Erfolgsgrenze mit bei Modulevaluation erfassten Object-/Array-
  Prototypen, Reflection-, Freeze-/Frozen-, Array- und JSON-Funktionen
  umgesetzt. Exakte Own-Data-Properties, Frozen-Zustand, feste
  Prototypketten bis `null`, eigene `toJSON`-Properties und die genau einmalige
  Vorabserialisierung werden fail-closed geprüft.
- Der exakt leere synthetische `syncTest` endet im explizit gestarteten lokalen
  Gateway nun ausschließlich mit der defensiven normalen SyncResponse und HTTP
  `200`. Kontrollierte Boundary-Ablehnungen bleiben HTTP `400`; Agenten-,
  Projektions-, terminale Prüf- oder Vorabserialisierungsfehler ergeben
  ausschließlich das statisch redigierte HTTP-`500 gatewayFailed`-Profil. Der
  bisherige statische `503 upstreamUnavailable`-Pfad und seine nicht mehr
  erreichbaren Fixtures wurden entfernt.
- Den bestehenden Gateway-Lifecycle und seine alleinige HTTP-, Header-, CORS-,
  Serialisierungs-, Socket- und Cleanup-Verantwortung unverändert beibehalten.
  Weder ein Browser-SyncTransport noch ein Cloud-, n8n-, Modell-, Provider-,
  Workflow-, Credential-, Persistenz-, Logging-, Telemetrie- oder privater
  Datenpfad wurde ergänzt.
- Der nächste Slice entscheidet und definiert ausschließlich den Browser-
  SyncTransport-Vertrag. Seine Implementierung und der lokale Browser-End-to-
  End-`syncTest` folgen getrennt; lokale Missbrauchs-, Parallelitäts-, Zeit-
  und Ressourcenbegrenzung beginnt erst nach diesem End-to-End-Pfad.
- Die enge vorläufige Phase-0-/Nicht-KI-Arbeitshypothese bleibt ausschließlich
  auf diesen deterministischen modellfreien lokalen Slice begrenzt und ist kein
  Compliance-Siegel. Die fokussierte Local-SyncGateway-Suite besteht mit 67/67
  Tests, die kombinierte serielle Sync-Suite mit 312/312 Tests und die
  vollständige serielle Gesamtsuite mit 1332/1332 Tests; alle drei Läufe haben
  0 Fehlschläge, 0 Skips und 0 Todos. Der Produktions-Build transformiert
  weiterhin exakt 46 Browsermodule; der schreibfreie Bundle-Check meldet keinen
  Drift.

### Local SyncGateway–SyncAgent Composition / ADR 0025

- ADR 0025 am `2026-08-23` als reinen Dokumentations- und Entscheidungsslice
  angenommen. Er ergänzt ADR 0023, erfüllt das von ADR 0024 verlangte
  Entscheidungsgate und verändert weder ADR 0023/0024 noch die Grundlagen aus
  ADR 0016, ADR 0017, ADR 0018 und ADR 0020.
- Die spätere Komposition ausschließlich im bestehenden lokalen Gateway-
  Prozess auf GD-WS01 entschieden. `server/startLocalSyncGateway.js` bleibt der
  einzige Produktions-Kompositionsroot; ein zweiter Listener, Dienst, IPC-,
  Worker-, Queue-, Browser- oder Providerpfad ist ausgeschlossen.
- Die exakte Übergabe der defensiven Boundary-Requestidentität, höchstens einen
  synchronen SyncAgent-Aufruf sowie die fail-closed Prüfung und frische
  Zehn-Felder-Projektion der unvertrauenswürdigen Agentenresponse festgelegt.
  Das Gateway bleibt alleiniger HTTP-Response-, Serialisierungs-, CORS-,
  Socket- und Cleanup-Owner.
- Die terminale Serialisierungsgrenze präzisiert: Das spätere Gateway-Modul
  erfasst Object-/Array-Prototypen, Reflection-, Freeze-/Frozen-Funktionen,
  `Array.isArray` und `JSON.stringify` bei Modulevaluation. Nach der letzten
  untrusted Reflection werden exakte Prototypen, Own-Data-Properties, Freeze
  sowie mit der erfassten `Object.getPrototypeOf`-Referenz exakt die Kette
  `capturedArrayPrototype → capturedObjectPrototype → null` geprüft. Zulässig
  sind ausschließlich `Response-Record → capturedObjectPrototype → null` und
  `Response-Array → capturedArrayPrototype → capturedObjectPrototype → null`.
  Erst danach werden der
  erfasste Array- und anschließend der erfasste Object-Prototyp auf eine eigene
  `toJSON`-Property geprüft; dann folgt genau ein Aufruf der erfassten
  Erfolgsserialisierung. Eine Kettenabweichung ergibt vor Responsebesitz
  statisch `500 gatewayFailed`, ruft die Erfolgsserialisierung nullmal auf und
  serialisiert den kompromittierten Graphen nicht. Fremder Body, Sentinel und
  Exceptiontext werden nicht ausgegeben; eine zweite Response entsteht nicht.
- Für den späteren Implementierungsslice die mutationswirksame Regression mit
  einem zwischen beide erfassten Prototypen eingeschobenen `toJSON`-Objekt und
  privatem Test-Sentinel festgelegt. Die bisherigen direkten Prototyp- und Own-
  `toJSON`-Prüfungen bestehen dabei, nur die neue Kettenprüfung lehnt vor der
  Serialisierung ab. `concurrency: false`, vollständiger `finally`-Restore und
  eine saubere Kontrollprobe der exakten Kette mit genau einem erfassten
  Erfolgsserialisierungsaufruf bleiben verbindlich. Der Restore umfasst die
  ursprüngliche Prototypkette, globalen Funktionen und Descriptoren; Code und
  Tests fehlen.
- Die synchrone Handoff-Grenze als ausdrückliche Nicht-Assimilation gefasst:
  kein `await`, `Promise.resolve` oder Promise-/Thenable-Auflösen. Ein echter
  Promise, ein Result mit zusätzlicher eigener `then`-Property oder ein
  anderweitig malformed Result scheitert an der exakten Resultform; geerbtes
  oder virtuell
  angebotenes `then` wird nicht eigens gelesen und keine universelle
  Proxy-/Thenable-Erkennung behauptet.
- Für den späteren gültigen Erfolgsweg HTTP `200`, für Agenten-, Projektions-,
  Freeze-, Revalidierungs- und Serialisierungsfehler statisch
  `500 gatewayFailed` entschieden. Der aktuelle Implementierungsstand bleibt
  unverändert: Akzeptierte Requests enden weiterhin mit HTTP `503`.
- Den engen Phase-0-/EU-Tor-A-Nachweis ohne Compliance-Siegel dokumentiert:
  kein Modell und keine modell-, lern- oder statistikbasierte Inferenz, kein
  Training, Lernen oder Adaptieren, sondern feste Validierungs-, Projektions-,
  Korrelations- und Mappingregeln mit deterministischem Output bei stabilem
  Request und Clockwert. Das Inhalts-Payload ist bestimmungsgemäß exakt leer,
  und es gibt keinen Zugriff auf PromptVault, LearningHub, LichtwaldLog oder
  GoldenDawn-Vault und keine bestimmungsgemäße Verarbeitung oder Übertragung
  privater Inhalte; Contractmetadaten können dennoch private Bedeutung codieren
  und beweisen weder Nicht-Privatheit noch Datenschutz.
  Die Einordnung bleibt eine vorläufige Arbeitshypothese, keine Rechtsberatung.
- Das Register um die direkten lokalen ADR-0016-/0018-/0020-/0024-, Node.js-
  und Lockfile-Abhängigkeiten sowie den noch unkomponierten SyncService aus ADR
  0017 ergänzt. Jan bleibt Projektowner und erteilt Implementierungs- sowie
  lokale Start-/Betriebsfreigaben ausdrücklich; ADR, Import oder Codex-Lauf
  starten nichts. Nutzung durch andere, Hosting und externer Betrieb bleiben
  unfreigegeben und neubewertungspflichtig.
- ADR 0021, ADR 0022 und Evidence-Schema 1 bleiben unkomponiert und
  unverändert: kein `overallGate`, `stableOssCompatibility: FAIL`, Tenant-,
  Provider-/Execution- und Production-Evidenz `UNPROVEN` sowie
  `activationDecision: FAIL`.
- Keine Code-, Factory-, Contract-, Schema-, Paket-, Evidence- oder
  `503`-Änderung vorgenommen. Nächster Slice ist ausschließlich die
  Implementierung der durch ADR 0025 entschiedenen lokalen Komposition;
  Browsertransport, lokaler End-to-End-Fluss, Betriebsgrenzen und Provider
  folgen später getrennt.
- Den unveränderten technischen Stand lokal verifiziert: serielle Gesamtsuite
  mit 1315/1315 Tests, 0 Fehlern, 0 Skips und 0 Todos; Produktions-Build mit
  exakt 46 transformierten Modulen; n8n-Bundle-Check ohne Drift; tracked und
  neue untracked ADR ohne Whitespacefehler.

### Local Model-free SyncAgent Core Foundation / ADR 0024

- ADR 0024 am `2026-08-22` angenommen. Die Entscheidung ergänzt ADR 0023,
  ersetzt keinen bestehenden ADR und friert ausschließlich Modulort,
  JavaScript-API, Synchronität, lokalen Resultvertrag, Clock- und
  `durationMs`-Semantik, Revalidierungsfolge, erfolgreiche lokale
  `syncTest`-Response sowie Importinaktivität und fehlende Komposition ein.
- `src/agents/syncAgent.js` als vollständig lokalen, modell- und providerfreien
  Kern ergänzt. Das Modul exportiert exakt `createSyncAgent`; die Factory
  `createSyncAgent({ getCurrentTimestamp = defaultUtcClock } = {})` liefert
  eine frische gewöhnliche und eingefrorene API exakt mit
  `processSyncRequest`.
- `processSyncRequest(syncRequest)` synchron mit genau einem formalen Parameter
  und exakt einem zulässigen Argument umgesetzt. Die Methode liefert niemals
  ein Promise oder Thenable. Jeder Aufruf erzeugt einen frischen, gewöhnlichen
  und tief eingefrorenen Vier-Felder-Result aus exakt `ok`, `status`,
  `syncResponse` und `error`; `syncResponseCreated`, `invalidInvocation`,
  `syncRequestRejected` und `agentFailed` bleiben statisch getrennt.
- Auf jedem zulässigen Einargumentpfad die Clock exakt einmal ausgewertet. Nur
  ein primitiver String wird unverändert als Referenzzeit und Response-
  `timestamp` übernommen; Clock-, Referenzzeit- und unerwartete interne Fehler
  werden statisch redigiert. `durationMs: 0` bleibt ausdrücklich ein statischer,
  ungemessener Wert ohne zweite Clock oder Timer.
- Den unveränderten Caller-Request vor jeder Projektion vollständig validiert.
  Erst danach entsteht descriptor-basiert eine frische Sechs-Felder-Projektion
  mit neuem exakt leerem Payload; sie wird validiert, tief eingefroren und final
  erneut validiert. Die neue normale Erfolgsresponse wird gegen denselben
  stabilen internen Request validiert, tief eingefroren und final erneut
  validiert. Fremde Record- oder Arrayidentitäten werden nicht übernommen.
- Bei erfolgreicher Modulevaluation private Referenzen auf `Object.freeze`,
  `Object.isFrozen`, `Object.getPrototypeOf`,
  `Object.getOwnPropertyDescriptor`, `Object.hasOwn` und `Reflect.ownKeys` sowie
  die gewöhnliche `Object.prototype`-Identität erfasst. Ausschließlich der
  terminale Verifier für Factory-API, Errorrecords sowie Failure- und Success-
  Results verwendet die erfassten Reflection-Referenzen und prüft ohne live
  Array-Prototypmethoden oder Iteratoren exakte Datenfelder, feste Werte,
  Identitäten und tatsächlichen Freeze-Zustand. Interne Request-/Response-
  Reflection und `Object.freeze` bleiben live; beobachtete Reflection- oder
  Freeze-Throws, No-ops, Mutationen oder Inkonsistenzen führen redigiert zu
  `agentFailed`. Nach dem Import ersetzte globale terminale Reflection-,
  Freeze- oder Frozen-Funktionen können keine mutable oder korrumpierte
  terminale Ausgabe erzeugen.
- Ausschließlich die erfolgreiche, korrelierte und synthetische `syncTest`-
  Response mit `handledBy: "SyncAgent"`, `processedBy: ["SyncAgent"]`, leeren
  `warnings`, `error: null` und `durationMs: 0` erzeugt. Lokale Ablehnungen und
  interne Fehler bleiben statische lokale Results und werden nicht in normale
  Contract-Fehlerresponses umgeschrieben.
- Der Modulimport startet nichts. Die Factory ruft die aufgelöste Clockfunktion
  nicht auf und startet selbst kein I/O, keinen Timer und keinen Providerpfad;
  ihre Parameterdestrukturierung löst jedoch die vertrauenswürdige
  Composition-Property `getCurrentTimestamp` auf. Ein Accessor oder Proxy im
  Container kann deshalb während der Factory-Erzeugung ausgeführt werden oder
  werfen; dies liegt außerhalb des Methoden-Resultvertrags. Erst
  `processSyncRequest` mit exakt einem Argument ruft die aufgelöste
  Clockfunktion genau einmal auf. Der Kern besitzt keinen Transport-, Provider-,
  Modell-, Workflow-, Storage-, Logging- oder privaten Modulpfad und ist weder
  mit dem lokalen SyncGateway noch mit dem Browser komponiert. Lokal akzeptierte
  HTTP-Requests enden weiterhin statisch mit `503`; es existiert kein externer
  Produktdatenfluss.
- Ausdrücklich nicht garantiert sind vor der Modulevaluation kompromittierte
  Primordials, veränderter Modulcode oder lexikalische Bindungen, eine
  kompromittierte JavaScript-Engine, OOM oder Prozessabbruch und beliebig
  koordinierte Manipulation sämtlicher Reflection-Intrinsics. Same-Realm-
  Ausführung und Deep Freeze bleiben keine Sandbox.
- Die Command-Center-Copy auf den implementierten isolierten Kern aktualisiert.
  Nächster Slice ist ausschließlich die kontrollierte lokale Gateway-/SyncAgent-
  Komposition; Browsertransport und optionale Provider bleiben außerhalb.
- Die gezielte SyncAgent-Suite besteht mit 103/103 Tests, die vier kombinierten
  Sync-Suites mit 245/245 Tests und die vollständige serielle Suite mit
  1315/1315 Tests, jeweils bei 0 Fehlschlägen, 0 Skips und 0 Todos. Der
  Produktions-Build transformiert weiterhin exakt 46 Module; der schreibfreie
  n8n-Bundle-Driftcheck besteht.

### Lokaler SyncAgent vor optionalen externen Providern / ADR 0023

- ADR 0023 am `2026-08-21` als dokumentarische Architektur- und
  Sicherheitsentscheidung angenommen und ADR 0002 sowie ADR 0019 formal
  ersetzt. Der weiterhin gültige Kern bleibt erhalten: `SyncService` ist die
  einzige Kommunikationsschicht des Browsers, der `SyncAgent` der einzige
  Einstieg und Router des Agentensystems, UI und Browser wählen keinen
  Fachagenten oder Provider direkt, Version 1 bleibt auf `SyncAgent`,
  `DataAgent` und `TestAgent` begrenzt, und das lokale SyncGateway ist kein
  vierter Agent.
- Die neue Zieltopologie als `GoldenDawn-Browser → SyncService → späterer
  lokaler SyncTransport → lokales SyncGateway auf GD-WS01 → lokaler SyncAgent
  → lokal validierte und korrelierte SyncResponse` entschieden. Der lokale
  SyncAgent wird die autoritative Policy-, Validierungs-, Routing- und
  Antwortgrenze des Agentensystems.
- Den ersten SyncAgent-Kern ausschließlich für den bestehenden leeren,
  synthetischen und nebenwirkungsfreien `syncTest` als vollständig lokal,
  deterministisch, modellfrei und providerfrei festgelegt. Er setzt keinen
  ModelProvider, WorkflowProvider, n8n-, OpenAI- oder lokalen Modelladapter als
  Dependency voraus.
- `ModelProvider` und `WorkflowProvider` nur als getrennte konzeptionelle
  spätere Portklassen festgelegt, ohne Signaturen, Methoden, Schemas oder
  Dateien zu definieren. Provider, Modell, Workflow, Endpoint und Umgebung
  dürfen ausschließlich aus vertrauenswürdiger lokaler Composition stammen,
  niemals aus Browserwerten, Requestfeldern oder Modelloutput.
- n8n Cloud, self-hosted n8n, OpenAI und lokale Modelle ausschließlich als
  standardmäßig deaktivierte, optionale spätere Provider eingeordnet. Kein
  Adapter ist durch ADR 0023 autorisiert. Provider erhalten später höchstens
  eine explizite minimierte neue Projektion; ursprüngliche Browserbytes,
  Browserheader, URL, Query und Serialisierung werden nicht weitergegeben.
- Die lokalen Gateway-Invarianten aus ADR 0020 unverändert übernommen. ADR 0021
  bleibt angenommen; Bundle und Manifest bleiben korrekte, nicht komponierte
  und nicht aktivierte n8n-Derivate. ADR 0022 bleibt vollständig unverändert
  und dokumentiert den gescheiterten beziehungsweise unbewiesenen ursprünglichen
  n8n-Ingresspfad: Schema 1 besitzt kein `overallGate`, die festen Werte
  `stableOssCompatibility: FAIL`,
  `productionUrlMeasurementStatus: UNPROVEN` und
  `activationDecision: FAIL` bleiben bestehen.
- Für einen optionalen späteren n8n-Adapter einen neuen ADR, eine neue
  adapterbezogene Evidenz-Schemaversion und eine getrennte Webhook-/Credential-
  Entscheidung verlangt. Der bekannte Header-Auth-/Execution-Data-Befund
  bleibt ein Blocker; `Raw Body` ist kein erforderlicher Beweis ursprünglicher
  Browserbytes und darf nicht als solcher dargestellt werden.
- Die verbindliche weitere Reihenfolge auf lokalen SyncAgent-Kern, getrennte
  Gateway-/SyncAgent-Komposition, Browser-SyncTransport und lokalen End-to-End-
  `syncTest`, lokale Missbrauchs-, Parallelitäts-, Zeit- und Ressourcenlimits
  und erst danach getrennte Providerentscheidungen festgelegt. Der nächste
  Schritt ist ein separater Implementierungsplan für den vollständig lokalen,
  modellfreien und importinaktiven `syncTest`-SyncAgent-Kern.
- Keinen Produkt-, Test- oder Servercode, keinen Transport, Provideradapter,
  externen Datenfluss, Workflow, Webhook, Credential oder Secret ergänzt.
  Contractfelder, Validatorregeln, Evidence-Schema und feste Evidence-Werte
  bleiben unverändert. Bis zur späteren Gateway-/SyncAgent-Komposition enden
  lokal akzeptierte Requests weiterhin statisch mit HTTP `503`.
- Den unveränderten technischen Stand lokal erneut verifiziert: vollständige
  serielle Suite mit 1212/1212 Tests, 0 Fehlschlägen, 0 Skips und 0 Todos;
  erfolgreicher Produktions-Build mit exakt 46 transformierten Modulen;
  Bundle-Check driftfrei und `git diff --check` erfolgreich.

### n8n Cloud Ingress & Runtime Evidence Gate Foundation / ADR 0022

- ADR 0022 als angenommene Evidenz- und Stoppentscheidung ergänzt. Die vier
  Klassen dokumentierte Plattformgarantie, commitgebundene Beobachtung im
  offiziellen OSS-Code, Messung im konkreten Cloud-Tenant und workflowseitig
  nicht beobachtbare Provider-/Ingress-Eigenschaft bleiben strikt getrennt.
  Jedes Messgate besitzt exakt `PASS`, `FAIL` oder `UNPROVEN`; `FAIL` hat
  Vorrang. Selbst ein vollständig gebundener Test-URL-Tenantmessstatus `PASS`
  öffnet keine Aktivierung, sondern ist nur Input für die getrennte
  ADR-0019-Neubewertung. ADR 0022 ergänzt und blockiert ADR 0019, ersetzt ihn
  aber nicht.
- Als öffentlichen Stable-Bezugspunkt
  [`n8n@2.35.4`](https://github.com/n8n-io/n8n/releases/tag/n8n%402.35.4)
  am Commit `d2ce3c084c228622c2ffe7c245d25870430e18a9` festgehalten. Der
  [offizielle Body-Reader](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/middlewares/body-parser.ts)
  setzt für `gzip` einen Gunzip- und für `deflate` einen Inflate-Stream vor
  `req.rawBody`; das commitgebundene Gate für den Erhalt dieser Wire-Bytes ist
  deshalb `FAIL`. `br` fällt dort in den unveränderten Defaultpfad, ist dadurch
  aber weder als Cloud- noch als Tenantgarantie bewiesen.
- Im selben Stable-Stand vergleicht die
  [Header Authentication](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/nodes-base/nodes/Webhook/utils.ts)
  den Credentialwert, entfernt ihn aber nicht aus `req.headers`; der
  [Standard-Webhook-Output](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/nodes-base/nodes/Webhook/Webhook.node.ts)
  gibt diese Header weiter. Das commitgebundene Gate „Header-Auth-Secret nicht
  im Standard-Webhook-Output“ ist daher ebenfalls `FAIL`. Dies ist eine
  offizielle OSS-Quellbeobachtung und keine Behauptung über den Build eines
  konkreten Cloud-Tenants.
- Den commitgebundenen
  [Test-Webhook-Lifecycle-Quellanker](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/webhooks/test-webhooks.ts)
  ergänzt, ohne daraus nicht dokumentierte Symbol-, Zeilen- oder Tenantzusagen
  abzuleiten.
- Die importseitig und standardmäßig netzwerkinaktive lokale Foundation aus
  `scripts/n8n/n8nCloudIngressProbe.js`,
  `scripts/n8n/n8nCloudIngressProbeObserver.js`,
  `tests/n8nCloudIngressProbe.test.js` und
  `docs/evidence/n8n-cloud-ingress-runtime-evidence.template.json` ergänzt.
- Eine feste Registry aus exakt 32 synthetischen Vektoren festgelegt:
  gültiges und ungültiges JSON, ASCII und Mehrbyte-UTF-8, Vierbytezeichen, BOM,
  NFC/NFD, CRLF/Whitespace und NUL, vier ungültige UTF-8-Folgen, die
  65.535-/65.536-/65.537-Byte-Grenzen einschließlich eines Mehrbytegrenzfalls,
  fehlendes beziehungsweise `identity`-/`gzip`-/`deflate`-/`br`-Encoding und
  Expansion über 65.536 Bytes, fehlende/falsche/korrekte/doppelt gleiche
  Header Authentication sowie beide Reihenfolgen des widersprüchlichen
  Doppelheaders. Der alte `auth-duplicate-conflicting` entfällt zugunsten von
  `auth-duplicate-conflicting-correct-first-wrong-last` und
  `auth-duplicate-conflicting-wrong-first-correct-last`; `Content-Length`- und
  Chunked-Framing bleiben getrennt.
- Die Fixture-Identitäten geschlossen: alle Auth-Bodies sind identisch,
  absent/identity und `Content-Length`/Chunked teilen jeweils exakt denselben
  Body, die Größenfixtures sind A-Präfix-kompatibel und die
  `gzip`-/`deflate`-/`br`-Payloads besitzen denselben dekomprimierten Sentinel;
  der Expansionsvektor bleibt die getrennte 65.537-Byte-Grenzprobe.
- Den kanonischen und vorgesehenen Operator-Laufweg für einen One-shot als
  `npm run probe:n8n:cloud:test -- --vector <probeId>` festgelegt; das
  Paket-Script bindet exakt `node scripts/n8n/n8nCloudIngressProbe.js --run`.
  Import, bloße Factory-Erzeugung, Build, Tests, Dev-Server und Bundle-Check
  binden keinen Real-HTTPS-Transport.
  Endpoint und
  Wegwerfsecret werden nur aus
  `GOLDENDAWN_N8N_CLOUD_PROBE_ENDPOINT` und
  `GOLDENDAWN_N8N_CLOUD_PROBE_SECRET` gelesen. Das Tool akzeptiert nur HTTPS
  ohne URL-Userinfo, Query oder Fragment und ausschließlich kanonische Pfade
  der Form `/webhook-test/<segment>[/<segment>…]`. Jedes nicht leere
  Suffixsegment besteht nur aus ASCII-Buchstaben, Ziffern, Bindestrich oder
  Unterstrich. Prozentkodierungen, rohe oder kodierte Backslashes,
  Steuerzeichen, leere Segmente sowie `.` und `..` werden vor der
  Transportauflösung abgelehnt. Das Tool verwendet eine feste Deadline von
  5.000 ms und höchstens 16 KiB Responsebytes, folgt keinen Redirects und
  wiederholt keinen Request. Nach vollständiger Argument-, Konfigurations- und
  ID-Validierung sendet es genau einen allowlist-validierten Vektor in genau
  einem HTTPS-Request an diese Test-URL und stoppt. Vor jedem nächsten Vektor
  muss der Operator den Test-Webhook manuell neu registrieren beziehungsweise
  in Listening versetzen. Es gibt keinen Sweep, kein Autoregister und keinen
  Production-URL-Runner. Die Factory verwendet ausschließlich einen explizit
  injizierten Transport; nur der CLI-Adapter darf danach Real-HTTPS binden.
- Den menschenprüfbaren importfreien Code-Node-Observer auf die offiziell
  dokumentierte API
  [`this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName)`](https://docs.n8n.io/build/code-in-n8n/cookbook/code-node/get-the-binary-data-buffer/)
  und die sechs erlaubten Rückgabefelder `probeId`, `exactMatch`,
  `receivedByteLength`, `strictUtf8Outcome`,
  `authorizationHeaderPresence` und `contentEncodingOutcome` begrenzt. Er komponiert weder
  SyncContract, Request Boundary, Boundary-Bundle noch `SyncAgent` und parst
  keinen fachlichen SyncRequest.
- Observerresponse, Runnerresult und Evidenzvorlage als geschlossene,
  allowlist-basierte Verträge umgesetzt. Unbekannte Felder, Accessors, Symbole,
  unbekannte Semantik und unvollständige Beobachtung werden nicht positiv
  normalisiert. Ausgabe und persistierbare Evidenz bleiben statisch redigiert:
  Endpoint, Tenantdomain, URL-Pfad, Secret, Credential-/Authorization-Werte,
  Header, Bodies, Bytes und Base64 werden nicht ausgegeben oder gespeichert.
  `executionDataSettings` besitzt zusätzlich zu den vier Save-/Pruning-Feldern
  exakt `readTimeRedaction`. Aktivierte Read-time-Redaction ist notwendig, aber
  nicht hinreichend: Die
  [offizielle Dokumentation](https://docs.n8n.io/deploy/host-n8n/configure-n8n/security/redact-execution-data/)
  sagt ausdrücklich, dass sie gespeicherte Daten nicht verändert. Unsichere
  beobachtete Save-/Redaction-Einstellungen ergeben `FAIL`, fehlende Angaben
  `UNPROVEN`.
- Das geschlossene Evidenz-Schema 1 auf die getrennten Statusfelder
  `testUrlTenantMeasurementStatus`, `stableOssCompatibility`,
  `providerExecutionEvidenceStatus`, `productionUrlMeasurementStatus` und
  `activationDecision` festgelegt; `overallGate` entfällt. `endpointKind` ist
  exakt `test`, Stable-OSS-Kompatibilität und Aktivierungsentscheidung sind
  unveränderlich `FAIL`, der Production-URL-Messstatus unveränderlich
  `UNPROVEN`. `activationDecision: PASS` wird in Schema 1 immer abgelehnt;
  Änderungen dieser festen Werte benötigen einen neuen ADR und eine neue
  Schemaversion. Ohne Lauf bleiben Test-URL-Tenant- und Providerstatus
  `UNPROVEN`, `cleanupConfirmed` ist `false`. Provider-`PASS` verlangt
  zusätzlich nicht-nullische Werte für `tenantAlias`, `observedAt`, `timezone`,
  `n8nBuild`, `webhookNodeTypeVersion` und `secretFreeWorkflowSha256`; `plan`
  und `region` dürfen `null` bleiben. Fehlt mindestens eine dieser sechs
  Pflichtbindungen, bleibt der Providerstatus ohne bekannten Widerspruch
  `UNPROVEN`; bekannte unsichere Setting-, Header-, Count- oder
  Attributionswerte behalten mit `FAIL` Vorrang.
- Jedes Vektorergebnis auf exakt `probeId`, `expectedByteLength`,
  `observedByteLength`, `expectedSha256`, `httpStatus`, `observerCallCount`,
  `workflowExecutionCount`, `uniqueVectorAttribution`, `exactMatch`,
  `strictUtf8Outcome`, `authorizationHeaderPresence`,
  `contentEncodingOutcome` und `gate` begrenzt. Nullable Counts werden nie aus
  HTTP-Antworten erfunden. Bei einer übernommenen geschlossenen erfolgreichen
  `2xx`-Observerresponse muss jeder bekannte Count exakt `1` sein; `0` oder ein
  Wert größer als `1` ist `FAIL`. `null` bleibt bei normalen und komprimierten
  Erfolgswegen als „noch nicht separat gebunden“ zulässig. Frühe eindeutig
  gebundene Auth-Ablehnungen mit `400`, `401` oder `403` und Encoding-
  Ablehnungen mit `400` oder `415` dürfen weiterhin 0/0 verwenden;
  `auth-correct` verlangt unverändert 1/1. Auf jedem erfolgreichen eindeutig
  zugeordneten `2xx`-Observerpfad kann nur
  `authorizationHeaderPresence: absent` das Header-Teilgate bestehen lassen;
  `present` ist `FAIL`, `null` oder `unavailable` ist mindestens `UNPROVEN`.
  Provider-`PASS` verlangt die Abwesenheit auf allen solchen Erfolgswegen. Ein
  einzelnes Vektor-`PASS` kann weder den Test-URL-Tenantstatus noch die
  Aktivierungsentscheidung öffnen.
- Keinen n8n-Cloud-Aufruf ausgeführt und keinen Tenant, Workflow, Webhook oder
  Credential angelegt oder verändert. Der tenantgebundene Messstatus bleibt
  `UNPROVEN`; wegen der zwei negativen Stable-OSS-Befunde ist das aktuelle
  Aktivierungsgate `FAIL` und geschlossen. Auch unabhängig davon würde
  `UNPROVEN` die Aktivierung geschlossen halten.
- Nach der lokalen Foundation einen verbindlichen Stopp festgelegt. Eine
  temporäre Workflowanlage, ein Wegwerfcredential, synthetischer externer
  Test-URL-Traffic und jede Supportanfrage benötigen jeweils getrennte
  Freigaben. Die vorbereiteten Supportfragen einschließlich der rein
  informativen Frage nach Test-/Production-URL-Unterschieden wurden nicht
  gesendet und autorisieren keinen Productionlauf.
  Jedes `FAIL` oder `UNPROVEN` erzwingt sofortigen Stopp, Cleanup und die
  Neubewertung von ADR 0019 vor weiterer Cloudarbeit.
- Keinen produktiven Webhook, Cloud-Upstream, Browser-SyncTransport, operativen
  `SyncAgent`, normale SyncResponse oder Boundary-Bundle-Komposition ergänzt.
  Lokal akzeptierte SyncRequests enden weiterhin statisch mit HTTP `503`.
- Die gezielte Evidence-Suite besteht mit 26/26 Tests, Bundle und Boundary
  unverändert mit 115/115 und die kombinierte Sync-Suite einschließlich der
  Evidence-Foundation mit 279/279 Tests. Die vollständige serielle Gesamtsuite
  besteht mit 1212/1212 Tests; alle Läufe besitzen 0 Fehlschläge, 0 Skips und
  0 Todos. Beide neuen Skripte bestehen die Syntaxprüfung, der
  Produktions-Build transformiert weiterhin exakt 46 Browsermodule und der
  schreibfreie Bundle-Check meldet keinen Drift.
  Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
  `v0.2.2` bleiben unverändert.

### Generated n8n Boundary Bundle Foundation / ADR 0021

- ADR 0021 als angenommene Implementierungsentscheidung ergänzt. Die
  unveränderten Module `src/contracts/syncContract.js` und
  `src/gateways/syncGatewayRequestBoundary.js` bleiben die einzigen fachlich
  kanonischen Quellen. Der Entry ist eine kleine explizit gepflegte,
  manifestierte nichtfachliche Glue- und Quelldatei, der Generator gepflegtes
  Repository-Tooling. Ausschließlich Bundle und Manifest sind reproduzierbar
  generierte Derivate und keine manuell gepflegte zweite fachliche
  Implementierung.
- Den kleinen expliziten Entry
  `scripts/n8n/syncGatewayBoundaryBundleEntry.js` sowie den deterministischen
  Generator `scripts/n8n/generateSyncGatewayBoundaryBundle.js` ergänzt. Die
  bereits im Lockfile gebundene Vite-`8.1.4`-/Rolldown-Toolchain wird ohne neue
  Dependency oder Lockfile-Erweiterung verwendet.
- `npm run bundle:n8n:generate` als expliziten Erzeugen-/Aktualisieren-Modus und
  `npm run bundle:n8n:check` als schreibfreien Driftcheck ergänzt. Der
  Checkmodus vergleicht die erwarteten Bytes ausschließlich im Speicher und
  endet bei abweichendem Artefakt, Manifest oder kanonischer Quelle mit einem
  Fehlercode.
- Das eingecheckte, menschenprüfbare
  `artifacts/n8n/syncGatewayRequestBoundary.bundle.js` als eigenständiges,
  seiteneffektfreies Artefakt aus statischem Header und direkt bindbarem
  Expression-IIFE ohne Top-Level-`var` oder Globalmutation ergänzt.
  `"use strict";` ist der erste IIFE-Body-Prolog und kein Top-Level-Statement;
  nach dem Ausdruck folgt kein separates Semikolon-Statement. Die vollständigen
  Artefaktbytes sind unverändert hinter `const boundaryBundle =` bindbar. Ihre
  Auswertung liefert exakt die eingefrorene API
  `{ createSyncGatewayRequestBoundary }`; die Factory behält die bestehende
  Clock- und Gateway-ID-Injektion und liefert exakt die eingefrorene API
  `{ processSyncRawBody }`. Beim Laden wird kein Request verarbeitet und kein
  globaler Namespace mutiert.
- Die Vite-/Rolldown-Ausgabe mit `strict: true` und
  `attachDebugInfo: "none"` erzeugt, sodass keine potenziell pfadabhängigen
  `//#region …`-/`//#endregion`-Direktiven ausgegeben werden. Der Generator
  akzeptiert nur den exakten Modulgraphen und die vollständige erwartete
  Wrapperform, entfernt fail-closed ausschließlich den bekannten deklarativen
  Wrapper und bearbeitet fachlichen Code nicht textuell. Abweichende Quellen,
  Modulgraphen oder Ausgabeformen werden nicht heuristisch umgeschrieben.
- Contract, Boundary und Entry jeweils exakt einmal über sichere FileHandles
  gelesen. SHA-256 und Vite-Virtualmodule verwenden denselben danach
  unveränderlichen In-Memory-Snapshot; ein ABA-Wechsel der Live-Datei kann
  nicht unbemerkt andere Bundler- als Manifestbytes erzeugen.
- Den kanonischen Repository-Root, Zielordner und beide festen Outputpfade vor
  jedem Generate-Write auf Containment, von Node erkannte symbolische Links und
  Junctions sowie `realpath`-Abweichungen geprüft. Der Generator legt
  unvorhersagbar benannte Tempdateien exklusiv im verifizierten Zielordner an,
  prüft Identität und Bytes, ersetzt Artefakt vor Manifest und bereinigt ihm
  weiterhin identitätsgleich zuordenbare Tempdateien. Ein kontrolliert
  unterbrochenes Mischpaar wird vom Checkmodus abgelehnt. Die individuellen
  Replaces bilden keine atomare Paartransaktion und garantieren weder
  Power-Loss- noch Single-Writer-Sicherheit. Die portable Node-API attestiert
  nicht jeden Windows-Reparse-Tag; Schutz vor einem bösartigen gleichzeitigen
  Reparse-Austausch wird nicht behauptet.
- Das Bundle benötigt zur Laufzeit weder ESM- noch CommonJS-Imports und enthält
  kein `import`, `export`, `require()`, `eval()` oder `new Function()`. Es
  besitzt keine Netzwerk-, Dateisystem-, Prozess-, Environment-, Credential-
  oder Secretzugriffe, erzeugt keine Logs oder Telemetrie und erfindet keine
  Webhook-, `$json`-, `$input`-, `items`- oder andere n8n-Inputstruktur.
- Das deterministische Manifest
  `artifacts/n8n/syncGatewayRequestBoundary.bundle.manifest.json` ergänzt. Es
  enthält eine feste Schema-Version, den relativen Artefaktpfad und SHA-256
  über dessen exakte Bytes sowie die feste geordnete Folge aus Contract,
  Boundary und Entry mit ihren SHA-256-Hashes. Zeit, absolute oder temporäre
  Pfade, Hostname, Locale und zufällige Buildwerte sind ausgeschlossen.
- Reproduzierbarkeit auf byteidentische Artefakt- und Manifestbytes bei
  wiederholter Generierung und unterschiedlichen absoluten Arbeitsverzeichnissen
  begrenzt. Beide Dateien verwenden UTF-8 ohne BOM, ausschließlich LF, einen
  finalen Zeilenumbruch und keine Source Map.
- `tests/n8nSyncGatewayBoundaryBundle.test.js` für Generator-,
  Reproduzierbarkeits-, Integritäts-, Snapshot-/ABA-, Outputpfad-, Paritäts-
  und Mutationseigenschaften ergänzt. Die kanonische lokale Boundary bleibt
  das Referenzorakel; verglichen werden auch eigene Felder, Reihenfolge,
  Prototypen, Freeze-Zustand, Identitäten, Entkopplung, Redaction,
  Console-Stille und Dependency-Aufrufgrenzen.
- Temporäre Mutationen erkennen Bundle-Byteänderungen, Quelldrift ohne
  Regeneration, semantische Abweichungen sowie entfernte API-/Freeze-Garantien.
  Ein künstlicher privater Marker wird weder in kontrollierten Resultaten noch
  in Consoleausgaben offengelegt. Kanonische Dateien werden dafür nicht
  verändert.
- Den offiziellen n8n-Plattformstand auf den `2026-08-17` datiert: n8n Cloud
  erhält keine beliebigen externen npm-Imports durch die getrennte
  Self-Hosted-Modul-Allowlist; die Webhook-Option `Raw Body` belegt weiterhin
  weder ursprüngliche byteidentische Wire-Oktette noch eine Prüfung vor
  Provider-Allokation. Das versions- und tenantgebundene Laufzeitgate aus ADR
  0019 bleibt unverändert.
- Kein n8n-Workflow, Webhook, Credential, Secret, Authentisierungsheader,
  Cloudaufruf, Browser- oder Cloudtransport, operativer `SyncAgent`, normaler
  SyncResponse-Upstream, Retry, Rate Limit, Persistenz, Logging, Telemetrie, UI
  oder `src/main.js`-Komposition ergänzt. Das Local-SyncGateway-HTTP-Verhalten
  bleibt unverändert; es existiert weiterhin kein externer Datenfluss.
- Die abschließende Syntax-, gezielte Bundle-, kombinierte Sync-, vollständige
  serielle, Build-, Checkmodus- und Dateihygiene-Verifikation wurde mit den
  tatsächlich ausgeführten Ergebnissen beziffert. Die gezielte Bundle-Suite
  bestand mit 61/61 Tests; Bundle zusammen mit der SyncGateway Request Boundary
  bestand mit 115/115 Tests. SyncContract, SyncService, Boundary, Local
  SyncGateway und Bundle bestanden kombiniert mit 253/253 Tests; die
  vollständige serielle Gesamtsuite bestand mit 1186/1186 Tests. Alle Läufe
  hatten 0 Fehlschläge, 0 Skips und 0 Todos. Der Produktions-Build war
  erfolgreich und transformierte weiterhin exakt 46 Browsermodule; der
  Bundle-Check meldete keinen Drift. Das aktuelle Artefakt besitzt SHA-256
  `15b84126852a597d429304d66d723a356b18537ba3910db9dd9443b3b787114f`;
  die exakten Manifestdateibytes besitzen SHA-256
  `87c4fa153d2af2753aaaf4d74fd515b3edae5268b9935d63faef24d10bcf593f`.
  Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
  `v0.2.2` bleiben unverändert.

### Local SyncGateway Raw-Wire and HTTP Foundation / ADR 0020

- ADR 0020 als angenommene Implementierungsentscheidung ergänzt. Die lokale
  Foundation läuft als separater, importseitig inaktiver Node-Prozess unter
  `server/`, startet ausschließlich explizit über `npm run gateway:local` und
  verändert weder `src/main.js` noch den Browser-Buildgraphen.
- `readLocalSyncGatewayRuntimeConfig` als fail-closed Konfigurationsgrenze für
  die ausschließlich serverseitigen Variablen
  `GOLDENDAWN_SYNC_GATEWAY_PORT` und
  `GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN` umgesetzt. Die Produktionslaufzeit
  akzeptiert nur einen kanonischen Port von 1 bis 65.535 und genau eine
  kanonische HTTP(S)-Origin auf `localhost`, `127.0.0.1` oder `[::1]`; Werte
  werden in Fehlern nicht gespiegelt. `VITE_*` ist kein Konfigurationspfad.
- `createLocalSyncGatewayHttpServer` als eingefrorene Lifecycle-API mit exakt
  `start` und `stop` ergänzt. Der Listener bindet unveränderlich an
  `127.0.0.1`; Port `0` ist ausschließlich für isolierte Factorytests erlaubt.
  Import, Doppeltstart, Startfehler, Stop vor Start und Doppelstop besitzen
  kontrollierte statische Results. Startfehler verwenden einen gemeinsamen
  irreversiblen Cleanup-Pfad, verwerfen `boundPort`, schließen den Listener
  best effort und zerstören offene Sockets. Ein synchroner Close-Throw erhält
  genau einen Retry; ein weiterhin werfender Listener wird dereferenziert und
  der Prozesseinstieg versucht zusätzlich `stop`. Offene Sockets werden auch
  beim Stop beendet. Der Listening-Handler kapselt außerdem den vollständigen
  Zugriff auf `server.address()` einschließlich des jeweils einmaligen Lesens
  von `address` und `port`. Ein werfender Getter führt zum normalen statischen
  `startFailed`-Cleanup und löst keinen Fatal-Callback aus. Dasselbe gilt für
  gemeldete Ports außerhalb `1` bis `65535` sowie bei einem Produktionsport
  für jede Abweichung vom angeforderten Wert; nur Factory-Port `0` akzeptiert
  einen abweichenden tatsächlich gebundenen Port im gültigen Bereich.
- Den Lifecycle nach einem Serverfehler bei bereits erfolgreichem Start
  vollständig fail-closed gehärtet: `boundPort` wird sofort verworfen, der
  Zustand bleibt irreversibel `failed`, der Listener wird best effort
  geschlossen und vorhandene Sockets werden zerstört. Weitere Request-,
  Decoder- und Boundary-Verarbeitung wird gesperrt; Exceptiontexte bleiben
  redigiert. Die Factoryoption `onFatal = () => {}` signalisiert diesen Zustand
  payloadlos und höchstens einmal; Throws und zurückgegebene Rejections werden
  konsumiert, die öffentliche API bleibt exakt `{ start, stop }`.
- Der Prozesseinstieg entfernt bei einem Fatal-Signal seine Signalhandler,
  versucht die Bereinigung idempotent, setzt `process.exitCode = 1` und gibt
  genau einmal die statische redigierte Meldung
  `Das lokale SyncGateway wurde nach einem internen Serverfehler beendet.` aus.
  Mehrfache Signale sowie werfende oder fehlschlagende Cleanup-Pfade erzeugen
  keine zweite Meldung oder unbehandelte Exception.
- Die lokale HTTP-Allowlist auf das exakte Request-Target `/api/sync-test`,
  einen zum gebundenen Port passenden `Host`, `POST` und einen streng
  kontrollierten `OPTIONS`-Preflight begrenzt. Bei Port `80` sind ausschließlich
  `127.0.0.1` und `127.0.0.1:80` gültige Autoritäten; bei allen anderen Ports
  bleibt exakt `127.0.0.1:<port>` erforderlich. `CONNECT`, Upgrades und
  Erwartungen umgehen die Policy nicht. Sicherheitsrelevante Header werden
  aus `rawHeaders` geprüft; Duplikate und widersprüchliche Framing-Signale
  werden fail-closed abgelehnt.
- `requireHostHeader: false` in den Node-Serveroptionen ausdrücklich gesetzt.
  Dies deaktiviert nur Nodes vorgezogene HTTP/1.1-Hostantwort und lockert die
  Hostpflicht nicht. Im ansonsten regulären Requestpfad, sofern keine frühere
  fail-closed Target- oder Sonderpfadablehnung greift, durchlaufen fehlende,
  doppelte oder falsche Hostwerte Admission und Response-Owner und enden im
  eigenen statischen `invalidHttpRequest`-Envelope mit kontrolliertem
  `Content-Length`. Die Option öffnet keinen akzeptierenden Pfad.
- Ausschließlich HTTP/1.1 unterstützt. Ein als HTTP/1.0 geparster Request endet
  statisch als `invalidHttpRequest`, bevor Raw-Header-Projektion, Decoder oder
  Boundary ausgeführt werden.
- Für Requests genau eine konfigurierte Origin erlaubt. CORS-Antworten spiegeln
  ausschließlich den konfigurierten Wert, erlauben keine Credentials und
  behandeln Loopback sowie CORS ausdrücklich nicht als Authentisierung oder
  Autorisierung. Ein Preflight erlaubt nur `POST` und `Content-Type`.
- POST-Bodies auf `application/json` mit optional genau
  `charset=utf-8`, fehlendes oder `identity` Content-Encoding und ein
  widerspruchsfreies HTTP-Framing begrenzt. Kompression, zusätzliche
  Media-Type-Parameter, Trailer und mehrdeutige relevante Header werden
  abgelehnt. `Content-Length` bleibt nur ein frühes Signal.
- Die kanonische Contractkonstante von 65.536 Bytes in die Wire-Schicht
  importiert. Tatsächlich gelieferte Chunkbytes werden gezählt, höchstens
  65.536 Bytes als Anwendungsbody gehalten und ab Byte 65.537 weder
  zusammengefügt noch decodiert oder an die Boundary übergeben. Diese
  Anwendungsgrenze behauptet keinen Schutz vor bereits durch Node, Betriebssystem
  oder Netzwerkstack allozierten Bytes und keinen vollständigen DoS-Schutz.
- Einen vollständig empfangenen zulässigen Body genau einmal mit einem
  kontrollierten `TextDecoder('utf-8', { fatal: true, ignoreBOM: true })`
  decodiert. Decoderfähigkeiten werden fail-closed geprüft; ungültige oder
  unvollständige UTF-8-Folgen werden abgelehnt. Es gibt kein `setEncoding`,
  keine Chunkdecodierung, Normalisierung, Reparatur oder Trim-Operation. Eine
  gültige UTF-8-BOM bleibt als U+FEFF im String und folgt der bestehenden
  nativen Parsersemantik.
- Nach erfolgreichem Empfang ausschließlich den unveränderten primitiven String
  exakt einmal an die vorhandene kanonische `processSyncRawBody`-Boundary
  übergeben. Die HTTP-Schicht besitzt keinen zweiten JSON-Parser. Sie spiegelt
  weder den Request noch die defensive Requestprojektion und sendet sie nicht
  weiter.
- Kontrollierte Boundary-Ablehnungen ausschließlich als die bereits validierte
  frühe Gateway-Fehlerresponse mit HTTP `400` serialisiert. Lokale HTTP- und
  Gatewayfehler verwenden stattdessen eine getrennte statische Drei-Felder-
  Envelope. Ein akzeptierter Request endet bewusst mit statischem HTTP `503`
  `upstreamUnavailable`; es gibt keine normale SyncResponse und keine
  behauptete Verarbeitung durch einen `SyncAgent`.
- Die implementierte lokale Statusmenge auf `204`, `400`, `403`, `404`, `405`,
  `413`, `415`, `417`, `431`, `500` und `503` begrenzt. Kontrollierte
  Antworten verwenden `no-store`, `nosniff`, statisches JSON mit UTF-8 wo
  zutreffend und eine enge Connection-Close-Strategie; Serverdetails sowie
  fremde Eingaben oder Exceptiontexte werden nicht ausgegeben.
- Pro physischem Socket genau einen Response-Owner vor dem ersten Application-
  oder Raw-Socket-Write eingeführt. Nach einer Übernahme schreibt
  `clientError` keine zweite Response oder Statuszeile; Parserfehler vor jeder
  Anwendungsübernahme erhalten weiterhin genau eine kontrollierte statische
  Raw-Response. Raw-Pfade senden ihre statische redigierte Antwort best effort
  und zerstören den Socket danach zuverlässig; bei bereits beanspruchtem Owner
  schreiben sie nichts und zerstören ihn unmittelbar. Asynchrone
  Raw-Schreibfehler werden redigiert abgefangen und führen nur zum Destroy. Das
  begrenzt auch halb offene Clients, die nach Response oder FIN weiter Bytes
  senden.
- Konservative Node-Ressourcengrenzen für Headerbytes und Headerfelder sowie
  absolute 5.000-ms-Header- und 10.000-ms-Requestfristen, endliche Socket- und
  Keep-Alive-Zeiten und höchstens eine Anfrage pro Socket umgesetzt. Das feste
  produktive `connectionsCheckingInterval` von 100 ms begrenzt die
  konfigurierte Erkennungstoleranz bei responsivem Eventloop auf einen
  Prüftakt. Die nur mit Port `0` und exakt `useTestTimeoutPolicy: true`
  erreichbare private Testpolicy verwendet fest 250/500/500/25 ms und ist
  weder Runtime- noch Environmentkonfiguration. Eventloop-, Betriebssystem-
  und Netzwerkplanung bleiben Laufzeitgrenzen. Das ist eine begrenzte lokale
  Ressourcenhärtung, kein Rate Limit, Identitätsnachweis oder vollständiger
  Schutz gegen lokale Denial-of-Service-Angriffe.
- Eine factory-lokale, vom Response-Owner getrennte Request-Admission als
  ersten gemeinsamen Anwendungsschritt für `request`, `checkContinue` und
  `checkExpectation` ergänzt. Nur der erste Request pro physischem Socket wird
  zugelassen. Jedes weitere Ereignis beansprucht den terminalen
  Response-Owner, pausiert und zerstört den Socket ohne zweite Response, bevor
  HTTP-Version, Headerprojektion, Decoder oder Boundary ausgewertet werden.
  Mutationsgerichtete Regressionen erzwingen für den ersten gültigen
  HTTP/1.1-Request exakt einen Decoderfactory-, Decode- und Boundary-Aufruf mit
  dessen Raw Body sowie für jedes zweite reguläre oder Expect-Ereignis exakt
  null `rawHeaders`-Zugriffe und einen terminalen Response-/Socketzustand.
- Einen expliziten synchronen `dropRequest`-Handler für
  `maxRequestsPerSocket: 1` als zusätzliche Defense-in-Depth ergänzt. Er
  beansprucht den terminalen Response-Owner und zerstört den physischen Socket
  bei einem von Node verworfenen pipelinierten Folgerequest, ohne eine
  zusätzliche Node- oder Gateway-Response zu erzeugen.
- Parser- und Socket-Timeouts fail-closed beendet. Je nach Node-Parserzustand
  kann dabei nur ein Verbindungsabschluss oder eine laufzeiteigene minimale
  Timeoutantwort möglich sein; dafür wird kein stets auslieferbarer lokaler
  JSON-Envelope behauptet.
- Kein Browser-SyncTransport, kein automatischer Start mit `npm run dev`, kein
  Cloud- oder n8n-Transport, Webhook, Secret, Credential, operativer
  `SyncAgent`, erfolgreicher SyncResponse-Pfad, externer Datenfluss, Storage,
  Requestlogging, Telemetrie, Rate Limit, Replay-/Idempotenzschicht oder UI
  ergänzt. PromptVault, LearningHub und LichtwaldLog bleiben unberührt und
  lokal.
- Die Host-Zentralisierung mit einem hostlosen HTTP/1.1-`OPTIONS` plus gültigem
  POST in einem Pipeline-Write mutationswirksam geprüft: bei deaktiviertem
  `maxRequestsPerSocket` exakt zwei Anwendungsereignisse, kein `dropRequest`,
  null Decoder-/Boundary-Aufrufe, höchstens eine eigene statische Response und
  keine Marker-Leaks. Gemeldete Ports `0`, `-1`, `65536` sowie ein abweichender
  gültiger Produktionsport führen redigiert zu `startFailed`, vollständigem
  Cleanup und keinem `onFatal`. Globale Instrumentierungen laufen mit
  `concurrency: false` und vollständigem `finally`-Restore.
- Die gehärtete gezielte Local-SyncGateway-Suite am `2026-08-16` mit 50/50
  Tests und die kombinierte Suite mit Boundary, SyncContract und SyncService
  mit 192/192 Tests bestanden. Die vollständige serielle Suite bestand mit
  1125/1125 Tests. Alle Läufe hatten 0 Fehlschläge, 0 Skips und 0 Todos und
  verwendeten ausschließlich synthetische Werte sowie Loopback-Kommunikation.
  Der
  Produktions-Build war erfolgreich und transformierte weiterhin exakt 46
  Browsermodule. Paketversion `0.2.2`, Tag `v0.2.2` und Release `v0.2.2`
  bleiben unverändert.

### ADR 0019 – Local SyncGateway before n8n Cloud Decision

- ADR 0019 als angenommene, ausschließlich dokumentationsbasierte Entscheidung
  ergänzt. Der Stand dieses damaligen Dokumentationsslices lautete
  `v0.3.0 – in Arbeit – Local SyncGateway before n8n Cloud Decision`.
- Die spätere Zieltopologie als
  `GoldenDawn-Browser → SyncService → lokaler SyncTransport → lokales
  SyncGateway auf GD-WS01 → authentisierter n8n-Cloud-Webhook → SyncAgent →
  validierte normale SyncResponse` entschieden. Alle neuen Transport-, Gateway-,
  Cloud- und Agentenkomponenten bleiben geplant und nicht implementiert.
- Das lokale SyncGateway als schmale, Loopback-only Transport- und
  Sicherheitsgrenze festgelegt. Es ist kein vierter Agent, keine Fachlogik,
  kein allgemeines Backend, kein Storage, kein Ersatz für den `SyncAgent` und
  keine UI-Komponente. ADR 0002, ADR 0005 und ADR 0016 bis ADR 0018 bleiben
  unverändert gültig.
- Browsercaller als nicht authentisiert und unvertrauenswürdig eingeordnet.
  `POST`, fester serverseitiger Pfad, kontrolliertes JSON/UTF-8, Ablehnung
  komprimierter Bodies und nicht unterstützter Content-Encodings sowie exakte
  Origin-Allowlist entschieden. `OPTIONS` darf nur einen CORS-Preflight
  bedienen; CORS und Loopback beweisen keine Identität.
- Die geplante lokale Raw-Wire-Reihenfolge entschieden: `Content-Length` nur als
  frühes Signal, tatsächliche Streaming-Bytezählung bis 65.536, Abbruch bei Byte
  65.537 vor vollständiger Materialisierung, exakt eine strikte UTF-8-
  Decodierung mit Erhalt einer gültigen BOM als U+FEFF und ohne Entfernung oder
  Reparatur, danach exakt ein Aufruf der vorhandenen kanonischen Request
  Boundary und ausschließliche Weiterverwendung ihrer defensiven Projektion.
- Für den ersten leeren, nebenwirkungsfreien synthetischen Cloudfluss n8n Header
  Authentication mit dediziertem hochentropischem gemeinsamen Bearer-Secret
  und HTTPS entschieden. Das Secret darf ausschließlich im n8n-Credential-
  Store und vertrauenswürdiger serverseitiger Gateway-Laufzeitkonfiguration
  liegen und wird nur für den `syncTest`-Webhook verwendet. Sein Besitznachweis
  ist keine starke Geräte-, Prozess- oder Benutzeridentität und kein n8n-RBAC-
  Principal. Header Authentication ist keine Bodysignatur; TLS ist kein Replay-
  oder Idempotenzschutz. HMAC-, JWT-Body-Binding und Replay-Nachweis bleiben vor
  privaten oder schreibenden Aktionen neu zu entscheiden.
- `src/contracts/syncContract.js` und
  `src/gateways/syncGatewayRequestBoundary.js` als kanonische Cloudquellen
  bestätigt. Weil n8n Cloud nach dem datierten offiziellen Plattformbefund vom
  2026-08-15 keine beliebigen externen npm-Module im Code Node importiert, darf
  ein späterer Workflow nur ein reproduzierbar generiertes, selbstständiges und
  automatisiert auf Integrität, Parität und Mutationen geprüftes Artefakt
  verwenden; eine manuell gepflegte Contractkopie ist ausgeschlossen.
- Die n8n-Option `Raw Body` nicht als Nachweis byteidentischer ursprünglicher
  Wire-Oktette oder einer GoldenDawn-spezifischen 65.536-Byte-Prüfung vor
  Provider-Allokation behandelt. Aktivierung erst nach versions- und
  tenantgebundenem Laufzeitnachweis tatsächlicher Binärdaten vor Decodierung;
  andernfalls ist ADR 0019 neu zu bewerten. Die geplante n8n-Prüfung bleibt eine
  nachgelagerte Defense-in-Depth-Schicht; das lokale Gateway die geplante exakte
  vorgelagerte Wire-Grenze.
- Responseebenen getrennt: Der SyncService akzeptiert weiterhin nur normale,
  vollständig korrelierte SyncResponses. HTTP-, Authentisierungs-, Timeout-,
  frühe `gateway_`-, lokale Gateway- und ungeeignete Cloudresponses werden
  später als statisch redigierte lokale Transportfehler behandelt und niemals
  zu normalen SyncAgent-Responses umgeschrieben.
- Keine Produktions-, Test-, Paket-, Lock-, Workflow-, Vault- oder
  `src/`-Datei geändert. Kein Server, Transport, Webhook, n8n-Workflow, Bundle,
  Credential, operativer Agent, externer Datenfluss, Storage, Logging,
  Monitoring oder UI wurde implementiert. Paketversion `0.2.2`, Tag `v0.2.2`
  und neuestes Release `v0.2.2` bleiben unverändert.
- Den Dokumentationsslice am `2026-08-15` mit der vollständigen seriellen Suite
  tatsächlich geprüft: 1075/1075 Tests bestanden, 0 Fehlschläge, 0 Skips und
  0 Todos. Der Produktions-Build war erfolgreich und transformierte exakt 46
  Module.

### SyncGateway Request Boundary Foundation

- `createSyncGatewayRequestBoundary({ generateGatewayRequestId,
  getCurrentTimestamp })` als synchrone transportneutrale Grenze für einen
  bereits vollständig materialisierten Raw-Body-Wert ergänzt. Die eingefrorene
  gewöhnliche API exportiert exakt `processSyncRawBody`; die Methode akzeptiert
  exakt einen Wert und ist kein HTTP-Handler.
- Jeden Aufruf synchron auf einen tief eingefrorenen exakten Fünf-Felder-Result
  aus `ok`, `status`, `syncRequest`, `gatewayErrorResponse` und `error`
  begrenzt. Beherrschte Eingabeablehnungen liefern eine vollständig gültige
  frühe Gateway-Fehlerresponse; ungültige Invocation sowie interne oder
  Dependency-Fehler bleiben getrennte statisch redigierte lokale Results.
- Die fail-closed Reihenfolge
  `Raw-Body-Größe prüfen → exakt einmal ohne Reviver parsen → unveränderten
  Parsed-Wert validieren → defensive Sechs-Felder-Projektion mit frischem
  leerem Payload erzeugen → erneut validieren → tief einfrieren → final erneut
  validieren` umgesetzt. Zusatzfelder werden nicht vor der maßgeblichen
  Contractvalidierung entfernt; Parsed-Original und Ausgabe teilen keine
  mutablen Recordidentitäten.
- Statische Ablehnungszuordnung festgelegt: Übergröße zu
  `PAYLOAD_TOO_LARGE`, andere reguläre Raw-Body-Fehler zu
  `VALIDATION_ERROR`, native Parser-Throws zu `INVALID_JSON`, ein alleiniger
  `unsupportedVersion`- oder `unknownAction`-Fehler zum jeweils spezifischen
  Profil und sonstige oder gemischte Requestfehler zu `VALIDATION_ERROR`.
  `invalidReferenceTimestamp` sowie Builder-, Projektions-, Freeze- und
  Validatorinkonsistenzen bleiben lokale `boundaryFailed`-Pfade.
- Frühe Gateway-Responses pro Aufruf aus frischen Records und Arrays gebaut,
  vor und nach Deep Freeze vollständig validiert und mit neuer kontrollierter
  `gateway_`-ID, `action: null`, `handledBy: null`,
  `meta.processedBy: []` sowie statischem, nicht gemessenem
  `durationMs: 0` ausgegeben. Eingehende `req_`-IDs werden nie gespiegelt und
  eine Verarbeitung durch den `SyncAgent` wird nicht behauptet.
- Clock für jeden akzeptierten Request oder ausgegebenen Gateway-Fehler exakt
  einmal erfasst. Gateway-ID-Generator ausschließlich für eine tatsächlich
  benötigte Ablehnung ausgewertet; der Default verwendet nur
  `gateway_ + crypto.randomUUID()` ohne schwächeren Fallback.
- Native ECMAScript-Last-Key-Wins-Semantik für doppelte JSON-Membernamen und die
  Single-Parser-Grenze dokumentiert. Es gibt keinen Reviver, zweiten Parser,
  Duplicate-Key-Scanner, Stringify-/Parse-Roundtrip, Trim-, BOM-,
  Unicode-Normalisierungs- oder Reparaturpfad.
- Klargestellt, dass die Grenze nur die berechnete UTF-8-Länge eines bereits
  allozierten Strings prüft. Sie ist keine tatsächliche Raw-Wire-
  Bytebegrenzung, kein Schutz vor vorheriger Body-Allokation und keine HTTP-,
  Webhook- oder DoS-Durchsetzung. Für die spätere HTTP-/Transportgrenze die
  mechanismusgerechte Reihenfolge aus frühen Methoden-, Content-Type-,
  Origin-/CORS-, Rate-Limit- und gegebenenfalls Header-Auth-Kontrollen, harter
  Raw-Byte-Begrenzung während des Empfangs, einer nur nach gesonderter
  Entscheidung erforderlichen Signaturprüfung vor Decodierung und Parsing,
  einmaliger kontrollierter Decodierung, alleiniger Boundary-Verarbeitung,
  kontextgebundener Autorisierung und erst anschließendem Routing dokumentiert.
  ADR 0019 entscheidet für den ersten synthetischen Flow Header Authentication
  ohne Bodysignatur. CORS ersetzt keine Authentisierung oder Autorisierung;
  Rate Limits können mehrschichtig sein.
- Die Boundary-Suite gezielt gegen verschobene Post-Freeze-Validierungen,
  NFC-Normalisierung vor der Originalgrößenprüfung, Console-Ausgaben im
  Erfolgspfad, wiederholte Dependency-Aufrufe nach Throws und geteilte
  Identitäten desselben Gateway-Fehlerprofils gehärtet. Globale
  Instrumentierungen laufen nicht konkurrierend und werden garantiert im
  `finally` restauriert.
- ADR 0018 ergänzt, ohne ADR 0016 oder ADR 0017 umzudeuten. Kein konkreter
  Transport, HTTP-Handler, Endpoint, Webhook, n8n, operativer `SyncAgent`,
  keine Authentisierung, Autorisierung, Signaturprüfung, Secrets, CORS oder
  Rate Limits, keine Persistenz, Logs, Telemetrie, Hub-UI oder
  `src/main.js`-Komposition wurden eingeführt.

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
- Für eine spätere Wire-Grenze allgemein festgehalten, rohe Bodybytes während
  des Empfangs hart zu begrenzen und eine künftig gesondert entschiedene
  Bodysignatur gegebenenfalls über exakt diese Bytes vor der kontrollierten
  Decodierung zu prüfen. ADR 0019 konkretisiert den ersten synthetischen Flow
  ohne HMAC-, JWT-Body-Binding- oder Replay-Nachweis: Der resultierende String
  wird ausschließlich von der Boundary einmal geparst und projiziert und erst
  nach serverseitiger Policy geroutet. Natives `JSON.parse` ohne
  benutzerdefinierten Reviver erzeugt aus JSON selbst keine Proxies, Accessors,
  Symbole oder Trap-Funktionen.
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

- Die gezielte Boundary-Suite mit dem exakt geforderten
  `node --test tests/syncGatewayRequestBoundary.test.js` mit 54/54 Tests
  geprüft; 0 Fehlschläge, 0 Skips und 0 Todos.
- Boundary und SyncContract gemeinsam mit 99/99 Tests sowie Boundary,
  SyncContract und SyncService gemeinsam mit 142/142 Tests geprüft. Die
  vollständige Suite besteht mit 1075/1075 Tests; alle Läufe besitzen 0
  Fehlschläge, 0 Skips und 0 Todos.
- Produktions-Build erfolgreich abgeschlossen; exakt 46 Module transformiert.

### Architektur- und Sicherheitsgrenzen

- Den späteren browserinitiierten Fluss durch ADR 0019 um den geplanten lokalen
  SyncTransport und das geplante lokale SyncGateway auf GD-WS01 vor dem
  authentisierten n8n-Cloud-Webhook konkretisiert; ein Vite-Browserfrontend
  terminiert keinen eingehenden öffentlichen Webhook.
- Die spätere Darstellung des `SyncAgent` dem AgentHub und Verbindungen,
  Webhooks, Workflows sowie den einzigen `syncTest`-Auslöser dem AutomationHub
  zugeordnet. Im aktuellen Slice wird keine Hub-UI umgesetzt.
- Keine Netzwerkkommunikation, keinen HTTP-Handler, konkreten externen
  Transport, Endpoint oder Webhook, keinen operativen `SyncAgent`, keine
  n8n-Verbindung, Header-, Methoden-, Statuscode-, Content-Type-, Charset- oder
  Encoding-Verarbeitung, Authentisierung, Autorisierung, Signaturprüfung,
  Secrets, CORS- oder Rate-Limit-Durchsetzung, keinen privaten externen
  Datenfluss und keinen produktiven Datenfluss eingeführt. SyncService und
  Boundary sind weder in `src/main.js` noch in einer UI komponiert.
- ADR 0016 für den transportneutralen Kern und die künftige Transport- und
  Hub-Grenze bleibt unveränderte Vertragsgrundlage. ADR 0017 dokumentiert die
  transportneutrale SyncService Foundation; ADR 0018 die materialisierte
  Request Boundary und ihre spätere Wire-Grenze. Paketversion `0.2.2`, Tag
  `v0.2.2` und neuestes veröffentlichtes Release `v0.2.2` bleiben unverändert.

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
