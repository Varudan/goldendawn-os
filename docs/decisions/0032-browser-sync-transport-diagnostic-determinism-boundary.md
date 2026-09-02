# ADR 0032 – BrowserSyncTransport Diagnostic Capture, Timing and Projection Determinism Boundary

## Status

Angenommen – 2026-09-02

## Kontext

ADR 0029 bindet den einmaligen historischen Chrome-151-Runtimenachweis an
`T₀`. Dieser Nachweis bleibt mit `overallGate: FAIL` abgeschlossen; die
beobachtete öffentliche statische Ablehnung trotz `OPTIONS 204`, `POST 200`
und sichtbarer Erfolgsresponse besitzt weiterhin `causeStatus:
CAUSE_NOT_PROVEN`. ADR 0030 entschied anschließend eine passive, vom
Produktpfad getrennte Diagnosegrenze. ADR 0031 ersetzte ADR 0030 und
präzisierte die flüchtige CDP-By-Value-Hülle sowie die damalige
Observation-Completion-Barriere.

Die Barriere aus ADR 0031 schloss jedoch bereits bei einem Settlement und
einem POST-Terminalereignis. Dadurch wären spätere doppelte
Evaluate-Antworten, weitere Requests oder andere budgetrelevante Ereignisse
innerhalb des vorgesehenen Capturefensters nicht sicher erfasst worden.
Außerdem fehlten totale Regeln für einen vor `Runtime.evaluate` nicht
beweisbar abgeschlossenen Setup, für rohe Zeitgrenzen, Hashdomänen,
Pre-Transport-Kontext, CDP-Deskriptoren, Replaytotalität und eine auch bei
Fehlern terminale Cleanup-Phase.

ADR 0032 ersetzt ADR 0031 formal und übernimmt alle Regeln aus ADR 0031, die
hier nicht ausdrücklich geändert werden. ADR 0030 bleibt als bereits durch
ADR 0031 ersetzte historische Entscheidung unverändert. ADR 0020, ADR 0028,
ADR 0029 und der historische Evidence-Record bleiben unverändert. Insbesondere
bleiben `BrowserTransportDiagnosticRecord.schemaVersion: 1`,
`recordType: browser-transport-diagnostic`, die 17 Rootfelder, sechs
Protokolloperationen, 17 Integritätschecks, neun Requestbudgetzähler plus
Sequenz, zehn Stages, drei Clockdomänen, 20 Cleanup-IDs und fünf Findings
erhalten.

`schemaVersion: 1` bleibt ausschließlich deshalb unverändert, weil weder eine
Implementierung noch eine einzige konforme persistierte
`BrowserTransportDiagnosticRecord`-Instanz existiert. Daraus folgt weder eine
Migrations- noch eine Rückwärtskompatibilitätsbehauptung.

Diese Entscheidung ist ausschließlich ein Dokumentationsslice. Sie
implementiert und autorisiert weder die Foundation noch einen Adapter,
Browser, CDP, Debug-Pipe, Vite, Gateway, Port, Listener, Request oder sichtbaren
Diagnoselauf.

## Entscheidung

### 1. Globaler Setupcap und vollständiges Capture

Vor dem Capture existiert ein eigener globaler Setupcap. Ein gültiger
Diagnoseversuch beginnt ausschließlich in dieser Reihenfolge:

1. Die eine controller-monotone Clockfähigkeit und die eine
   One-shot-Setupcapfähigkeit werden vollständig validiert. Ein fehlender,
   nicht funktionaler, werfend aufgelöster oder nicht scharf schaltbarer Cap-
   beziehungsweise Clockpfad verhindert einen gültigen Diagnoseversuch vor
   jedem Kommando und Stimulus.
2. `m_setup` wird nach validierter Cap-/Clock-Fähigkeit exakt einmal
   controller-monoton erfasst. Throw, nicht endliche primitive Zahl oder
   negativer Wert ist `V`; es gibt keinen Kommando-Send.
3. Der persistierte relative Nullpunkt wird auf `t_setup := 0` gesetzt und die
   rohe Deadline als `setupDeadline := m_setup + 6000` gebildet; der
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

Die Zustände lauten:

```text
setupWindowMilliseconds = 6000
captureWindowMilliseconds = 6000

m_setup := exakt einmal controller-monoton nach validierter
           Cap-/Clock-Fähigkeit erfasst
t_setup := 0
setupDeadline := m_setup + 6000

setupReady := die Antworten auf Target.getTargets,
              Target.attachToTarget und Network.enable sind jeweils
              eindeutig korreliert, erfolgreich und vollständig validiert

U := Setup ist vor Runtime.evaluate terminal nicht beweisbar
V := eine sticky, bestätigte und nicht mehr widerlegbare Observer-,
     Hüllen-, Request- oder Ablaufverletzung liegt vor
C := der controllerlokale Capturecap nach gesendetem Runtime.evaluate
     wurde verarbeitet

setupClosed       := setupReady || U || V
observationClosed := V || U || C
```

Der Setupcap umfasst gemeinsam `Target.getTargets`,
`Target.attachToTarget` und `Network.enable` und wird zwischen diesen
Kommandos nicht zurückgesetzt. Beim Dequeue jedes materialisierten
CDP-Eingangswerts während einer ausstehenden Setupantwort wird die
controller-monotone Clock vor jeder Reflection genau einmal zu `m_answer`
ausgewertet. `lastValidControllerMonotonicSample` ist initial exakt `m_setup`.
Es gibt für diesen Eingangswert keine zweite Clockauswertung. Throw, eine nicht
endliche oder negative primitive Zahl, `m_answer < m_setup` oder
`m_answer < lastValidControllerMonotonicSample` ist `V`. Erst nach bestandener
Endlichkeits-, Nichtnegativitäts- und Monotonieprüfung wird
`lastValidControllerMonotonicSample := m_answer` gesetzt.

Nur wenn die rohe Differenz `d_setup := m_answer - m_setup` strikt kleiner
als `6000` ist, darf der Eingangswert anschließend descriptorbasiert
inspiziert werden. Bei `d_setup >= 6000` gewinnt der Setupcap; der gesamte
dequeue-te Eingangswert bleibt ungelesen und kann weder Setup, `V` noch einen
Stimulus nachträglich begründen. Die persistierte 10-ms-Rundung beeinflusst
diese Entscheidung nicht. Liegt vor der Grenzentscheidung bereits ein
bestätigtes `V` vor, besitzt `V` absolute `FAIL`-Präzedenz.

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

`U` besitzt genau zwei Abschlussarten:

- `setup-cap`: Der Setupcap wurde verarbeitet, bevor `setupReady` oder `V`
  erreicht wurde. Dazu zählen insbesondere bis dahin fehlende Antworten.
- `setup-terminal-unproven`: Noch vor dem Cap steht terminal fest, dass der
  Setup ohne bestätigten Obserververstoß nicht beweisbar ist. Dazu zählen
  eindeutig korrelierte browserseitige CDP-Fehler, keine oder mehrere
  geeignete Targets, eine nicht eindeutig gebundene Session oder ein nicht
  eindeutig erfolgreiches `Network.enable` sowie eine irreversibel
  geschlossene Verbindung vor der erforderlichen Antwort.

Eine Antwort gilt nur dann als fehlend, wenn der Setupcap verarbeitet wurde
oder die gebundene Verbindung vor ihrer erforderlichen eindeutig korrelierten
Antwort irreversibel geschlossen ist. Eine momentan leere Queue oder eine
lediglich noch nicht eingetroffene Antwort reicht dafür nicht aus.

Ein vom Controller falsch erzeugtes Kommando, falsche Parameter, ein
Allowlistverstoß, eine nach eindeutiger Korrelation bestätigte
Descriptor-/Hüllenverletzung, ein vom Controller beziehungsweise Observer
bestätigt ausgeführtes fremdes oder zweites Attachment oder eine andere
bestätigte Obserververletzung ist dagegen `V`, niemals `U`.
Verhindert unvertrauenswürdiges Routing bereits die eindeutige Korrelation,
bleibt der Ausgang ohne unabhängige Verletzung `U`.

`Runtime.evaluate` darf ausschließlich nach `setupReady`, höchstens einmal
und nie nach `U` oder `V` gesendet werden. Erst der bestätigte Sendeübergang
dieses Kommandos startet den getrennten 6.000-ms-Capturecap. Der Setupcap ist
nach `setupClosed` wirkungslos. Späte Setupantworten und alle nach
`observationClosed` eintreffenden Ereignisse werden verworfen und erlauben
weder rückwirkendes Setup noch einen Stimulus.

Eine zweite descriptor-richtig beobachtbare Antwort auf eines der drei
Setupkommandos vor dem Evaluate-Sendeübergang macht das Setup terminal
mehrdeutig und ergibt `U/setup-terminal-unproven`; Evaluate bleibt gegatet.
Wird eine solche Dublette erst während des Capturefensters verarbeitet, bleibt
ihr tatsächlicher Antwortcount `multiple`; der Send-Ledger-Count bleibt davon
unverändert. Das betroffene Operationsergebnis wird `unproven`. Die Dublette
erzeugt allein kein `V`, hält den endgültigen Ausgang aber bis `C`
`UNPROVEN/inconclusive`. Eine malformed Dublette ist jederzeit `V`.

Für das Produktcapture gilt weiterhin:

```text
S := genau ein gültiger Settlementkandidat liegt vor
N := genau ein eindeutig dem POST zugeordnetes loadingFinished oder
     loadingFailed liegt vor
P := S && N

productEvidenceComplete := P
```

`S`, `N` und `P` schließen die Beobachtung nicht. Ohne `V` bleibt der
Observer nach gesendetem `Runtime.evaluate` bis zum verarbeiteten `C` aktiv.
Bei `V` wird sofort fail-closed eingefroren und ein bereits gestarteter
Capturecap kontrolliert entwaffnet; `C` wird dann nicht als erreicht
ausgegeben. Bei `C` werden alle bis zur Verarbeitung des Cap-Ereignisses
eingegangenen Beobachtungen berücksichtigt. Bei Gleichzeitigkeit entscheidet
die controllerlokale Verarbeitungsreihenfolge, soweit nicht die rohe
`d_setup >= 6000`-Grenze oder die absolute `V`-Präzedenz entscheidet.

Der Record beschreibt genau einen Diagnoseversuch und höchstens einen
Transportstimulus. Jeder `PASS` und jeder nicht-inkonklusive Diagnosebefund
verlangt genau einen Stimulus. Ein vor dem Stimulus geschlossener Versuch darf
nur `UNPROVEN/inconclusive` oder bei `V` `FAIL/observer-invalid` ergeben.

### 2. Totaler Completionvertrag

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

Die Ableitung ist geschlossen:

- `U` ergibt den passenden Setupgrund, `not-started`,
  `evaluateReplyCountClass: zero`, `productEvidenceComplete: false` und einen
  eingefrorenen Requestbudgetzustand mit `requestBudgetFinalized: true`.
- `C` ergibt `capture-cap` und `elapsed`.
- `V` ergibt `confirmed-violation`; ein bereits gestartetes Capture ist
  `truncated`. Ein vor dem Evaluate-Sendeübergang bestätigtes `V` besitzt
  `not-started`.
- Regulärer `PASS` verlangt `capture-cap`, `elapsed`, genau eine gültige
  Evaluate-Antwort, genau einen Stimulus und ein vollständig finalisiertes
  Requestbudget.
- Null oder mehrere ansonsten gültige Evaluate-Antworten sind `UNPROVEN`;
  eine eindeutig korrelierte malformed Hülle ist `V`.

Alle Felder werden intern abgeleitet. Kein Caller darf Abschlussgründe,
boolesche Abschlüsse, Zählklassen, Sequenz oder Status frei liefern.

### 3. Zwei unveränderliche Phasen und finale Komposition

Bei `U`, `V` oder `C` erzeugt der Controller frisch einen tief eingefrorenen
Pre-Cleanup-Observation-Snapshot. Er enthält ausschließlich Replay- und
Hashbindungen, Observer- und Evaluationzustand, die ersten vier
Protokolloperationen, Requestbudget und Sequenz, Settlement, Stages 1 bis 8,
Timing, die observationsseitigen sechs Completionwerte und den sticky
`FAIL`-Latch.

Danach entsteht getrennt ein tief eingefrorenes Cleanup-Ledger. Es enthält
`Network.disable`, `Target.detachFromTarget`, Stages 9 und 10, exakt 20
Cleanupchecks, Cleanup-Finalisierungsgrund und Cleanupresultat.

Erst nach der terminalen Cleanup-Phase wird der Finalrecord frisch aus beiden
unveränderten Projektionen gebaut. Dabei werden die sechs observationsseitigen
Completionwerte mit den zwei cleanupseitigen Werten zu dem geschlossenen
achtfeldrigen `timing.completion` projiziert. Weder der Observation-Snapshot
noch das Cleanup-Ledger werden erweitert oder mutiert. Die sechs
`protocolOperations` erscheinen im Finalrecord stets in kanonischer
Reihenfolge.

Cleanup vor dem Observation-Snapshot, Snapshotmutation oder Übernahme später
Ereignisse ist `FAIL/observer-invalid`.

### 4. Cleanup-Finalisierung aus jedem erreichten Zustand

Cleanup beginnt nach `U`, `V` oder `C` aus genau dem tatsächlich erreichten
partiellen Zustand:

```text
cleanup = {
  observationClosedBeforeCleanup,
  checks,
  result,
  recordMaterializedAfterCleanup
}

cleanupFinalized := allCleanupStepsTerminal || cleanupCapProcessed
cleanupWindowMilliseconds = 60000
```

Die beiden Ablauffelder sind boolesch; `result` ist `PASS`, `FAIL` oder
`UNPROVEN` und `checks` enthält exakt die folgenden 20 Einträge.

Der Cleanupcap beginnt controller-monoton bei `cleanup-started` und ist vom
allgemeinen Durationcap getrennt. Bei Cap-Gleichzeitigkeit entscheidet die
controllerlokale Verarbeitungsreihenfolge. Offene Checks werden beim Cap
`unproven`; ein bestätigtes `failed` behält `FAIL`-Präzedenz.
`cleanupCompleted` bedeutet ausschließlich, dass alle Cleanupschritte vor dem
Cap terminal ausgewertet wurden, nicht dass sie erfolgreich waren. Stage 10
bleibt bei Capabschluss ohne vollständige Terminalität
`not-observed/unproven`.

Ein `FAIL`- oder `UNPROVEN`-Record darf nach `cleanupFinalized` materialisiert
werden. `recordMaterializedAfterCleanup` bedeutet Materialisierung nach
terminaler Finalisierung der Cleanupphase, nicht nur nach erfolgreichem
Cleanup.

Die Cleanup-IDs bleiben in exakt dieser Reihenfolge:

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

Jeder Check besitzt ausschließlich `confirmed`, `failed` oder `unproven`.
Seine Ableitungsquelle ist geschlossen:

| Check | Gebundene Ableitungsquelle |
| --- | --- |
| `cleanupStarted` | einmaliger interner Übergang nach eingefrorenem Observation-Snapshot |
| `networkDomainClosed` | erfolgreiche korrelierte `Network.disable`-Antwort oder Send-Ledger-Beweis, dass `Network.enable` nie gesendet wurde; eine nur unzugängliche oder mehrdeutige Session bleibt `unproven` |
| `targetSessionClosed` | erfolgreiche korrelierte Detach-Antwort oder Send-Ledger-Beweis, dass `Target.attachToTarget` nie gesendet wurde; eine möglicherweise erzeugte, aber nicht identifizierbare Session bleibt `unproven` |
| `debugPipeClosed` | identitätsgebundene irreversible Close-Bestätigung des späteren Adapters |
| `controllerObservationClosed` | verworfene Event-/Commandfähigkeiten und nur noch geschlossene Primitive |
| `browserStopped` | terminaler Wait-/Terminate-Ausgang des gebundenen Browserhandles |
| `devServerStopped` | terminaler Wait-/Terminate-Ausgang des gebundenen Devserverhandles |
| `gatewayStopped` | terminaler Wait-/Terminate-Ausgang des gebundenen Gatewayhandles |
| `profileRemoved` | geschlossene Verifikation des exakt gebundenen temporären Profilpfads |
| `harnessFragmentsRemoved` | geschlossene Verifikation der allowlisteten temporären Fragmente |
| `objectGroupsAbsentOrReleased` | bestätigte Abwesenheit, weil `objectGroup` und `Runtime.releaseObject` verboten sind |
| `rawEventsDiscarded` | Entleerung der controllerlokalen flüchtigen Raw-Eventhaltung |
| `ephemeralIdentifiersDiscarded` | Entleerung aller flüchtigen Command-, Session-, Target- und Request-IDs |
| `permissionSiteCacheAndServiceWorkerStateCleared` | geschlossene Post-Cleanup-Verifikation des gebundenen Wegwerfprofils |
| `environmentRestored` | Vergleich der geschlossen gebundenen Umgebungsbaseline |
| `portsFree` | geschlossene Verifikation ausschließlich der vorgebundenen lokalen Ports |
| `repositoryAndIndexRestored` | geschlossene Repository-/Indexverifikation unmittelbar vor Finalrecord |
| `historicalEvidenceHashUnchanged` | SHA-256 der unveränderten historischen Evidence-Datei |
| `observerStorageLogAndTelemetryResidueAbsent` | geschlossene Residueprüfung unmittelbar vor Finalrecord |
| `cleanupCompleted` | alle vorherigen Cleanupschritte vor dem Cap terminal ausgewertet |

Eine fehlende oder nicht authentisch zuordenbare Grundlage ergibt
`unproven`; ein Gegenbeweis ergibt `failed`.

### 5. Exakte Timingfunktion und Nullpunkte

`timing` besitzt exakt acht Felder:

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

roundingMilliseconds = 10
durationCapMilliseconds = 60000
setupWindowMilliseconds = 6000
captureWindowMilliseconds = 6000
calibration = none
crossDomainComparison = forbidden
```

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

Zulässig sind nur `null`, `0, 10, …, 59990, 60000`. `m_setup` ist der rohe
controller-monotone Clockursprung des Setupfensters; `t_setup = 0` ist
ausschließlich dessen persistierter relativer Nullpunkt. Die übrigen
Nullpunkte lauten:

- Controller-Clock der Observation: Übergang zu `observer-armed`;
- Capturefenster: bestätigter Sendeübergang des einzigen
  `Runtime.evaluate`;
- Main-World-Clock: unmittelbar vor dem einzigen `sendSyncRequest`;
- Network-Clock: erstes eindeutig attribuiertes Endpoint-
  `requestWillBeSent`;
- Cleanupcap: `cleanup-started`.

Setup- und Observationcontroller verwenden dieselbe Clockdomäne
`controller-monotonic`; es entsteht keine vierte Clockdomäne.
`deadline-compatible` ist ausschließlich bei gültiger gerundeter
Main-World-Dauer zwischen einschließlich `4500` und `5500` zulässig.
Außerhalb gilt `no-causal-classification`, bei fehlendem oder unbrauchbarem
Timing `unknown`. Clockdomänen werden nie miteinander verrechnet.

### 6. Feste Stage-, Layer- und Clock-Matrix

Die zehn Stages und ihre Domänen bleiben exakt:

```text
observer-armed
  layer: controller
  clock: controller-monotonic

transport-call-dispatched
  layer: javascript-main-world
  clock: javascript-main-world

preflight-request-observed
preflight-204-observed
post-request-observed
post-response-200-observed
post-loading-finished | post-loading-failed
  layer: browser-network
  clock: browser-network

public-promise-settled
  layer: javascript-main-world
  clock: javascript-main-world

cleanup-started
cleanup-completed
  layer: cleanup
  clock: controller-monotonic
```

`receiptOrder` wird je Layer lückenlos ab `1` vergeben. Nur eindeutig
beobachtete Slots erhalten eine positive Zahl; `not-observed` und `ambiguous`
verwenden `null`. Ein Preflight-`loadingFinished` darf nur flüchtig korrelieren
und erzeugt keinen zusätzlichen Stage-Slot. Nach einem späteren `U` bleibt
Stage 1 `observer-armed` unverändert `observed/match` mit `receiptOrder: 1`,
`relativeMilliseconds: 0` und `timingState: measured`. Nur die gegateten
Stages 2 bis 8 sind `not-observed/unproven` mit `receiptOrder: null`,
`relativeMilliseconds: null` und `timingState: unavailable`; Cleanup verwendet
weiterhin die Slots 9 und 10.

Die Clockdomänen-Allowlist bleibt exakt:

```text
controller-monotonic
javascript-main-world
browser-network
```

### 7. Geschlossene Foundation und Foundation-Hashdomäne

Der einzige spätere Foundationpfad lautet:

```text
scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js
```

Das Modul ist selbständig und importinaktiv, besitzt keine lokalen oder
relativen Implementierungsimports und exportiert ausschließlich
`createBrowserSyncTransportRuntimeDiagnosticObserver`. Jede Factory liefert
eine frische gewöhnliche tief eingefrorene API exakt `{ run }`; `run` ist
one-shot und Promise-basiert.

Die Foundation besitzt keine Realdefaults, kein CLI, keinen Main-Guard und
keinen Launcher-, Browser-, Pipe-, Prozess-, Socket-, Port-, Dateisystem- oder
Netzwerkzugriff. Sie verarbeitet ausschließlich effects-as-data:
unveränderliche Command-/Cleanup-Intents, controllerlokale Cap-Intents und
unvertraute materialisierte In-Memory-Beobachtungen.

`foundationSha256` ist Lower-Hex-SHA-256 über die exakten rohen Bytes des
tatsächlich geladenen Foundationpfads. Es gibt keine BOM-, EOL-, Unicode-,
Trim- oder andere Normalisierung. Vor einem späteren Lauf müssen die
Checkoutbytes bytegleich zum Git-Blobinhalt desselben Pfads unter
`replay.repositoryCommit` sein. Git-Objektheader gehören nicht zur Domäne.

- Byteabweichung: `sourceUnmodified: violated`.
- Fehlender oder mehrdeutiger Nachweis: `sourceUnmodified: unproven`.

### 8. Exakte Evaluation-Hashdomäne

`evaluationSha256` ist Lower-Hex-SHA-256 über:

```text
UTF-8(exakt Runtime.evaluate.params.expression)
```

Die Domäne ist der tatsächlich gesendete primitive String, UTF-8 ohne BOM,
ohne Normalisierung, Trim oder Wrapper. Der Hash wird vor dem Send gebildet;
gehashter und gesendeter String sind bytegleich. JSON-Serialisierung und
CDP-Envelopebytes gehören nicht zur Domäne. Der statische Ausdruck enthält
keine Run-ID, Request-ID, Requesttimestamp, Profilkennung oder privaten Werte.
Wird wegen `U` oder frühem `V` kein Evaluate gesendet, ist
`evaluationSha256: null` und sein Nachweis `unproven`.

### 9. Pre-Transport-Kontext und verschachtelte Primitive-Projektion

Die unmittelbare By-Value-Projektion verwendet das Profil
`immediate-closed-by-value-pretransport-context-and-settlement-v2-no-handle`
und besitzt exakt:

```text
value = {
  preTransportContext,
  execution,
  settlement
}

preTransportContext = { url, origin, topLevel, secureContext }
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

Jedes der vier Felder in `preTransportContext` enthält genau einen
`contextResult`, keinen URL-, Origin- oder sonstigen Rohwert.

Die vier Kontextprüfungen erfolgen innerhalb derselben Main-World-Evaluation
vor dynamischem Import, Factoryauswertung und Transportaufruf. Sie geben nur
`match`, `mismatch` oder `unproven` zurück, nie reale abweichende URLs oder
Origins. Nur viermal `match` erlaubt Import, genau eine argumentlose
Factoryauswertung und höchstens einen Transportdispatch.

Bei `mismatch` oder `unproven` bleiben beide Counts `zero`, Settlement ist
`null` und kein Produktrequest entsteht. Kontextblockierung ist kein
Obserververstoß, sondern `UNPROVEN/inconclusive`. Import-, Factory-,
Requestkonstruktions- oder sonstige Fehler vor einem öffentlichen Promise
werden ohne Grund- oder Stackinspektion auf
`failed-before-public-settlement` projiziert. `dispatched` verlangt genau eine
Factory- und eine Transportauswertung sowie ein nicht-nullisches Settlement.
`settlement: null` setzt `S` nie wahr.

Nur die neu konstruierte controller-eigene Projektion kann
`closedPrimitiveProjectionConfirmed: confirmed` besitzen, auch wenn sie wegen
Kontextblockierung kein Settlement behauptet. Sie ist ein frischer,
gewöhnlicher, geschlossener und tief eingefrorener Recordbaum ausschließlich
mit primitiven Blattwerten. Die akzeptierten primitiven Blätter werden sofort
ohne Inputreferenz kopiert. Die unvertrauenswürdige Eingabehülle und ihr Graph
erhalten dadurch weder eine Plain-Data-/Proxy-free- noch eine Parser-, Raw-Byte-
oder Materialisierungsbestätigung.

Der daraus abgeleitete Recordteil bleibt exakt:

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

Nach `U` gilt `not-observed`, `unknown`, `unproven`, `unknown`, `unknown`,
`unknown` in dieser Feldreihenfolge.

### 10. Main-World-Grenzen und öffentliches Fehlerprofil

Der Evaluationtext darf ausschließlich den unveränderten realen
BrowserSyncTransport dynamisch importieren, den benannten Export genau einmal
auswerten, die Factory höchstens einmal ohne Argument aufrufen, genau einen
frischen gültigen v1-`syncTest`-Request bauen und dessen Request-ID sowie
Timestamp ausschließlich flüchtig erzeugen. Der Request wird unmittelbar vor
dem höchstens einmaligen `sendSyncRequest(request)` gegen sein geschlossenes
Profil geprüft.

Der Fulfillmentwert wird nicht inspiziert. Ein Rejectiongrund wird nur über
eigene Data-Descriptoren gegen das descriptor- und freeze-beobachtbare Profil
des exakten statischen Zwei-Feld-Records geprüft:

```text
code = BROWSER_SYNC_TRANSPORT_FAILED
message = Der lokale Browser-SyncTransport ist fehlgeschlagen.
```

Accessor, Symbol, Zusatzfeld, falscher Prototyp, fehlender Freeze oder falscher
Wert ergibt ausschließlich `other-rejection/mismatch`; kein Getter wird
aufgerufen. Auch `match` bestätigt am unvertrauenswürdigen Rejectiongrund keine
Plain-Data- oder Proxy-free-Eingabeidentität. Die zulässigen Settlementpaare
bleiben:

```text
fulfilled / not-applicable
static-redacted-rejection / match
other-rejection / mismatch
```

Die reale Moduloberfläche bleibt unverändert: einziger Export
`createBrowserSyncTransport`; jede Factory liefert eine frische gewöhnliche
eingefrorene API exakt `{ sendSyncRequest }`. Der statische öffentliche
Fehlerrecord ist modulweit geteilt, gewöhnlich, eingefroren und nicht pro
Ablehnung frisch.

Globale Mutation, DOM-Auswertung, freie Responseinspektion, Logs, Storage,
Telemetrie oder ein zweiter Promisepfad bleiben verboten.

### 11. Descriptorbasierte CDP-Grenze

Die Foundation akzeptiert ausschließlich unvertrauenswürdige materialisierte
Werte und behauptet für keinen Eingabegraphen JSON-, Debug-Pipe-, Parser-,
Raw-Byte-, Materialisierungs-, Plain-Data- oder Proxy-free-Provenienz. Auch ein
transparent pass-through Proxy kann bei Prototyp-, Own-Key- und
Descriptorprüfungen wie sein Ziel erscheinen. Diese bloße Möglichkeit ist
allein weder `V` noch ein Grund für eine Proxy-free-Bestätigung.

Nur konsumierte erforderliche Feldwerte werden descriptorbasiert über die bei
Modulevaluation erfassten Intrinsics gelesen. Jedes davon muss eine eigene
Data-Property ohne Getter oder Setter und mit dem erforderlichen primitiven
Wertprofil sein; geerbte oder frei aufgelöste Properties bleiben verboten.
Accessor, Reflection-Throw, falscher Descriptor oder malformed erforderlicher
Wert ist nach eindeutiger Korrelation `V/FAIL/observer-invalid`. Geschlossene
Own-Key- beziehungsweise Own-Presence-Prüfungen dürfen ausschließlich die
benannten Vertrags- und Verbotsfelder klassifizieren; zusätzliche Feldwerte
bleiben ungelesen und werden nie übernommen oder persistiert.

Für `Runtime.evaluate` ist die Reihenfolge verbindlich:

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

Zusätzliche äußere CDP-Metadaten werden weder aufgezählt noch gelesen. Ein
Accessor oder falscher erforderlicher Descriptor nach eindeutiger Korrelation
ist `V/FAIL/observer-invalid`. Verhindert Routing die Korrelation, ist der
Ausgang ohne unabhängige Verletzung `UNPROVEN/inconclusive`. Null oder mehrere
ansonsten gültige Evaluate-Antworten ergeben `UNPROVEN`; eine eindeutig
korrelierte malformed Hülle ergibt `V`.

### 12. Exakte CDP-Kommandoprofile und Operationsergebnisse

Zulässig sind nur:

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

Eine Setupantwort ist nur mit einer eigenen normalen Data-Property `id` als
Response-ID ein Antwortkandidat. Für sessiongebundene Kommandos muss zusätzlich
die eigene normale Data-Property `sessionId` exakt zur gebundenen flachen
Session passen. Nach eindeutiger Korrelation und bestätigter Abwesenheit einer
eigenen `error`-Property gelten genau drei Erfolgsprofile:

```text
Target.getTargets.result = { targetInfos }

Target.attachToTarget.result = { sessionId }

Network.enable.result = {}
```

Jedes `result` muss als eigene normale Data-Property der Antwort das
descriptor-beobachtbare Profil des angegebenen geschlossenen
Nicht-Array-Records besitzen; dies bestätigt keine gewöhnliche oder proxyfreie
Eingabeidentität. `Target.getTargets.result.targetInfos` muss das
descriptor-beobachtbare Profil eines dichten Arrays besitzen. Jeder Eintrag
muss die erforderlichen eigenen normalen Data-Properties `targetId`, `type`,
`url` und `attached` besitzen. Weitere TargetInfo-Feldwerte bleiben ungelesen.

Zuerst werden über `type` und `url` alle Einträge mit `type === "page"` und
exakt gebundener URL gezählt, unabhängig von `attached`. Genau ein solcher
Kandidat ist erforderlich. Erst danach muss an genau diesem Kandidaten
`attached === false` gelten und erst dann wird sein `targetId` gebunden. Null
oder mehrere Kandidaten sowie `attached !== false` ergeben `U`; ein zweiter
passender, bereits attachter Eintrag darf nicht ignoriert werden.

`Target.attachToTarget.result` besitzt exakt die eigene normale Data-Property
`sessionId`; ihr Wert ist ein nichtleerer primitiver String und wird nur als
flüchtige Sessionidentität gebunden. `Network.enable.result` muss exakt das
descriptor-beobachtbare Profil eines leeren Records `{}` besitzen; dies
bestätigt keine gewöhnliche oder proxyfreie Eingabeidentität.

Eine Antwort gilt nur am verarbeiteten Setupcap oder nach irreversibler
Verbindungsschließung als fehlend und ergibt dann `U`; eine leere Queue oder
ein bloßes Noch-nicht-Eintreffen genügt nicht. Normale Fehlerantwort sowie null
oder mehrere vollständig gültige Kandidaten ergeben ebenfalls `U`. Eine eindeutig korrelierte angebliche
Erfolgsantwort mit fehlendem `result`, fehlender Pflichtproperty, falschem Typ,
Accessor, falschem Descriptor, sparsem oder vom geforderten beobachtbaren
Arrayprofil abweichendem Wert oder einer nicht geschlossenen Resultform ist
`V`. Verbotene oder zusätzliche
Resultfelder werden ausschließlich auf Own-Presence geprüft und nicht gelesen.

Es gibt keine Zusatzparameter, insbesondere kein `contextId`,
`uniqueContextId`, `objectGroup`, `includeCommandLineAPI`, `userGesture`,
`serializationOptions` oder CDP-Timeoutparameter. Command-IDs sind flüchtige,
streng steigende positive Safe Integers. Routing verwendet nur die eine
flache Session.

Die sechs Operationseinträge besitzen exakt `{ command, allowedMaximum,
observedCountClass, result }`, `allowedMaximum: 1` und die obige Reihenfolge.
`observedCountClass` ist `zero`, `one`, `multiple` oder `unknown`; `result`
ist `match`, `mismatch` oder `unproven`.

- Der controllerlokale unveränderliche Send-Ledger ist die einzige Quelle der
  Zählklasse und des gesendeten Parameterprofils.
- Ein erlaubtes, genau einmal gesendetes und, soweit erforderlich, eindeutig
  erfolgreich abgeschlossenes Profil ist `one/match`.
- Ein gesendetes, aber am Setupcap oder nach irreversibler
  Verbindungsschließung wegen fehlender beziehungsweise wegen fehlerhafter
  oder mehrdeutiger Antwort nicht beweisbares Setupprofil ist
  `one/unproven`.
- Ein nach `U` oder `V` bewusst gegatetes Downstreamkommando ist
  `zero/unproven`, nie `zero/mismatch`.
- Falsche Parameter, Überschreitung oder Allowlistverletzung erzeugen `V` und
  `mismatch`; ein fremdes Kommando wird nicht als siebter Eintrag übernommen.
- `Network.disable` und `Target.detachFromTarget` sind je nach tatsächlich
  vorhandener nutzbarer Fähigkeit `zero` oder `one`; Cleanupantwort und
  Capabilityledger bestimmen `match`, `unproven` oder `mismatch`.

Ein korrektes Setupkommando mit browserseitigem Fehler ist `U`, nicht `V`.
Ein eindeutig korrelierter `Runtime.evaluate`-Fehler oder eigene
`exceptionDetails` ist `V`. Fehler von `Network.disable` oder
`Target.detachFromTarget` sind Cleanup-`FAIL`.

### 13. Target- und Network-Korrelation

Aus `Target.getTargets` dürfen descriptorbasiert nur diese Felder gelesen
werden:

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
zweites Attachment ist `V`. IDs bleiben nur bis zur kontrollierten Schließung
im Speicher.

Network darf ausschließlich lesen:

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

`loadingFailed.errorText`, Header, Body, Initiator, Redirectdetails und alle
sonstigen Felder bleiben ungelesen. Zuordnung verwendet nur die gebundene
Session, exakte URL-Gleichheit ohne Normalisierung und die flüchtige
Request-ID. Wiederholte oder neue Endpoint-IDs werden als zusätzliche
Sequenz verarbeitet und nie überschrieben.

### 14. Requestbudget und Findingvertrag

`requestBudget` behält exakt:

```text
defaultTransportCalls
retries
directDiagnosticFetches
negativeOriginRuns
redirectRuns
observerProductEndpointRequests
endpointOptions
endpointPosts
endpointOtherMethods
sequence
```

Die neun Zähler sind `zero`, `one`, `multiple` oder `unknown`. Das Budget gilt
nur vom Zustand `observer-armed` bis zum verarbeiteten `U`, `V` oder `C` und
behauptet keine globale Abwesenheit danach. Nach `U` sind Evaluation, Factory,
Transportstimulus und bewusst gegatete Downstreampfade `zero`; nicht
zuverlässig beobachtete Networkzählungen sind `unknown`, die Sequenz ist
`incomplete`.

Bei einem Stimulus wird die Sequenz total abgeleitet:

1. `ambiguous`, sobald Attribution nicht eindeutig ist;
2. `other`, sobald eine eindeutig beobachtete Methode, Statusklasse,
   Reihenfolge, Zusatzanforderung oder Terminalklasse abweicht;
3. `OPTIONS-204-POST-200-loadingFinished` nur bei vollständiger exakter
   Übereinstimmung;
4. andernfalls `incomplete`.

Zweiter Transportaufruf, zweiter `POST`, direkter Diagnose-Fetch oder
Observerrequest am Produktendpoint ist `V/FAIL/observer-invalid`. Fehlende
oder mehrdeutige Attribution ist ohne unabhängigen Verstoß
`UNPROVEN/inconclusive`. Einzelner klar abweichender Status,
`loadingFailed`, zusätzliche produktverursachte `OPTIONS` oder andere
produktverursachte Methode bildet eine bekannte `other`-Signatur. Sie darf bei
sonst intaktem Observer und `EQUIVALENT`
`PASS/network-signature-diverged` ergeben. Obserververursachte
Zusatzanforderung ist `FAIL/observer-invalid`.

Die fünf Findings bleiben:

```text
static-rejection-reproduced-after-http200
original-failure-not-reproduced
network-signature-diverged
observer-invalid
inconclusive
```

Erwartete Reproduktionsfindings verlangen exakt einen Stimulus, einen
`OPTIONS 204`, einen `POST 200`, `loadingFinished` und genau ein gültiges
Settlement. `other-rejection` bei ansonsten erwarteter Netzsequenz bleibt
`PASS/inconclusive`. `U` ergibt ohne späteren Integritäts- oder Cleanupfehler
zwingend `UNPROVEN/inconclusive`. Jede bestätigte Integritäts- oder
Cleanupverletzung besitzt absolute `FAIL/observer-invalid`-Präzedenz.

### 15. Replaytotalität und exakt 59 Vergleiche

Die Relation lautet künftig exakt:

```text
relationId = adr-0032-causal-replay-v2

noUnexplainedCausalDeviation = confirmed | contradicted | unproven

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

`comparisons` enthält exakt 59 Einträge in dieser Reihenfolge:

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

Das sind acht Artefaktvergleiche, ein separater
`repository.state`-Vergleich und 50 kausale Kontextvergleiche. Jeder Eintrag
besitzt weiterhin exakt `{ fieldId, comparisonBasis, observationState,
historicalValue, replayValue, result }`. `not-observed` oder `ambiguous`
erzwingt `unproven`; historische oder neue fehlende Grundlagen werden nie als
Gleichheit behandelt.

```text
comparisonBasis =
  historical-record-value |
  historical-record-closed-derivation |
  historical-commit-artifact-sha256 |
  historical-commit-closed-derivation
```

Die acht `artifact.*`-Werte verwenden Lower-Hex-SHA-256 und
`historical-commit-artifact-sha256`. `gateway.responseProfile` verwendet
`historical-record-closed-derivation`;
`historical-commit-closed-derivation` darf ausschließlich für
`toolchain.vite.lockfileVersion` verwendet werden; dieser Vergleich verwendet
diese Basis. Die übrigen kausalen Werte verwenden `historical-record-value`.
Es wird kein Vergleich ergänzt; die Kardinalität bleibt unverändert bei 59.

#### Historisches Frontend-Runtime-Source-Set

Die historische Basis ist der Git-Tree des im ADR-0029-Evidence-Record
gebundenen Commits
`8001cc7eb7d2fed68c5ca4061514b486a204ac44`. Das Set enthält exakt diese 51
Literalpfade:

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
auf den rohen Git-Blobinhalt ohne Git-Objektheader oder Normalisierung. Der
historische Manifestdigest lautet:

```text
6f3d5740b043308b4d38df33b6293c9064d8dd1b3f0c5801d50844336c195591
```

Der Vergleich unter `artifact.frontend.runtime-source-set.sha256` löst im
Replaycommit erneut `index.html`, `package.json`, `package-lock.json` und jeden
dort getrackten regulären Pfad unter `src/` auf und bildet mit demselben
Algorithmus den neuen Digest. Eine bestätigte Abweichung der aufgelösten
Literalpfadmenge oder ihrer Bytes ist `mismatch`; fehlende oder mehrdeutige
Ableitung ist `unproven`. Dadurch werden auch hinzugefügte oder entfernte
Runtimequellen erfasst. Globs und vage Sammelhashes sind unzulässig; die
historische Liste oben bleibt die vollständig ausgeschriebene
Vergleichsbasis.

#### Vite-Bindung

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
verwendete Vite-Runtimeversion bleibt ein getrennter Nachweis.

Das neue `causalContext.toolchain` besitzt geschlossen:

```text
toolchain = {
  vite: {
    lockfileVersion,
    runtimeVersion
  }
}
```

Replay bindet neue Lockfile- und tatsächlich verwendete Vite-Version getrennt.
Der einzige zusätzliche Vergleichs-`fieldId` bleibt
`toolchain.vite.lockfileVersion`; `runtimeVersion` ist die getrennte
Authentizitätsgrundlage für dessen neue Laufbindung und kein 60. Vergleich.
Fehlender Nachweis der Übereinstimmung beider neuen Werte ergibt `unproven`,
bestätigte Abweichung `mismatch`. Die Vergleichskardinalität bleibt
unverändert bei 59.

### 16. Totale Profil-, Integritäts- und Statusableitung

`observer` behält exakt zwölf Felder:

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

`deltaProfile` bleibt unverändert exakt
`adr-0030-passive-external-observer-v1`. Davon getrennt ist `relationId`
exakt `adr-0032-causal-replay-v2` und `primitiveProjectionProfile` exakt
`immediate-closed-by-value-pretransport-context-and-settlement-v2-no-handle`.

`profileInstanceBinding` wird exakt so abgeleitet:

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

`true/true` ist ungültig.

Die 17 Integritätschecks behalten ihre Reihenfolge. Ihre konkrete
Ableitungsquelle lautet:

| Check | Gebundene Ableitungsquelle |
| --- | --- |
| `sourceUnmodified` | Checkoutbytes, Replaycommit-Blob und `foundationSha256` |
| `instrumentedSourceCopyAbsent` | geschlossene spätere Adapter-/Residueinventur gegen die eine reale Transportquelle |
| `compositionSeamsAbsent` | statisches Evaluationprofil und geschlossener Command-/Capabilityledger |
| `protocolAllowlistOnly` | vollständiger controllerlokaler Send-Ledger der sechs erlaubten Kommandos |
| `runtimeSurfaceMutationAbsent` | statisches Evaluationprofil und ausschließlich zulässige Main-World-Aktionen |
| `fetchInterceptionAbsent` | Evaluationprofil, Operationsledger und spätere Adapterbindung |
| `debuggerBreakpointsAndSteppingAbsent` | Operationsledger ohne Debuggerdomain und spätere Adapterbindung |
| `profilerAndTracingAbsent` | Operationsledger ohne Profiler-/Tracingdomain und spätere Adapterbindung |
| `responseBodyReadAbsent` | Network-Feldzugriffsledger ohne Bodykommando oder Bodyfeld |
| `freeRawInspectionAbsent` | descriptorbasierter Own-Data-Feldzugriffsledger |
| `additionalNativeFetchAbsent` | Main-World-Ausführungszähler und Requestbudget |
| `observerProductEndpointRequestAbsent` | Requestownership und Endpointbudget |
| `rawPersistenceAbsent` | Capability-/Outputledger und Post-Cleanup-Residueprüfung |
| `observerDiagnosticDuringRunOutputAbsent` | geschlossener Outputledger bis Finalrecord |
| `closedPrimitiveProjectionConfirmed` | ausschließlich der frisch konstruierte controller-eigene geschlossene, tief eingefrorene v2-Projektionsbaum ohne Inputreferenzen |
| `singleTargetAndSessionConfirmed` | validiertes Targetset, eine flache Session und Sessionrouting |
| `singleMainWorldEvaluationConfirmed` | Send-Ledger, eindeutige Antwortklasse und Main-World-Zähler |

`confirmed` erfordert die benannte authentisch gebundene Quelle. Gegenbeweis
ergibt `violated`; fehlende oder mehrdeutige Grundlage `unproven`.
`closedPrimitiveProjectionConfirmed` bestätigt ausschließlich die neue
Outputprojektion, niemals Eingabe-, Proxy-, Parser-, Raw-Byte- oder
Materialisierungsprovenienz. Die pure Foundation allein kann weder adapter-
oder residueabhängige Checks bestätigen noch reale Evidenz für
`observerGate: PASS` erzeugen. Ein späterer hashgebundener Parser-/Adapterpfad
muss seine Provenienz intern aus den gebundenen Bytes, dem Parser- und dem
Capabilityledger ableiten; ein frei gelieferter Provenienzboolean ist
verboten.

`interferenceObservation` ist total:

- bestätigte vertraglich sichtbare Interferenz:
  `contract-visible-detected`;
- alle relevanten Checks bestätigt und keine Verletzung:
  `none-contract-visible-detected`;
- sonst `unknown`.

`observerGate`, `finding`, `equivalence.result`, `cleanup.result`,
`deadlineRelation`, Sequenz und Completion sind ausschließlich intern
abgeleitet. `FAIL` besitzt Präzedenz vor `UNPROVEN`, `UNPROVEN` vor `PASS`.
`adr0029OverallGate.before` und `.after` bleiben unabhängig davon `FAIL`,
`causeStatus` ausnahmslos `CAUSE_NOT_PROVEN`.

### 17. Cleanupfähigkeiten und Recordmaterialisierung

Nach `controllerObservationClosed` sind nur bereits vorhandene,
identitätsgebundene irreversible Fähigkeiten zulässig:

```text
wait
terminate
close
Entfernen exakt gebundener temporärer Artefakte
geschlossene Post-Cleanup-Verifikation
```

Neue Prozesse, stdin, freie IPC, CDP- oder Pipe-Schreiben, Browserkommandos,
Produktrequests, Wiederöffnung, freie Metadatenabfragen und PID-Persistenz
bleiben verboten. `Network.disable` und `Target.detachFromTarget` müssen vor
`debugPipeClosed` und `controllerObservationClosed` ausschließlich über beim
Setup gebundene Fähigkeiten versucht werden; nach deren Schließung gibt es
keinen CDP-Schreibpfad mehr.

`objectGroupsAbsentOrReleased` wird nur durch bestätigte Abwesenheit erfüllt,
weil `objectGroup` und `Runtime.releaseObject` verboten bleiben. Repository-,
Index- und Residuechecks erfolgen unmittelbar vor der Finalmaterialisierung.
Danach ist ausschließlich die eine sanitierte Finalrecord-Ausgabe zulässig;
sie ist keine Residue. Der Index bleibt leer. Logs, Rohdaten,
Zwischenrecords und temporäre Manifeste bleiben verboten.

### 18. Finale Recordgrammatik

Der Finalrecord behält exakt diese 17 Rootfelder in dieser Reihenfolge:

```text
schemaVersion
recordType
diagnosticRunId
observedAt
timeZone
historicalEvidence
replay
observer
requestBudget
publicSettlement
stages
timing
cleanup
adr0029OverallGate
observerGate
finding
causeStatus
```

`observedAt` besitzt exakt das 24-stellige kanonische
`YYYY-MM-DDTHH:mm:ss.sssZ`-Profil mit echter UTC-Rückprojektion. `timeZone` ist
eine begrenzte ASCII-IANA-ID mit höchstens 64 Zeichen. Records sind
gewöhnliche geschlossene Nicht-Array-Records mit ausschließlich aufzählbaren
Own-Data-Properties. Arrays besitzen feste Reihenfolge und Kardinalität.
Zahlen sind endlich, nichtnegativ und erforderlichenfalls Safe Integers.

Symbole, Accessors, Funktionen, BigInts, `undefined`, `NaN`, Infinity und
`toJSON` sind verboten. Der Finalrecord wird frisch erzeugt und tief
eingefroren. Die Foundation persistiert oder serialisiert ihn nicht.

Bei `U` gelten zusätzlich zwingend:

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

Diese Grundableitung wird ausschließlich durch einen später bestätigten
Integritäts- oder Cleanupverstoß zu `FAIL/observer-invalid` überstimmt.

### 19. Bewusste Adaptergrenze und Folgereihenfolge

Die Foundation verarbeitet nur materialisierte unvertrauenswürdige
In-Memory-Werte und erzeugt immutable Intents. Sie implementiert ausdrücklich
keinen Debug-Pipe-Transport oder Framing, Byte- oder Messageparser,
UTF-8-Decoder, JSON-Parser, keine Duplicate-Key-Erkennung, Prozesslauncher,
Browser-, Vite- oder Gatewayadapter, Dateisystem- oder Recordwriter.

Sie kann deshalb ausschließlich ihre frisch konstruierte controller-eigene
geschlossene Outputprojektion bestätigen, nicht den unvertrauenswürdigen
Eingabegraphen oder dessen Proxy-, Parser-, Raw-Byte- und
Materialisierungsprovenienz. Die pure Foundation allein kann keine reale
`observerGate: PASS`-Evidenz erzeugen. Bounded-`JSON.parse`-, No-Reviver-,
Raw-Byte-, Duplicate-Key- und Materialisierungsprovenienz bleiben bis zu einem
späteren hashgebundenen Adapter unbewiesen und müssen dort intern aus
gebundenem Parser-, Byte- und Capabilityledger abgeleitet werden; ein frei
gelieferter Provenienzboolean bleibt verboten.

Die verbindliche Folgereihenfolge ist:

1. ADR 0032 dokumentieren und mergen.
2. Ausschließlich die pure, netzwerkfreie effects-as-data-Foundation
   implementieren und netzwerkfrei testen.
3. Raw-Pipe-, Parser-, Queue-, Ressourcen-, Cap-/Timer-, Adapter-, Launcher-
   und Hashbindung in einem eigenen ADR entscheiden und anschließend
   netzwerkfrei implementieren.
4. Erst danach einen sichtbaren Diagnoselauf gesondert autorisieren.
5. Anschließend erst über Produktentscheidung oder einen neuen
   ADR-0029-Runtime-Evidence-Lauf entscheiden.

Vor Schritt 4 darf kein realer `BrowserTransportDiagnosticRecord`
materialisiert werden.

## Konsequenzen

- Setup, Capture und Cleanup besitzen getrennte terminale Caps; ein korrektes,
  aber nicht beweisbares Setup kann den one-shot Diagnoseversuch ohne
  Stimulus sicher als `UNPROVEN` abschließen.
- Positive Produktsignale schließen das Capture nicht vorzeitig. Doppelte
  Antworten und zusätzliche Requests bleiben bis zum Cap beobachtbar.
- Hash-, Timing-, Descriptor-, Projection-, Requestbudget-, Replay- und
  Cleanupaussagen besitzen geschlossene, intern ableitbare Domänen.
- Der neue Source-Set-Vergleich deckt die vollständige historische
  Frontend-Runtimequelle ab; der Vite-Vergleich unterscheidet Lockfile- und
  tatsächlich verwendete Version.
- Die passive Foundation bleibt netzwerkfrei, importinaktiv und ohne reale
  Runtimefähigkeiten. Der notwendige Raw-Pipe-/Parser-/Launcheradapter ist eine
  eigene spätere Architekturentscheidung.
- Weder das historische Runtimegate noch dessen Ursache werden neu bewertet:
  `overallGate` bleibt `FAIL`, `causeStatus` bleibt `CAUSE_NOT_PROVEN`.

## Erwogene Alternativen

### Früher Freeze bei `S && N`

Verworfen, weil dadurch spätere doppelte Evaluate-Antworten oder weitere
budgetrelevante Requests innerhalb des vollständigen Fensters unbeobachtet
blieben.

### Setupfehler pauschal als `FAIL`

Verworfen. Ein browserseitiger Fehler, eine erst am Setupcap oder bei
irreversibler Verbindungsschließung fehlende Antwort oder eine fehlende
eindeutige Target-/Sessiongrundlage beweist ohne unabhängige
Obserververletzung keine Vertragsverletzung und bleibt daher `U/UNPROVEN`.

### Capturecap bereits vor `Runtime.evaluate` starten

Verworfen. Setup und Produktcapture besitzen verschiedene Zwecke und
Nullpunkte; ein gemeinsamer Timer würde ihre Aussagen vermischen.

### Cleanup nur nach erfolgreicher Observation

Verworfen. Gerade partielle und fehlerhafte Zustände müssen terminal und
prüfbar bereinigt werden können.

### Freie Rohinspektion oder Responsebody-Lesen

Verworfen. Die Diagnose benötigt nur die geschlossenen primitiven
Projektions- und Networkmetadaten und darf den Produktpfad nicht durch einen
zweiten Datenkanal erweitern.

### Foundation und Realadapter im selben Slice

Verworfen. Pipe-Framing, Parserprovenienz, Timer, Prozesse, Ressourcenlimits
und Launcherfähigkeiten benötigen eine eigene Entscheidung und getrennte
netzwerkfreie Implementierung.

## Bedingungen für eine Neubewertung

Diese Entscheidung muss vor einem sichtbaren Diagnoselauf neu bewertet oder
ergänzt werden, wenn:

- die pure Foundation die geschlossenen Caps, Statusableitungen,
  Descriptorgrenzen oder Kardinalitäten nicht ohne Runtimezugriff
  implementieren kann;
- ein Raw-Pipe-, Parser-, Queue-, Timer-, Launcher- oder Hashbindungsadapter
  autorisiert werden soll;
- eine weitere CDP-Operation, ein weiteres Feld, ein zweiter Target-, Session-
  oder Evaluationspfad benötigt wird;
- der reale BrowserSyncTransport, sein öffentliches Fehlerprofil, Endpoint,
  Requestprofil oder die historische Replaybasis geändert wird;
- ein Diagnoselauf, Produktfix, neuer ADR-0029-Lauf, Browserkomposition oder
  Browser-End-to-End-`syncTest` autorisiert werden soll;
- private Daten, Provider, Cloud, n8n, Credentials, Storage, Logging oder
  Telemetrie in den Pfad gelangen sollen.

Bis zu einer solchen gesonderten Entscheidung bleiben Browser, CDP,
Debug-Pipe, Vite, Gateway, Netzwerk, Ports, Requests, Profile,
Permissionzustände, Cache und Service Worker unangetastet.
