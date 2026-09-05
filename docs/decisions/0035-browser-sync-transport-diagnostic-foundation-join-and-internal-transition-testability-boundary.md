# ADR 0035 – BrowserSyncTransport Diagnostic Foundation Join and Internal Transition Testability Boundary

## Status

Angenommen – 2026-09-05

## Kontext

[ADR 0034](0034-browser-sync-transport-diagnostic-foundation-grammar-derivation-and-testability-boundary.md)
ist die aktuelle angenommene Entscheidung für die noch nicht implementierte
BrowserSyncTransport-Diagnosefoundation. Er totalisiert die aus
[ADR 0033](0033-browser-sync-transport-diagnostic-foundation-effects-protocol-boundary.md)
und
[ADR 0032](0032-browser-sync-transport-diagnostic-determinism-boundary.md)
fortgeführten Grammatik-, Ableitungs-, Cleanup- und Testregeln. Zwischen den
beiden aktuellen Vertragsebenen verbleibt jedoch ein normativer
Testbarkeitswiderspruch: ADR 0033 verlangt dynamische Tests des internen
Pending-Joins in `prestart`, `observation` und `cleanup`; ein dafür notwendiger
zweiter interner Exchange ist über die einzige öffentliche API konstruktiv
unerreichbar. ADR 0034 erlaubt in seiner bisherigen temporären Testkopie nur
White-box-Exports der privaten Candidate-Gate- und Candidate-Finding-
Ableitungen. Damit kann die verpflichtende Join-Matrix nicht zugleich den
echten produktiven Maschinenzustand und die echte produktive Exchange-Grenze
adressieren.

Dieser ADR schlägt ausschließlich die Schließung dieser Testbarkeitslücke und
drei eng begrenzte Ableitungspräzisierungen vor: den
Network-Clock-Rücklauf, eine unkorrelierte Endpoint-Response und eine doppelte
`Target.getTargets`-Antwort. Bei einer späteren, ausdrücklich getrennten
Annahme würde ADR 0035 ADR 0034 formal ersetzen. ADR 0035 würde keinen
weiteren ADR ersetzen. Sämtliche nicht ausdrücklich korrigierten Regeln aus
ADR 0034 sowie die von ihm übernommenen Regeln aus ADR 0033 und ADR 0032
würden vollständig fortgelten.

Bis zu dieser späteren Annahme bleibt ADR 0034 unverändert die geltende
Entscheidung. Dieser vorgeschlagene Dokumentationsslice implementiert oder
autorisiert weder Foundation noch Testdatei, Adapter oder Runtimevorgang. Er
autorisiert insbesondere keinen Browser-, CDP-, Gateway-, Vite-, Permission-,
Netzwerk- oder Diagnoselauf. ADR 0029, sein historischer Evidence-Record,
`overallGate: FAIL` und ausnahmslos `causeStatus: CAUSE_NOT_PROVEN` bleiben
unverändert.

Schema, öffentliche API und sämtliche Kardinalitäten würden unverändert
bleiben:

```text
öffentliche Factory:
createBrowserSyncTransportRuntimeDiagnosticObserver({
  effectPort,
  runBinding
})

öffentliche Exports: 1
Intentarten:         7
Protocol Commands:   6
Replayvergleiche:    59
Integritychecks:     17
Stages:              10
Capzustände:         10
Cleanupchecks:       20
SchemaVersion:       1
ADR-0029-Gate:       FAIL
Cause:               CAUSE_NOT_PROVEN
```

Die einzige öffentliche erfolgreiche API-Form bliebe die frische, gewöhnliche
und tief eingefrorene `{ run }`-API. Öffentlich erreichbar blieben
ausschließlich `FAIL/observer-invalid` und `UNPROVEN/inconclusive`.
Candidate-`PASS`, `none-contract-visible-detected`, sämtliche PASS-spezifischen
Findings und der hypothetische PASS-Fallback blieben über die öffentliche API
konstruktiv unerreichbar. Eine temporäre Testkopie wäre weder ein produktiver
noch ein evidenzfähiger Pfad.

## Entscheidung

Die folgenden Festlegungen würden erst mit einer späteren Annahme normativ.
Im vorgeschlagenen Stand beschreiben sie den vor einer Implementierung
vollständig zu prüfenden Vertrag.

### 1. Geschlossene Testkopie v2

Die spätere einzelne Produktionsdatei
`scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js` würde für
White-box-Tests weiterhin zunächst bytegenau in ein eindeutig aufgelöstes
Betriebssystem-Temporärverzeichnis außerhalb des Repositorys kopiert. Vor
jeder Instrumentierung müssten Länge und SHA-256 der kopierten Bytes mit der
Produktionsdatei übereinstimmen. Die ausführbare Konformitätskopie müsste einen
pro Testlauf eindeutigen Dateinamen der Form
`browserSyncTransportRuntimeDiagnosticObserver.<nonce>.conformance.mjs`
erhalten. Sie würde auf Windows und allen anderen unterstützten Plattformen
ausschließlich über eine aus dem vollständig aufgelösten Pfad erzeugte
`file:`-URL als ESM importiert. Die Endung `.mjs` würde die ESM-Ausführung
außerhalb des `type`-Scopes des Repositorys eindeutig machen.

In dieser Konformitätskopie dürfte über genau einen vor und nach der Änderung
lexikalisch eindeutig einmal passenden Anker genau eine zusätzliche
Exportdeklaration eingefügt werden. Diese eine Deklaration dürfte nur die
folgenden vier bereits im unveränderten Produktionspfad verwendeten privaten
Bindings exportieren:

| Binding | Arity | Eingabeprofil | Rückgabeprofil | Wirkung |
| --- | ---: | --- | --- | --- |
| `deriveCandidateObserverGate` | 1 | exakt ein geschlossenes internes `CandidateGateInput` | primitiver Wert `FAIL\|UNPROVEN\|PASS` | rein |
| `deriveCandidateFinding` | 1 | exakt ein geschlossenes internes `CandidateFindingInput` | einer der fünf geschlossenen Findingwerte | rein |
| `createBrowserSyncTransportRuntimeDiagnosticRunMachine` | 1 | exakt ein internes `RunMachineInput` | exakt eine private Run-Machine-Identität | zustandsbehaftet |
| `requestBrowserSyncTransportRuntimeDiagnosticExchange` | 2 | dieselbe Run-Machine-Identität und ihr produktiv erzeugtes `ExchangeRequestProfile` | stets `undefined` | zustandsbehaftet |

Die Exportdeklaration wäre codeunitgenau:

```js
export {
  deriveCandidateObserverGate,
  deriveCandidateFinding,
  createBrowserSyncTransportRuntimeDiagnosticRunMachine,
  requestBrowserSyncTransportRuntimeDiagnosticExchange,
};
```

Es gäbe keine Aliasnamen, keinen Defaultexport und keinen fünften Export.

#### Reine Candidate-Bindings

`CandidateGateInput` wäre ein frischer, gewöhnlicher, geschlossener und tief
eingefrorener interner Record mit exakt diesen Own-Data-Keys:

```text
{
  hardViolation,
  proofIncomplete
}
```

Beide Werte wären primitive Booleans. `deriveCandidateObserverGate.length`
wäre exakt `1`; die Funktion würde ohne I/O, Maschinenzugriff oder Mutation
`FAIL` bei `hardViolation === true`, sonst `UNPROVEN` bei
`proofIncomplete === true`, sonst `PASS` zurückgeben. `FAIL` behielte damit
Präzedenz vor `UNPROVEN`.

`CandidateFindingInput` wäre ein frischer, gewöhnlicher, geschlossener und
tief eingefrorener interner Record mit exakt diesen Own-Data-Keys:

```text
{
  candidateObserverGate,
  replayResult,
  stimulusCount,
  requestSequence,
  settlementOutcome,
  settlementStaticProfileResult
}

candidateObserverGate = FAIL | UNPROVEN | PASS
replayResult = EQUIVALENT | DIVERGED | UNPROVEN
stimulusCount = zero | one | multiple | unknown
requestSequence =
  OPTIONS-204-POST-200-loadingFinished | other | incomplete | ambiguous
settlementOutcome =
  fulfilled | static-redacted-rejection | other-rejection | unknown
settlementStaticProfileResult =
  match | mismatch | unproven | not-applicable
```

`deriveCandidateFinding.length` wäre exakt `1`. Die Funktion wäre rein und
gäbe mit der fortgeltenden Präzedenz exakt einen dieser Werte zurück:

```text
observer-invalid
inconclusive
static-rejection-reproduced-after-http200
original-failure-not-reproduced
network-signature-diverged
```

`FAIL` ergäbe `observer-invalid`, `UNPROVEN` ergäbe `inconclusive`.
Historische Reproduktionsfindings wären nur bei `PASS`, `EQUIVALENT`, exakt
einem Stimulus und den bereits in ADR 0034 festgelegten vollständigen
Netzwerk- und Settlementprofilen zulässig. `DIVERGED` verhinderte jedes
historische Reproduktionsfinding. Der PASS-Fallback bliebe `inconclusive`.
Beide Funktionen würden weder Eingabereferenzen halten noch eine
Foundationprojection erzeugen.

#### Produktive Run-Machine und Exchange-Grenze

`createBrowserSyncTransportRuntimeDiagnosticRunMachine.length` wäre exakt
`1`. Sein einziges Argument wäre ein foundationeigener interner Record mit
exakt diesen Keys:

```text
RunMachineInput = {
  activeExchange,
  runBinding
}
```

`activeExchange` wäre die vom alleinigen öffentlichen Run-Owner bereits
synchron aus `capturedExchange` transferierte Capability. `runBinding` wäre
ausschließlich die vollständig validierte, defensiv kopierte und tief
eingefrorene interne Bindingprojektion. Der Konstruktor wäre
zustandsbehaftet, würde die einzige private mutable Run-Machine-Identität für
`activeRunToken === 1` innerhalb des bereits auf `active` gesetzten
`runState` erzeugen und genau das lokale Owner-Run-Promise an sie binden. Er
würde den ersten produktiven `capability-probe` als
`nextExchangeRequestProfile` vorbereiten, aber noch keinen Effect ausführen.
Der öffentliche Factorypfad müsste exakt diesen Konstruktor verwenden; eine
alternative öffentliche oder private Produktionsmaschine wäre unzulässig.

Das Rückgabeprofil wäre exakt die Referenz auf die eine private mutable
Run-Machine selbst, nicht ein Wrapper, Array, Promise, öffentliches API-Objekt
oder eine Testprojektion. Diese Referenz wäre die Owner- und Zustandsidentität
aller weiteren Maschinenübergänge. Sie verließe im Originalmodul nie den
privaten Factory-/Run-Closure. Aus ihrem bereits für produktive Ableitung und
Kontrolle notwendigen Zustand dürfte die Konformitätsprüfung ausschließlich
die folgenden direkt gebundenen Werte beobachten; kein Wert dürfte
ausschließlich für einen Test ergänzt werden:

```text
ownerRunPromise
runState
activeRunToken
attemptStarted
phase
lease
activeExchange
nextExchangeRequestProfile
activeExchangeRequestProfile
portState
pendingInternalExchangeViolation
intentCount
nextIntentId
portCallCount
protocolSendCount
capabilityCallCount
currentExchangeCount
runSettlementCount
preCleanupObservationSnapshot
cleanupLedger
cleanupViolation
cleanupFinalizeReason
capStates
```

Der öffentliche Factorypfad und die temporäre Konformitätsprüfung würden den
Start identisch durch den Aufruf der echten Exchange-Grenze mit der Maschine
und ihrem `nextExchangeRequestProfile` auslösen. Jeder kontrollierte Handler,
der einen weiteren normalen Effect benötigt, würde auf derselben Maschine das
nächste Profil erzeugen und wiederum ausschließlich diese Grenze verwenden.

Die Konformitätskopie dürfte genau diese produktiv benötigten
Maschinenblätter und die vom Test kontrolliert beobachteten Portaufrufe
delta-basiert prüfen. Weil der Test die Identität unmittelbar vom echten
Konstruktor erhält, adressiert er dieselbe Maschineninstanz; ein zusätzlicher
Inspector, eine Debugprojection oder ein fünfter Export wäre weder nötig noch
zulässig. Der öffentliche Factorypfad gäbe weiterhin ausschließlich das
Owner-Run-Promise über `run` zurück und niemals die Run-Machine.

`requestBrowserSyncTransportRuntimeDiagnosticExchange.length` wäre exakt `2`.
Das erste Argument müsste referenzidentisch die vom vorstehenden Konstruktor
erzeugte aktive Run-Machine sein. Das zweite Argument wäre deren bereits durch
einen normalen produktiven Übergang erzeugtes, foundationeigenes,
unveränderliches `ExchangeRequestProfile`; es bindet den vorgesehenen
`intentKind`, die Phase und die für die spätere Intentkonstruktion benötigten
foundationeigenen Payloadwerte. Der öffentliche Factorypfad würde den ersten
Request nach Konstruktion der Maschine durch genau diese Funktion auslösen;
jeder weitere normale Maschinenübergang würde dieselbe Funktion verwenden.
Alle sieben Intentarten liefen ausnahmslos durch diese eine Grenze:

```text
capability-probe
controller-clock-sample
cap-arm
cap-cancel
protocol-command-send
observation-dequeue
cleanup-step
```

Das zweite Eingabeprofil wäre ein frischer, gewöhnlicher, geschlossener und
tief eingefrorener interner Record mit exakt diesen Own-Data-Keys:

```text
ExchangeRequestProfile = {
  phase,
  intentKind,
  payload
}

phase = prestart | observation | cleanup
intentKind =
  capability-probe | controller-clock-sample | cap-arm | cap-cancel |
  protocol-command-send | observation-dequeue | cleanup-step
payload = exakt das bereits fortgeltend geschlossene foundationeigene
          Payloadprofil der gewählten Intentart
```

Das Profil wäre noch kein Intent und enthielte keine Intent-ID. Erst die
Exchange-Grenze dürfte bei `lease === idle` daraus das frische Drei-Felder-
Intent `{ intentId, kind, payload }` konstruieren. Während
`observable-pending` bliebe das aktive Profil allein zur gebundenen
Handler- und Joinadressierung referenzidentisch an der Maschine; es würde von
der zweiten Anforderung nicht gelesen.

Die Funktion gäbe auf jedem synchronen Pfad ausschließlich `undefined`
zurück. Ergebnis, Fehler und Fortschritt würden nur durch die kontrollierten
Promisehandler, die produktiven Maschinenfelder, das Owner-Run-Promise und die
vom Test selbst bereitgestellte Effect-Capability beobachtet. Das wäre keine
zusätzliche Inspection-API.

Bei `lease === observable-pending` müsste die Grenze nach der
Maschinenidentitätsprüfung, aber vor jeder Reflexion oder Verwendung des
zweiten Arguments stoppen. Der Test würde sie mit derselben Run-Machine und
deren referenzidentischem `activeExchangeRequestProfile` aufrufen. Sie dürfte
dann ausschließlich
`pendingInternalExchangeViolation` aus dem bereits gebundenen
Maschinenzustand phasengenau setzen. Insbesondere müsste der Guard vor allen
folgenden Aktionen liegen:

- Intentkonstruktion;
- Erhöhung oder Reservierung einer Intent-ID;
- Count-, Budget-, Sequenz- oder Ledgermutation;
- Cap-, Snapshot-, Observation- oder Cleanupmutation;
- Capability-, Port- oder Resolveraufruf.

Nur `lease === idle` dürfte nach vollständiger Prüfung des
`ExchangeRequestProfile` ein frisches Intent konstruieren, die nächste ID
verbrauchen und `activeExchange` anwenden. Der produktiv gebundene
`activeExchangeRequestProfile` bliebe bis zum Eintritt des kontrollierten
Handlers die eindeutige Requestidentität. `settlement-unobservable` und
`closed` folgten
weiterhin ausschließlich den fortgeltenden Terminalregeln.

#### Konformitätskopie und Mutantenkopien

Die vorstehende Konformitätskopie dürfte außer der einen Exportdeklaration
keinerlei Änderung an Funktionskörpern, Konstanten, Inputs oder produktiven
Callsites enthalten. Für die mutationswirksamen Nachweise aus Entscheidung 5
müsste dagegen jeder Mutant als eigene, disjunkte Datei direkt aus denselben
zuvor verifizierten Produktionsbytes erzeugt werden. Eine Mutantenkopie dürfte
zusätzlich zur gleichen einzelnen Exportdeklaration genau die für ihren einen
benannten Mutanten erforderliche kontrollierte Änderung enthalten. Sie dürfte
niemals als Konformitätskopie ausgegeben oder von einer zuvor veränderten
Kopie abgeleitet werden.

Jede Konformitäts- und Mutantenkopie erhielte einen eindeutigen `.mjs`-Namen,
würde seriell über ihre eigene `file:`-URL importiert und wäre ausnahmslos
`NOT_EVIDENCE`. Alle Kopien und alle ausschließlich für sie erzeugten
Artefakte müssten im `finally` entfernt werden; danach wären Nichtexistenz und
das Fehlen jedes Repositoryartefakts ausdrücklich zu bestätigen.

Unverändert verboten blieben:

- eine Testfunktion im Produktionsmodul;
- ein permanenter `__test`-Export;
- Environment-, Debug- oder Buildflag;
- ein bedingter Export;
- eine zweite Produktdatei;
- eine zusätzliche öffentliche Factoryoption;
- öffentliche State-Inspection;
- eine manipulierte PASS-Projection;
- eine Nutzung der Kopie oder ihrer Resultate als Evidenz.

Das Originalmodul behielte exakt einen öffentlichen Export.

### 2. Dynamische Drei-Phasen-Join-Matrix

Der spätere Implementierungsslice müsste den Pending-Join getrennt in exakt
diesen drei Phasen dynamisch prüfen:

```text
prestart
observation
cleanup
```

Die Phase würde weiterhin ausschließlich aus dem echten Maschinenzustand
abgeleitet:

```text
!attemptStarted                          -> prestart
attemptStarted && O0 noch nicht frozen   -> observation
O0 bereits frozen                        -> cleanup
```

Für jede Phase müsste der Test die durch den echten Konstruktor erzeugte
Run-Machine über ihre normalen Effects-as-Data-Übergänge in den Zielzustand
treiben. Die kontrollierte Test-Capability erfüllte oder wiese vorherige
Effects nur so zurück, wie es die bestehende Übergangsmatrix erlaubt. Der
eigentliche Join-Nachweis wäre das vollständige kartesische Produkt aus drei
Maschinenphasen, zwei Settlementausgängen und drei Settlementzeitlagen, also
exakt 18 getrennte dynamische Fälle:

```text
phase = prestart | observation | cleanup
settlementOutcome = fulfillment | rejection
settlementTiming =
  pre-invocation | synchronous-post-invocation | observable-pending
```

Diese drei Zeitlagen wären disjunkt; jeder finite Testfall müsste genau einer
Zeitlage angehören.

Die drei Zeitlagen wären relativ zum ersten Aufruf der echten Exchange-Grenze
und zum anschließenden zweiten Boundaryaufruf geschlossen:

| Zeitlage | Teststeuerung vor dem zweiten Boundaryaufruf |
| --- | --- |
| `pre-invocation` | Das gültige lokale native Promise ist bereits erfüllt beziehungsweise zurückgewiesen, bevor die erste Exchange-Grenze `activeExchange` aufruft; die Capability gibt exakt diese Identität zurück. Die kontrollierten Handler werden installiert, sind beim synchronen Rücksprung der Grenze aber noch nicht eingetreten. |
| `synchronous-post-invocation` | Die Capability gibt ein pending gültiges lokales natives Promise zurück. Unmittelbar nach dem synchronen Rücksprung der ersten Grenze erfüllt beziehungsweise verwirft der Test es, ohne einen Microtask-Checkpoint zu durchlaufen; der kontrollierte Handler ist noch nicht eingetreten. |
| `observable-pending` | Das gültige lokale native Promise bleibt durch den zweiten Boundaryaufruf hindurch pending und wird erst danach erfüllt beziehungsweise zurückgewiesen. |

In allen 18 Fällen müsste die erste Grenze bereits beide echten Handler
installiert und `lease === observable-pending` gesetzt haben. Der Test dürfte
zwischen ihrem synchronen Rücksprung und dem zweiten Boundaryaufruf weder
`await` noch Microtask-, Timer- oder sonstige Schedulergrenze durchlaufen. Der
zweite Aufruf erfolgte im selben synchronen Turn zwingend vor jedem
kontrollierten Handlerzutritt. Ein bereits oder unmittelbar danach gesetteltes
Promise änderte den Maschinenzustand bis zu diesem Handlerzutritt nicht. Erst
unmittelbar vor dem zweiten Boundaryaufruf würde der Test den
Baselinesnapshot erfassen.

Der Baselinesnapshot müsste mindestens diese privaten, produktiv benötigten
Zähler und die außerhalb der Maschine beobachtbaren Effects enthalten:

```text
intentCount
nextIntentId
portCallCount
protocolSendCount
capabilityCallCount
currentExchangeCount
Anzahl der von der Test-Capability empfangenen Intents
Anzahl ihrer tatsächlichen Aufrufe
```

Danach müsste der Test
`requestBrowserSyncTransportRuntimeDiagnosticExchange` mit exakt derselben
Run-Machine und ihrem aktiven Requestprofil erneut aufrufen. Unmittelbar nach
diesem Aufruf müssten gelten:

```text
Δ Intentanzahl       = 0
Δ nächste Intent-ID  = 0
Δ Portaufrufe        = 0
Δ Sendcount          = 0
Δ Capabilityaufrufe  = 0
currentExchangeCount = 1
lease                = observable-pending
```

Die Assertions wären bewusst delta-basiert. In `observation` und `cleanup`
könnten vor dem Baselinesnapshot bereits normale Exchanges, Intents und Sends
stattgefunden haben; deren absolute Werte dürften die Joinprüfung weder
verdecken noch fälschlich als Dublette zählen.

Die zweite Anforderung dürfte ausschließlich eines dieser drei Blätter setzen:

```text
pendingInternalExchangeViolation = prestart
pendingInternalExchangeViolation = observation
pendingInternalExchangeViolation = cleanup
```

Alle anderen Baselineblätter und beobachtbaren Effects blieben bis zum Eintritt
des kontrollierten Handlers identisch. Das bloße Settlement des ursprünglichen
Promise wäre davor kein Maschinenereignis. Insbesondere entstünden kein
zweites Intent, keine zweite ID, keine zweite Capability und kein zweites
Promise.

### 3. Fulfillment- und Rejection-Join

Für `prestart`, `observation` und `cleanup` müssten Fulfillment und Rejection
des ursprünglichen Exchange-Promises in jeder der drei Zeitlagen
`pre-invocation`, `synchronous-post-invocation` und `observable-pending`
getrennt geprüft werden. Damit wären alle 18 Fälle aus Entscheidung 2
verpflichtend; kein bereits gesetteltes oder noch im selben Turn gesetteltes
Promise dürfte die Join-Prüfung über seinen erst als Microtask eintretenden
Handler umgehen. Der Fulfillmenthandler dürfte weder Payload noch einen
gegebenenfalls gehaltenen Dequeuegraphen reflektieren. Der Rejectionhandler
müsste nullstellig bleiben und dürfte weder Parameter, `arguments` noch Grund
lesen. Ein möglicher Ack in der verworfenen Fulfillmentpayload dürfte keinen
Sendcount verändern.

Nach Eintritt des ersten kontrollierten Handlers würde der Join atomar von
`observable-pending` nach `closed` und niemals zwischenzeitlich nach `idle`
wechseln. Für Fulfillment und Rejection müsste anschließend exakt gelten:

```text
lease:                closed
activeExchange:       null
portState:            closed
furtherExchangeCount: zero
currentExchangeCount: zero
```

Alle noch lebenden Caps würden `terminal-unknown`. „Noch lebend“ bliebe exakt
die fortgeltende Menge
`arm-pending|armed|pending-activation|active|activation-unknown|cancel-pending`;
`absent|cancelled|fired|terminal-unknown` würden nicht umklassifiziert. Es
gäbe weder Cancel, Retry, Ersatz-Exchange noch weiteren Portzugriff.

Die Phasenfolgen wären geschlossen:

| Phase | Abschluss nach Eintritt des kontrollierten Handlers |
| --- | --- |
| `prestart` | statischer Foundationfehler; kein `O0`; kein Cleanup-Ledger |
| `observation` | sticky `V`; `O0` wird eingefroren; ausschließlich lokaler portloser Cleanup |
| `cleanup` | `O0` bleibt unverändert; `cleanupViolation: true`; verbleibende Portchecks `unproven`; `cleanupFinalizeReason: cleanup-terminal-failure` |

Späte oder doppelte Fulfillment- und Rejectionhandler blieben durch
Run-Token, Lease und Handlerzustand gegatete `undefined`-No-ops. Sie dürften
weder Resultat noch Zähler, Snapshot, Ledger, Cap oder Resolver verändern.

### 4. Geschlossenes Forever-pending-Oracle

Ein endlicher Test könnte keine unendliche Zeitspanne empirisch beobachten.
Der vertragliche Forever-pending-Nachweis würde deshalb zwingend aus einer
endlichen dynamischen Präfixprobe und einem vollständigen strukturellen
Transitionsnachweis bestehen. Keiner der beiden Teile allein wäre
hinreichend.

Diese Probe wäre von den 18 settelnden Join-Fällen getrennt. Ihr Promise
bliebe durch den zweiten Boundaryaufruf und alle drei Microtask-Checkpoints
hindurch tatsächlich ungesettelt; insbesondere wäre sie keine vierte
Settlementzeitlage und dürfte keinen der drei Fulfillment- oder
Rejection-Zeitfälle ersetzen.

#### Dynamische Präfixprobe

Für jede der drei Phasen müsste die Präfixprobe:

1. über den normalen produktiven Übergang ein gültiges lokales natives
   Exchange-Promise erhalten;
2. dieses Promise während der vollständigen Probe weder erfüllen noch
   zurückweisen;
3. über die echte Exchange-Grenze und dieselbe Run-Machine den zweiten
   internen Exchange anfordern;
4. die Delta-Invarianten aus Entscheidung 2 unmittelbar prüfen;
5. danach exakt drei einzeln gezählte, testlokale Microtask-Checkpoints
   vollständig durchlaufen;
6. nach dem dritten Checkpoint dieselben Delta-Invarianten erneut prüfen.

Jeder Checkpoint wäre genau eine testlokal geplante Microtask und keine Uhr-
oder Schedulerbehauptung. Für die Probe wären reale Uhr, Timer, Timeout,
Produktions-`Promise.race`, Polling oder ein zusätzlicher Cap verboten. Nach
dem dritten Checkpoint müsste weiterhin gelten:

```text
genau ein aktueller Exchange
Run-Settlementcount: 0
kein künstliches O0
kein vorzeitiger Cleanup
keine Terminalmaterialisierung
keine weitere Capability
keine neue Intent-ID
```

Eine zusätzliche getrennte Probe würde das Exchange-Promise bis zum Testende
ungesettelt lassen. Sie dürfte das Owner-Run-Promise ausschließlich mit
kontrollierten Settlementzählern beobachten, aber bewusst nicht auf dessen
Settlement warten. Das ungesettelte lokale Promise dürfte keinen externen
Handle, Timer oder Prozess erzeugen.

#### Vollständige private Transitionstabelle

Die produktive Transitionstabelle der Lease wäre vollständig:

| Ausgang | Ereignis | Zulässige Wirkung | Folgezustand |
| --- | --- | --- | --- |
| `idle` | gültiger produktiver Exchange-Request, Promiseprofil und Handlerinstallation erfolgreich | genau ein Intent, genau eine neue ID, genau ein Capabilityaufruf | `observable-pending` |
| `idle` | synchroner Throw, malformed Promiseprofil, Reflectionthrow oder Throw der nativen `then`-Anwendung | atomares fortgeltendes Closed-Tupel, keine kontrollierte Handlerbeobachtung | `settlement-unobservable`, unmittelbar `closed` |
| `idle` | später oder doppelt eintretender Handler einer bereits abgeschlossenen Requestidentität | token- und zustandsgegateter `undefined`-No-op | `idle` |
| `observable-pending` | kein kontrollierter Handler | keine Wirkung | `observable-pending` |
| `observable-pending` | das Promise ist bereits oder im selben Turn gesettelt, der kontrollierte Handler aber noch nicht eingetreten | keine Wirkung; Promisezustand wird weder gepollt noch als Maschinenereignis behandelt | `observable-pending` |
| `observable-pending` | später oder doppelt eintretender Handler, dessen gebundene Requestidentität nicht die aktive ist | token- und zustandsgegateter `undefined`-No-op; aktive Lease und Requestidentität bleiben unverändert | `observable-pending` |
| `observable-pending` | zweiter Exchange-Request | ausschließlich phasengenaues `pendingInternalExchangeViolation`; keine Fortschrittswirkung | `observable-pending` |
| `observable-pending` | kontrollierter Fulfillment- oder Rejectionhandler ohne Pending-Join | zuerst Leasefreigabe, danach exakt intent- und zustandsspezifischer normaler Dispatch | `idle` oder nach regulärem letztem Exchange `closed` |
| `observable-pending` | kontrollierter Fulfillment- oder Rejectionhandler nach Pending-Join | ungelesenes Settlement, atomares Join-Closed-Tupel und allein die phasenlokale Folge aus Entscheidung 3 | `closed` |
| `settlement-unobservable` | interne Terminalmaterialisierung | keine Capability, kein Cancel, kein Retry | `closed` |
| `closed` | Exchangeversuch, später oder doppelter Handler | `undefined`-No-op; keine fingierte Joinverletzung | `closed` |

Damit existierte aus `observable-pending` ohne Eintritt in einen
kontrollierten Fulfillment- oder Rejectionhandler kein Fortschritts-,
Snapshot-, Cleanup-, Terminalisierungs- oder Resolvepfad. Der zweite Request
setzte lediglich das phasengenaue sticky Joinblatt und wäre ausdrücklich kein
Fortschritt. Es gäbe insbesondere keinen Timerersatz, keinen zweiten Port,
keinen konkurrierenden Resolver, keinen Retry, kein autonomes Polling, keine
zweite Capability und keinen Übergang zu `idle` ohne kontrollierten Handler.

Nur die Kombination aus der dynamischen Präfixprobe und dieser vollständigen
Transitionstabelle dürfte als vertraglicher Forever-pending-Nachweis berichtet
werden. Ein Test- oder Abschlussbericht dürfte niemals behaupten, eine
unendliche Zeitspanne dynamisch beobachtet zu haben.

### 5. Mutationswirksamer Join-Nachweis

Der spätere Implementierungsslice müsste nachweisen, dass mindestens jede
folgende einzelne Abweichung einen ansonsten grünen Join-Test fehlschlagen
lässt:

- Entfernen oder Umgehen des zentralen Join-Guards;
- Guard erst nach Intentkonstruktion;
- Guard erst nach ID-Erhöhung;
- Guard erst nach Count- oder Ledgermutation;
- zweiter Port- oder Capabilityaufruf;
- Freigabe der Lease zu `idle`;
- künstliches Settlement des Owner-Runs;
- vorzeitiges `O0`;
- vorzeitiger Cleanup;
- Verlust der phasengenauen Join-Klassifikation;
- Mutation des bereits eingefrorenen `O0` im Cleanupfall.

Jeder Mutant dürfte nur in einer eigenen kontrollierten Mutantenkopie gemäß
Entscheidung 1 existieren. Produktionssource, Konformitätskopie und andere
Mutanten blieben dabei unverändert. Pro Kopie wäre genau ein Mutant zulässig;
der Test müsste sowohl seinen erwarteten Fehlschlag als auch die unveränderte
grüne Gegenprobe gegen die separate Konformitätskopie belegen. Auch
Mutantenresultate blieben `NOT_EVIDENCE`.

### 6. Regression: Network-Clock-Rücklauf

Der bereits fortgeltende Begriff `Rücklauf` würde vollständig geschlossen.
Die Run-Machine führte privat:

```text
firstEndpointRequestTimestamp
lastValidBrowserNetworkTimestamp
```

Der erste eindeutig attribuierte Endpoint-Request-Timestamp würde nach seiner
vollständigen Prüfung beide Werte initialisieren. Für jeden weiteren eindeutig
attribuierten Networkkandidaten müsste vor jeder Stage-, Count-, Timing- oder
Sequenzmutation in dieser Reihenfolge gelten:

```text
typeof timestamp === number
timestamp ist endlich
timestamp ist nichtnegativ
timestampMilliseconds := timestamp * 1000 ist endlich und sein Betrag
  überschreitet Number.MAX_SAFE_INTEGER nicht
relativeMillisecondsRaw :=
  (timestamp - firstEndpointRequestTimestamp) * 1000 ist endlich,
  nichtnegativ und überschreitet Number.MAX_SAFE_INTEGER nicht
timestamp >= lastValidBrowserNetworkTimestamp
```

Gleichheit wäre zulässig. Erst nachdem sämtliche Prüfungen bestanden sind,
dürfte gelten:

```text
lastValidBrowserNetworkTimestamp := timestamp
```

Der projizierte Timingwert bliebe dennoch immer relativ zum unveränderten
Nullpunkt:

```text
d_ms := (timestamp - firstEndpointRequestTimestamp) * 1000
```

Er würde niemals relativ zum letzten Sample berechnet. Es gäbe weiterhin
keinen Vergleich mit Controller- oder Main-World-Zeit.

Ein Rücklauf vor `O0` wäre sticky `V` und ergäbe:

```text
observationCloseReason: confirmed-violation
candidateObserverGate: FAIL
candidateFinding: observer-invalid
captureWindowState: truncated
```

Der verletzende Kandidat dürfte weder
`lastValidBrowserNetworkTimestamp` überschreiben noch einen Stage-Slot,
Count, Receipt Order oder die Sequenz fortschreiben. Für ihn dürfte kein
provisorischer Timingwert gerundet, gespeichert oder projiziert werden. Nach
`O0` dürfte kein Networkereignis die eingefrorene Observation verändern.

Der spätere Implementierungsslice müsste die Regression black-box über den
öffentlichen Effects-as-Data-Port mindestens mit diesen getrennten Folgen
prüfen:

```text
10 -> 12 -> 11
10 -> 9
gleicher Timestamp
NaN
Infinity
unsicherer Millisekundenüberlauf
```

Insbesondere wäre `10 -> 12 -> 11` ein Rücklauf, obwohl `11` weiterhin über
dem ursprünglichen Nullpunkt `10` liegt. Der Gleichheitsfall müsste dagegen
zulässig bleiben.

### 7. Regression: unkorrelierte Endpoint-Response

Eine ansonsten strukturell zulässige `Network.responseReceived`-Beobachtung
mit gebundener Session, exakter Endpoint-URL und einer unbekannten oder nicht
gebundenen `requestId` dürfte weder still verworfen noch einem Stage-Slot
zugeschlagen werden. Nach dem fortgeltenden absoluten Cap- und Dequeueguard
wäre die descriptorbasierte eventlokale Konsumreihenfolge exakt:

1. eigener Data-Descriptor `method` der offenen Eventhülle;
2. eigener Data-Descriptor `sessionId` der offenen Eventhülle;
3. eigener Data-Descriptor `params` der offenen Eventhülle;
4. eigener Data-Descriptor `requestId` des gecachten `params`-Werts;
5. eigener Data-Descriptor `response` des gecachten `params`-Werts;
6. eigener Data-Descriptor `url` des gecachten `response`-Werts;
7. Vergleich der gecachten URL mit dem exakt gebundenen Endpoint und danach
   Korrelation der gecachten `requestId` mit der gebundenen Requestidentität.

Jeder Descriptor dürfte höchstens einmal konsumiert, jeder Wert nur dem
gecachten Descriptor entnommen werden. Für eine exakte Endpoint-URL bei
fehlgeschlagener Request-ID-Korrelation müsste die Verarbeitung unmittelbar
nach Schritt 7 stoppen. Insbesondere blieben dann ungelesen:

- `params.timestamp`;
- `response.status` und `response.statusText`;
- Header-, MIME-, Protocol-, Timing-, Security- und Cachewerte;
- jeder Body- oder Folgewert.

Diese begrenzte URL-Lesung wäre erforderlich, um eine unkorrelierte Response
für einen fremden Endpoint von der sicherheitsrelevanten unkorrelierten
Produktendpoint-Response zu unterscheiden. Nach festgestellter
Endpointidentität dürfte aber kein zur Attribution unnötiges Blatt gelesen
werden. Bei erfolgreicher Request-ID-Korrelation würde danach die bestehende
Konsumfolge mit `response.status` und `params.timestamp` fortgesetzt.

Die fehlgeschlagene Korrelation setzte ein sticky privates
Attributionsblatt auf `ambiguous/unproven`, aber ohne unabhängige bereits
definierte Verletzung kein künstliches `V`. Verbindlich wären:

```text
requestBudget.sequence: ambiguous
productEvidenceComplete: false
candidateObserverGate: UNPROVEN
candidateFinding: inconclusive
```

Die Response erhöhte keinen Requestcount, erzeugte keine Request-ID und
veränderte keine Protocol-Operation.

Wenn nur die unkorrelierte Response beobachtet würde, bliebe der nach dem
aktuellen Sequenzzustand betroffene Response-Slot – Stage 4 für Preflight oder
Stage 6 für POST – exakt:

```text
stageId: preflight-204-observed | post-response-200-observed
observationState: not-observed
result: unproven
receiptOrder: null
relativeMilliseconds: null
timingState: unavailable
```

Wenn später zusätzlich genau eine korrekt korrelierte Response einträte,
dürfte der betroffene Stage-4- oder Stage-6-Slot aus seiner eigenen
korrelierten Quelle `observed/match` werden.
Die zuvor festgestellte Attributionsunsicherheit bliebe jedoch bis `O0`
sticky; `requestBudget.sequence` bliebe `ambiguous`,
`productEvidenceComplete` bliebe `false`, und eine vollständige
Erfolgssequenz dürfte nicht wiederhergestellt werden.

Mehrere oder widersprüchliche korrelierbare Responsekandidaten folgten
weiterhin der bestehenden Stage-Ableitung `ambiguous/unproven`. Malformed
Routing, ein nicht zulässiger Descriptor oder jede andere unabhängig
definierte Obserververletzung behielte seine bestehende `V`-Ableitung. Diese
Regression wäre ausschließlich black-box über den normalen öffentlichen
Effects-as-Data-Port zu testen und benötigte keinen privaten Testexport.

### 8. Regression: doppelte `Target.getTargets`-Antwort

Für die Präzedenz zwischen der historischen ADR-0032-Aussage und der totalen
ADR-0034-Operationsmatrix würde verbindlich die Operationsmatrix gelten:

```text
exakt ein gültiger Target.getTargets-Send-Ack
  -> observedCountClass: one
  -> result: match
```

Eine Antwortdublette wäre kein zweites Intent und kein zweiter Send-Ack. Sie
erzeugte auf Operationsebene weder `multiple` noch `one/unproven` und dürfte
das bereits belegte Operationsergebnis nicht verändern. Unsicherheit entstünde
ausschließlich auf Antwort-, Setup-, Targetprofil- und Candidateebene.

#### Wohlgeformte Dublette vor Evaluate

Eine zweite descriptor-richtig beobachtbare Antwort derselben bereits
abgeschlossenen `Target.getTargets`-Command-ID, die während des Wartens auf die
nächste Setupantwort vor Evaluate eintrifft, ergäbe ohne eigenständiges `V`:

```text
U
observationCloseReason: setup-terminal-unproven
targetProfile: unknown
singleTargetAndSessionConfirmed: unproven
Target.getTargets observedCountClass: one
Target.getTargets result: match
Runtime.evaluate Intent: zero
Runtime.evaluate Send: zero/match
captureWindowState: not-started
candidateObserverGate: UNPROVEN
candidateFinding: inconclusive
```

Stage 1 bliebe `observed/match`. Die gegateten Stages 2 bis 8 blieben jeweils
`not-observed/unproven` mit `receiptOrder: null`,
`relativeMilliseconds: null` und `timingState: unavailable`. Die
wohlgeformte Dublette allein erzeugte kein `V`.

#### Wohlgeformte Dublette während Capture

Würde dieselbe Dublette erst während des Capturefensters vor `O0` verarbeitet,
bliebe `Target.getTargets` auf Operationsebene `one/match`. Das Targetprofil
würde beziehungsweise bliebe `unknown`, die Antwortbeobachtung würde
`multiple/ambiguous`, und ein sticky `proofIncomplete` hielte den Candidate
bis zum verarbeiteten `C` auf `UNPROVEN/inconclusive`. Die Dublette allein
erzeugte kein `V` und schlösse das Capture nicht vorzeitig.

#### Malformed Dublette

Eine eindeutig routbare, aber malformed Dublette vor `O0` bliebe eine
bestätigte Obserververletzung und ergäbe:

```text
V
candidateObserverGate: FAIL
candidateFinding: observer-invalid
```

Nach `O0` dürfte eine solche Nachricht die eingefrorene Observation nicht
mehr verändern und folgte ausschließlich den bereits bestehenden
Cleanup-Purpose- und `cleanupViolation`-Regeln.

Alle drei Dublettenfälle wären black-box über den öffentlichen
Effects-as-Data-Port testbar und benötigten keinen privaten Testexport. Der
historische Satz, eine wohlgeformte Antwortdublette mache trotz genau eines
gültigen Send-Acks das Protocol-Operationsergebnis `unproven`, würde mit einer
späteren Annahme dieses ADRs ausdrücklich als durch ADR 0034 und ADR 0035
überholt gelten. Antwortdubletten änderten niemals einen bestätigten Send-Ack
oder dessen Operationsergebnis.

### 9. Unveränderte Grenzen und spätere Testpflicht

Die vorgeschlagenen Korrekturen würden weder Schema noch öffentliche
Oberfläche, Effects-Protokoll oder Evidencegrenze erweitern. Unverändert
blieben insbesondere:

- genau eine öffentliche Factory und genau ein öffentlicher Export;
- die sieben Intentarten und sechs Protocol Commands;
- 59 Replayvergleiche, 17 Integritychecks und zehn Stages;
- zehn Capzustände und exakt 20 Cleanupchecks;
- `schemaVersion: 1` und die 17 Rootfelder der Foundationprojection;
- sämtliche Owner-, Arity-, Referenz-, Promiseprofil-, Redaktions-, Cap-,
  Snapshot-, Ledger-, Hash- und Cleanupregeln, soweit dieser ADR sie nicht
  ausdrücklich präzisiert;
- die produktive Unerreichbarkeit von Candidate-`PASS`,
  `none-contract-visible-detected`, allen PASS-spezifischen Findings und dem
  PASS-Fallback;
- `evidenceStatus: NOT_EVIDENCE`, `runtimeAuthorized: false` und
  `persistenceAuthorized: false` für jede Foundationprojection;
- ADR-0029-`overallGate: FAIL` und `causeStatus: CAUSE_NOT_PROVEN`.

Der spätere Foundationimplementierungsslice müsste zusätzlich zur gesamten
fortgeltenden ADR-0033-/ADR-0034-Testmatrix nachweisen:

- die vier exakten temporären Bindings mit Namen, Arity, Eingabe- und
  Rückgabeprofil;
- dass öffentlicher Factorypfad und temporärer Test denselben produktiven
  Konstruktor und dieselbe produktive Exchange-Grenze verwenden;
- dass alle sieben Intentarten diese Grenze durchlaufen;
- die vollständige Drei-Phasen-Matrix jeweils für Fulfillment, Rejection und
  Pending, einschließlich des 18-Fälle-Produkts aus drei Phasen, zwei
  Settlementausgängen und drei Settlementzeitlagen;
- die dynamische Drei-Checkpoint-Präfixprobe und die vollständige
  Transitionstabelle;
- sämtliche Mutanten aus Entscheidung 5 in disjunkten Mutantenkopien;
- alle Fälle des Network-Rücklaufs, der unkorrelierten Endpoint-Response und
  der doppelten `Target.getTargets`-Antwort;
- die unveränderte öffentliche Unerreichbarkeit jedes PASS-spezifischen
  Ergebnisses.

Dieser ADR selbst implementierte keine dieser Prüfungen. Ein eigener
Adapter-ADR, die danach getrennte netzwerkfreie Adapterimplementierung und ein
erst anschließend gesondert autorisierter sichtbarer Diagnoselauf blieben
nachgelagert.

Die Foundation und ihre späteren fokussierten Tests blieben vollständig
netzwerkfrei. Eine unveränderte vollständige Repository-Regression dürfte
ausschließlich die bereits etablierten Loopback-Fixtures in
`tests/localSyncGatewayHttpServer.test.js` und
`tests/n8nCloudIngressProbe.test.js` ausführen. Es entstünden keine neuen
Listener, Requests, Ports, Prozesse oder Fixtures.

## Konsequenzen

Bei späterer Annahme wäre der Testbarkeitswiderspruch geschlossen, ohne die
öffentliche API, den einzigen öffentlichen Export oder die produktive
Evidencegrenze zu öffnen. Die temporäre Konformitätskopie könnte sowohl die
vollständigen privaten Candidate-Ableitungen als auch die echte produktive
Run-Machine und ihre einzige Exchange-Grenze prüfen. Der Test würde dieselbe
Maschinenidentität in allen drei Phasen adressieren und bräuchte weder einen
permanenten Seam noch eine nur für Tests existierende Produktionsfunktion.

Fulfillment und Rejection wären über alle 18 Phasen-/Outcome-/Zeitlagenfälle
total; ein bereits gesetteltes Promise könnte den synchronen Join-Guard nicht
über den erst später eintretenden Handler umgehen. Der davon getrennte
Forever-pending-Nachweis würde eine endliche dynamische Beobachtung ehrlich von der strukturellen
Abwesenheit jedes autonomen Fortschrittspfads trennen. Mutationswirksamkeit
würde belegen, dass die Tests nicht nur grüne Beispiele reproduzieren, sondern
die Reihenfolge des zentralen Guards und die Irreversibilität von `O0`
tatsächlich schützen.

Network-Rücklauf würde gegen das letzte gültige Sample geprüft, ohne den
ursprünglichen Timingnullpunkt zu verschieben. Eine unkorrelierte
Produktendpoint-Response könnte nicht still verschwinden. Eine
`Target.getTargets`-Antwortdublette würde die Antwort- und Candidateebene
unbewiesen machen, aber keinen nie gesendeten zweiten Command erfinden und
keinen belegten Send-Ack entwerten.

ADR 0034 bliebe bis zur getrennten Annahme dieses ADRs aktuell. Foundation,
Tests, Adapter und Runtime blieben in diesem Draft unverändert geschlossen;
das historische ADR-0029-Gate bliebe `FAIL` und seine Ursache
`CAUSE_NOT_PROVEN`.

## Erwogene Alternativen

### Nur die beiden reinen Candidate-Funktionen temporär exportieren

Diese Alternative würde verworfen. Sie reicht für die private
Gate-/Finding-Wahrheitstabelle, kann aber weder einen zweiten Exchange gegen
eine aktive Lease auslösen noch beweisen, dass der produktive Join vor Intent,
ID, Ledger und Capability greift.

### Permanenter Testseam oder zusätzliche öffentliche Factoryoption

Diese Alternative würde verworfen. Ein `__test`-Export, Debugflag oder
öffentliches Machine-Handle würde den produktiven Vertrag und die
Angriffsfläche verändern. Die eindeutig benannte, seriell importierte und im
`finally` entfernte `.mjs`-Kopie prüft dieselben produktiven Bindings ohne eine
dauerhafte Oberfläche.

### Ein eigens für Tests implementierter Maschinenkonstruktor

Diese Alternative würde verworfen. Eine Testmaschine könnte von Owner-,
Lease- oder Handlerübergängen des öffentlichen Factorypfads abweichen. Nur der
vom Factorypfad selbst verwendete Konstruktor und die einzige von allen sieben
Intents verwendete Exchange-Grenze sind zulässig.

### Eine endliche Wartezeit als Beweis für Forever-pending

Diese Alternative würde verworfen. Drei Microtask-Checkpoints oder jeder
andere endliche Zeitraum können zeitliche Unendlichkeit nicht empirisch
beweisen. Erst die Verbindung der endlichen Präfixprobe mit der vollständigen
Transitionstabelle schließt jeden handlerlosen Fortschrittspfad
deterministisch aus.

### Mutanten in der Produktionsdatei oder in der Konformitätskopie

Diese Alternative würde verworfen. Eine Produktionsmutation wäre außerhalb
des Dokumentations- und Testslices; eine nachträglich mutierte
Konformitätskopie könnte keinen unveränderten Produktionspfad mehr belegen.
Jeder Mutant benötigt daher seine eigene, neu aus verifizierten
Produktionsbytes abgeleitete und anschließend vollständig entfernte Kopie.

### Network-Rücklauf nur gegen den ersten Timestamp prüfen

Diese Alternative würde verworfen. Sie übersieht die Folge
`10 -> 12 -> 11`, obwohl der dritte Wert gegenüber dem letzten gültigen
Sample zurückläuft. `firstEndpointRequestTimestamp` bleibt Timingnullpunkt;
`lastValidBrowserNetworkTimestamp` ist davon getrennt allein der monotone
Ordnungswächter.

### Unkorrelierte Endpoint-Responses still verwerfen

Diese Alternative würde verworfen. Eine exakte Endpoint-URL bei unbekannter
Request-ID ist eine relevante Attributionslücke. Stilles Verwerfen könnte
eine scheinbar vollständige Erfolgssequenz erzeugen. Die begrenzte
Descriptorfolge macht die Unsicherheit sticky, ohne unnötige fremde Werte zu
lesen oder ohne unabhängigen Grund ein `V` zu erfinden.

### Antwortdubletten als zweite Sends zählen

Diese Alternative würde verworfen. Ein Reply ist weder Intent noch
Send-Ack. Die Vermischung würde aus genau einem belegten Send fälschlich
`multiple` oder `one/unproven` ableiten. Antwortmehrdeutigkeit bleibt deshalb
auf Antwort-, Setup-, Targetprofil- und Candidateebene begrenzt.

## Bedingungen für eine Neubewertung

Eine Annahme dieses ADRs würde einen erneuten vollständigen unabhängigen
Review-`PASS` des tatsächlichen Dokumentationsdiffs und danach eine
ausdrücklich getrennte Statuspromotion erfordern. Erst mit dieser Annahme
würde ADR 0035 ADR 0034 formal ersetzen; ADR 0034 bliebe bis dahin die
aktuelle Entscheidung.

Erst nach einer Annahme dürfte ein eigener, weiterhin netzwerkfreier
Implementierungsslice für die Foundation und ihre fokussierten Tests
autorisiert werden. Dieser müsste die unveränderte öffentliche API, den einen
Produktionssourcepfad, die getrennten Konformitäts- und Mutantenkopien, die
vollständigen 18 finiten Join-Fälle, das getrennte zweiteilige Pending-Oracle und die drei
Regressionen gemeinsam nachweisen.

Eine technische Neubewertung der Evidencegrenze würde weiterhin einen eigenen
angenommenen Adapter-ADR, seine identitätsgebundene netzwerkfreie
Implementierung und erst danach einen gesondert autorisierten sichtbaren
Diagnoselauf benötigen. Bis dahin blieben Browserkomposition und
Browser-End-to-End-`syncTest` geschlossen, jede Foundationprojection
`NOT_EVIDENCE`, `causeStatus: CAUSE_NOT_PROVEN` unverändert und das
ADR-0029-Gesamtgate vor wie nach jeder Foundationprojection `FAIL`.
