# ADR 0036 – BrowserSyncTransport Runtime Diagnostic Adapter Boundary

## Status

Angenommen – 2026-09-12

Jan hat ADR 0036 am 2026-09-12 ausdrücklich angenommen:
„Ja, ADR0036 wird hiermit ausdrücklich von mir angenommen.“

Der zuvor von Jan als Chatbericht übermittelte unabhängige
Daybreak-Blue-Latest-/xhigh-Dokumentreview des Foundationabgleichs ist mit
`PASS` ohne Befund abgeschlossen. Er bindet die vollständig geprüften
Vorannahmebytes dieses ADRs mit SHA-256
`788c6fc074148278476d776417ad04767ac4384d46f8d84d78cf3b7f94e79682`
und die sieben weiteren im [Changelog](../../CHANGELOG.md) gebundenen
Dokumentfassungen. Er gilt nicht für die durch diese Statusnachführung
entstehenden vollständigen Dokumenthashes; ein neuer unabhängiger Review
dieser Statusänderung wird nicht behauptet.

Der geprüfte Hauptteil ab einschließlich der tatsächlichen Überschrift
`## Kontext` ist unverändert übernommen. Seine Aussagen zum damaligen
Vorschlagsstatus, zur damals fehlenden Annahmereife und zum damals ausstehenden
Dokumentreview dokumentieren den historischen Vorannahmestand. Dieser
Statusvermerk hält die aktuelle Annahme und den Abschluss jenes Reviews fest.
Diese zeitliche Einordnung hebt keine technischen Regeln, Sicherheitsgrenzen,
Implementierungsvoraussetzungen oder verbleibenden Laufblocker auf.

Die Adaptergrenze ist damit als Architekturentscheidung angenommen. Adapter
und Adaptertests sind weiterhin weder implementiert noch ausgeführt; ihr
eigener netzwerkfreier Implementierungs- und Testslice benötigt einen
gesonderten Auftrag. Lauf-, Browser-, E2E-, Writer- und Persistenzfreigaben
fehlen weiterhin. `overallGate: FAIL`, `causeStatus: CAUSE_NOT_PROVEN`,
Foundation `NOT_EVIDENCE` und das fehlende authentische adapterseitige `A_obs`
bleiben unverändert. Dieser Auftrag endet nach Statusnachführung und
Verifikation; Git-Schritte bleiben manuell bei Jan.

## Kontext

[ADR 0035](0035-browser-sync-transport-diagnostic-foundation-join-and-internal-transition-testability-boundary.md)
ist angenommen und die dort entschiedene Effects-as-Data-Foundation ist
inzwischen getrennt, importinaktiv und netzwerkfrei implementiert. Sie bleibt
eine reine, nicht evidenzfähige Zustandsmaschine. Ihr öffentlicher Vertrag ist
unverändert:

```text
createBrowserSyncTransportRuntimeDiagnosticObserver({ effectPort, runBinding })
```

Die Foundation besitzt genau einen öffentlichen Export, sieben Effect-Intents,
sechs Protocol Commands, 59 Replayvergleiche, 17 Integritychecks, zehn Stages,
zehn Capzustände, 20 Cleanupchecks und höchstens 128 Dequeues. Ihre
17-Felder-`FoundationProjection` bleibt immer `NOT_EVIDENCE`,
`runtimeAuthorized: false` und `persistenceAuthorized: false`; ein
Candidate-`PASS` ist öffentlich konstruktiv unerreichbar.

Zwischen dieser reinen Maschine und einem späteren realen Windows-/Chrome-Lauf
fehlt eine entschiedene Adaptergrenze. Nur sie dürfte reale Clocks und Caps,
den Chrome-Debug-Pipe, Framing und Parsing, Prozesse und Ressourcen, die FIFO,
den selbst erzeugten `runBinding`, Provenienz und den nachgelagerten
Finalrecord verantworten. Ohne diese Grenze könnten Callerwerte, ein
TOCTOU-anfälliger Modulimport, ein voreiliger Write-Ack oder ein positives
`cleanup-fact` fälschlich als Evidenz erscheinen.

Dieser ADR ergänzt ADR 0035 unter dessen gezielter Ergänzung durch
[ADR 0037](0037-browser-sync-transport-diagnostic-foundation-observation-close-notification.md)
und ersetzt keinen ADR. ADR 0032 bis ADR 0035 sowie ADR 0037 bleiben
bytegleich. Er ist ausschließlich ein vorgeschlagener
Dokumentationsslice. Er implementiert oder autorisiert weder Adapter noch
Tests, Loader, Parser, Queue, Timer, Launcher, Recordfinalizer, Writer,
Runtimekomposition oder Diagnoselauf. Eine Annahme beziehungsweise
Statuspromotion bleibt ausschließlich Jan vorbehalten.

Der begrenzte R1–R4-Dokumentreview hat die damalige K2-Konstruktion mit PASS
geprüft. Er bindet ausschließlich die frühere ADR-0036-Fassung mit Rohhash
`08ba627230077020f2b3ae50b9903ebf768f4413ede242aac35294d2c1453d2e`,
nicht diesen neuen Dokumentationsdiff und keine ausgeführten Adaptertests.

Jan hat ADR 0037 für `D_K4` am 2026-09-08 angenommen. Die getrennt
netzwerkfrei implementierte Foundation besteht mit 595/595 fokussierten Tests,
`Δ = 173` gegenüber der historischen 422er-Basis. Der unabhängige
Daybreak-xhigh-Implementierungsreview meldet PASS ohne Befund ausschließlich
für diesen Implementierungsscope. Sein Bericht mit Rohhash
`f94935a30c429fbe052adc81a4760cdeb2e0f6f1a1f40f5b2aaa614e372ae139`
galt ursprünglich HEAD `4dc4d6f98e0d4dd0418544b286fd1bb204597f55` plus
neun exakt gehashten uncommitteten Dateien. Jan hat diese geprüften Fassungen
anschließend unverändert in `799e23e2f122ec2df3262af28a883616a8120327`
committet; alle neun Berichthashes stimmen mit dessen Blobs überein. Der
Review wurde weder rückwirkend auf diesem Featurecommit noch auf dem jetzigen
Dokumentationsbranch ausgeführt. Ein Reviewdatum wird nicht behauptet.

Damit ist die Foundationabhängigkeit aus Abschnitt 14 erfüllt. Dieser
Foundationabgleich vom 2026-09-12 dokumentiert die neue Load-, Port- und
Testbindung; sein eigener unabhängiger Dokumentreview steht aus. ADR 0036
bleibt vorgeschlagen und nicht annahmereif, ohne Annahme- oder
Implementierungsfreigabe. Ein adapterseitiges `A_obs` ist weiterhin weder
implementiert noch nachgewiesen.

Unverändert bleiben das historische ADR-0029-`overallGate: FAIL`, vor und nach
jeder späteren Diagnose, sowie ausnahmslos
`causeStatus: CAUSE_NOT_PROVEN`. Auch ein späteres Observer-`PASS` würde weder
ADR 0029 neu bewerten noch Browserkomposition oder Browser-E2E autorisieren.

## Entscheidung

Die folgenden Regeln würden erst mit einer getrennten Annahme dieses ADRs
normativ. Bis dahin sind sie weder Implementierungs- noch Laufautorisierung.

### 1. Modul-, Owner- und Testbarkeitsgrenze

Der einzige spätere Produktionsmodulpfad wäre:

```text
scripts/browser/browserSyncTransportRuntimeDiagnosticAdapter.js
```

Der einzige zugehörige Testpfad wäre:

```text
tests/browserSyncTransportRuntimeDiagnosticAdapter.test.js
```

Das Produktionsmodul dürfte genau einen benannten Export besitzen:

```text
createBrowserSyncTransportRuntimeDiagnosticAdapter()
```

Die Factory hätte Arity `0`, akzeptierte keine Optionen und keine Argumente
und lieferte eine frische, gewöhnliche, exakt einfeldrige und tief
eingefrorene API `{ run }`. `run` hätte Arity `0`. Modulimport und Factory
wären vollständig inaktiv: kein Foundationload, keine Clockabtastung, kein
Datei- oder Git-Zugriff, kein Timer, Prozess, Handle, Port, Log oder Output.
Jeder erste `run()`-Aufruf würde den privaten Owner vor jeder
Argumentauswertung und Wirkung irreversibel latchen. Nur der argumentlose
Erstaufruf dürfte danach Wirkungen beginnen; ein argumentbehafteter Erstaufruf
verbrauchte den Owner ohne Wirkung und rejected statisch.
Reentrante, parallele und spätere Aufrufe erhielten jeweils ein frisches,
lokales natives Rejection-Promise. Factoryfehler würden synchron, Lauffehler
asynchron und ausnahmslos statisch redigiert ausgegeben:

```text
invalidBrowserSyncTransportRuntimeDiagnosticAdapterArguments
browserSyncTransportRuntimeDiagnosticAdapterAlreadyUsed
browserSyncTransportRuntimeDiagnosticAdapterFailed
```

Ein Laufpromise dürfte nur mit einem frisch aus terminalem Cleanup
materialisierten, tief eingefrorenen 17-Felder-
`BrowserTransportDiagnosticRecord` erfüllt werden. Es dürfte niemals einen
internen Fehlergrund, Stack, Pfad, Raw-Identifier oder Teilrecord ausgeben.

Callerlieferbare Capabilities, `runBinding`, Gate-, Finding-, Digest-,
Provenienz-, Clock-, Scheduler-, Pipe-, Prozess-, Cleanup- oder Writerwerte
wären verboten. Die reale Factory verdrahtete ausschließlich private, im
Produktionsmodul fest ausgewählte Node-Core-Fähigkeiten. Kein
Dependency-Injection-Objekt dürfte den Produktionspfad erreichen.

Private Zustände dürften später nur wie bei ADR 0035 in einer pro Test neu aus
verifizierten Produktionsbytes erzeugten temporären Kopie geprüft werden. Die
Adapterquelle besäße dafür genau eine lexikalisch eindeutige Stelle
`// ADR-0036-ADAPTER-TESTCOPY-EXPORT-ANCHOR-V1` sowie genau je einen
lexikalisch eindeutigen Bindepunkt
`const adapterEvidenceEligible = true` und
`const createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities =
createBrowserSyncTransportRuntimeDiagnosticNodeCapabilities`. Es gäbe genau
zwei disjunkte Kopieprofile; ihre privaten Exports dürften niemals in derselben
Kopie kombiniert werden:

| Profil | Exaktes Namespace |
| --- | --- |
| Produktionsmodul | ausschließlich `createBrowserSyncTransportRuntimeDiagnosticAdapter` |
| `derivation-conformance` | öffentlicher Factoryexport plus `deriveBrowserSyncTransportRuntimeDiagnosticRecordGate`, `deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding` und `finalizeBrowserSyncTransportRuntimeDiagnosticRecord`; insgesamt exakt vier Namen |
| `virtual-runtime-conformance` | öffentlicher Factoryexport plus `createBrowserSyncTransportRuntimeDiagnosticAdapterOwner`, `enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent` und `installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities`; insgesamt exakt vier Namen |
| profilspezifische Mutantenkopie | exakt dasselbe Namespace wie ihr Baselineprofil und genau eine zusätzlich benannte Sourcesubstitution, nie ein weiterer Export |

Default-, Alias-, Re-Export- und weitere Namen wären in jedem Profil verboten.
Das `derivation-conformance`-Profil behielte die beiden reinen Ableitungen mit
Arity `1` und ausschließlich frischen, gewöhnlichen, exakt geformten, tief
eingefrorenen Eingaben:

```text
deriveBrowserSyncTransportRuntimeDiagnosticRecordGate({
  hardViolation, proofIncomplete
}) -> FAIL | UNPROVEN | PASS

deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding({
  candidateObserverGate, replayResult, stimulusCount, requestSequence,
  settlementOutcome, settlementStaticProfileResult
}) -> eines der fünf geschlossenen Findings

finalizeBrowserSyncTransportRuntimeDiagnosticRecord({
  foundationProjection, adapterLedger
}) -> { evidenceStatus, observerGate, finding, runtimeRecord }
```

Der Produktionspfad müsste genau diese drei Ableitungen verwenden. Im
`virtual-runtime-conformance`-Profil wären die zwei produktiven privaten
Bindings und der eine ausschließlich durch die Anchorinsertion entstehende
Installer wie folgt geschlossen:

```text
createBrowserSyncTransportRuntimeDiagnosticAdapterOwner(runtimeCapabilities)
  .length === 1
  -> referenzidentisch der einzige mutable produktive Owner

enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent(owner, producerEvent)
  .length === 2
  -> undefined

installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(runtimeCapabilities)
  .length === 1
  -> undefined
```

`createBrowserSyncTransportRuntimeDiagnosticAdapterOwner` akzeptierte genau
einen frischen, gewöhnlichen, exakt geformten und tief eingefrorenen
`RuntimeCapabilities`-Record. Der Aufruf validierte und hielt nur diese
Identität und erzeugte die tief eingefrorene `{ run }`-API; er rief noch keine
Capability auf. Seine Rückgabe wäre kein Wrapper und keine Testmaschine,
sondern derselbe produktive Owner, dessen `api`, `ownerRunPromise`,
`runState`, `activeRunToken`, `phase`, `attemptStarted`, `activeExchange`,
`waitingDequeueResolver`, `fifo`, `fifoMaterialBytes`, `nextFifoSequence`,
`dispatcherState`, `capLedger`, `wireLedger`, `pipeLedger`, `childLedger`,
`resourceLedger`, `foundationProjection`, `adapterObservationSnapshot`,
`cleanupLedger`, `finalizationCount` und `writerCallCount` auch der reale Lauf
verwendet. Keine dieser Properties dürfte nur für Tests ergänzt werden. Die
öffentliche Factory müsste ausschließlich so komponieren:

```text
createBrowserSyncTransportRuntimeDiagnosticAdapter()
  -> owner = createBrowserSyncTransportRuntimeDiagnosticAdapterOwner(
       createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities()
     )
  -> owner.api
```

`enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent` akzeptierte nur die
Identität dieses aktiven Owners und ein exakt geformtes produktives
`ProducerEventProfile`. Es wäre der einzige produktive Eintritt aller rohen
Callbackproduzenten in den Ownerdispatcher. Owner- und Generationguard lägen
vor Payloadreflection, Sequenzvergabe und Ledgeränderung. Erst dahinter liefen
der produktive Pipeparser beziehungsweise die Timer-, Child- und
Ressourcenübergänge; nur ein daraus erlaubter Foundationwert erreichte die
echte FIFO, während etwa Drain oder Writecompletion ausschließlich Ledger
änderten. Speicherung, Bytesaldierung, Pending-Dequeue-Auflösung, Overflow und
Terminalisierung blieben dieselbe produktive Adapterlogik; der Export öffnete
keine Ersatzqueue.

Der Installer existierte nur in der instrumentierten Kopie. Er akzeptierte
genau einen vollständigen frischen, gewöhnlichen, tief eingefrorenen
`RuntimeCapabilities`-Record, speicherte dessen Identität ohne Aufruf genau
einmal in einem kopielokalen Slot und lieferte `undefined`. Zweite
Installation, fehlender Wert oder zweiter Consume rejected statisch. Der
nicht exportierte
`consumeBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities()` hätte
Arity `0`, löschte den Slot atomar und lieferte genau diese eine Identität.

Das vollständige Capabilityprofil hätte diese exakte Own-Key-Reihenfolge; auch
alle verschachtelten Container wären gewöhnliche, accessor- und symbolfreie
Records mit ausschließlich den gezeigten Keys:

```text
{
  profile: "adr-0036-runtime-capabilities-v1",
  entropy: {
    readDiagnosticRunIdEntropyBytes, // length 0 -> mutable Uint8Array(17)
    readReplayContextIdEntropyBytes  // length 0 -> mutable Uint8Array(15)
  },
  clock: {
    readControllerNanoseconds,  // length 0 -> bigint
    readWallMilliseconds,       // length 0 -> nichtnegative safe integer
    readTimeZone                // length 0 -> primitiver String
  },
  runtime: {
    readProcessPlatform,           // length 0 -> primitiver String
    readProcessArchitecture,       // length 0 -> primitiver String
    readProcessVersion,            // length 0 -> primitiver String
    readProcessExecutablePath,     // length 0 -> primitiver String
    readProcessExecArguments,      // length 0 -> frisches Own-Data-Array
    readProcessEnvironmentMatches, // length 1: Name -> frisches Matcharray
    readWorkingDirectory           // length 0 -> primitiver String
  },
  scheduler: {
    armTimer,                   // length 2: callback, milliseconds -> Handle
    cancelTimer                 // length 1: exaktes Handle -> undefined
  },
  pipe: {
    openDebugPipe,              // length 2: Childhandle, producerSink -> Pipepaar
    writeDebugPipe,             // length 3: Paar, Uint8Array, completionSink
                                // -> {acceptedByteLength, backpressure}
    closeDebugPipe              // length 1: exaktes Paar -> undefined
  },
  launcher: {
    spawnChild,                 // length 2: Spawnprofil, producerSink -> Handle
    terminateChild,             // length 1: exaktes Handle -> undefined
    closeChild                  // length 1: exaktes Handle -> undefined
  },
  resources: {
    performResourceOperation,   // length 2: Operation, producerSink -> Token
    closeResource               // length 2: Handle, producerSink -> Token
  }
}
```

Rootrecord und sieben Capabilitycontainer würden tief eingefroren; die
Funktionswerte blieben wie in ADR 0034 undurchlaufene Blätter. Später gelieferte
Byteviews, Handles, Tokens und Capabilityresultate gehörten nicht zu diesem
Freezegraph. Keine nichtleere Typed Array würde eingefroren.

Die zwei Entropiefunktionen riefen im realen Profil unabhängig und jeweils
genau einmal `crypto.randomBytes(17)` beziehungsweise
`crypto.randomBytes(15)` auf. Sie normalisierten den dabei erhaltenen
`Buffer`-Subclass unmittelbar in eine frische gewöhnliche `Uint8Array`,
verwarfen die Bufferreferenz und lieferten nur diese mutable, nicht-geteilte,
nicht überlappende, nicht resizable und nicht `SharedArrayBuffer`-basierte View
mit `byteOffset:0` und gleich großer Backing-Allocation. Das virtuelle Profil
müsste dieselbe Bytegrenze liefern.
Der Owner kopierte jede View unmittelbar descriptor- und brandgeprüft in eine
eigene gleich große View, verwarf die Capabilityreferenz und leitete Base32 und
IDs ausschließlich aus seiner Kopie ab. Die beiden Kopien dürften nicht
überlappen; nach ID-Ableitung würden auch sie verworfen. Falsche Marke, Länge,
Backingform, Alias, detached View oder Throw endeten statisch vor jeder
Wirkung.

`readControllerNanoseconds()` dürfte ausschließlich bei einem phasengültigen
Foundation-Clockintent oder dem einmaligen äußeren Cleanupcap gelesen werden
und lieferte eine nichtnegative `bigint`. `readWallMilliseconds()` und
`readTimeZone()` würden nach dem Run-Owner-Latch jeweils genau einmal vor der
ersten Datei-, Timer-, Pipe- oder Spawnwirkung gelesen. Wallclock wäre ein
nichtnegativer Safe Integer; Timezone höchstens 64 printable ASCII-Zeichen und
müsste `iana-shaped-ascii-time-zone-v1` erfüllen. Ein zweiter Read, Rücklauf,
Throw oder Profilfehler wäre der statische Capabilityfehler.

Die sieben `runtime`-Funktionen wären ebenfalls reine Rohquellen. Platform und
Architektur wären primitive printable ASCII-Strings von höchstens 16 Bytes,
Version höchstens 32 ASCII-Bytes, Executable Path und Working Directory je
höchstens 32.767 UTF-16-Codeunits ohne NUL. `readProcessExecArguments()`
lieferte ein frisches gewöhnliches Own-Data-Array mit höchstens 16 primitiven
Strings und höchstens 1.024 UTF-8-Bytes pro Eintrag. Der produktive Owner
forderte weiterhin exakt die Zweierfolge aus Abschnitt 8.
`readProcessEnvironmentMatches(name)` dürfte genau einmal und in dieser
Reihenfolge nur mit
`NODE_OPTIONS`, `SystemRoot`, `WINDIR`, `ComSpec`, `PATHEXT`, `Path`, `TEMP`,
`TMP`, `LOCALAPPDATA`, `ProgramFiles`, `ProgramFiles(x86)` und `ProgramW6432`
aufgerufen werden. Es lieferte ein frisches Array von höchstens 16 gewöhnlichen
Own-Data-Records exakt `{ name, value }`; beide Werte wären primitive Strings,
der Name höchstens 256 und der Wert höchstens 32.767 UTF-16-Codeunits. Das
Array enthielte nur case-insensitive Windows-Treffer für den angefragten Namen.
Null Treffer blieben fehlend, mehr als ein Treffer mehrdeutig; ausschließlich
die produktive Logik leitete daraus die feste Environmentprojektion und das
`NODE_OPTIONS`-Verbot ab. Die reale Capability dürfte pro Aufruf höchstens 256
Own-Property-Namen des Environments enumerieren; jeder müsste ein primitiver
String mit höchstens 256 UTF-16-Codeunits ohne NUL sein. Nur für
case-insensitiv zum angefragten Allowlistnamen passende Namen dürfte sie den
Wert lesen. Namen ohne Treffer würden unmittelbar verworfen, ihre Werte nie
gelesen; Überschreitung oder malformed Enumeration scheiterte statisch. Das
gesamte Environment oder ein fremder Wert durfte nie gelesen oder projiziert
werden.

Nach Owner-Latch wäre die R0-Quellenreihenfolge exakt: beide
Entropiefunktionen, Wallclock, Timezone, Platform, Architektur, Version,
Executable Path, Exec Arguments, Working Directory und anschließend die zwölf
Environmentabfragen in der eben genannten Reihenfolge. Erst nach Prüfung und
defensiver Projektion dieser Quellen dürfte eine effectful Capability laufen.
Die wiederholten Handle-, Pfad- und Bytesprüfungen aus Abschnitt 2 wären davon
getrennte Ressourcenoperationen und keine erneuten R0-Messungen. Jede falsche
Arity, Eingabe, Ergebnisform, Capüberschreitung oder Capabilityexception setzte
ausschließlich einen privaten Capabilityfehler-Latch; dieser interne Zustand
wäre keine vierte öffentliche Fehlerform. Der öffentliche Runpfad mappt ihn auf
`browserSyncTransportRuntimeDiagnosticAdapterFailed`, ein bereits begonnenes
Effectexchange auf `browserSyncTransportRuntimeDiagnosticAdapterEffectFailed`;
der Rohgrund würde jeweils verworfen.

`armTimer(callback,milliseconds)` akzeptierte nur die produktiv gebundene
Arity-0-Closure der aktiven Owner-/Capgeneration und einen nichtnegativen Safe Integer
bis `60_000`; es lieferte genau einen undurchsichtigen Timerhandle.
`cancelTimer(handle)` akzeptierte ausschließlich die aktive Identität, lieferte
`undefined` und invalidierte deren Generation vor Handlefreigabe. Der
`producerSink` der Pipe- und Launcherfunktionen sowie der `completionSink` des
Writes wären produktiv erzeugte, nicht callerlieferbare Closures. Ein
Pipepaar dürfte nur einmal aus dem gebundenen Chrome-Childhandle erzeugt
werden. `writeDebugPipe` akzeptierte eine owner-eigene unveränderte View von
höchstens 65.536 Bytes und lieferte gewöhnlich exakt
`{ acceptedByteLength, backpressure }`; `acceptedByteLength` war ein Safe
Integer zwischen `0` und der vollständigen Viewlänge einschließlich, und
`backpressure` boolean. Vollständige Annahme mit `false`, vollständige Annahme
mit `true` und partielle Annahme waren verschiedene zulässige Ergebnisse.
Pair, Timer-, Child-, Ressourcen-
und Operationhandles wären undurchsichtige Identitäten: Sie würden nie
reflektiert, kopiert, eingefroren, serialisiert oder ausgegeben und dürften nur
in derselben aktiven Generation Cancel, Close oder Terminate erreichen.

Jede Capabilityfunktion würde mit `undefined` als Receiver aufgerufen und
lieferte synchron ausschließlich den genannten Wert, nie Promise oder Thenable;
spätere Rückläufe gelangten nur über produktiv gebundene Closures. Jeder
`producerSink` und `completionSink` hätte Arity `1`. Das geschlossene
`RawCapabilitySignalProfile` bestünde aus gewöhnlichen, accessor- und
symbolfreien, shallow-frozen Own-Data-Rootrecords; Byteviews und Handles wären
undurchlaufene Blätter. Der gebundene Pipe-Rawsink erhielte exakt
`{kind:"read-chunk",bytes}`, `{kind:"read-eof"}`, `{kind:"read-error"}`,
`{kind:"drain"}` oder `{kind:"write-error"}`; der Write-Completion-Sink exakt
`{state:"completed"|"failed"}`. Der Child-Rawsink erhielte exakt
`{kind:"stdout",bytes}`, `{kind:"stderr",bytes}`, `{kind:"exit",code,signal}`,
`{kind:"close",code,signal}` oder `{kind:"error"}`. Der Ressourcen-Rawsink
erhielte exakt `{operationId,state,result}` mit
`state:"completed"|"failed"`; bei `failed` wäre `result:null`, bei `completed`
exakt das operationsgebundene Resultat. Die ownergebundene Closure ergänzte
erst danach Producerhandle und Generation und erzeugte den
`ProducerEventProfile`; Capability oder Fixture durften diesen Rootrecord nie
selbst liefern. Ein Terminal-Rawsink durfte pro Handle-/Generation höchstens
einmal eintreten; weitere Eintritte wurden erst am produktiven Guard als stale
behandelt.

Jede ownergebundene Timer-, Raw-Sink- oder Completion-Sink-Closure durfte erst
nach der synchron erfolgreichen Capabilityrückkehr und der anschließenden
ownerlokalen Bindung des gelieferten Handles oder Tokens eintreten. Ein
synchroner Callback- oder Sinkeintritt noch innerhalb von
`armTimer`, `openDebugPipe`, `writeDebugPipe`, `spawnChild`,
`performResourceOperation` oder `closeResource` wäre eine bestätigte
Capabilityverletzung; sein Argument würde verworfen, ohne einen handlelosen
oder fabrizierten `ProducerEventProfile` zu erzeugen. Die ownergebundenen
Timer-, Raw-Sink- und Completion-Sink-Closures fingen interne
Verarbeitungsausnahmen, latchten sie fail-closed und lieferten der Capability
synchron immer primitives `undefined`; ein Callback- oder Sinkthrow blieb
daher kein offener Bytesaldofall.

`spawnChild` akzeptierte exakt einen gewöhnlichen, tief eingefrorenen
`SpawnProfile` mit der Own-Keyfolge
`{ role, executablePath, entryPath, arguments, workingDirectory, environment,
stdioProfile, windowsHide, shell, detached }`. `role` wäre ausschließlich
`vite|gateway|chrome`; `entryPath` wäre für Chrome `null`, sonst der gebundene
Entry. Argumente und Environment wären frische Own-Data-Arrays aus den exakten
Allowlisten in Abschnitt 8, höchstens 16 Argumente, höchstens 16
Environmentrecords und zusammen höchstens 65.536 UTF-8-Bytes. `stdioProfile`
wäre für Vite/Gateway `node-readiness-v1`, für Chrome
`chrome-debug-pipe-v1`; `shell:false`, `detached:false` und das rollengebundene
`windowsHide` wären fest. Ausschließlich daraus erzeugte der reale Launcher
einen undurchsichtigen Childhandle und rohe Childereignisse; PID, Finding,
Readiness- oder Cleanupstatus waren keine Capabilityresultate.

`performResourceOperation` akzeptierte ausschließlich den produktiv erzeugten
gewöhnlichen, selektiv eingefrorenen Graphen exakt
`{ operationId, kind, input }` und den gebundenen Sink; Rootrecord und alle
gewöhnlichen Own-Data-Record-/Arraycontainer des Inputs wären frozen, die
Traversal endete vor undurchsichtigen Handle- und nichtleeren
`Uint8Array`-Blättern. `operationId` war ein positiver ownerlokaler Safe
Integer. Seine geschlossene Grammatik lautete:

| `kind` | Exakte `input`-Keys | Einziges erfolgreiches rohe Resultat |
| --- | --- | --- |
| `canonicalize-path` | `{ path }` | `{ kind:"canonical-path", path }` |
| `inspect-path` | `{ path }` | `{ kind:"path-identity", pathType, volumeId, fileId, byteLength, modifiedTimeNanoseconds, changeTimeNanoseconds, reparsePoint }` |
| `open-resource` | `{ path, expectedType }` | `{ kind:"resource-opened", resourceHandle }` |
| `inspect-open-resource` | `{ resourceHandle }` | `{ kind:"open-resource-identity", pathType, volumeId, fileId, byteLength, modifiedTimeNanoseconds, changeTimeNanoseconds, reparsePoint }` |
| `read-resource` | `{ resourceHandle, offset, maximumByteLength }` | `{ kind:"resource-bytes", bytes, endOfFile }` |
| `list-directory` | `{ resourceHandle, maximumEntries }` | `{ kind:"directory-entries", entries }` |
| `create-temporary-root` | `{ parentPath, prefix }` | `{ kind:"resource-created", path, resourceHandle, pathIdentity }` |
| `create-directory-exclusive` | `{ parentHandle, name }` | dieselbe `resource-created`-Form |
| `create-file-exclusive` | `{ parentHandle, name, bytes }` | dieselbe `resource-created`-Form |
| `passive-tcp-listeners` | `{ endpoints:[{address:"127.0.0.1",port:5173},{address:"127.0.0.1",port:8787}] }` | `{ kind:"passive-tcp-listeners", endpoints:[{address,port,state},{address,port,state}] }` |

`pathIdentity` in jeder `resource-created`-Form wäre gewöhnlich exakt
`{ pathType, volumeId, fileId, byteLength, modifiedTimeNanoseconds,
changeTimeNanoseconds, reparsePoint }`. `expectedType` wäre
`regular-file|directory`; `pathType` wäre
`regular-file|directory|other`, `reparsePoint` boolean, `volumeId`, `fileId`
und die Nanosekundenwerte jeweils `null` oder eine kanonische nichtnegative
Dezimalform `0|[1-9][0-9]{0,63}`, und `byteLength` ein nichtnegativer Safe
Integer. Jeder `path` oder `parentPath` wäre ein primitiver String mit höchstens
32.767 UTF-16-Codeunits ohne NUL; jeder erzeugte Ergebnispfad erfüllte dieselbe
Grenze. `prefix` wäre 1 bis 64 printable ASCII-Zeichen aus
`[A-Za-z0-9_-]`; `name` wäre eine einzelne, von `.` und `..` verschiedene
Pfadkomponente mit 1 bis 1.024 UTF-8-Bytes ohne NUL, Slash oder Backslash.
`offset` wäre nichtnegativ, `maximumByteLength` höchstens `1_048_576`,
`maximumEntries` höchstens `4_096`; die kumulativen §2-/§8-Caps blieben
zusätzlich maßgeblich. `resource-bytes.bytes` wäre höchstens so lang wie das
angeforderte `maximumByteLength`, `endOfFile` boolean. `entries` wäre ein
gewöhnliches dichtes Own-Data-Array mit höchstens dem angeforderten
`maximumEntries`. Ein Directoryentry wäre gewöhnlich exakt
`{ name, pathType, reparsePoint }`, sein Name höchstens 1.024 UTF-8-Bytes ohne
NUL. `state` der passiven Quelle wäre `free|occupied|unavailable`; nur `free`
für beide gebundenen Endpoints könnte später positiv beitragen. Createbytes
wären eine owner-eigene mutable `Uint8Array` bis `1_048_576` Bytes. Jeder
Aufruf lieferte genau einen undurchsichtigen Operationtoken; das Resultat kam
ausschließlich über die Producergrenze. `closeResource(handle,producerSink)`
lieferte ebenfalls einen Operationtoken und durfte nur
`{ kind:"resource-closed" }` produzieren. Keine Operation lieferte
Replayoperand, Digest, Ack, Integrity-/Cleanupstatus, Gate, Finding oder
Record.

Capabilityresultate blieben unvertrauenswürdig. Gewöhnliche Array-/Recordwerte
würden descriptorbasiert sofort in frische adaptereigene Projektionen kopiert
und danach nicht gehalten. Ein Entropieresultat wäre nur bis zur synchronen
Capabilityrückkehr capability-owned; der Adapter kopierte es unmittelbar und
die Capability verwarf ihre Referenz. Pipe-, Child- und Ressourcenbytes wären
bis zum Sinkeintritt producer-owned; der Adapter kopierte sie synchron vor
Rückkehr des Sinks. Nur die Adapterkopie erreichte Decoder, Scanner, Parser
oder Readinessscanner. Jede an `writeDebugPipe` übergebene Versuchview ginge
als exklusiver read-only Loan an die Pipecapability; diese dürfte sie nie
mutieren. Der Adapter verwarf seinen mutable Alias vor dem nächsten Übergang
und hielt bis Completion oder Pairclose nur primitive Länge, Zustand,
Writegeneration und String-/Hashbindung. Bei partieller Annahme materialisierte
er einen benötigten Restsuffix frisch aus der bereits gebundenen serialisierten
Commandform. Die Capability gab den Loan bei Writecompletion oder Pairclose
frei.

`ProducerEventProfile` wäre ein gewöhnlicher, shallow-frozen Rootrecord exakt
`{ profile, producer, producerHandle, generation, event }` mit
`profile:"adr-0036-producer-event-v1"`, positiver Safe-Integer-Generation und
undurchsichtigem Handleblatt. Gewöhnliche Eventcontainer wären ebenfalls
shallow-frozen; Byteviews und Handles blieben mutable beziehungsweise opaque
Blätter. Die Varianten wären geschlossen:

| `producer` | Exakte `event`-Varianten |
| --- | --- |
| `scheduler` | `{kind:"fired"}` |
| `debug-pipe-read` | `{kind:"chunk",bytes}`; `{kind:"eof"}`; `{kind:"error"}` |
| `debug-pipe-write` | `{kind:"drain"}`; `{kind:"error"}`; `{kind:"completion",writeGeneration,state}` mit `state:"completed"\|"failed"` |
| `child` | `{kind:"stdout",bytes}`; `{kind:"stderr",bytes}`; `{kind:"exit",code,signal}`; `{kind:"close",code,signal}`; `{kind:"error"}` |
| `resource` | `{kind:"completion",operationId,state,result}` mit `state:"completed"\|"failed"`; bei `failed` exakt `result:null`, sonst eine der obigen Rohresultatformen |

Jeder Pipe-/Childchunk wäre höchstens 65.536 Bytes. `code` wäre `null` oder ein
32-Bit-Integer, `signal` `null` oder höchstens 32 printable ASCII-Zeichen;
`writeGeneration` und `operationId` wären positive korrelierte Safe Integer.
Fehlerereignisse trügen nie Grund, Exception oder Stack. Der Owner käme nie aus
dem Event, sondern ausschließlich aus dem ersten Argument von
`enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent` beziehungsweise der
gebundenen Sinkclosure. Owner, Handle und Generation würden vor jeder
Payloadreflection geprüft. Ein fremder Owner rejected statisch ohne Mutation;
ein bekanntes spätes, stale oder doppeltes Terminalereignis lieferte
`undefined` und blieb vollständig inert. Unbekannter Handle oder zukünftige
Generation latchte vor Payloadreflection eine bestätigte Producerverletzung.
Ein aktives malformed oder fehlerhaftes Ereignis verwarf den Rohgrund,
invalidierte die Generation und führte fail-closed in Cleanup. Nur ein aktives,
exakt korreliertes Ereignis durfte genau einmal Ledger oder FIFO verändern.
`debug-pipe-write/error` wäre ein streamseitiges Pairereignis unabhängig vom
writegebundenen Completion-Sink und dürfte daher auch nach terminaler
Completion einer früheren Writegeneration eintreten, solange das Pipepaar noch
aktiv wäre. Eine zweite Completion derselben Writegeneration bliebe dagegen
stale und inert.

Die virtuelle Fixture wäre ausschließlich In-Memory und lieferte eine tief
eingefrorene Controller-API exakt `{ dispatch, snapshot }` mit Arity `1/0`.
`dispatch(profile)` akzeptierte gewöhnlich und exakt nur:

```text
{kind:"source-return", source, value}
{kind:"source-throw", source}
{kind:"fail-next-capability-call", capability}
{kind:"timer-fire", timerOrdinal}
{kind:"pipe-chunk", pipeOrdinal, bytes}
{kind:"pipe-eof"|"pipe-read-error"|"pipe-write-error"|"pipe-drain",
 pipeOrdinal}
{kind:"pipe-write-result", pipeOrdinal, acceptedByteLength, backpressure}
{kind:"pipe-write-completion", pipeOrdinal, state:"completed"|"failed"}
{kind:"child-stdout"|"child-stderr", childOrdinal, bytes}
{kind:"child-exit"|"child-close", childOrdinal, code, signal}
{kind:"child-error", childOrdinal}
{kind:"resource-completion", operationOrdinal,
 state:"completed"|"failed", result}
```

`source` wäre entweder exakt einer der elf Nicht-Environment-Namen
`readDiagnosticRunIdEntropyBytes`, `readReplayContextIdEntropyBytes`,
`readControllerNanoseconds`, `readWallMilliseconds`, `readTimeZone`,
`readProcessPlatform`, `readProcessArchitecture`, `readProcessVersion`,
`readProcessExecutablePath`, `readProcessExecArguments` und
`readWorkingDirectory` oder exakt einer der zwölf Labels
`process-environment:<Name>` mit dem jeweils in der oben festgelegten
Environmentallowlist geschriebenen Namen. Wiederholte Controllerclockwerte
würden in Dispatchreihenfolge verbraucht, jede andere R0-Quelle genau einmal.
`capability` wäre einer der effectful Methodennamen aus Scheduler, Pipe,
Launcher oder Resources. Ordinale wären fixturelokale positive Safe Integer;
Timer-, Pipe-, Child- und Operationordinale würden erst nach erfolgreicher
Rückkehr des jeweiligen produktiven Capabilityaufrufs live,
Ressourcenordinale erst nach erfolgreicher Open-/Create-Completion und
Raw-Sink-Rückkehr. Sie wären weder Handle noch Owner oder Generation und
verschwänden bei ihrem korrelierten terminalen Fire-, Cancel-, Close- oder
Completionübergang wieder aus `liveOrdinals`. Dispatch kopierte Callerbytes
sofort in eine frische mutable View. `source-return|source-throw` hängte genau einen
Eintrag an die FIFO der benannten Quelle; deren nächster Aufruf konsumierte
genau den Kopf. `fail-next-capability-call` bewaffnete genau den nächsten Aufruf
der benannten effectful Methode und löschte sich vor seinem statischen Throw.
Ein zweiter unverbrauchter Eintrag für eine einmalige R0-Quelle, ein doppelter
Failurearm oder ein Quellaufruf bei leerer Queue war
`browserSyncTransportRuntimeDiagnosticVirtualDispatchStateInvalid`.
`pipe-write-result` stellte genau das synchrone Resultat des nächsten
`writeDebugPipe`-Aufrufs dieses Pipeordinals bereit. Am Aufruf musste
`acceptedByteLength` zusätzlich höchstens der angebotenen Viewlänge sein; so
waren vollständige Annahme mit und ohne Backpressure sowie partielle Annahme
getrennt skriptbar. Pro Pipe durfte höchstens ein solches Resultat pending sein;
ein zweites oder ein `writeDebugPipe`-Aufruf ohne genau ein vorbereitetes
Resultat scheiterte mit dem statischen Fixturezustandsfehler. Ein
`fail-next-capability-call` für `writeDebugPipe` und irgendein pending
`pipe-write-result` waren gegenseitig ausgeschlossen; die jeweils zweite
Dispatchform scheiterte vor Zustandsänderung. Pro Pipe durfte höchstens eine
Writegeneration offen sein. `pipe-write-completion` adressierte ohne weitere
callerlieferbare Identität ausschließlich deren gebundenen Completion-Sink;
keine oder mehrere aktive Writegenerationen waren ein Fixturezustandsfehler.
`pipe-read-error` und `pipe-write-error` blieben unabhängige asynchrone
Produzenten. `timer-fire` rief ausschließlich die bereits produktiv gebundene
Timerclosure auf, `pipe-write-completion` ausschließlich den gebundenen
Completion-Sink und jede andere asynchrone Dispatchvariante ausschließlich den
zugehörigen Raw-Sink; jeder erfolgreiche Dispatch lieferte `undefined`.
Malformed Profile führten zu
`TypeError("browserSyncTransportRuntimeDiagnosticVirtualDispatchInvalid")`,
unbekannte Ordinale oder falsche Zustände zu
`Error("browserSyncTransportRuntimeDiagnosticVirtualDispatchStateInvalid")`;
beides geschah vor einem Sinkaufruf. Die Fixture akzeptierte insbesondere kein
`ProducerEventProfile`, `cdp-message`, `cap-fired`, `connection-closed`,
Effect-Ack, Cleanupcheck, Gate, Finding oder Record als Eingabe.

Bei erfolgreicher `resource-completion` verwendete `result` dieselbe
operationsgebundene virtuelle Resultatform wie das Rawresultat, mit genau zwei
Ausnahmen: `resource-opened` war in der Dispatchform exakt
`{kind:"resource-opened"}`, `resource-created` exakt
`{kind:"resource-created",path,pathIdentity}`. Nur die Fixture erzeugte dazu
einen frischen opaque Ressourcenhandle und eine neue Ressourcenordinal und
setzte den Handle ausschließlich in das dem gebundenen Raw-Sink übergebene
Resultat ein. Ein Caller konnte somit weder Handle noch Ressourcenordinal
fabrizieren. Bei `state:"failed"` war `result` zwingend `null`.

`snapshot()` lieferte frisch und tief eingefroren exakt
`{ profile, dispatchCount, pendingSourceResultCount,
pendingCapabilityFailureArmCount, pendingPipeWriteResultCount, callCounts,
liveOrdinals, producerTurnCount, fixtureOwnedByteLength }` mit
`profile:"adr-0036-virtual-runtime-snapshot-v1"`. `callCounts` spiegelte die
sieben Capabilitygruppen und innerhalb davon exakt deren Methodennamen auf
nichtnegative Safe-Integer-Zähler; `liveOrdinals` enthielt exakt die fünf
Own-Data-Arrays `timers`, `debugPipes`, `children`, `resourceOperations` und
`resources` mit aufsteigend sortierten fixturelokalen Ordinalen. Alle übrigen
Blätter wären primitive Counts. Handles, Callbacks, Rawbytes, Pfade,
Fehlergründe, Acks und Foundationwerte blieben ausgeschlossen. Der Snapshot
bewiese keinen produktiven Ack oder Cleanupstatus.

`dispatchCount` erhöhte sich genau nach einem erfolgreich validierten und
zustandskonform übernommenen Dispatch; jede vor Übernahme verworfene Eingabe
ließ ihn unverändert. `pendingSourceResultCount` zählte ausschließlich noch
nicht konsumierte `source-return|source-throw`-Einträge;
`pendingCapabilityFailureArmCount` war exakt `0|1`, und
`pendingPipeWriteResultCount` zählte die vorbereiteten Writeergebnisse aller
Pipes. `producerTurnCount` erhöhte sich erst, wenn ein gebundener
Raw-Sink genau einmal aufgerufen worden war und synchron zurückkehrte. Jede von
der Fixture gehaltene Bytekopie floss in `fixtureOwnedByteLength` ein:
Sourcebytes wurden unmittelbar nach Capabilityrückkehr, asynchrone
Producerbytes unmittelbar nach Raw-Sink-Rückkehr abgezogen. Rejected Dispatches
änderten keinen Zähler, keine Ordinalmenge und keinen Bytesaldo.

Die drei Ebenen wären strikt getrennt und vollständig produktiv verdrahtet:

```text
R0-Quellcapability
  -> sofortige defensive Ownerprojektion/-kopie
  -> ausschließlich lokale Ableitung und ownergebundene Bindung/Ledger

effectful Capability
  -> synchrone Rückgabe und ownergebundene Handle-/Tokengeneration
  -> spätere Timerclosure | Raw-Sink | Completion-Sink
  -> produktiver Owner erzeugt ProducerEventProfile
  -> enqueue... mit Owner-/Handle-/Generationguard
  -> produktiver Parser beziehungsweise Timer-/Child-/Ressourcenübergang
  -> produktives Ledger
  -> nur bei erlaubtem Foundation-Dequeuewert: einzige sequenzierte FIFO
       -> frischer tief eingefrorener Foundation-Dequeuewert
       -> effectPort.exchange
```

Pipechunks durchliefen Framing, fatalen UTF-8-Decoder, Duplicate-Key-Scanner,
genau einen nativen Parse und die defensive Projektion, bevor daraus
`cdp-message` entstand. EOF bei leerem Akkumulator erzeugte
`connection-closed`, Timerfire das korrelierte `cap-fired`, und ein terminales
Ressourcenresultat durfte erst über die produktive Creation-/Cleanupmatrix zu
`cleanup-fact` werden. Drain, Writecompletion und Childevents änderten nur die
produktiven Ledger, solange kein erlaubter Foundationwert daraus folgte.
Fixture, Capability und Producer durften keine dieser Foundationformen direkt
herstellen.

Ohne Capability blieben nur deterministische lokale Transformationen mit
bereits gebundenem Input zulässig: Base32 aus den kopierten 17-/15-Bytewerten,
ISO-Serialisierung und Rückprojektion aus dem einen Wallclockwert, SHA-256 aus
exakt bezeichneten Bytes, UTF-8-/Scanner-/JSON-Verarbeitung aus
adaptereigenen Pipekopien, Git-Object-/Packdekodierung aus Ressourcenbytes,
Pfad-/URL-Stringableitungen aus gelesenen primitiven Werten sowie
`vm.SourceTextModule` ausschließlich aus dem einen Foundationbytesnapshot mit
kanonischer Identifier-URL und null Imports. Diese lokalen Primitiven durften
keine neue externe Quelle öffnen. Direkte Verwendung von `process.*`,
`process.env`, `crypto.randomBytes`, `Date.now`, `Intl`, Filesystem, Timer,
Childprozess, Pipe oder passiver Portquelle außerhalb der ausgewählten
Capabilities wäre verboten; ein versteckter Hostfallback existierte nicht.

Erst nach Längen- und SHA-256-Prüfung der exakten Produktionsbytes dürfte jede
Kopie ausschließlich aus diesen Bytes entstehen. `derivation-conformance`
fügte am einmaligen Anchor genau einen festen Block aus der privaten
nullstelligen Sperrfunktion
`rejectBrowserSyncTransportRuntimeDiagnosticDerivationCapabilities` und der
festen Exportdeklaration der drei bereits produktiven Ableitungsbindings ein.
Die Sperrfunktion wäre bytegenau:

```text
function rejectBrowserSyncTransportRuntimeDiagnosticDerivationCapabilities() {
  throw new TypeError("browserSyncTransportRuntimeDiagnosticAdapterFailed")
}
```

Das Profil ersetzte exakt einmal die vollständige Deklaration
`const adapterEvidenceEligible = true` durch
`const adapterEvidenceEligible = false` und exakt einmal nur die RHS der
vollständigen Selector-Deklaration von
`createBrowserSyncTransportRuntimeDiagnosticNodeCapabilities` auf
`rejectBrowserSyncTransportRuntimeDiagnosticDerivationCapabilities`. Weitere
Änderungen wären verboten. Ein argumentloser Aufruf des exportierten
Factorybindings endete damit synchron am Selector mit genau diesem statisch
redigierten `TypeError`, bevor reale Capabilityfactory, Owner, `{ run }`-API,
Promise oder irgendeine Entropie-, Clock-, Environment-, Datei-, Timer-, Pipe-,
Prozess- oder andere Hostquelle erreichbar war. Es entstand keine Rückgabe;
auch `createBrowserSyncTransportRuntimeDiagnosticAdapter().run()` endete am
Factorythrow, bevor `run` oder eine Property eines Ergebnisses ausgewertet
wurde. Der bestehende argumentbehaftete Factoryfall blieb
`invalidBrowserSyncTransportRuntimeDiagnosticAdapterArguments`.

`virtual-runtime-conformance` fügte am selben Anchor genau einen festen
Instrumentierungsblock ein. Dieser Block definierte ausschließlich einen
initial leeren kopielokalen Capabilityslot, den genannten Installer, den nicht
exportierten Consumer und die feste Exportdeklaration für Owner, Eventgrenze
und Installer; kein anderer Testzustand oder Code läge darin. Das Profil nähme
dieselbe vollständige Evidence-Ersetzung vor und ersetzte zusätzlich exakt
einmal nur dieselbe Selector-RHS durch
`consumeBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities`. Eine Kopie
dürfte nie beide Selectorersetzungen enthalten;
`adapterEvidenceEligible:false` wäre ausschließlich Evidenzdemotion und keine
allgemeine Ownersperre, sodass das virtuelle Profil produktiv weiterlaufen
konnte. Eine
Mutantenkopie entstünde erneut aus den ursprünglichen Produktionsbytes und
enthielte neben den profilspezifischen Änderungen genau eine deklarierte
Mutation. Null-, Mehrfachtreffer oder jede weitere Byteabweichung brächen vor
Import ab. Der Test müsste gegen die erwarteten festen Insertions- und
Substitutionsbytes sowie einen daraus vorab berechneten Gesamtdiff vergleichen;
eine semantisch ähnliche freie Umschreibung wäre unzulässig.

Jede Kopie läge unter einem frisch aufgelösten OS-Temporärroot außerhalb des
Repositorys, würde seriell über eine eindeutige `.mjs`-File-URL importiert und
im `finally` samt Temproot entfernt; Nichtexistenz wäre anschließend zu
bestätigen. Im virtuellen Profil bliebe die reale Capabilityfactory zwar
lexikalisch vorhanden, wäre aber durch den geprüften Selector unerreichbar;
im Ableitungsprofil wäre auch die öffentliche Factory konstruktiv vor ihr
gesperrt. Alle hostwirksamen Node-Callsites müssten ausschließlich hinter den
Methoden der realen Factory liegen; deren bloße Erzeugung dürfte noch keine
Quelle lesen oder Wirkung starten. Die spätere Gegenprobe
`derivation-no-host-selector-poison` entstünde aus Produktionsbytes mit dem
vollständigen Ableitungsprofil und genau einer zusätzlichen benannten
RHS-Sourcesubstitution: Anstelle der Sperre stünde der inline benannte
nullstellige Funktionsausdruck
`function derivationRealFallbackPoison(){ throw new
Error("ADR-0036-DERIVATION-REAL-FALLBACK-POISON") }`. Die Baseline müsste den
exakten Factory-`TypeError`, keine Rückgabe, keinen Owner-/Runaufruf, keinen
Aufruf der realen Capabilityfactory oder ihrer Methoden und keinen Hostcall
bestätigen; der Mutant müsste am abweichenden Sentinel sterben,
bevor tatsächliches I/O möglich wäre. Der getrennte Ein-Substitutionsmutant
`derivation-real-selector-fallback` setzte nur dieselbe RHS auf die reale
Nodefactory zurück; weil deren bloße Erzeugung definitionsgemäß keine Quelle
liest, müsste die fehlende synchrone Rejection bereits an der unerwarteten
Factoryrückgabe sterben, ohne `run()` aufzurufen. Eine getrennte
Sourcestrukturprüfung müsste außerdem jede Selector-Rückkehr zur realen
Nodefactory verwerfen.
Weder Environment noch Calleroption, Loaderhook oder zweiter öffentlicher
Einstieg dürfte die Auswahl beeinflussen.

In beiden Kopieprofilen wäre `adapterEvidenceEligible` konstruktiv `false` und
nicht durch die Fixture überschreibbar. Reine Ableitungen dürften
hypothetisches `PASS` liefern; der echte Testfinalizer müsste bei bestätigter
Verletzung `FAIL`, sonst höchstens `UNPROVEN`, immer
`evidenceStatus:NOT_EVIDENCE`, `runtimeRecord:null` und `writerCallCount:0`
liefern. Jede virtuelle Baseline müsste den produktiven Owner direkt und
mindestens einmal die öffentliche Factory nach genau einer Installation
durchlaufen. Permanente Testexports, frei komponierbare Teilfakes und eine
zweite Adaptermaschine blieben verboten.

Diese beiden Adapterkopieprofile sind nicht die bestehende
ADR-0035-Foundationtestkopie. Deren exakt vier private Bindings, insgesamt fünf
Exports, Anchor und Instrumentierung bleiben unverändert; ihre aktuelle
Quellbindung sind die ADR-0037-Bytes aus Abschnitt 2. Keiner ihrer Exports
wird wiederverwendet, umbenannt oder kombiniert. Im getrennten
Foundation-Konformitätszugang wird der produktive interne Konstruktorinput
`{ activeExchange, activeObservationClosed, runBinding }` geprüft;
ausschließlich dort sind die produktiven Werte `activeObservationClosed`,
`observationNotificationState` und `observationNotificationViolation`
beobachtbar. Das eröffnet keinen
Adapterinspector, keinen weiteren Export, Installer oder Capabilityseam.

### 2. Byte-owned Foundationload und Quellenidentität

Nur der Adapter dürfte die unveränderte Foundation laden. Ein gewöhnliches
`import(fileUrl)` mit Vorher-/Nachherhash wäre ausdrücklich unzureichend, weil
es einen Austausch-und-Rücktausch zwischen Read und Modulload nicht
ausschließt.

Der spätere Load müsste deshalb in dieser Reihenfolge erfolgen:

1. Repositoryroot und Foundationpfad werden als absolute kanonische Realpaths
   gebunden. Jeder Symlink, jede Junction, jeder Reparse Point, jeder
   Parentwechsel und jede nicht normale Datei beendet die positive
   Provenienz.
2. Ein exklusiv im Ledger gebundener Readhandle wird auf
   `scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js`
   geöffnet. File-ID, Volumen-ID, Länge und Zeitmetadaten werden privat
   gesnapshottet; die rohen Bytes werden genau einmal mit Cap `1_048_576`
   gelesen.
3. Die Bytes müssen SHA-256
   `ff55a775ccbb7588474fc1efe3e1a08d871ce3524f133a000b0b3d8c7512eb1d`
   besitzen und bytegleich zum Git-Blob desselben Pfads unter dem bereits
   gebundenen `repositoryCommit` sein. Der Blobzugriff erfolgt ohne
   Git-Prozess in einem geschlossenen in-process Objectreader: SHA-1-
   Objectformat, lose `commit|tree|blob`-Objekte oder Pack v2/v3 mit Index v2,
   verifizierten Pack-/Indextrailern, höchstens 16 MiB Index, 512 MiB
   adressiertem Pack, 4.096 gelesenen Objekten, Deltatiefe 32, 64 MiB kumulativ
   expandierten und `1_048_576` Blobbytes. Alternates, Replace-Refs, Grafts,
   Promisorobjects, unbekannte Extensions und freie Revisionen oder Pfade sind
   verboten; jede nicht eindeutig auflösbare Form bleibt `unproven` und stoppt
   einen evidenzfähigen Load.
4. Genau dieser eine Bytesnapshot wird fatal als UTF-8 ohne Normalisierung,
   BOM-Entfernung oder Zeilenendenkonvertierung dekodiert und im selben Realm
   als `vm.SourceTextModule` kompiliert. Sein Identifier ist exakt die
   kanonische Foundation-File-URL. Der Linker akzeptiert null Imports. Die
   Namespaceform muss exakt den einen Export
   `createBrowserSyncTransportRuntimeDiagnosticObserver` enthalten.
5. Factoryidentität, unveränderte Arity `1`, äußeres Eingabeprofil
   `{ effectPort, runBinding }` und die aus diesem Namespace mit beiden
   erforderlichen Portrollen aus Abschnitt 3 erzeugte Foundationinstanz
   werden im privaten Loadledger gebunden. Kein Standard-
   ESM-Cache, Data-URL-Modul oder temporärer Sourcepfad darf verwendet werden.
6. Vor `O0`, nach Foundationsettlement und nach Cleanup werden der gehaltene
   Handle sowie ein neu aufgelöster Pfad erneut gegen Realpath, File-/Volumen-
   ID, Länge, rohe Bytes und Git-Blob geprüft. Jede beobachtete Abweichung ist
   eine Verletzung. Eine fehlende Plattformfähigkeit oder mehrdeutige
   Identität bleibt `unproven` und darf keinen positiven Claim erzeugen.

Damit stammen die tatsächlich ausgeführten Modulbytes aus dem einmaligen,
gehashten Bytesnapshot; ein späterer Pfad-ABA kann sie nicht austauschen.
Dieser Loader ist keine Sourceinstrumentierung. Eine instrumentierte
Testkopie bleibt durch `adapterEvidenceEligible: false` konstruktiv
`NOT_EVIDENCE`.

`799e23e2f122ec2df3262af28a883616a8120327` ist die Auditbasis dieses
Foundationabgleichs, weder der historische Runtimecommit noch ein fest
vorgeschriebener Commit jedes künftigen Laufs. Der spätere Loader muss den Blob
des dann tatsächlich gebundenen `repositoryCommit` mit denselben aktiven
Sollbytes vergleichen. Der frühere Foundationhash
`f8d9ad6b39f1417009dbd7ab6e28096045d5b010d3708acb796da2d81d2ad31b`
gehört ausschließlich zur historischen ADR-0035-Basis.

Die Adapterquelle selbst besitzt in Schema 1 kein Digestfeld. Ein privater
Bootstrap darf ihren kanonischen Pfad und Commit-Blob vor dem Lauf prüfen und
bei Drift demotieren; Selbstattestierung ist aber keine unabhängige
Provenienzwurzel. Ohne eine später getrennt entschiedene unabhängige
Bootstrapbindung bleibt die Adapterattestierung `unproven`. Weder
`foundationSha256`, ein Replayoperand noch ein anderes bestehendes Feld darf
mit einem Adapterdigest überladen werden.

### 3. Totaler Effects-Port

Der künftige Adapter erzeugte für die angenommene und implementierte
ADR-0037-Foundation genau einen privaten `effectPort` mit der exakten
Own-Key-Folge `{ exchange, observationClosed }`. Die Foundationfactory erfasst
die vollständige Own-Key-Folge genau einmal und beide erforderlichen Rollen
nach der fortgeltenden ADR-0034-Containergrammatik als aufzählbare
Own-Data-Funktionen je einmal descriptorbasiert. An der erfassten
Notification wird genau einmal ihr eigener nicht aufzählbarer
Data-Descriptor `length` mit primitivem Wert `0` geprüft; `writable` und
`configurable` bleiben unbeschränkt. Zusätzliche Function-Prototyp-, Realm-,
Native-, Source- oder Freezeanforderungen entstehen nicht. Die Rollen dürfen
dieselbe Funktionsidentität besitzen, werden aber getrennt konsumiert.
Probeanruf, freier Propertyread, erneute Auflösung, optionaler Callback und
Ein-Rollen-Fallback sind verboten. Die Foundationfactory erfasst nur; der zentrale
`O0`-Übergang wendet die Notification mit Receiver `undefined` und exakt
leerer Argumentliste an. Nur synchrones `undefined` besteht. Abschnitt 12
totalisiert Konsum und Fehlerbehandlung. Die Notification ist kein achter
Intent, Ack, Clock-/Timerpfad oder neues Probeprofil; die Adapterfactory bleibt
argumentlos mit Arity `0` und ohne Optionen.

Jeder Exchangeaufruf validierte den frischen, tief eingefrorenen
Foundationintent vor Feldnutzung und lieferte immer ein adaptereigenes,
own-key-loses natives Promise desselben Realms mit direktem
`Promise.prototype`. Fremde Thenables, Foundation-, Caller- oder Seam-Promises
dürften nie durchgereicht werden. Pro Zeitpunkt dürfte höchstens ein Exchange
offen sein.

| Intent | Exakte Eingangsform | Linearization Point | Einzige Erfüllung | Rejection, Zustand und Ledgerwirkung |
| --- | --- | --- | --- | --- |
| `capability-probe` | `{intentId, kind, payload:{profile:"adr-0033-foundation-effect-port-v1"}}` | vollständige Prüfung aller sieben privaten Fähigkeiten | `{kind:"capability-probe-result", profile:<gleich>, capabilitySet:"clock-cap-send-dequeue-cleanup-v1"}` | fehlende/mehrdeutige Capability: statische Rejection vor `attemptStarted`; keine Ressource |
| `controller-clock-sample` | Payload exakt `{reason}` mit einem der sechs Foundationgründe | genau ein erfolgreicher Read der gebundenen Controllerclock | `{kind:"controller-clock-sample-result", reason:<gleich>, monotonicMilliseconds:<raw>}` | Clockfehler/-rücklauf/-overflow: statische Rejection; privates Clockledger verletzt |
| `cap-arm` | Setup/Cleanup absoluter Deadlinepayload oder Capture `pending-send-activation/6000` | Ledgerinstall plus Timerhandle; bei Capture nur pending Generationstoken | `{kind:"cap-arm-result", capKind, armState:"armed"\|"pending"}` | zweite Armierung, falsches Profil oder Handlefehler: Rejection; kein erfundener Arm-Ack |
| `cap-cancel` | `{capKind, armIntentId}` | erster controllerlokal serialisierter Terminalübergang der exakten Generation | `{kind:"cap-cancel-result", capKind, armIntentId, cancelState:"cancelled"}` | bereits fired/falsche Generation/zweiter Cancel: Rejection; fired bleibt fired |
| `protocol-command-send` | exaktes fünffeldriges Payloadprofil eines der sechs Commands | vollständige lokale Frameannahme; Evaluate zusätzlich atomarer Capturestart | `{kind:"protocol-command-send-result", commandId, sendState:"sent"}` beziehungsweise Evaluate `"sent-and-capture-cap-started"` | Profil-, Framing-, Write- oder Commitfehler: statische Rejection; Send bleibt `unknown`, kein Ack |
| `observation-dequeue` | `{phase:"setup"\|"capture"\|"cleanup"}` | Entnahme des ältesten Events oder Installation des einzigen Resolvers; keine Clockabtastung | direkt genau ein `cdp-message`, `cap-fired`, `connection-closed` oder `cleanup-fact` | bei leerer Queue pending; Parser-/Queue-/Ownerverletzung statische Rejection, nie Leerwert; der 129. Dequeue-Aufruf rejected vor FIFO-Entnahme oder Resolverinstallation |
| `cleanup-step` | `{checkId, action}` aus den zwölf festen Paaren | Annahme genau eines identitätsgebundenen Steps in das Cleanup-Ledger | `{kind:"cleanup-step-result", checkId, stepState:"accepted"}` | falsche/doppelte Aktion: Rejection; das Ergebnis folgt getrennt als `cleanup-fact` |

Die sechs Clockgründe sind exakt
`setup-origin`, `setup-dequeue-before-reflection`,
`capture-dequeue-before-reflection`, `cleanup-origin`,
`cleanup-dequeue-before-reflection` und
`cleanup-completion-after-cap-cancel`. Setup und Cleanup armen exakt
`{capKind, mode:"absolute-controller-monotonic", deadlineMilliseconds}`;
Capture armt exakt `{capKind:"capture", mode:"pending-send-activation",
windowMilliseconds:6000}`. Ein Cancelpayload ist exakt
`{capKind, armIntentId}`.

Jedes Commandpayload ist exakt
`{commandId, command, sessionId, captureArmIntentId, params}`:

```text
Target.getTargets
  sessionId:null, captureArmIntentId:null, params:{}
Target.attachToTarget
  sessionId:null, captureArmIntentId:null,
  params:{targetId:<gebunden>, flatten:true}
Network.enable
  sessionId:<gebunden>, captureArmIntentId:null, params:{}
Runtime.evaluate
  sessionId:<gebunden>, captureArmIntentId:<capture-arm-intent-id>,
  params:{expression:<exakter 4259-Byte-String>, awaitPromise:true,
          returnByValue:true, generatePreview:false}
Network.disable
  sessionId:<gebundene Cleanupsession>, captureArmIntentId:null, params:{}
Target.detachFromTarget
  sessionId:null, captureArmIntentId:null,
  params:{sessionId:<gebundene Cleanupsession>}
```

Aus diesem internen Payload entsteht genau eine frische outbound
CDP-Wireprojektion. `commandId` wird zu `id`, `command` zu `method`;
`captureArmIntentId` bleibt ausschließlich lokaler Commitbeleg und gelangt nie
auf den Wire. Ein `sessionId:null` wird nicht serialisiert. Die sechs
Root-Keyfolgen und Frames sind exakt:

```text
{id, method:"Target.getTargets", params:{}}
{id, method:"Target.attachToTarget",
     params:{targetId:<gebunden>, flatten:true}}
{id, method:"Network.enable", params:{}, sessionId:<gebunden>}
{id, method:"Runtime.evaluate",
     params:{expression:<exakter String>, awaitPromise:true,
             returnByValue:true, generatePreview:false},
     sessionId:<gebunden>}
{id, method:"Network.disable", params:{}, sessionId:<cleanup-session>}
{id, method:"Target.detachFromTarget",
     params:{sessionId:<cleanup-session>}}
```

Die gewöhnliche accessor-, symbol- und `toJSON`-freie Wireprojektion wird
genau einmal durch den bei Modulevaluation erfassten nativen
`JSON.stringify(value)`-Pfad ohne Replacer oder Space serialisiert, genau
einmal UTF-8-codiert und um genau ein finales NUL-Byte ergänzt. Weder das
Foundationintent noch sein Payloadgraph wird serialisiert.

`cdp-message` ist exakt `{kind:"cdp-message", value:<frozen JSON graph>}`,
`cap-fired` exakt `{kind:"cap-fired", capKind, armIntentId}`,
`connection-closed` exakt `{kind:"connection-closed"}` und `cleanup-fact`
exakt `{kind:"cleanup-fact", checkId, fact:<boolean>}`. Andere
Fulfillmenttypen und Zusatzfelder sind verboten.

Probe ist einmalig in `prestart`; Setup-Clock/Arm/Commands nur vor
`setupReady`; Capture-Arm/Evaluate/Dequeue nur nach erfolgreichem Setupcancel;
Cleanup-Clock/Arm/Commands/Steps nur nach `O0`. Jeder Intent außerhalb dieses
Phasen- und Ressourcenledgers rejected statisch vor Wirkung.

Alle Ack- und Eventobjekte wären frische, gewöhnliche, exakt geformte und
tief eingefrorene Records. `intentId`, `commandId`, `armIntentId`, `checkId`
und Sessionbindung müssten exakt korrelieren. Ein fremder, doppelter oder
später Callback dürfte weder Promise noch Ledger ein zweites Mal verändern.
Rejectiongründe enthielten nur den statischen Code
`browserSyncTransportRuntimeDiagnosticAdapterEffectFailed`; Rohgründe würden
unmittelbar verworfen.

### 4. Pending, Joins und garantierte Fortschrittsgrenze

Der Adapter besäße genau eine controllerlokale Eventschleife, einen
`activeExchange` und höchstens einen `waitingDequeueResolver`. Eine leere FIFO
ließe `observation-dequeue` pending; es existierte kein Queue-Leerobjekt. Ein
zweiter Resolver, ein zweiter offener Exchange oder ein Portcall nach
Terminalisierung wäre fail-closed. Der jeweils erste serialisierte Terminal-
Übergang gewänne; alle späten Callbacks prüften Owner- und Generationstoken
und blieben inert.

Es gäbe weder `Promise.race`, Polling, Watchdog noch einen zweiten oder
versteckten Ersatzcap. Pre-settled, same-turn-settled und delayed Settlements
durchliefen dieselbe lokale native Promisehülle. Ein forever-pending Dequeue
würde ausschließlich durch das zuerst eingereihte echte Pipeevent, den
korrelierten vorhandenen Cap, Connection-Close oder Cleanupfact geschlossen.

Bei jedem zulässigen setup- oder cleanupseitigen `observation-dequeue` wählt
die FIFO nur den ältesten Envelopekandidaten und erfüllt damit ohne
Clockabtastung. Die Foundation hält diesen Wert unreflektiert und sendet danach
den phasengenauen `controller-clock-sample`-Intent. Erst dessen Bearbeitung
liest die gebundene Controllerclock exakt einmal. Derselbe rohe primitive Wert
`m_answer` wird sowohl im privaten Adapterledger festgehalten als auch im
`controller-clock-sample-result` an die Foundation geliefert; ein zweiter Read
oder ein geteilter Ledger-/Foundationwert ist verboten. Ein ungültiges Sample
ist ein Controlverstoß. Bei Setup und Cleanup verarbeitet
`m_answer >= deadline` den jeweiligen Cap und verwirft den gehaltenen
Envelope vor jeder Descriptorprüfung, Reflection oder Feldnutzung. Nur bei
`m_answer < deadline` darf die Foundation den Kandidaten reflektieren. Der
129. Dequeue-Aufruf rejected bereits vor Entnahme und Sample; für die
zulässigen ersten 128 Fulfillments gilt exakt ein nachgelagerter Clockread.
Capture verwendet diesen Sample ausschließlich für das Foundationtiming und
niemals als numerischen Deadlineguard. Eine kleinere FIFO-Sequenznummer kann
damit bei Setup oder Cleanup niemals einen beim Sample bereits erreichten Cap
überholen.

Jeder Nicht-Dequeue-Exchange hätte einen endlichen, nicht auf einen externen
Callback wartenden terminalen Pfad: Capability, Clock, Arm und Cancel werden
synchron entschieden; Send linearisiert an der vollständigen lokalen
Frameannahme; Cleanup-Step linearisiert an der Schritteinreihung. Write-
Callback, `drain` und Cleanupabschluss sind nachgelagerte FIFO-Fakten, keine
Ack-Voraussetzung. Dadurch kann ein bereits laufender Setup-, Capture- oder
Cleanupcap auch bei einem nie aufgerufenen Write- oder Cleanupcallback in die
FIFO gelangen und den wartenden Dequeue schließen. Ein blockierter Node-
Eventloop oder Betriebssystemkern ist außerhalb des beweisbaren Claims und
darf nicht als garantierte Hostliveness bezeichnet werden.

Die Joins lauten:

```text
Write vs Close          := frühestes serialisiertes Accept oder Close
Read vs Close           := früheste FIFO-Sequenznummer
Fire vs Cancel          := frühester Generationstoken-Übergang
Setup/Cleanup-Envelope vs Cap := Dequeue ohne Clock; danach ein Rohzeitsample;
                                 bei `< deadline` FIFO-Envelope, sonst Cap
Capture-Envelope vs Cap := ausschließlich FIFO-Reihenfolge des `cap-fired`
Callback nach Terminal  := inert
```

### 5. Windows-Chrome-Debug-Pipe, Framing und Parser

Chrome dürfte ausschließlich mit `--remote-debugging-pipe` gestartet werden.
`--remote-debugging-port`, `--remote-debugging-address`, WebSocket-Discovery
und Debug-TCP-Listener wären verboten. Das Windows-`stdio`-Profil wäre exakt:

```text
0: ignore/NUL
1: eigene bounded stdout-drain pipe
2: eigene bounded stderr-drain pipe
3: eine geerbte Pipe; Parent schreibt, Chrome liest CDP
4: eine geerbte Pipe; Chrome schreibt, Parent liest CDP
weitere Handles: nicht geerbt
shell: false
detached: false
```

Genau ein Adapterowner hielte die Enden 3 und 4; weder Vite, Gateway noch ein
Caller erhielte sie. Ein Outboundframe bestünde aus exakt den UTF-8-Bytes von
genau einem gecachten JSON-String plus genau einem Byte `0x00`. Inbound trennt
allein `0x00`: Teilframes bleiben im Akkumulator, mehrere Frames eines Chunks
werden einzeln in Reihenfolge verarbeitet. Ein leeres Frame, EOF mit
nichtleerem Rest oder Bytes nach terminalem EOF ist eine Parserverletzung;
EOF bei leerem Akkumulator erzeugt genau ein `connection-closed`.

Vor dem Decode werden die drei rohen führenden Framebytes `EF BB BF` explizit
als UTF-8-BOM abgelehnt. Pro Frame würde danach genau ein frischer fataler
`TextDecoder("utf-8", { fatal:true })` verwendet. Reparatur, Unicode- oder
Zeilenendennormalisierung ist verboten. Ein JSON-Escape `\uFEFF` ist keine BOM
und bleibt nach der normalen Stringgrammatik zulässig. Danach läuft genau ein
lexikalischer Scanner und anschließend genau ein
natives `JSON.parse(text)` ohne Reviver.

Der Scanner akzeptiert ausschließlich die RFC-8259-Strukturgrammatik:

```text
ws      = *(SP / HTAB / LF / CR)
value   = object / array / string / number / true / false / null
number  = ["-"] ("0" / %x31-39 *DIGIT) ["." 1*DIGIT]
          [("e"/"E") ["+"/"-"] 1*DIGIT]
escape  = %x22 / %x5C / %x2F / "b" / "f" / "n" / "r" / "t"
          / "u" 4HEXDIG
```

Unescaped U+0000 bis U+001F, unbekannte Escapes, Trailing Commas, Kommentare,
zusätzlicher Text und nicht geschlossene Container sind verboten. Der Scanner
dekodiert nur Objektmembernamen in exakt dieselbe UTF-16-Codeunitfolge wie
`JSON.parse`, einschließlich `\u`-Escapes und escape-äquivalenter Namen. Pro
offenem Objekt hält er eine bounded Keymenge; die zweite gleiche Codeunitfolge
ist fatal. Werte werden nur tokenisiert und gezählt, nie semantisch gelesen.
Keymengen, Text und Rawbytes werden nach Materialisierung sofort verworfen.

Diese enge lexikalische Duplicate-Key- und Capprüfung ist Teil der
Parsergrenze, keine freie CDP-Rohinspektion. Sie darf nur die privaten Zähler
und einen statischen Verletzungscode behalten. Freies Suchen, Ausgeben,
Persistieren oder Ableiten aus Rawtext bleibt verboten.

Nach `JSON.parse` ist nur eine gewöhnliche Top-Level-CDP-Hülle erlaubt:

```text
Response: { id, [sessionId], genau eines aus result | error }
Event:    { method, [sessionId], params }
```

`id` ist ein positiver Safe Integer; `method` und `sessionId` sind nichtleere
Strings. Extras, Symbole, Arrays und Primitive sind verboten. Innerhalb von
`result`, `error` und `params` findet keine CDP-Semantik- oder Endpointfilterung
statt. Eine einzige generische iterative Post-Parse-Traversierung bestätigt
die bereits gezählten Tiefe-/Knoten-/Member-/Stringcaps, ausschließlich
endliche Zahlen, JSON-Prototypen und Own-Data-Descriptoren und friert den Graph
tief ein. Der vollständige bounded Graph wird als `cdp-message` an die
Foundation gereicht; die zugehörige ursprüngliche Framebytelänge zählt bis
zum Dequeue gegen `FIFO-Materialbytes` und wird danach sofort verworfen.

Die harten Caps lauten:

| Domäne | Cap |
| --- | ---: |
| ein Readchunk | `65_536` Bytes |
| ein NUL-freies Frame | `262_144` Bytes |
| Inbound-Akkumulator einschließlich Trenner | `262_145` Bytes |
| dekodierter Frame-Text | `262_144` UTF-16-Codeunits |
| JSON-Tiefe, Root mitgezählt | `32` |
| JSON-Knoten | `4_096` |
| Objektmember gesamt | `8_192` |
| ein String | `131_072` UTF-16-Codeunits |
| FIFO-Einträge | `256` |
| FIFO-Materialbytes | `1_048_576` Bytes |
| Inboundmessages pro Lauf | `512` |
| ein Outboundframe einschließlich NUL | `65_536` Bytes |
| ausstehende Outboundframes/-bytes | `1` / `65_536` |
| stdout beziehungsweise stderr | je `65_536` Bytes gelesen, danach weiter drain und verwerfen |

Jede Cap-, Framing-, UTF-8-, Duplicate-Key-, JSON- oder Queueverletzung latcht
einen statisch redigierten Parserverstoß, verwirft Rawbytes/-text/-graphen,
schließt die Pipe identitätsgebunden und rejected den aktuellen oder nächsten
Dequeue. Sie darf niemals als `connection-closed` maskiert werden.

### 6. Eine FIFO und Send-Ack

Alle materialisierten CDP-Hüllen, Capcallbacks, Connection-Close-Ereignisse
und Cleanupfacts erhalten beim Eintritt in die eine controllerlokale
Dispatcherschleife eine strikt steigende Safe-Integer-Sequenznummer. Genau
diese Nummer bestimmt die FIFO; Quelle, Timestamp, Typ und vermeintliche
Relevanz dürfen sie nicht ändern. Deduplizierung, Koaleszierung,
Vorfilterung und Umordnung sind verboten.

Responses, die vor dem Send-Ack eintreffen, werden in Ankunftsreihenfolge
gepuffert. Sie dürfen keinen Ack erzeugen oder ersetzen und erreichen die
Foundation erst, nachdem der aktuelle Send-Exchange terminal ist. Doppelte
`Target.getTargets`-Responses, unkorrelierte `Network.responseReceived`-
Events für den exakten Endpoint, fremde Request-IDs, Statuswerte und
Timestamps bleiben unverändert erhalten. Die Adaptercaps sind unabhängig vom
Foundationlimit 128; ein Adapterüberlauf ist der zuvor definierte
Parserverstoß.

`sent` beweist ausschließlich, dass der exakt einmal serialisierte vollständige
NUL-Frame nach dem Aufruf von `write(frame)` ohne synchronen Fehler von der
einzigen bounded lokalen Writable-Queue angenommen wurde. Es beweist weder
OS-Flush, Chromeempfang, Parsing, CDP-Erfolg noch Responsekorrelation. Der Ack
darf nie aus Intentempfang, Queueeintrag, Pipe-Response oder Writecallback
abgeleitet werden.

Node-Writable-`false` bedeutet Backpressure, aber vollständige lokale Annahme;
der Ack bleibt zulässig, während weitere Sends bis `drain` verboten sind. Ein
weiterer Send vor `drain`, ein synchroner Throw, ein vom verwendeten
Writeprimitive gemeldeter Teilwrite oder eine Annahme oberhalb des
Outboundcaps rejected statisch ohne Ack. Callbackerfolg beendet nur den
privaten Bufferbesitz. Asynchroner Fehler oder Close nach Ack wird danach in
FIFO-Reihenfolge als Pipe-Terminalereignis verarbeitet; ein nie aufgerufener
Callback blockiert keinen Cap. Der Framebuffer bleibt bis Callback oder
identitätsgebundenem Close unverändert im Ledger und wird dann verworfen.

Für `Runtime.evaluate` wird der SHA-256 vor dem Send über exakt den gecachten,
tatsächlich serialisierten primitiven UTF-8-Expressionstring gebildet. Er muss
4.259 Bytes und
`a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b`
ergeben. Es gibt keine Normalisierung oder zweite Stringquelle.

Nach lokaler Frameannahme werden innerhalb desselben nicht reentranten
Dispatchturns der bereits pending Capture-Arm aktiviert, sein einzelner
6.000-ms-Timer mit neuer Generation installiert, Captureorigin und
Sendledger gemeinsam committed und erst danach das Ack
`sent-and-capture-cap-started` resolved. Da Timercallbacks diesen Turn nicht
unterbrechen, ist dies ein logischer atomarer Übergang. Vor dem Write bleibt
alles pending. Bei Writefehler gibt es weder Capstart noch Ack. Bei möglichem
Frame-Accept und Fehler vor dem gemeinsamen Commit gibt es keinen Ack, der
Send bleibt `unknown`, Capture wird `activation-unknown`, Pipe und Lauf gehen
fail-closed in Cleanup. Ein Fehler nach Commit kann den Ack nicht widerrufen
und wird als späteres FIFO-Ereignis verarbeitet.

### 7. Clocks und Caps

Die drei Domänen bleiben strikt getrennt:

```text
Controller: process.hrtime.bigint(), einmalig erfasst, ganze Millisekunden
UTC-Wallclock: observedAt und Run-ID-Messzeit, nicht für Caps
Browser: window.performance.now() nur im festen Evaluationstring
```

Der Controller bildet rohe Millisekunden durch ganzzahlige Division der
Nanosekunden durch `1_000_000n`; dies definiert seine Rohdomäne und ist keine
10-ms-Berichtsrundung. Jeder ausgegebene Wert muss endlich, nichtnegativ,
monoton und als Number ein Safe Integer sein. `observation-dequeue` liest die
Clock nie. Nach jedem zulässigen erfüllten Dequeue hält die Foundation den
Envelope unreflektiert und fordert ihren phasengenauen
`controller-clock-sample` an. Genau dessen Bearbeitung führt exakt einen Read
aus und verwendet denselben primitiven Rohwert für Adapterledger und
Foundationresultat. `NaN`, Infinity, negativer Wert, Safe-Integer-Überlauf,
Throw, Rücklauf, Zusatzread oder auseinanderfallende Werte sind fail-closed.
Vor der Capentscheidung erfolgt keine weitere Rundung.

```text
Setupcap:   6_000 ms absolut ab m_setup
Capturecap: 6_000 ms ab Evaluate-Send-Ack
Cleanupcap: 60_000 ms absolut ab Cleanupstart
```

Der Setupcap ist vor dem `Target.getTargets`-Send aktiv. Der Capturecap ist
zunächst nur pending und wird ausschließlich im Evaluate-Commit aktiv. Der
Cleanupcap ist vor dem ersten Cleanupkommando aktiv. Nur Setup und Cleanup
verwenden den inklusiven Guard `sample >= deadline`; Gleichheit gehört dort
zum Cap. Capture wird ausschließlich durch das korrelierte, in die FIFO
eingereihte `cap-fired`-Ereignis geschlossen und nie durch einen numerischen
Vergleich des Capture-Clock-Samples. Keine Deadline wird pro Command, Response
oder Step zurückgesetzt.

Jeder Arm besitzt exakt `capKind`, Foundation-`armIntentId`, Deadline oder
Window, Generation und höchstens einen Timerhandle. Ein Capereignis trägt
exakt dieselbe Arm-Intent-ID. Pro Arm gibt es höchstens einen Cancelversuch.
`fired` kann nie `cancelled` werden. Cancel invalidiert die Generation vor
Handlefreigabe; bereits eingereihte alte Callbacks vergleichen Owner,
Generation und Terminalzustand und bleiben inert. Timer-, Pipe-, Child- und
Cleanupcallbacks werden allein durch ihren Eintritt in den seriellen
Dispatcher total geordnet.

### 8. Launcher, Readiness und Ressourcenowner

Der Adapterprozess selbst müsste unter dem kanonischen `process.execPath` mit
Node `24.19.0` und exakt `process.execArgv ==
["--experimental-vm-modules", "--no-warnings"]` in genau dieser Reihenfolge,
ohne `NODE_OPTIONS`, Loaderhook, Inspector, zusätzlichen Flag oder
Preloadmodul laufen. `--no-warnings` verhindert den standardmäßigen
ExperimentalWarning-Write von `vm.SourceTextModule`; es ist weder
Outputprovenienz noch ein Beweis für sonstige Stille. Fehlt diese feste
`vm.SourceTextModule`-Fähigkeit, endet der Lauf vor dem Foundationload statisch
redigiert. Es gäbe keine Shell. Der Repositoryrealpath wäre Working Directory
des Adapters, Vite und Gateways. Unter Windows würden Umgebungsnamen
case-insensitiv verglichen; Child-Environments würden frisch nur aus
`SystemRoot`, `WINDIR`, `ComSpec`, `PATHEXT`, `Path`, `TEMP`, `TMP`,
`LOCALAPPDATA`, `ProgramFiles`, `ProgramFiles(x86)` und `ProgramW6432`
projiziert. Nicht vorhandene optionale Namen blieben fort, Extras würden nie
vererbt.

Die einzige Prozess- und Argumentallowlist wäre:

| Owner | Exakte Identität und Entry | Exakte Argumente beziehungsweise Zusatz-Environment |
| --- | --- | --- |
| Adapter | kanonisches aktuelles `process.execPath`; genau dieses Modul, kein zweiter Node-Child | keine öffentlichen Runtimeargumente |
| Vite | derselbe Node-Realpath; `<repo>/node_modules/vite/bin/vite.js` aus Lockfileversion `8.1.4` | `--host`, `127.0.0.1`, `--port`, `5173`, `--strictPort`; `NO_COLOR=1` |
| Gateway | derselbe Node-Realpath; `<repo>/server/startLocalSyncGateway.js` | keine Args; `GOLDENDAWN_SYNC_GATEWAY_PORT` ist der rohe vierstellige String `8787` mit Länge 4 und Codeunits `[56,55,56,55]`, ohne Quotezeichen; `GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN=http://127.0.0.1:5173` |
| Chrome | ausschließlich der vorab über regulären Readhandle, Realpath, File-/Volumen-ID, Länge, rohe Bytes und SHA-256 laufgebundene Pfad `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`; dies belegt weder Produkt noch Version | `--remote-debugging-pipe`, `--user-data-dir=<eigener Profilrealpath>`, `--incognito`, `--no-first-run`, `--no-default-browser-check`, `--new-window`, `http://127.0.0.1:5173/` |

Eine fehlende oder abweichende Identität würde nicht durch Suche in `PATH`,
einen zweiten Installationspfad, Channelwechsel oder Argumentfallback ersetzt.
Vite und Gateway dürften nur an `127.0.0.1:5173` beziehungsweise
`127.0.0.1:8787` binden. Es gäbe keine Alternativports, Retries, Restarts,
`Target.createTarget`, PID-Dateien oder Prozessbaum-Kills.

Genau ein Browser-, Vite- und Gateway-Childhandle sowie genau ein Debug-
Pipepaar dürften im gemeinsamen Ledger existieren. Für Vite und Gateway gilt
`windowsHide:true`, für den historisch sichtbaren Chrome
`windowsHide:false`; `shell:false` und `detached:false` gelten für alle
Children. Ein Headless-Argument ist verboten. Wait,
Terminate und Close dürften ausschließlich über den beim Spawn erhaltenen
Child- oder Pipehandle derselben Generation erfolgen, nie über eine freie PID.

Der festgelegte Node-Core-Pfad besitzt keine identitätsgebundene Windows-Job-
Object- oder äquivalente Prozessbaumfähigkeit. Deshalb bestätigt ein
terminaler Root-Childhandle weder Chrome-Nachfahren noch von Vite gestartete
esbuild-Nachfahren und auch für das Gateway wird keine globale
Nachfahrenabwesenheit behauptet. Der Ledger wechselt unmittelbar vor jedem
Spawn irreversibel von `never-attempted` zu `may-have-started`; erst der
erfolgreiche Rückgabewert bindet den Root-Childhandle. Nach einem möglichen
Spawn bleiben `browserStopped`, `devServerStopped` und `gatewayStopped` ohne
eine später getrennt entschiedene, handlegebundene Job-/Tree-Quelle
`unproven`, selbst wenn der Root-Child terminal ist. Ein nach dem terminalen
Stopppfad authentisch noch aktiver gebundener Root ist `failed`; nur ein aus
dem gemeinsamen Ledger konstruktiv sicher nie versuchter Spawn ist
`confirmed`. Freie PID-Suche, `taskkill`, WMI-, PowerShell- oder
Prozessnamen-Kills und jede Berührung fremder Prozesse bleiben verboten.

Readiness darf keinen HTTP-, Produkt- oder Zusatz-CDP-Request erzeugen.
Gatewayreadiness ist genau ein Vorkommen der UTF-8-Bytes für
`Das lokale SyncGateway lauscht ausschließlich auf 127.0.0.1.` unmittelbar
gefolgt von `0a`. Vitereadiness ist genau ein Vorkommen von
`20 20 e2 9e 9c 20 20` plus den ASCII-Bytes für
`Local:   http://127.0.0.1:5173/` und abschließend `0a`; `NO_COLOR=1` ist
bereits Teil des Child-Environments. Beide Scanner arbeiten ausschließlich
im jeweiligen ersten `65_536`-Byte-stdout-Fenster, akzeptieren weder `0d 0a`,
ANSI-Sequenzen noch ein zweites Vorkommen und besitzen nur
`not-seen|seen-once|ambiguous`. Chromereadiness ist nur die erfolgreiche
Pipeannahme des ohnehin erforderlichen `Target.getTargets`.
Fehlt beim ersten Command eine der beiden Childreadinessmarken, rejected der
Send sofort; er wartet nicht außerhalb des bereits aktiven Setupcaps.

Stdout und stderr jedes Childs werden ab Spawn fortlaufend gedraint. Nur die
ersten `65_536` Bytes je Stream dürfen durch den festen Readinessscanner
laufen; kein Byte wird ausgegeben oder persistiert. Weitere Bytes werden bis
EOF verworfen und setzen einen privaten Overflowverstoß. Der Scanner behält
nur `not-seen|seen-once|ambiguous`; Rohoutput und Fehlergründe werden nicht
übernommen.

Der Profilpfad und alle Harnessfragmente liegen unter genau einem durch
`mkdtemp` exklusiv erzeugten Run-Temproot. Vor jeder Create-, Read-, Close-
oder Identitätsprüfung werden Parent-Containment, `lstat`, Realpath,
File-/Volumen-ID sowie Symlink-, Junction- und Reparsefreiheit erneut geprüft.
Diese Vorprüfung autorisiert ausdrücklich keine anschließende pfadbasierte
Löschung: Zwischen Prüfung und `rm`, `rmdir` oder `unlink` bliebe unter Windows
ein Austauschfenster. Node Core stellt in der festgelegten Runtime keine
handle-relative, nicht folgende Deleteprimitive mit gebundener Objektidentität
bereit. Der Schema-1-Adapter darf deshalb für ein möglicherweise erzeugtes
Profil oder Harnessfragment weder `rm`, `rmdir` noch `unlink` aufrufen. Ohne
eine später getrennt entschiedene objektgebundene native Löschfähigkeit bleibt
der betreffende Removecheck `unproven`; ein konstruktiv sicher nie versuchtes
Create ist dagegen `confirmed`. Ein authentisch belegter fremder Touch oder
ein sicher gebundener verbleibender Rest ist `failed`. Fremde Pfade werden nie
berührt. Diese Einschränkung blockiert einen sichtbaren Diagnoselauf weiterhin
und darf nicht durch einen Pfad-Vorcheck gelockert werden.

Der gemeinsame idempotente Ressourcenledger wird vor dem ersten Create
erzeugt und von Foundation-Cleanup und äußerem Fallback-Cleanup gemeinsam
verwendet. Fehler vor `attemptStarted` führen ebenfalls in den äußeren
Cleanup. Existiert noch kein Foundation-Cleanupcap, darf der Fallback genau
den einen 60.000-ms-Cleanupcap derselben Controllerclock armieren; existiert er
bereits, darf kein zweiter Timer entstehen. Der Cap beendet Warten, aber
erfindet keinen erfolgreichen Stop-, Close- oder Deletefakt.

Git-Zustand wird nur gelesen und verglichen. `reset`, `checkout`, `clean`,
`restore`, Indexschreiben und jede andere Reparatur sind verboten.

### 9. Selbst gebauter `runBinding` und 59 Replayoperanden

Der Adapter erzeugt unmittelbar vor der Foundationfactory selbst exakt die
neun Felder:

```text
diagnosticRunId
observedAt
timeZone
replayContextId
repositoryCommit
profileInstanceObservation
unexplainedCausalDeviationObservation
replayOperands
viteRuntimeVersionObservation
```

`diagnosticRunId` ist `diag-` plus 26 Zeichen aus lowercase, ungepaddetem
RFC-4648-Base32 mit Alphabet `a-z2-7`: `crypto.randomBytes(17)` wird
most-significant-bit-first codiert, genau die ersten 130 Bits werden als 26
Zeichen übernommen und die übrigen sechs Bits verworfen. `replayContextId`
ist `replay-` plus 24 Zeichen derselben Codierung aus unabhängigen
`crypto.randomBytes(15)`, also exakt 120 Bits, und ungleich
`chrome-stable-win-t0-01`. Ein CSPRNG-Fehler beendet den Lauf statisch vor
jeder Wirkung. `observedAt` entsteht aus genau einem gefangenen
`Date.now()`-Sample: endlicher nichtnegativer Safe Integer, exakt einmal über
den gefangenen `Date`-Konstruktor als UTC-ISO-String serialisiert und durch
erneutes Parsen millisekundengenau zurückprojiziert. `timeZone` stammt aus
genau einem gefangenen
`Intl.DateTimeFormat().resolvedOptions().timeZone`-Own-Data-Wert, höchstens 64
printable ASCII-Zeichen, und muss die bestehende Grammatik
`iana-shaped-ascii-time-zone-v1` erfüllen. Fehlende, accessorbasierte,
werfende oder abweichende Clock-/Intl-Quellen stoppen vor Wirkung.
`repositoryCommit` stammt aus der
realpathgebundenen HEAD-/Refkette und muss ein einzelner Lower-Hex-40-Wert
sein. `profileInstanceObservation` stammt nur aus dem exklusiven Createledger;
historische Profilwiederverwendung wird nie aus einem Pfadnamen abgeleitet.
`unexplainedCausalDeviationObservation` wird erst nach vollständiger
Quellenklassifikation gesetzt: `reviewCompleted` ist nur bei abgeschlossener
59-Zeilen-Prüfung wahr, `deviationObserved` nur für eine authentisch bekannte,
nicht erklärte Abweichung. `viteRuntimeVersionObservation` stammt aus dem
gebundenen Lockfile-/Entrygraph oder ist `null`.

Alle R0-Klassifikationsquellen werden nach der in Abschnitt 1 festgelegten
Aufruffolge genau einmal vor der Foundationfactory gemessen, defensiv
projiziert und gemeinsam als `R0` tief eingefroren. Wiederholte
Ressourcenprüfungen nach Abschnitt 2 lesen ihre gebundenen Pfad-, Handle- und
Bytesquellen dagegen zu den dort geforderten Zeitpunkten erneut und mutieren
`R0` nicht. Eine eindeutige
Quelle ergibt `observationState: observed` und ihren primitiven Wert;
authentische Abweichung vom historischen Wert bleibt als beobachteter
Istwert erhalten und wird dadurch `mismatch`. Fehlende Quellen ergeben
`not-observed/null`, mehrere widersprüchliche Quellen `ambiguous/null`. Ein
späterer Befund mutiert `R0` nie, sondern demotiert die adapterabhängigen
Integrity- und Gateableitungen.

In der folgenden Tabelle bedeutet `C0` die vor jedem Spawn gebundene
Commit-/Checkoutquelle, `X0` den exakten Launcher-/Handlezustand unmittelbar
vor Factoryerzeugung, `P0` Profil- und Plattformzustand am selben Punkt und
`E0` eine geschlossene Ableitung aus dem bereits verifizierten 4.259-Byte-
Evaluationstring. Jede Quelle ist an den genannten Realpath, Rawbytes,
Childhandle oder privaten Ledgerknoten gebunden und friert in `R0` ein.

Die Runtimequelle ist auf gefangene Node-Core-Werte begrenzt:
`process.platform`, `process.arch`, `process.version`, `process.execPath`,
`process.execArgv`, `process.env` und rohe, über verifizierte Handles gelesene
Dateibytes. Der rohe Wert `process.platform` muss exakt `win32` sein und wird
ausschließlich als geschlossene Projektion `windows` in Operand 11
übernommen. Der rohe Wert `process.version` muss höchstens 32 ASCII-Bytes lang
sein und exakt `^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`
erfüllen; ausschließlich das eine initiale ASCII-`v` wird entfernt, sodass
Operand 17 den Core-SemVer-Wert `24.19.0` erhält. Andere Präfixe, Suffixe,
Prerelease-/Buildteile oder Normalisierungen sind verboten.

Es gibt keinen Registry-, WMI-, PowerShell-, `wmic`-,
Versionsresource-, Authenticode- oder freien PE-Parser und keinen zusätzlichen
Childprozess. `process.arch` muss exakt `x64` sein; der kanonische
`process.execPath` wird über Handle,
File-/Volumen-ID, rohe Bytes und SHA-256 gebunden. Diese Angaben belegen weder
Windowsarchitektur/-edition/-patch noch Chromeprodukt/-channel/-version;
`process.arch` beschreibt das Node-Binary und kann unter emulierter Windows-
Architektur laufen. Die betreffenden Operanden sind deshalb konstruktiv
`not-observed/null`.

`repository.state` bleibt ebenfalls konstruktiv `not-observed/null`: Der
Adapter startet keinen Gitprozess und implementiert weder vollständige
Ignore-, Sparse-Checkout-, Submodule-, Worktree- noch Index-Semantik. Für die
getrennte Wiederherstellungsprüfung werden nur die rohe `HEAD`-Datei bis
`4_096` Bytes, genau eine direkte Refdatei bis `4_096` Bytes oder
`packed-refs` bis `16_777_216` Bytes, die rohen Indexbytes bis `16_777_216`
Bytes und die aus dem gebundenen Commit-Tree gewonnenen höchstens `4_096`
getrackten regulären Pfade inventarisiert. Relative UTF-8-Pfade sind auf
`1_024` Bytes, eine Datei auf `16_777_216` Bytes und alle Worktree-Dateibytes
zusammen auf `268_435_456` Bytes begrenzt. Reparse Points, Submodule,
Symlinks, unbekannte Objekt-/Indexformen oder Capüberschreitung ergeben
`unproven`; sie werden nicht traversiert. Dieser Baseline-/Postvergleich ist
kein Git-Clean-Beweis und darf Operand 9 niemals positiv setzen.

Die Vitebindung liest `package-lock.json` und
`node_modules/vite/package.json` je über einen kanonischen regulären
Readhandle mit Einzelcap `1_048_576` Bytes, fatalem UTF-8-Decode,
Duplicate-Key-Ablehnung und genau einem `JSON.parse` ohne Reviver. Akzeptiert
werden nur Lockfileversion `3`, genau der Own-Data-Pfad
`packages["node_modules/vite"].version`, der gleiche geschlossene ASCII-Core-
SemVer-Wert im Paketmanifest und dessen Own-Data-`bin.vite`-Pfad
`bin/vite.js`. Der aufgelöste Entry muss derselbe reguläre, reparsefreie
Realpath wie `<repo>/node_modules/vite/bin/vite.js` sein. Nur die exakte
Übereinstimmung `8.1.4` darf Operand 59 und
`viteRuntimeVersionObservation` beobachten; jede Abweichung, Zusatzquelle,
Accessorform oder Capüberschreitung ergibt `ambiguous/null` beziehungsweise
`not-observed/null`.

| # | Operand | Authentische Quelle und Messzeit | Klassifikation ohne eindeutige Quelle |
| ---: | --- | --- | --- |
| 1 | `artifact.transport.src/transports/browserSyncTransport.js.sha256` | `C0`: rohe Checkoutbytes und Git-Blob desselben Pfads/Commits | `not-observed` |
| 2 | `artifact.contract.src/contracts/syncContract.js.sha256` | wie 1, eigener Pfad | `not-observed` |
| 3 | `artifact.gateway.server/startLocalSyncGateway.js.sha256` | wie 1, eigener Pfad | `not-observed` |
| 4 | `artifact.gateway.server/localSyncGatewayRuntimeConfig.js.sha256` | wie 1, eigener Pfad | `not-observed` |
| 5 | `artifact.gateway.server/localSyncGatewayHttpServer.js.sha256` | wie 1, eigener Pfad | `not-observed` |
| 6 | `artifact.gateway.src/gateways/syncGatewayRequestBoundary.js.sha256` | wie 1, eigener Pfad | `not-observed` |
| 7 | `artifact.gateway.src/agents/syncAgent.js.sha256` | wie 1, eigener Pfad | `not-observed` |
| 8 | `artifact.frontend.runtime-source-set.sha256` | `C0`: kanonisches 51-Pfade-/5.606-Byte-Manifest aus Checkout und Commit-Blobs | `not-observed` |
| 9 | `repository.state` | keine vollständige Git-Clean-/Ignore-/Indexquelle im erlaubten Adapter | immer `not-observed/null`; der getrennte Baselinevergleich ist kein Operand |
| 10 | `hostRuntime.executionClass` | One-shot-Owner und Run-Temproot beweisen ohne Tree-/Deleteabschluss keine historische Klasse `local-disposable` | immer `not-observed/null` in `R0` |
| 11 | `operatingSystem.family` | `C0`: gefangenes rohes `process.platform === "win32"`, exakt projiziert zu `windows` | `not-observed` bei fehlender/deskriptorwidriger Quelle |
| 12 | `operatingSystem.edition` | keine erlaubte authentische Quelle | immer `not-observed/null` |
| 13 | `operatingSystem.architecture` | `process.arch` bindet nur das Node-Binary und ist kein OS-Architekturbeweis | immer `not-observed/null` |
| 14 | `operatingSystem.version` | keine erlaubte authentische Quelle | immer `not-observed/null` |
| 15 | `operatingSystem.build` | keine erlaubte authentische Quelle | immer `not-observed/null` |
| 16 | `operatingSystem.patch` | keine erlaubte authentische Quelle | immer `not-observed/null` |
| 17 | `node.version` | `C0`: gefangenes `process.version === "v24.19.0"`, nach exakter Grammatik durch Entfernen allein des initialen `v` zu `24.19.0` projiziert, plus gebundener `process.execPath` | `not-observed` bei fehlender/mehrdeutiger Quelle |
| 18 | `browser.product` | fester Pfad und Exename sind kein Produktbeweis | immer `not-observed/null` |
| 19 | `browser.channel` | fester Installationspfad ist kein Channelbeweis | immer `not-observed/null` |
| 20 | `browser.version` | keine Versionsresource- oder CDP-Quelle | immer `not-observed/null` |
| 21 | `browser.engine` | keine unabhängige lokale Quelle; Produktname ist kein Enginebeweis | immer `not-observed/null` |
| 22 | `browser.engineBuild` | keine Quelle in der Sechs-Command-Allowlist; kein `Browser.getVersion` | immer `not-observed/null` |
| 23 | `browser.executionMode` | Launchargs beweisen keinen tatsächlichen sichtbaren Modus | immer `not-observed/null` in `R0` |
| 24 | `browser.privateMode` | `--incognito` beweist ohne effektive Browserquelle keinen Istwert | immer `not-observed/null` in `R0` |
| 25 | `profile.lifecycle` | `mkdtemp` beweist ohne handle-sicheren Deleteabschluss nicht `fresh-disposable` | immer `not-observed/null` in `R0` |
| 26 | `profile.extensions` | frisches Profil/Flags allein beweisen keine effektiven Extensions | immer `not-observed/null` ohne Storequelle |
| 27 | `profile.startParameters` | `X0`: exakter Arg-Vektor; effektive Nichtumgehung braucht unabhängige Quelle | sonst `not-observed` |
| 28 | `profile.featureFlags` | kein Flag allein beweist `none-effective` | immer `not-observed/null` ohne Plattformquelle |
| 29 | `profile.enterprisePolicies` | keine Policyinspektion im erlaubten Pfad | immer `not-observed/null` |
| 30 | `networkEnvironment.proxy` | kein Profil-/Argschluss auf effektiven Proxy | immer `not-observed/null` |
| 31 | `networkEnvironment.vpn` | keine passive authentische Quelle | immer `not-observed/null` |
| 32 | `initialState.serviceWorker` | frisches Profil ist kein Abwesenheitsbeweis | immer `not-observed/null` |
| 33 | `initialState.permission` | fehlender Dialog ist kein Zustandssample | immer `not-observed/null` |
| 34 | `initialState.preflightCache` | frisches Profil ist kein Cachebeweis | immer `not-observed/null` |
| 35 | `initialState.siteCache` | frisches Profil ist kein Cachebeweis | immer `not-observed/null` |
| 36 | `bindingComparisonProfile` | `C0`: fest implementierter Vergleichsalgorithmus, nur bei attestierter Adapterquelle | sonst `not-observed` |
| 37 | `frontend.topLevelUrl` | der Launcharg beweist keinen tatsächlichen Top-Level-Targetwert vor Factoryerzeugung | immer `not-observed/null` in `R0` |
| 38 | `frontend.serializedOrigin` | der geplante Evaluationstring beweist keinen tatsächlichen Main-World-Originwert | immer `not-observed/null` in `R0` |
| 39 | `frontend.contextKind` | der Text `top===window` ist nur ein späterer Test, kein vorab beobachteter Istwert | immer `not-observed/null` in `R0` |
| 40 | `frontend.isSecureContext` | Loopbackregel und Testtext beweisen keinen tatsächlichen Main-World-Wert | immer `not-observed/null` in `R0` |
| 41 | `transportRequest.factoryProfile` | `E0`: exakter argumentloser Real-Factorypfad im Evaluationstring | `not-observed` bei Hashdrift |
| 42 | `transportRequest.compositionProfile` | `E0`: alleiniger direkter Transportimport | `not-observed` bei Hashdrift |
| 43 | `transportRequest.requestProfile` | `E0`: geschlossener synthetischer v1-Request mit leerem Payload | `not-observed` bei Hashdrift |
| 44 | `transportRequest.requestEqualityMethod` | `E0`: geschlossene primitive By-value-Projektion ohne Retention | `not-observed` bei Hashdrift |
| 45 | `transportRequest.initialUrl` | `E0`: exakt gecachter Endpointstring | `not-observed` bei Hashdrift |
| 46 | `transportRequest.initialScheme` | `E0`: geschlossene URLzerlegung von 45 | `not-observed` bei fehlender 45 |
| 47 | `transportRequest.initialHost` | wie 46 | `not-observed` |
| 48 | `transportRequest.initialPort` | wie 46 | `not-observed` |
| 49 | `transportRequest.initialPath` | wie 46 | `not-observed` |
| 50 | `transportRequest.requestInitProfile` | `C0+E0`: Evaluationhash plus Transport-/Contract-Commitblob | `not-observed` bei einer fehlenden Quelle |
| 51 | `gateway.listenerHost` | `X0`: exakter Gateway-Environmentwert und Runtimeconfig-Blob | `ambiguous` ohne Childidentität |
| 52 | `gateway.listenerPort` | wie 51 | `ambiguous` |
| 53 | `gateway.portEnvironmentValue` | `X0`: ausschließlich für diesen Replayoperanden erzeugte `adr-0034-I3-contract-projection` mit Länge 6 und Codeunits `[34,56,55,56,55,34]` | `not-observed` |
| 54 | `gateway.allowedOrigin.value` | `X0`: exakte primitive Envprojektion | `not-observed` |
| 55 | `gateway.allowedOrigin.relationToFrontend` | `X0`: codeunitgleicher Vergleich von 38 und 54 | `unproven` als Replayresultat, wenn eine Quelle fehlt |
| 56 | `gateway.endpoint` | `C0+X0`: geschlossene Runtimeconfig-/Boundaryableitung | `not-observed` |
| 57 | `gateway.responderProfile` | `C0+X0`: exakter Produktionsentry und sieben Gatewayartefaktbindungen | `ambiguous` bei Ersatzentry |
| 58 | `gateway.responseProfile` | `C0`: geschlossene Ableitung aus attestierten Gateway-/Contract-/Agentbytes | `not-observed` bei fehlendem Blob |
| 59 | `toolchain.vite.lockfileVersion` | `C0+X0`: rohe Lockfilebytes, exakt aufgelöster Viteentry und Packageversion | `ambiguous` bei Mehrfachauflösung |

Der authentisch an Spawn und Own-Data gebundene
`GOLDENDAWN_SYNC_GATEWAY_PORT`-Rohwert bleibt der String `8787` mit genau vier
Codeunits `[56,55,56,55]`. Ausschließlich für Operand 53 erzeugt der Adapter
danach einen separaten Wert, indem er U+0022, genau diese vier Codeunits und
U+0022 zusammensetzt. Das Ergebnis ist der primitive Sechs-Codeunit-String
`"8787"` mit `[34,56,55,56,55,34]`; es ist weder der historische Rohwert noch
der Child-Environmentwert. Trimmen, `Number`, `String`, freie Normalisierung,
bereits gequoteter Childinput, zusätzliche Quotezeichen oder Umschreiben einer
abweichenden Ziffer sind verboten. Falscher Typ, Whitespace oder Quotezeichen
stoppen die Child-Environmentbindung vor Spawn; eine andere vierstellige
Ziffernfolge bleibt unverändert und führt zu `mismatch/DIVERGED`, niemals zur
Normalisierung auf `8787`.

Kein Tabellenwert darf aus Childstdout, einem Dateinamen, einer Browserversion
oder einem frischen Profil weiter abgeleitet werden, als die Zeile erlaubt.
Insbesondere bleibt `browser.engineBuild` ohne siebten CDP-Befehl unbewiesen.
Die sieben I1–I7 und die getrennte I8-Abweichungsachse werden von der
Foundation unverändert aus diesen 59 Operanden gebildet; es entsteht kein
60. Vergleich.

### 10. Hash-, Provenienz- und endliche Suchräume

Alle SHA-256-Werte werden über rohe Bytes ohne Unicode-, BOM-, Whitespace-
oder Zeilenendennormalisierung gebildet. Für den späteren Adapter gelten neben
dem Foundationhash diese festen Bindungen:

| Identität | Fester SHA-256 |
| --- | --- |
| Foundationtest, nur Regression | `1e8ce75e175b3e74c8c8b064e343550f32865fd5703aa54e01ead909a86e100c` |
| ADR 0032 | `0f7264b6d1b0d796d92bc8d5cbef243f374b0c923d9d924337e0f6af01333515` |
| ADR 0033 | `ebbcb6e30a139e71a4dbb7aea2dbdd16158d745983ae3ebaff81f4c98a383dc3` |
| ADR 0034 | `4d0816046a83982ed49bbc8505d504166fe4f1f38eaa26f97fe5861f4f4e6f9f` |
| ADR 0035 | `ab433eafee9c78b2196e664deebf25edd390ca01e44cdb811bb99130b476b197` |
| ADR 0037, ergänzende aktuelle Entscheidungsgrundlage | `0b15c4cfbf864740e3acc0aa8a3d5c9d3d93ad833112b5a936c4592eabfcd680` |
| historischer Evidence-Record | `ffad6b1de2e0c32ec5c2cdc3e88bfd455b14adc2eb4dd45f0d81e911e1a64b33` |
| Evaluationstring, exakt 4.259 UTF-8-Bytes | `a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b` |
| Frontendmanifest, exakt 51 Pfade/5.606 Bytes | `6f3d5740b043308b4d38df33b6293c9064d8dd1b3f0c5801d50844336c195591` |

Der ADR-0037-Dokumenthash ergänzt nur die Entscheidungsbindung: kein neuer
Replayoperand, kein Recordfeld und keine unabhängige Adapterattestierung.
Der frühere Regressionshash
`63d48e9c1b389678183f05cf26054f33ccd107992138894ba86f09b9d1277afe`
gehört zur historischen 422/422-Suite; die aktive Suite besitzt 595/595 Tests.

Die sieben Produktartefakte sind unverändert:

| Pfad | Fester SHA-256 |
| --- | --- |
| `src/transports/browserSyncTransport.js` | `3c41b17e1d80e94e4b05e7c76f019d3fd3af281b451e85c8f90d80fd25391c28` |
| `src/contracts/syncContract.js` | `96ad2c52fb4545d6e587d9b3fd86d76a4a735e8cb33e9b572a3d7d5f4e5a6aeb` |
| `server/startLocalSyncGateway.js` | `677be5e9cace926ba0a1f3540e39926f5b5c54dd57440bd1ac53de6f255ca6d5` |
| `server/localSyncGatewayRuntimeConfig.js` | `e9a4419666e33b57d1ed5712e00f3d954a5b82c1cc7956b9a7582e0462743836` |
| `server/localSyncGatewayHttpServer.js` | `70243e66f85448c23920ea30409a03be7ed349b6868535729f4a798f012fdbb8` |
| `src/gateways/syncGatewayRequestBoundary.js` | `b1e55f03283bfdd1d35562951503471b4a812ac61868af0b927a05623e597b79` |
| `src/agents/syncAgent.js` | `899e06d3a80925cab8680749d133e9a8d87f30a2fd1d509cf7339eb1c8d65db0` |

Jeder Checkoutwert wird zugleich gegen den Git-Blob desselben Pfads unter
`repositoryCommit` geprüft. Ein Hashvergleich ohne Pfad-, Commit-, Realpath-
und Bytesidentität ist keine Provenienz. Der historische Evidencehash wird
vor jeder Wirkung und nach Cleanup am selben File-/Volumenobjekt geprüft.
Der Evaluationhash stammt ausschließlich aus dem exakt gecachten primitiven
String, aus dem auch der tatsächlich geschriebene UTF-8-Frame entsteht.

`controllerExclusivity` darf nur aus dem eigenen Factoryowner, dem einzigen
Dispatcher, den konkreten Child- und Pipehandles sowie dem vollständigen
Capabilityledger abgeleitet werden. `connectionProfile` darf nur aus den
beiden geerbten Debug-Pipehandles, der Abwesenheit jedes Debug-Port-Arguments
und dem exklusiven Read-/Writeowner entstehen. Callerbooleans, Childstdout
oder ein erfolgreiches CDP-Reply sind dafür keine Quelle.

Die Residue- und Copy-Abwesenheitsclaims sind endlich. Ihr vollständiger
Suchraum besteht ausschließlich aus den vorab aus dem Commit-Tree gebundenen
höchstens 4.096 getrackten Worktreepfaden unter den oben genannten Pfad-/Byte-
Caps, dem eigenen Run-Temproot, Profilroot, den exakten Harnesspfaden, dem
tatsächlichen Module-Loadledger und der geschlossenen Adapter-
Schreiballowlist. Ungetrackte Repositorypfade gehören mangels vollständiger
Ignoresemantik nicht zu einem positiven Abwesenheitsclaim. Reparse Points
werden nicht traversiert. Außerhalb dieses durch Capability-Confinement
endlichen Raums wird keine globale Hostabwesenheit behauptet. Ein
unvollständiger oder gecappter Raum bleibt `unproven`.

Die Post-Cleanup-Repositoryprüfung startet keinen Prozess und verwendet weder
stdin noch freie IPC. Sie vergleicht im bereits laufenden Adapter die in `C0`
gebundenen HEAD-/Refbytes, rohen Indexbytes, Pfadtypen, File-IDs und Bytes der
begrenzten Commit-Tree-Baseline mit dem Postzustand. Gleichheit kann den
Cleanupcheck innerhalb dieses Raums stützen, belegt aber weder Git-Clean noch
Ignore-/Untracked-Abwesenheit; `repository.state` bleibt immer
`not-observed/null`. Es wird nichts repariert.

Globale Portfreiheit wird nicht aus dem Ende eigener Children abgeleitet und
nie durch einen Bind-, Listen- oder Connectversuch getestet. Nur eine bereits
vor dem Cleanup gebundene passive OS-TCP-Tabellenfähigkeit ohne neuen Prozess,
Listener oder Request dürfte `portsFree: confirmed` erzeugen. Fehlt sie,
bleibt der Check selbst bei beendeten Vite-/Gatewayhandles `unproven`.

### 11. Integrity- und Cleanupableitung bei authentischer Phasenbindung

Die Adapterledger sind:

```text
B0 = tief eingefrorene Baseline vor jeder Wirkung
S  = Source-, Realpath-, Loader-, Git-Blob- und Hashledger
W  = vollständiger Outbound-Wire-/Send-Ack-/Commandledger
P  = Framing-, UTF-8-, Parser-, Feldzugriffs- und FIFO-Ledger
X  = Launcher-, Handle-, Environment- und Ressourcenledger
N  = vollständig attribuierter Network-/Requestownership-Ledger
D  = Output-, Storage-, Filesystem- und Residueledger
F  = unveränderte tief eingefrorene FoundationProjection
A_obs   = Adapterfreeze nach authentisch gebundenem O0 und vor jeder folgenden
          Adapter- oder Foundation-Cleanupwirkung; nur durch den in Abschnitt
          12 gewählten synchronen observationClosed-Übergangsmarker
A_clean = Adapterfreeze nach terminalem Foundation-/Fallback-Cleanup
A_final = abschließender Freeze unmittelbar vor Recordmaterialisierung
```

Die Foundationabhängigkeit aus Abschnitt 12 ist durch ADR 0037 einschließlich
Implementierung, unabhängigem Review und Featurecommit erfüllt. Ein
authentisch zeitgebundenes adapterseitiges `A_obs` folgt daraus noch nicht:
Erst der künftige produktive Owner darf es durch seinen identitätsgebundenen
Callback aus der authentisch geladenen Foundation erzeugen. Ohne diesen
Nachweis bleiben die daran gebundenen positiven Integrity- und Cleanupaussagen
`unproven`, und ein Record ist verboten. Ein gespeicherter Cancelcheckpoint,
`A_clean` oder `A_final` darf `A_obs` nicht rückwirkend ersetzen.

Ein freier Digest, Boolean oder `cleanup-fact: true` kann keinen positiven
Zustand erzeugen. Bei Integrity gilt `violated` vor `unproven` vor
`confirmed`, bei Cleanup `failed` vor `unproven` vor `confirmed`.

#### 11.1 Alle 17 Integritychecks

| `checkId` | Authentische Quelle | `confirmed` | `violated` | `unproven` | Freeze / gebundene Identität |
| --- | --- | --- | --- | --- | --- |
| `sourceUnmodified` | `S`: Foundation-Checkoutbytes, Commit-Blob, byte-owned Load und Vorher/Nachher-Identität | alle Bytes, Digests, kanonischer Pfad und ABA-Bindung identisch | Byte-, Digest-, Pfad-, Reparse- oder Loaderabweichung | Actual-loaded- oder ABA-Bindung fehlt; gleiche Vorher/Nachher-Hashes allein genügen nicht | `B0→A_clean→A_final`; Foundationhandle, Blob, Modulinstanz |
| `instrumentedSourceCopyAbsent` | `S+D`: geschlossene Inventur und vollständiger Loadledger | im endlichen Suchraum nur die kanonische uninstrumentierte Transportquelle | instrumentierte, ersetzende oder zusätzlich geladene Transportkopie | Suchraum oder Loadledger unvollständig; keine globale Abwesenheit | `B0→A_clean→A_final`; Transportquelle, Repo-, Temp- und Modulgraph |
| `compositionSeamsAbsent` | `S+W+X`: Foundation-, Evaluation-, Factory- und Capabilityledger | nur kanonische Foundation, realer Transportimport und argumentlose Factory | Fake-Seam, Ersatzmodul, Caller-`runBinding` oder zweiter Kompositionspfad | eine Source-, Send-, Loader- oder Capabilitybindung fehlt | `A_obs→A_final`; Foundation, Evaluate, Target, Session, Transportmodul |
| `protocolAllowlistOnly` | `F+W`: Intent- und tatsächlicher Wireledger | nur sechs Commands in exaktem Profil und erlaubter Kardinalität | fremder Command, Profilabweichung oder bestätigter Mehrfachsend | Wireledger unvollständig oder Send unbekannt | `A_obs→A_final`; Pipegeneration, Intent-/Command-/Session-ID |
| `runtimeSurfaceMutationAbsent` | `S+W`: gesendeter Evaluationstring und Runtimeaktionsledger | nur festes Main-World-Profil, keine weitere Runtimeaktion | obserververursachte Mutation oder Zusatzaktion | Text-, Actual-Send- oder Aktionsprovenienz fehlt | `A_obs→A_final`; Main World, Evaluate-Intent, Text |
| `fetchInterceptionAbsent` | `S+W+X`: Evaluation-, Operations- und Launcherledger | keine Fetch-Domain, Interception, Proxy- oder Hookfähigkeit | authentisch belegte Interception oder Hook | Verbindung, Runtimeaktion oder Launcherbindung unvollständig | `A_obs→A_final`; Browser, Pipe, Main World, Adapterowner |
| `debuggerBreakpointsAndSteppingAbsent` | `W+P`: vollständiger Pipeledger | keine Debuggerdomain, Breakpoints oder Steppingoperation | mindestens eine solche Operation | Pipevollständigkeit oder exklusiver Writer fehlt | `A_obs→A_final`; Pipegeneration und Writeowner |
| `profilerAndTracingAbsent` | `W+P`: vollständiger Pipeledger | keine Profiler-/Tracingoperation | mindestens eine solche Operation | Pipevollständigkeit oder Exklusivität fehlt | `A_obs→A_final`; Pipegeneration und Writeowner |
| `responseBodyReadAbsent` | `W+P`: Command- und begrenzter Feldzugriffsledger | kein Bodycommand, Bodyfeld, Stream oder Bodyread | authentischer Bodyzugriff | Parser-, Pipe- oder Zugriffledger unvollständig | `A_obs→A_final`; Parser, Pipe, attribuierte POST-Generation |
| `freeRawInspectionAbsent` | `S+P`: attestierter Parser und Zugriffszähler | nur NUL-Framing, fataler Decode, lexikalische Grammatik/Dubletten und allowlistete Descriptorreads | freie Rohsuche, semantische Vorfilterung oder weiterer Parse | Parserattestierung oder Zugriffledger unvollständig | `A_obs→A_final`; Reader, Decoder, Scanner, Parser, FIFO |
| `additionalNativeFetchAbsent` | `S+F+N`: Evaluation, Counts und Requestownership | genau der erlaubte Transportaufruf, kein Zusatzfetch | zusätzlicher Fetch dem Observerpfad zugeordnet | Networkvollständigkeit oder Owner mehrdeutig | `A_obs→A_final`; Main World, Browser, Capture, Requestkette |
| `observerProductEndpointRequestAbsent` | `N+X`: Endpointbudget und Prozessownership | jeder Endpointrequest gehört dem einen Produktstimulus | Adapter/Launcher erzeugt einen Endpointrequest | Endpointrequest nicht eindeutig attribuierbar | `A_obs→A_final`; Endpoint, Browser-, Adapter- und Requestgeneration |
| `rawPersistenceAbsent` | `S+D`: Schreibcapabilities, Outputledger und Inventur | keine Rawbytes/-texte/-IDs/-fehler im endlichen Schreibraum | solche Persistenz authentisch gefunden | Schreibledger oder Suchraum unvollständig | `A_clean→A_final`; Repo-, Temp-, Profil- und Outputidentitäten |
| `observerDiagnosticDuringRunOutputAbsent` | `D+X`: Outputledger und Childdrains | nur eine spätere unabhängige, vollständige Ownerbindung von Adapter-stdout/-stderr plus alle sechs Childstreams könnte bis `A_final` Abwesenheit bestätigen; in Schema 1 unerreichbar | authentisch beobachtete Diagnose-/Roh-/Fehlerausgabe während des Laufs | ohne externen Adapter-Streamowner immer `unproven`; `--no-warnings` und verworfener Childoutput genügen nicht | `A_clean→A_final`; Adapteroutput und alle sechs Childstreams |
| `closedPrimitiveProjectionConfirmed` | `F` plus adapterseitiger Shape-/Freezecheck | Projection frisch, geschlossen, tief gefroren und referenzdisjunkt | erfolgreiche Projection verletzt Shape, Frische, Freeze oder Referenzfreiheit | keine vollständig prüfbare Erfolgsprojection | `F→A_final`; konkrete Result-/Projectionobjekte |
| `singleTargetAndSessionConfirmed` | `F+W+P+X`: Targetset, Attach, Routing, Launcher | exakt ein Top-Level-Target und eine flache Session voll korreliert | zwei widersprüchliche gültige Bindungen | null/mehrere Kandidaten, fehlende/doppelte Antwort oder Provenienzlücke | `A_obs→A_final`; Browser-, Target- und Sessiongeneration |
| `singleMainWorldEvaluationConfirmed` | `S+F+W+P`: Textdigest, Send-Ack, Reply und v2-Wert | genau ein Evaluate und ein gültiger Main-World-v2-Wert | mehrere korrelierbare Replies oder widersprüchliche Werte | Send, Korrelation, Text oder Main-World-Provenienz fehlt | `A_obs→A_final`; Evaluate-/Command-/Session-/Capturegeneration |

#### 11.2 Alle 20 Cleanupchecks

Die zwölf bestehenden `cleanup-step`-Aktionen bleiben unverändert. Ihr Ack
bestätigt nur Annahme; ihr späteres `cleanup-fact` informiert die Foundation,
bestätigt im Finalrecord aber niemals allein einen Check.

Jede reale oder logische Ressource besitzt im gemeinsamen monotonen Ledger
dieselbe totale Creationmatrix. `never-attempted` ist nur dann positiv, wenn
der zugehörige Prä-Wirkungs-Latch nachweislich nie verlassen wurde; der bloße
Name eines noch nicht erreichten Steps genügt nicht. Unmittelbar vor jedem
Syscall oder jeder möglichen Allokation wird auf `may-exist` gelatcht, sodass
Throw, fehlender Callback und verlorene Rückgabe niemals Abwesenheit erfinden.

```text
never-attempted und Wirkung konstruktiv unmöglich -> absent/confirmed
may-exist, Identität oder Ergebnis fehlt          -> unproven
gebunden und sicher terminal/geschlossen          -> confirmed,
                                                    soweit die Zeile das erlaubt
gebunden und authentisch aktiv/verblieben         -> failed
fremde Identität berührt oder Control verletzt    -> failed plus Aggregate-FAIL
```

Für Rawgraphen und flüchtige IDs gilt dieselbe Matrix: nie allokiert ist
`confirmed`, möglicherweise allokiert aber nicht vollständig inventarisiert
`unproven`, nach `A_clean` authentisch erreichbar `failed`. Für Windows-
Pfadressourcen existiert in Schema 1 nach einem möglichen Create kein
positiver Deletepfad; dessen Resultat bleibt ohne die getrennte handle-relative
Löschfähigkeit `unproven`, sofern nicht ein sicher gebundener Rest oder fremder
Touch `failed` belegt.

| `checkId` | Authentische Quelle | `confirmed` | `failed` | `unproven` | Freeze / gebundene Identität |
| --- | --- | --- | --- | --- | --- |
| `cleanupStarted` | `S+F` plus Adapterphasenledger: synchroner `effectPort.observationClosed()`-Marker | der exakt einmalige Marker band unmittelbar nach Foundation-`O0` und vor jeder Cleanupwirkung `A_obs`, danach genau eine Cleanupgeneration | Marker früh, fehlend, reentrant, doppelt oder nach der ersten Cleanupwirkung; Cleanup ohne gebundenes `A_obs` oder in falscher Reihenfolge | `D_K4`-, Foundationbytes- oder Markeridentität nicht authentisch bindbar; kein Record | `A_obs→A_final`; Owner, Foundation, Markeridentität und Cleanupgeneration; ohne authentisches `A_obs` keine positive Ableitung |
| `networkDomainClosed` | `W+P`: Enable-/Disable-Send und Antworten | Enable sicher nie gesendet oder ein korreliertes Disable mit exakt `result:{}` | ausschließlich ein eindeutig zur exakten Disable-Command-ID korrelierter Fehler oder malformed Gegenwert | Enable möglich/gesendet, exakter Disableerfolg fehlt; unroutebare/malformed Hülle bleibt hier unproven und setzt getrennt Aggregate-FAIL; Close genügt nicht | `A_clean→A_final`; Session, beide Intents/Command-IDs |
| `targetSessionClosed` | `W+P`: Attach-/Detach-Send und Antworten | Attach sicher nie gesendet oder ein korreliertes Detach mit exakt `result:{}` | ausschließlich ein eindeutig zur exakten Detach-Command-ID korrelierter Fehler oder malformed Gegenwert | Attach möglich/gesendet, exakter Detacherfolg fehlt; unroutebare/malformed Hülle bleibt hier unproven und setzt getrennt Aggregate-FAIL; Close genügt nicht | `A_clean→A_final`; Target/Session, beide Intents/Command-IDs |
| `debugPipeClosed` | `X+P`: Read-/Writehandles und EOF/Close | Open konstruktiv nie versucht oder beide Enden irreversibel geschlossen und alle Callbackgenerationen terminal | gebundener Handle nach terminalem Versuch bekannt offen oder Closefehler | Open möglich, Handleidentität oder Terminalzustand unbekannt | `A_clean→A_final`; exaktes Handlepaar/Pipegeneration |
| `controllerObservationClosed` | `P+X`: FIFO, Resolver, Callback- und Capabilityledger | Intake irreversibel aus, kein Resolver offen, späte Callbacks inert | nach `O0` Observation verarbeitet oder frozen Zustand mutiert | Intake-/Resolver-/Callbackzustand unvollständig | `A_clean→A_final`; Controller/FIFO/Resolvergeneration |
| `browserStopped` | `X`: Spawn-, Wait-, Terminate-, Exitledger | Spawn konstruktiv nie versucht; nach möglichem Spawn ist ohne Job-/Tree-Owner kein positiver Fall erlaubt | gebundener Root nach terminalem Stopppfad bekannt aktiv | Spawn möglich, Identität unklar oder Root terminal, aber Nachfahren ungebunden | `A_clean→A_final`; Browser-Root-Childhandle, keine freie PID |
| `devServerStopped` | `X`: Spawn-, Wait-, Terminate-, Exitledger | Spawn konstruktiv nie versucht; nach möglichem Spawn ist ohne Job-/Tree-Owner kein positiver Fall erlaubt | gebundener Root nach terminalem Stopppfad bekannt aktiv | Spawn möglich, Identität unklar oder Root terminal, aber Nachfahren ungebunden | `A_clean→A_final`; Vite-Root-Childhandle |
| `gatewayStopped` | `X`: Spawn-, Wait-, Terminate-, Exitledger | Spawn konstruktiv nie versucht; nach möglichem Spawn ist ohne Job-/Tree-Owner kein positiver Fall erlaubt | gebundener Root nach terminalem Stopppfad bekannt aktiv | Spawn möglich, Identität unklar oder Root terminal, aber Nachfahren ungebunden | `A_clean→A_final`; Gateway-Root-Childhandle |
| `profileRemoved` | `X+D`: Creationmatrix und handlegebundene Identität | Create konstruktiv nie versucht; nach möglichem Create ist in Schema 1 kein positiver Deletefall erlaubt | sicher gebundener Rest oder fremdes Ziel berührt | Create möglich/erfolgt, weil keine handle-relative Deleteprimitive existiert; Austausch/Identität mehrdeutig | `A_clean→A_final`; eigener Profilpfad/Parentkette |
| `harnessFragmentsRemoved` | `X+D`: Creationmatrix, Fragmentallowlist und Identitäten | alle Creates konstruktiv nie versucht; nach möglichem Create ist in Schema 1 kein positiver Deletefall erlaubt | sicher gebundenes eigenes Fragment bleibt oder fremdes Ziel verändert | mindestens ein Create möglich/erfolgt oder Pfadmenge/-identität unvollständig | `A_clean→A_final`; konkrete Fragmente/Run-Temproot |
| `objectGroupsAbsentOrReleased` | `S+F+W+P`: Evaluateprofil und RemoteObject-Prüfung | keine Objectgroup, kein `objectId`, daher kein Releasecommand nötig | Objectgroup/Handle erzeugt und nicht freigegeben | Evaluate-/Parser-/RemoteObject-Provenienz fehlt | `A_obs→A_final`; Evaluate, Session, Main-World-Projektion |
| `rawEventsDiscarded` | `P+D`: Buffer-, Decoder-, Scanner-, Parser-, FIFO-Ledger | Rawallokation konstruktiv nie möglich geworden oder alle inventarisierten Raw-, Text-, Graph- und Callbackreferenzen verworfen | mindestens eine Rawreferenz bleibt authentisch erreichbar | Allokation möglich, Erreichbarkeit oder Ledgerabschluss unvollständig | `A_clean→A_final`; Reader/Decoder/Parser/FIFO |
| `ephemeralIdentifiersDiscarded` | `P+X`: ID-Ledger und Outputinventur | ID-Allokation konstruktiv nie möglich geworden oder alle Target-, Session-, Request-, Command-, Intent-, Cap- und Callback-IDs entfernt | Raw-ID übernommen, persistiert oder authentisch erreichbar | Allokation möglich, ID-Inventur oder Outputgraph unvollständig | `A_clean→A_final`; alle runlokalen Generationen |
| `permissionSiteCacheAndServiceWorkerStateCleared` | `X+D`: Profil- und Plattform-Store-Zuordnung | Profil-/Browsercreate konstruktiv nie versucht oder authentische Quelle belegt ausschließliche Profilzuordnung und Entfernung aller Stores | gebundener Zustand bleibt oder sicher zugeordnetes Clear/Delete scheitert eindeutig | Profil/Browser möglich, aber Storezuordnung oder handle-sichere Entfernung fehlt; frisches Profil allein genügt nicht | `A_clean→A_final`; Browser, Profil und exakt kartierte Stores |
| `environmentRestored` | `B0+X`: Environment-, CWD-, Handle- und Handlerbaseline | Mutation konstruktiv nie versucht oder alle allowlisteten Werte/Descriptoren baselineidentisch | authentische Abweichung bleibt | Mutation möglich, Baseline/Postvergleich fehlt oder ist mehrdeutig | `B0→A_clean→A_final`; Adapterprozess, Envkeys, CWD, Handler |
| `portsFree` | `X`: passive vorgebundene OS-Portquelle | nur passive Quelle belegt beide Ports frei | passive Quelle belegt verbleibenden Listener | eigene Childexits beweisen keine globale Freiheit; kein Probe-Listener | `A_clean→A_final`; `127.0.0.1:5173/8787`, Listenerowner |
| `repositoryAndIndexRestored` | `B0+D`: in-process Baseline-/Postinventur | Pfade, Typen, Bytes, Index und Commitref exakt gleich; keine Reparatur | authentische Abweichung | Baseline, Postcheck oder Reparseidentität unvollständig | `B0→A_clean→A_final`; Repo, `.git/index`, HEAD/Refs, Pfadmenge |
| `historicalEvidenceHashUnchanged` | `B0+D`: rohe Evidencebytes vor/nach Lauf | beide feste Hashes und dieselbe Pfadidentität | Hash-, Byte-, Pfad- oder Identitätsunterschied | Datei/Identität/ein Read fehlt | `B0→A_clean→A_final`; historischer Evidencepfad |
| `observerStorageLogAndTelemetryResidueAbsent` | `S+D`: Creationmatrix, Schreibfähigkeiten und endliche Inventur | solche Erzeugung konstruktiv nie möglich geworden oder kein Storage-, Log-, Telemetrie- oder Rawrest im vollständigen Raum | solcher Rest authentisch gefunden | Erzeugung möglich, Suchraum oder Schreibledger unvollständig; keine globale Abwesenheit | `A_clean→A_final`; Repo-, Temp-, Profil-, Outputbereiche |
| `cleanupCompleted` | `F+X`: Checks 1–19, Cleanupcap, Completionclock | 1–19 terminal, exakter Cap einmal gecancelt, ein gültiges Completionsample | Controlfehler, falscher/zweiter Cancel, Clockfehler oder terminaler Abschlussfehler | Cap gewinnt oder Terminal-/Clock-/Cancelfakt fehlt | `A_clean→A_final`; Cleanupgeneration, Arm-ID, Clockgeneration |

### 12. Observationfreeze, Cleanup, Finalrecord und Writer

#### 12.1 Grenzen des beschlossenen syntaktischen Trackers

Der Adapter kennt mehr als ein einzelnes Cancelpayload: die streng geordnete
Folge aller `{ intentId, kind, payload }`, seine eigenen validierten
Exchange-Promise-Identitäten und Settlements, die von ihm eingereihten und
ausgelieferten Producerereignisse, Clockwerte und Generationen sowie das
öffentliche Foundation-Runsettlement. Er kennt dagegen weder den privaten
`purpose`, die interne Foundationphase noch
`preCleanupObservationSnapshot`. Der erste validierte
`protocol-command-send(Target.getTargets)` belegt öffentlich
`attemptStarted`; sein Fehlen belegt nur, dass dieser Übergang nicht erreicht
wurde.

Ein einzelnes `cap-cancel`-Payload trägt weder `purpose` noch `O0`-Phase; auch
eine spätere `confirmed-violation`-Projection trägt keine Cancelursache oder
-phasenbindung. Die vollständige öffentliche Historie enthält aber zusätzlich
die geordnete Intent-, Exchange-, Producer- und Settlementfolge. Aus gleichen
Cancelpayloads oder gleichen späteren Projektionen folgt daher weder
Nicht-Injektivität noch Injektivität dieser vollständigen Historie; beides wird
hier nicht behauptet und durch diesen Dokumentationsslice nicht bewiesen.

Ein auf eine vom Adapter selbst erzeugte Rejection folgender Cancel ist als
Quieszenzpfad erkennbar; ein späterer `cap-arm(capture)` belegt einen
erfolgreichen Setup-ready-Pfad. Unveränderliche Vorwirkungscheckpoints an jedem
Cancel wären ebenfalls möglich. Der hier beschlossene Tracker ist jedoch
enger als eine beliebige Analyse der vollständigen Historie: Er darf nur die
nachfolgend geschlossenen syntaktischen Fakten und Kardinalitäten führen. Unter
dieser Grenze kann er einen Cancelcheckpoint nicht in allen Pfaden als den
Zeitpunkt unmittelbar nach `O0` und vor jeder Cleanupwirkung authentisieren.

Ein adapterinterner Tracker bleibt deshalb auf öffentliche, syntaktische
Fakten begrenzt: höchstens 128 Dequeues, sieben Intentarten, drei
Capgenerationen, sechs Commands, genau einen offenen Exchange und je einen
unveränderlichen Vorwirkungscheckpoint pro Setup- und Capture-Cancel. Er darf
keine CDP-Nachricht nach der Foundationsemantik neu klassifizieren, keine
Projection als rückwirkenden Zeitstempel behandeln und aus dem Ausbleiben
eines Intents nichts Positives ableiten. Seine Zustände ohne neuen Marker
wären nur `NO_O0_YET`, `AMBIGUOUS_CANDIDATE(intentId)` und `NO_RECORD`:
Setup-ready-Erfolg verwirft den Kandidaten, ein Cancelkandidat wird nie
promotet, und jeder terminale Übergang endet `NO_RECORD`.
Auch `cleanup-origin` darf nicht frisch binden: Die Foundation erzeugt dieses
Intent erst nach `initializeCleanupLedger` und damit zu spät für einen
Pre-Cleanup-Beleg. Das ist total und konservativ, schließt K4 für einen
evidenzfähigen Lauf aber nicht.

#### 12.2 Erfüllte Foundationabhängigkeit und künftige Adapterbindung

ADR 0037 entscheidet `D_K4` als gezielte Ergänzung von ADR 0035 und ersetzt
keinen ADR formal. Die im Kontext gebundene Annahme-, Implementierungs-,
Review- und Commitkette ist abgeschlossen. Die beiden erforderlichen
Capabilityrollen entsprechen exakt Abschnitt 3. Daraus folgt weder ein
Injektivitätsbeweis noch ein informationstheoretischer Ausschluss anderer
denkbarer Designs.

Der einzige Callsite liegt im tatsächlichen `freezeObservationSnapshot`.
Nur beim ersten erfolgreichen vollständigen Deep Freeze und anschließender
Bindung von `O0` konsumiert er den Notificationslot vor dem Aufruf. Die
Reihenfolge ist exakt: Deep Freeze -> Snapshotbindung -> Slotkonsum ->
synchrone Notification samt Fehlerbehandlung -> Phasenwechsel zu Cleanup ->
geordneter Old-Cap-Scan -> Cleanup-Ledger und weitere Cleanupwirkungen.
Fehler vor `attemptStarted`, fehlgeschlagene Snapshot-/Freezekonstruktion
oder ein vor `O0` pending bleibender Exchange erzeugen null Marker. Späte
oder wiederholte Cleanupübergänge erzeugen keinen zweiten Marker.

Exchange-Portschluss vor `O0` verwirft die getrennte Notification nicht.
Nach erfolgreichem Freeze läuft sie auch im portlosen Observationpfad einmal;
nach ihrem Konsum bleibt keine terminale Callbackreferenz. Setup-ready- und
Rejection-Quieszenz-Cancel vor `O0` bleiben an ihrer bisherigen Stelle.
Throw oder jeder Return außer primitivem `undefined` wird ohne Reflection,
Assimilation oder Grundübernahme als sticky Cleanupverletzung behandelt:
`O0` bleibt unverändert, Cleanup und der spätere Candidate bleiben `FAIL`.
Der zentrale Reentranzguard greift nach Arity-/Maschinenidentitätsprüfung,
aber vor Profilreflection, Pending-Join und Effects; während des Callbacks
wird nur die Verletzung gelatcht und erst nach Rückkehr in Cleanup übernommen.
Ein pending Exchange wird dadurch nicht künstlich beendet. Ein nicht
zurückkehrender Callback oder blockierter Host bleibt außerhalb einer
Fortschrittsgarantie; kein zusätzlicher Timer oder Resolver entsteht.

Der Marker trägt weder Argument, `purpose`, Closegrund, Phase noch Recorddaten
und ist kein achter Intent, Command, Ack, Promise-, Timer-, Clock-, Polling-
oder Requestpfad. Er bestätigt den Foundationübergang, nicht den Erfolg des
adapterseitigen Freezes. Die bestehenden Recordformen bleiben unverändert.

Nach einer später authentisch geladenen `D_K4`-Foundation würde der
Adaptermarker aus dem aktiven Owner synchron alle bis dahin gebundenen
Adapterledger in `A_obs` projizieren und tief einfrieren, bevor er `undefined`
zurückgibt. Der begrenzte Tracker wäre exakt
`PREATTEMPT -> OBSERVATION_NO_AOBS -> AOBS_BOUND -> CLEANUP ->
TERMINAL_ELIGIBLE|TERMINAL_NO_RECORD`. Der erste validierte
`Target.getTargets`-Sendintent erzeugte `OBSERVATION_NO_AOBS`; nur der
einmalige Marker dürfte `AOBS_BOUND` erzeugen. `A_obs` bliebe danach
referenzidentisch unverändert. Ein früher, reentranter, doppelter, nach
Terminalisierung eintretender oder bei Foundationsettlement fehlender Marker
latchte bestätigte Verletzung und `TERMINAL_NO_RECORD`, ohne einen Ersatzfreeze
zu erzeugen. Der Adaptermarker dürfte keinen Rohgrund nach außen werfen;
interne Fehler würden lokal redigiert gelatcht und `undefined` zurückgeben,
damit der bereits notwendige Foundationcleanup nicht durch einen zweiten
Fehlerpfad ersetzt wird.

#### 12.3 Warum ein Promise-Reaktionszaun nicht genügt

Der Adapter könnte an sein Exchange-Promise eine eigene native Reaktion so
ketten, dass sie nach der kontrollierten Foundationreaktion und vor dem
Runpromise-Consumer läuft. Dieser Zaun wäre aber selbst ein Promisecallback.
Die Foundationreaktion ist atomar und kann darin bereits den post-`O0`
Old-Cap-Exchange aufrufen und der Adapter dessen Cancelwirkung linearisieren,
bevor der Zaun läuft. Im portlosen Pfad hat die Foundation vor dem Zaun nicht
nur `O0`, sondern bereits ihren lokalen Cleanup finalisiert. Ein Zaun oder
späteres Runsettlement ist daher kein rechtzeitiger Pre-Cleanup-Marker. Es darf
nur belegen, dass ein gespeicherter Kandidat existierte, nie ihn rückwirkend
zum `A_obs` machen. Auch ein nicht beobachtbar gewordenes Exchange besitzt
überhaupt keinen verlässlichen Settlementzaun.

#### 12.4 Vollständige Fallmatrix

| Fall | Öffentliche Reihenfolge und tatsächliche `O0`-Lage | Freeze, weitere Wirkungen, späte Callbacks und Abschluss |
| --- | --- | --- |
| Setup-ready-Cancel | exakte Setupantworten setzen `setupReady`, danach folgt `cap-cancel(setup)` vor `O0` | exakter Cancelerfolg armiert Capture und lässt `O0` weiter ausstehen; beobachteter Reject oder malformed Settlement bildet danach `O0` und geht in regulären Cleanup. Ein unbeobachtbarer Cancel schließt zuerst den Port, bildet dann `O0` und finalisiert portlos; forever-pending bildet kein `O0`. Der Marker dürfte nur unmittelbar nach einem tatsächlich gebildeten `O0` laufen. |
| Rejection-Quieszenz | ein beobachteter fehlgeschlagener Observationexchange führt vor `O0` zu `cap-cancel(setup\|capture)` | exaktes oder sonst beobachtetes terminales Cancelsettlement bildet danach `O0`; ein unbeobachtbarer Cancel schließt zuerst den Port, bildet dann `O0` und finalisiert portlos. Forever-pending hält `O0` aus. Kein Freeze oder Marker liegt vor dem Cancel. |
| post-`O0` Old-Cap-Cancel / Setup oder Capture | `beginObservationClosure` friert und bindet `O0`; der zentrale Freezer konsumiert danach die Notification samt Fehlerbehandlung, erst dann folgen `phase:"cleanup"` und der Scan zuerst von Setup, danach Capture, soweit die vorige Generation nicht mehr eligible oder beobachtet terminal ist | der künftige Adaptermarker muss `A_obs` vor dem Scan frieren. Ein beobachtetes Terminalsettlement setzt den Scan fort; unbeobachtbar schließt den Port und finalisiert portlos, pending hält das bereits gefrorene `O0` ohne Cleanup-Ledger. Stale Fire-/Cancelcallbacks bleiben inert. |
| regulärer Cleanup | `O0` und Marker liegen vor Phasenwechsel; danach folgen optional der geordnete Old-Cap-Scan, `initializeCleanupLedger` und erst dann `controller-clock-sample({reason:"cleanup-origin"})` | bei bereits quieszenten Caps entfällt nur der Scan. Anschließend folgen Cleanupclock, -cap, Commands und Schritte. Der normale terminale Pfad friert das Cleanup-Ledger und schließt erst danach den Port; Finalisierung folgt aus `A_clean/A_final`. |
| portlos nach `attemptStarted` | der erste `Target.getTargets`-Sendintent belegt den Start; bei kontrolliertem Handlerfehler oder unbeobachtbarem Exchange schließt die Foundation zuerst den Port und bildet erst danach `O0`. Eine bereits gelatchte Pending-Join-Verletzung vollzieht dieselbe Reihenfolge erst beim späteren Eintritt des ersten kontrollierten Handlers | der Marker läuft nach diesem `O0`, aber noch vor `initializeCleanupLedger` und lokaler portloser Finalisierung; es folgt kein weiterer Exchange. Danach darf nur äußerer Cleanup folgen. Bestätigte Verletzung bleibt `FAIL`; ein Record verlangt gültige Projection, terminalen äußeren Cleanup und sonst vollständige Evidenz. |
| Fehler vor `attemptStarted` | kein `Target.getTargets`-Sendintent; nach gegebenenfalls beobachteter Prestart-Arm-Recovery schließt/settelt die Foundation ohne `O0` und Marker; ein pending Exchange bleibt pending | kein `A_obs`, ausschließlich äußerer Fallback-Cleanup, alle späten Tokens inert, Recordfinalizer und Writer verboten. Ein dennoch eintretender Marker wäre früh und damit Verletzung/no-record. |
| portloser Fehler während begonnenem Cleanup | ein früheres `O0`, Marker und Cleanup-Ledger bestehen bereits; ein späteres Cleanup-Exchange wird unbeobachtbar oder sein Handler scheitert | die Fehlerbehandlung schließt den Port, markiert das vorhandene Cleanup-Ledger und finalisiert es portlos. Das ursprüngliche `A_obs` bleibt referenzidentisch, ohne zweiten Marker oder Freeze; ein frischer `FAIL`- oder `UNPROVEN`-Record bleibt an gültige Projection und terminale äußere Finalisierung gebunden. |

Alle sieben Klassen sind auf Foundationebene in der gebundenen 595er-Suite
geprüft. Für den künftigen Adapter bleiben die authentische Load-/Ownerbindung
und sein tatsächliches `A_obs` gesondert nachzuweisen; gespeicherte Checkpoints
dürfen weiterhin nicht promotet und Records ohne früheres authentisches
`A_obs` nicht finalisiert werden. Der unabhängige Review dieses neuen
Dokumentationsdiffs steht aus. ADR 0036 bleibt nicht annahmereif;
Adapterimplementierung und Adaptertests bleiben geschlossen.

Für einen rechtzeitig öffentlich eindeutig gebundenen `O0`-Übergang ist die
Cleanupreihenfolge total:

1. unverändertes Foundation-`O0`, unmittelbar gefolgt vom exakt einmaligen
   synchronen `D_K4`-Marker und adapterseitigem `A_obs`; andernfalls kein
   evidenzfähiger Record;
2. `Network.disable`, falls nach dem bestehenden Ledger erforderlich;
3. `Target.detachFromTarget`, falls erforderlich;
4. identitätsgebundener Pipe-/Controllerclose;
5. identitätsgebundenes Wait, einmaliges Terminate und Close für Browser,
   Vite und Gateway;
6. Ableiten der Profil-/Fragmentchecks ohne Pfaddelete; nach möglichem Create
   bleiben sie mangels handle-relativer Deleteprimitive `unproven`;
7. Site-/Environment-/Port-/Repository-/Index-/Evidence-/Residueprüfung;
8. terminaler `A_clean`- und danach `A_final`-Freeze;
9. frische Recordmaterialisierung;
10. höchstens eine sanitierte Erfüllung des öffentlichen Runpromises.

Die zwölf Foundationaktionen bleiben exakt und in dieser Reihenfolge:

```text
debugPipeClosed
  -> close-debug-pipe
browserStopped
  -> stop-browser
devServerStopped
  -> stop-dev-server
gatewayStopped
  -> stop-gateway
profileRemoved
  -> remove-profile
harnessFragmentsRemoved
  -> remove-harness-fragments
permissionSiteCacheAndServiceWorkerStateCleared
  -> clear-profile-site-state
environmentRestored
  -> restore-environment
portsFree
  -> verify-bound-ports-free
repositoryAndIndexRestored
  -> verify-repository-index-restored
historicalEvidenceHashUnchanged
  -> verify-historical-evidence-hash
observerStorageLogAndTelemetryResidueAbsent
  -> verify-observer-residue-absent
```

`cleanup-step-result/accepted` wird unmittelbar nach idempotenter
Schrittannahme erzeugt. Der getrennte terminale Zustand wird als
`cleanup-fact` über dieselbe FIFO geliefert; dieser Adapterkanal bleibt auch
nach Debug-Pipe-Close funktionsfähig. Connection-Close bestätigt weder
`Network.disable` noch Detach. Foundation-`fact:true` bleibt in der
Foundation `unproven`; nur der identitätsgebundene Adapterledger darf den
entsprechenden Finalrecordcheck neu ableiten.

Die Abbildung in das unveränderte boolesche Foundationprotokoll ist total und
exakt: Adapterzustand `failed` erzeugt `fact:false`; `confirmed` und
`unproven` erzeugen beide `fact:true`. Damit kann die Foundation einen
bestätigten Fehler negativ festhalten, aber niemals aus dem Booleschen einen
positiven Cleanupbeweis ableiten. Nur `A_final` darf ein adapterseitiges
`confirmed` in den Finalrecord übernehmen. Ein Fact nach verarbeitetem
Cleanupcap oder terminalem Dequeue wird nicht erneut zugestellt; ein bereits
FIFO-eingereihter Fact unterliegt weiterhin beim Dequeue zuerst dem rohen
Deadlineguard und bleibt danach inert, falls der Cap gewinnt.

Der äußere Cleanup verwendet dieselben Schrittknoten. `not-started` darf
einmal gestartet, `in-flight` nie doppelt gestartet und `terminal` nie
verändert werden. Gewinnt der Cleanupcap, werden offene Knoten `unproven`,
Callbacktoken invalidiert und nur noch nichtblockierende identitätsgebundene
Close-/Terminateaufrufe ausgeführt. Ein bestätigter Fehler bleibt `failed`.
Der Ledger kann daher trotz nicht bewiesener Hostressourcen endlich terminal
werden, ohne Erfolg zu erfinden.

Fehlt ein authentisch zeitgebundenes `A_obs`, führt der Adapter ausschließlich
den äußeren Ressourcen-Cleanup zu Ende, verwirft alle transienten Referenzen
und rejected das öffentliche Runpromise danach mit dem statischen
Adapterfehler; er ruft Recordfinalizer und Writer nicht auf. Der Prestartfall
rejected nach demselben statisch redigierten äußeren Fallback-Cleanup. Der
folgende Finalrecordpfad gilt nur für einen vollständig rechtzeitig gebundenen
`A_obs`-Verlauf.

Nach Foundation-Settlement prüft der Adapter zunächst das exakte siebenfeldrige
Foundationresultat und die frische tief eingefrorene 17-Felder-Projection.
Diese Projection bleibt referenzidentisch unverändert `NOT_EVIDENCE`; sie wird
weder umbenannt noch persistiert. Erst nach `A_final` entsteht ein neuer,
referenzdisjunkter `BrowserTransportDiagnosticRecord` mit exakt 17 Rootfeldern:

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

Die drei Foundation-Rootnamen `projectionType`, `candidateObserverGate` und
`candidateFinding` werden nicht übernommen. Der Finalrecord setzt stattdessen
`recordType: "browser-transport-diagnostic"` und leitet `observerGate` sowie
`finding` neu ab. Nur tatsächlich foundationeigene übrige Werte werden
defensiv und referenzdisjunkt kopiert und erneut gegen das geschlossene Schema
validiert.

Insbesondere wird `observer` frisch aufgebaut: `controllerExclusivity` stammt
nur aus dem vollständigen Owner-/Capabilityledger,
`connectionProfile` nur aus der gebundenen Pipe-/Launcheridentität und
`foundationSha256` nur aus den tatsächlich geladenen byte-owned Bytes. Alle 17
`integrityChecks` werden aus `A_final` nach Tabelle 11.1 neu materialisiert;
`interferenceObservation` wird danach ausschließlich als ihr Aggregat
`contract-visible-detected|none-contract-visible-detected|unknown` erneut
abgeleitet. Die Foundationwerte `unknown`, `null` und ihre alten
Checkresultate werden an diesen Stellen nicht kopiert.

Auch `observer.evaluationSha256` ist adapterabhängig: Nur ein im Wireledger
exakt einmal vollständig akzeptierter `Runtime.evaluate`-Frame mit dem
tatsächlich serialisierten 4.259-Byte-Expressionstring setzt den festen
Digest; bei fehlender Actual-Send-Bindung bleibt er `null`, bei Widerspruch
entsteht eine Verletzung. Die sechs `protocolOperations` werden aus dem
Actual-Wire-/Ack-Ledger `W` neu erzeugt und gegen die Foundationintent-
beziehungsweise -ack-Sicht in `F` kreuzvalidiert. Abweichende Counts,
Reihenfolge, Profile oder Results werden nicht kopiert, sondern als
`mismatch` und Integrityverletzung abgeleitet. Die übrigen Observerblätter
werden nur übernommen, wenn ihre Foundationquelle geschlossen ist und jede
vorhandene `W`, `N` oder `X`-Gegenquelle denselben Wert trägt; sonst werden sie
`unknown` oder verletzend klassifiziert.

`requestBudget` wird ebenfalls vollständig frisch aus `A_final` erzeugt. Die
neun Counter plus `sequence` werden nicht aus konstruktiven Foundation-
Platzhaltern kopiert: `defaultTransportCalls` stammt aus dem geschlossenen
Main-World-Wert und der Actual-Evaluate-/Networkkorrelation;
`retries`, `directDiagnosticFetches`, `negativeOriginRuns` und `redirectRuns`
aus dem vollständigen Source-, Capability-, Scheduler- und Launchledger;
`observerProductEndpointRequests` aus Requestowner und `N`; und
`endpointOptions`, `endpointPosts`, `endpointOtherMethods` sowie `sequence`
aus der vollständig attribuierten Network-FIFO. Eine fehlende Gegenquelle
ergibt für das betroffene Blatt `unknown`, ein authentischer Widerspruch eine
Verletzung. `zero` ist nur bei konstruktiv fehlender Capability oder
vollständigem negativem Ledger zulässig.

Ebenso wird `cleanup` frisch aufgebaut: alle 20 `checks` stammen aus der
Creationmatrix und Tabelle 11.2; `cleanup.result` wird daraus mit
`failed > unproven > confirmed` beziehungsweise `FAIL > UNPROVEN > PASS` neu
aggregiert. Die cleanupseitigen Felder von `timing.completion`, einschließlich
`cleanupFinalizeReason` und `cleanupFinalized`, stammen aus demselben
terminalen `A_final`-Ledger. Kein adapterabhängiges Blatt oder Aggregat wird in
`F` ersetzt; `F` bleibt unverändert und referenzdisjunkt.

`candidateObserverGate` und `candidateFinding` sind Eingaben in eine neue,
vollständige Ableitung, keine Autorität. Der Finalizer berechnet die fünf
möglichen Findings
`static-rejection-reproduced-after-http200`,
`original-failure-not-reproduced`, `network-signature-diverged`,
`observer-invalid` und `inconclusive` aus Projection plus Adapterledger neu.
Präzedenz ist immer:

```text
bestätigte Foundation- oder Adapterverletzung -> FAIL / observer-invalid
sonst irgendein unproven                       -> UNPROVEN / inconclusive
sonst vollständige geschlossene Ableitung     -> PASS / passendes Finding
```

Foundation-`FAIL` bleibt sticky. Die Präzedenz wird zuerst vollständig aus
FoundationProjection und Adapterledger abgeleitet; erst danach wirkt die
Evidenzfähigkeit:

```text
hardViolation
  -> FAIL / observer-invalid
else adapterEvidenceEligible !== true oder proofIncomplete
  -> UNPROVEN / inconclusive
else geschlossene PASS-Bedingungen
  -> PASS / genau eines der drei Produktfindings
```

`observer-invalid` ist bei `stimulusCount` `zero`, `unknown`, `multiple` und
`one` zulässig; kein Stimuluszustand darf eine bestätigte Verletzung
überdecken. Exakt ein Stimulus ist ausschließlich für `PASS` und die drei
Produktfindings `static-rejection-reproduced-after-http200`,
`original-failure-not-reproduced` und `network-signature-diverged`
erforderlich. Ein unbekannter oder mehrfacher Stimulus ohne bestätigte
Verletzung hält die Evidenz unvollständig und ergibt
`UNPROVEN/inconclusive`. Replay-`DIVERGED` kann nicht zu einem positiven
Reproduktionsfinding führen. Die drei Produktfindings bleiben zusätzlich an
die jeweils vollständig geschlossenen angenommenen Replay-, Network-/
Requestsequenz- und Public-Settlement-/Static-Profile-Bedingungen gebunden;
der einzelne Stimulus ersetzt keine davon.

Eine temporäre Testkopie mit `adapterEvidenceEligible:false` darf daher in der
reinen Gate-/Findingfunktion hypothetisches `PASS` erreichen, damit alle Äste
direkt geprüft werden können. Ihr echter Finalizer erhält einen bestätigten
Verstoß dennoch als `FAIL/observer-invalid`; ohne bestätigten Verstoß endet er
wegen fehlender Evidenzfähigkeit `UNPROVEN/inconclusive`. In beiden Fällen ist
`evidenceStatus:NOT_EVIDENCE`, `runtimeRecord:null`, und kein Writer darf
erreichbar sein. `adr0029OverallGate` bleibt exakt `{before:"FAIL",
after:"FAIL", unchanged:true}` und `causeStatus` exakt `CAUSE_NOT_PROVEN`.

Der Recordfinalizer besitzt keine Schreibfähigkeit. Ein späterer Writer wäre
ein getrennt zu entscheidender Owner hinter dem tief eingefrorenen Record.
Writerfehler bedeuten ausschließlich `nicht persistiert`, werden außerhalb
des Records statisch redigiert gemeldet und dürfen weder Record, Gate,
Finding noch Cleanup rückwirkend verändern. Eigene partielle Writerdateien
dürfte nur dieser Writer und nur über eine separat entschiedene
handle-relative, nicht folgende Deleteprimitive entfernen; andernfalls bliebe
auch dort Löschen verboten. Dieser ADR autorisiert weder Writer noch
Recordinstanz oder Persistenz.

### 13. Threat Model und verbotene Claims

- Same-Realm ist keine Sandbox. Captured Intrinsics verhindern weder Host-
  noch Same-Realm-Manipulation vollständig.
- Pipe, Childoutput, Environment, Registry-/OS-Angaben und Dateisystem sind
  unvertrauenswürdig und werden nur innerhalb der geschlossenen Grammatiken
  verwendet.
- Secrets, private Inhalte, Header, Bodys, Fehlergründe, Stacks, Raw-Pfade,
  PIDs, Target-, Session- und Request-IDs dürfen weder ausgegeben noch
  persistiert werden.
- Ein Pipe-Write beweist nur lokale Frameannahme, niemals Browserempfang.
- `Network.loadingFinished` beweist weder Responsebody noch interne
  Fehlerursache.
- Reproduktion beweist keine Kausalität; `CAUSE_NOT_PROVEN` bleibt immer.
- Fake-, Unit-, Parser- und Mutantentests sind keine Runtime-Evidenz.
- Frisches Profil und exakte Launchargs beweisen keine Proxy-, VPN-, Policy-,
  Extension-, Permission-, Service-Worker-, Preflight- oder Sitecachefreiheit.
- Childexit beweist keine globale Portfreiheit; Connection-Close beweist
  weder Network-disable noch Detach.
- Ein späteres Observer-`PASS` ändert ADR 0029 nicht und autorisiert weder
  Browserkomposition noch Browser-E2E oder Produktfix.

### 14. Ergebnis der harten Blockerprüfung

| Konflikt | Entscheidung ohne Regelbruch |
| --- | --- |
| 1. `browser.engineBuild` | Keine authentische Quelle innerhalb der sechs Commands; Operand 22 bleibt `not-observed/null`, Replay `unproven`. Kein `Browser.getVersion`. |
| 2. Repository/Index nach Cleanup | `B0` plus ausschließlich in-process Raw-/Manifestvergleich; kein neuer Post-Cleanup-Prozess, keine Reparatur. Fehlende Vollständigkeit bleibt `unproven`. |
| 3. `portsFree` ohne Listener | Nur passive vorgebundene OS-TCP-Quelle darf bestätigen; sonst `unproven`. Kein Bind-, Listen- oder Connecttest. |
| 4. Duplicate Keys versus Rohinspektion | Ein bounded generischer JSON-Scanner dekodiert nur Membernamen zur Dublettenprüfung und verwirft sie; keine CDP-Semantik oder Rohpersistenz. |
| 5. endlicher Residuesuchraum | Exakt begrenzte Commit-Tree-Pfade, Run-Temp-, Profil-, Harness-, Modul- und Schreiballowlist; Untracked-/Ignore-Abwesenheit und alles außerhalb bleiben unbewiesen. |
| 6. Profil-/Connection-Provenienz | Eigene Create-, Arg-, Handle- und Pipeledger belegen nur diese Identitäten; effektive Policy-/Netz-/Storewerte bleiben ohne eigene Quelle `unproven`. |
| 7. Adapterattestierung in Schema 1 | Kein Feld wird überladen. Private Selbstprüfung demotiert bei Drift; ohne unabhängige Bootstrapwurzel bleibt Adapterattestierung `unproven`. |
| 8. Writerfehler nach Cleanup | Writer strikt nach tief gefrorenem Record; Fehler ändert ihn nie und bedeutet nur `nicht persistiert`. |
| 9. Liveness von Writes/Cleanup | Send-Ack linearisiert an vollständiger lokaler `write`-Annahme, Cleanup-Ack an Annahme; Callbacks sind FIFO-Fakten und blockieren den bestehenden Cap nicht. OS-/Eventloop-Liveness wird nicht behauptet. |
| 10. tatsächlich geladene Foundationbytes | Byte-owned `vm.SourceTextModule` aus dem einmaligen Commit-geprüften Snapshot mit kanonischer File-URL, null Imports und Handle-/Pfadnachprüfung; Standardimport plus Vorher/Nachherhash ist verboten. |
| 11. Windows-sichere Profil-/Fragmentlöschung | Node Core besitzt keine handle-relative, nicht folgende Deleteprimitive. Nach möglichem Create wird nicht pfadbasiert gelöscht; der Check bleibt `unproven`. Ein sichtbarer Lauf bleibt bis zu einer getrennten objektgebundenen Capabilityentscheidung blockiert. |
| 12. Chrome-/Vite-/Gatewaynachfahren | Root-Childhandles sind kein Windows-Prozessbaumbeweis. Ohne getrennten Job-/Tree-Owner bleiben Stopchecks nach möglichem Spawn `unproven`; freie PID-/Prozessnamen-Kills sind verboten. |
| 13. Node-ExperimentalWarning und Adapteroutput | Exaktes `--no-warnings` verhindert den standardmäßigen `SourceTextModule`-Warnwrite, belegt aber keine allgemeine Stille. Ohne unabhängigen Owner von Adapter-stdout/-stderr bleibt `observerDiagnosticDuringRunOutputAbsent` `unproven`. |
| 14. authentischer `A_obs`-Zeitpunkt | Die Foundationabhängigkeit `D_K4` ist durch den angenommenen ADR 0037, netzwerkfreie Implementierung, 595/595 Tests, gebundenen unabhängigen Implementierungsreview und Jans Featurecommit erfüllt. Der zentrale synchrone Marker folgt nur auf erfolgreich gefrorenes und gebundenes `O0`, auch nach Exchange-Portschluss und vor jedem Cleanup. Der künftige Adapter muss daraus mit authentischer Load-/Ownerbindung sein eigenes `A_obs` bilden; dieser Nachweis fehlt weiterhin. Cancelcheckpointpromotion, Spiegelmaschine und Promisezaun bleiben verboten; kein Injektivitäts- oder Notwendigkeitsbeweis wird behauptet. |
| 15. virtueller produktiver Adapterpfad | Die zwei disjunkten bytegeprüften Vier-Export-Profile aus Abschnitt 1 bleiben `adapterEvidenceEligible:false`. Der frühere begrenzte R1–R4-Dokumentreview prüfte ihre damalige K2-Konstruktion mit PASS, ausschließlich an der im Kontext gebundenen alten ADR-0036-Fassung. Der Review dieser neuen Port-/Load-/Fixtureabgleichsfassung steht aus. Tatsächliche Adapter-, Fixture-, Owner-/Generationguard- und Poisonmutantentests wurden nicht ausgeführt; sie folgen erst nach eigener Entscheidung und Autorisierung. |

Die Punkte 1 bis 13 und 15 erzwingen keine Änderung der Foundation-API, des
Schema-1-Vertrags, einer Kardinalität, der sechs CDP-Commands oder einer
angenommenen Regel. Ihre
bewusst fehlenden Quellen werden nicht positiv erfunden, sondern bleiben
`UNPROVEN`; die Punkte 11 bis 13 blockieren außerdem jeden sichtbaren
Prozess-/Profil-Lauf. Punkt 14 ist auf Foundationebene erfüllt; die
adapterseitige Beweisführung bleibt zukünftig. Der Foundationabgleich dieser
ADR-0036-Fassung ist dokumentiert, ihr unabhängiger Dokumentreview steht aus.
Ausgeführte Adaptertests werden nicht zur Voraussetzung der ihnen zeitlich
vorausgehenden Adapterentscheidung erklärt. ADR 0036 bleibt vorgeschlagen und
nicht annahmereif, ohne Implementierungsfreigabe. Würde `sent` stattdessen Callback-/OS-Abschluss
bedeuten oder ein Standardimport als ABA-sicher gelten sollen, wäre auch
dieser übrige Vertrag nicht ohne verbotenen zweiten Cap beziehungsweise
unbewiesene Provenienz lösbar.

### 15. Verpflichtende spätere netzwerkfreie Testmatrix

Ein getrennt autorisierter Implementierungsslice müsste ausschließlich mit
virtuellen Clocks/Schedulern, Fake-Pipes, Fake-Prozessen und explizit
begrenzten temporären Testpfaden mindestens nachweisen:

Der tatsächlich produktiv verwendete Owner muss dabei die nach Abschnitt 2
authentisch geladenen neuen Foundationbytes mit exakt beiden erforderlichen
Portrollen verdrahten. Nur sein eigener synchroner Callback darf `A_obs`
binden. Raw-Fixture, öffentlicher Factorypfad und direkter Ownerpfad verwenden
diese gleiche Komposition; weder fertiges `A_obs` noch Foundation-Acks dürfen
von der Fixture geliefert werden. Die beiden Adapterprofile bleiben bei je
vier Exports; der getrennte Foundation-Konformitätszugang bleibt bei fünf.

Die praktische K2-Aufruffolge ist dabei nicht frei wählbar:

1. **Pending Dequeue:** Nach virtueller Readiness, Setupclock/-cap und drei
   ausschließlich als Raw-Pipebytes zugestellten CDP-Responses erreicht der
   echte Owner eine leere FIFO mit genau einem `activeExchange` und genau einem
   `waitingDequeueResolver`; seit dem Dequeue sind null Clockreads erfolgt.
   Genau ein virtueller `dispatch({kind:"pipe-chunk",...})`-Turn mit einem
   Raw-`Uint8Array` löst den gebundenen Rawsink aus; der produktive Owner erzeugt
   daraus den Producerturn, der referenzidentisch diesen Resolver einmal
   schließt. Erst der folgende Foundation-
   Clockintent liest phasengenau genau einmal; ein zweiter Resolver oder eine
   direkt von der Fixture erzeugte Ack-/Envelopeform ist verboten.
2. **Cap-vs-Event / Adapterintegration:** Ein ausschließlich als rohes
   `Uint8Array` zugestelltes Frame durchläuft produktiv Scanner, einmaligen
   nativen Parser, Post-Parse-Projektion und Producer-Eventgrenze. Erst der
   daraus entstandene gewöhnliche, tief eingefrorene Own-Data-Graph erhält
   seine FIFO-Sequenz und wird ohne Clockread an die Foundation geliefert. Das
   folgende gemeinsame Clocksample liefert bei
   `m_setup:100/deadline:6100` getrennt `6099`, `6100` und `6101`, beim Cleanup
   relativ zu dessen absoluter Deadline exakt `deadline-1`, `deadline` und
   `deadline+1`. Nur bei `deadline-1` reflektiert die Foundation den Graph; bei
   Gleichheit und Überschreitung gewinnt Setup beziehungsweise Cleanup, und der
   Adapter gibt die dem dequeueten Frame zugerechneten Materialbytes frei.
   Dieser unveränderte Raw-JSON-Pfad erzeugt konstruktiv weder Getter noch
   Proxy-Envelopes. Capture schließt in derselben produktiven FIFO
   ausschließlich durch das korrelierte `cap-fired`-Producerereignis, nie durch
   das numerische Sample.
3. **Evaluate-Send/Capturestart:** Capture ist zunächst `pending`, ohne Timer
   oder Ack. Der echte Wirepfad muss das vollständige Frame einmal lokal
   annehmen, danach den virtuellen Capturetimer armen, Wire- und Capledger in
   einem Commit binden und erst dann
   `sent-and-capture-cap-started` erfüllen. Write-Throw/Teilwrite erzeugen
   weder Timer noch Ack; Scheduler-Throw nach Write ergibt
   `activation-unknown` und Cleanup. Eigene Mutanten halten die Fenster
   Timer-vor-Commit und Commit-vor-Ack offen und müssen sterben.
4. **Partieller Cleanup:** Virtuell startet Vite erfolgreich, Gateway wirft
   nach `may-have-started`, Browser wird nie versucht, ein Temproot ist erzeugt
   und Profilcreate nur `may-exist`. Nur gebundene Handles erhalten Wait/
   Terminate/Close; ein Ressourcenabschluss bleibt pending, bis der Cleanupcap
   feuert. Browser bleibt `never-attempted/confirmed`, Vite/Gateway ohne
   Treeowner und Pfade ohne handle-relative Deleteprimitive bleiben
   `unproven`, kein `rm|rmdir|unlink` wird aufgerufen, bestätigte Fehler bleiben
   `failed`, Finalisierung geschieht genau einmal und Writercount bleibt null.

Jede dieser Folgen läuft sowohl direkt über den exportierten produktiven Owner
als auch mindestens einmal über öffentliche Factory plus einmaligen Installer
des `virtual-runtime-conformance`-Profils. Eine Fixture darf nur
Low-Level-Ereignisse dispatchen; Parser, FIFO, Ack-, Cap-, Ressourcen- und
Finalizerübergänge müssen ausnahmslos produktiv entstehen.

Der adversariale Nachweis vor Foundationreflection bleibt getrennt auf der
Foundation-Testebene. Der vorhandene Test
`entscheidet Setup- und Cleanup-Caps unterhalb, exakt und oberhalb roh vor
Reflection` injiziert gewöhnliche Envelopes mit werfendem `kind`-Accessor über
den Foundation-Effectport und bestätigt für Setup bei `6100/6101` sowie für
Cleanup bei `deadline/deadline+1` jeweils Gettercount null und den passenden
Capabschluss. Er misst keine Descriptor- oder Proxytraps: Ein
`Object.getOwnPropertyDescriptor` auf einem gewöhnlichen Accessor ruft dessen
Getter nicht auf. `bindet den zentralen Join vor Profilreflexion, Intent, ID,
Ledger und Capability` hält `get`, `getOwnPropertyDescriptor`,
`getPrototypeOf` und `ownKeys` eines Proxyprofils am Pending-Join unerreicht.
`begrenzt Dequeues bei 128 und trennt den 129. Wert vor und nach O0` hält einen
`getPrototypeOf`-Proxytrap am Dequeuecountguard bei null. Diese Proxytests
betreffen andere Guards, nicht die Setup-/Cleanupdeadline.

Die inzwischen implementierte ADR-0037-Suite schließt diese konkrete
Foundation-Nachweislücke mit
`beweist ADR-0037-Deadlinegrenzen mit vier getrennten Envelope-Proxytraps und kausalen Mutanten`.
Setup und Cleanup werden jeweils bei `deadline-1`, `deadline` und
`deadline+1` geprüft. Bei Gleichheit und Überschreitung bleiben `get`,
`getPrototypeOf`, `ownKeys` und `getOwnPropertyDescriptor` getrennt null.
Unterhalb bestätigt die positive Kontrolle erreichbare Descriptorreflection;
der freie `get`-Read bleibt auch dort null. Vier kausale Mutanten werden
erkannt: je Phase der Wechsel von `>=` zu `>` und Envelope-Reflection vor dem
Deadlineguard. Das ist Teil der aktuellen 595/595-Foundationtests, nicht der
historischen 422er-Suite und kein ausgeführter Raw-Adapter-Wiringnachweis.

Dieselbe Suite erkennt 27 Notificationmutanten, erhält alle 18 Joinfälle und
elf Joinmutanten sowie das endliche Drei-Microtask-Präfix zusammen mit dem
strukturellen Pending-Oracle. Der endliche Präfix allein beweist keine
empirisch unendliche Zeit. Diese Foundationnachweise ersetzen weder Scanner,
Parser, Producer, FIFO noch reales oder virtuelles Adapter-Cap-Wiring.
Capture bleibt ausschließlich am korrelierten FIFO-`cap-fired` geschlossen.
Dieser Dokumentationsslice ändert oder ergänzt keinen Test.

- Import- und Factoryinaktivität, genau einen Export, Arity `0`, exakte API,
  Frische, Deep Freeze, Ownerverbrauch und alle Wiederaufrufe;
- statische Redaction sowie Abwesenheit callerlieferbarer Optionen,
  `runBinding`-, Gate-, Digest-, Provenienz-, Cleanup- und Capabilityseams;
- alle sieben Intents, alle sechs Fulfillmenttypen, alle vier Dequeueevents,
  exakte IDs/Keyfolgen und unzulässige Zustände;
- lokale native Promiseisolation gegen Thenables, fremde Realms,
  Promise-Subklassen, own keys und Seam-Promises;
- pre-settled, same-turn-settled, delayed und forever-pending, genau einen
  offenen Exchange/Resolver sowie den ersten terminalen Join;
- Raw-Pipe-Teilframes, mehrere Frames je Chunk, Split-UTF-8, führende BOM,
  unescaped/escaped U+FEFF, invalides UTF-8, leere Frames, sauberes EOF,
  unvollständiges EOF, Setup- und Cleanupcap jeweils an `cap-1`, `cap`,
  `cap+1` sowie Capture ausschließlich als korreliertes FIFO-`cap-fired` ohne
  numerische Sampleentscheidung;
- vollständige JSON-Grammatik, Duplicate Keys auf jeder Tiefe,
  escape-äquivalente Namen, Surrogat-/Escapegrenzen, Zahlengrammatik, exakt
  einen nativen Parse ohne Reviver und Entfernung aller Scannerreferenzen;
- Top-Level-Response-/Eventformen sowie Ablehnung von Extras, Mischformen,
  Arrays, Primitiven und nicht endlichen Zahlen;
- totale FIFO für Pipe-, Timer-, Close- und Cleanup-Produzenten,
  Backpressure, Queuebytes/-einträge/-messages, Produzentenrennen und
  fail-closed Overflow ohne `connection-closed`-Maskierung;
- Responses vor Ack, doppelte `Target.getTargets`-Responses und unkorrelierte
  Endpoint-`Network.responseReceived`-Events ohne Vorfilterung;
- alle sechs Commandprofile, Session-/Capture-Arm-Bindungen und jedes
  verbotene siebte oder abweichende Command;
- synchronen Write-Throw, volle Annahme mit `true` und `false`, gemeldeten
  Teilwrite, Backpressure/`drain`, Callbackerfolg, asynchronen Fehler,
  Write-vs-Close und nie eintretenden Callback;
- alle Evaluate-Fenster vor Write, nach Write/vor Timer, nach Timer/vor
  Ledgercommit, nach Commit/vor Ack und nach Ack; nur der vollständige Commit
  darf `sent-and-capture-cap-started` liefern;
- den Hash des tatsächlich gesendeten primitiven Expressionstrings und Drift
  durch Byte-, Encoding-, Normalisierungs- oder zweite Stringquelle;
- virtuelle `<`, `=` und `>`-Deadlinefälle für Setup und Cleanup, darunter
  bei `m_setup:100/deadline:6100` exakt `6099`, `6100`, `6101` sowie für die
  absolute Cleanupdeadline jeweils `deadline-1`, `deadline`, `deadline+1`;
  Clockrücklauf, Throw, negativen Wert, `NaN`, Infinity, Safe-Integer-/
  Additionsüberlauf und keinerlei 10-ms-Rundung vor Capentscheidungen;
  `observation-dequeue` muss null Clockreads ausführen, die Foundation den
  gelieferten Envelope bis zum folgenden phasengenauen Sample unreflektiert
  halten und die Bearbeitung des `controller-clock-sample` exakt einmal lesen;
  derselbe primitive Wert muss Foundationresultat und Adapterledger speisen;
  insbesondere muss ein bei Setup- oder Cleanup-Sample erreichtes
  `>=`-Deadline-Ergebnis den FIFO-älteren, aus Rawbytes produktiv geparsten
  gewöhnlichen Own-Data-Graphen ungelesen schlagen und dessen Adaptermaterial
  freigeben. Der historische Gettertest bestätigt allein null Getteraufrufe;
  die aktuelle ADR-0037-Suite bestätigt getrennt null für alle vier
  Deadline-Envelope-Traps bei `=` und `>`, ohne dieses Adapter-Wiring zu beweisen;
  während ein Capture-Sample an oder über einem rechnerischen Zeitpunkt ohne
  `cap-fired` nie numerisch schließt; der 129. Dequeue-Aufruf muss vor Entnahme,
  Resolverinstallation und Clockread rejecten;
- Cancel-vs-Fire, bereits eingereihte stale Callbacks, Generationstausch,
  genau einen Cancel, fehlenden Timerreset und totale Producerreihenfolge;
- jede partielle Ressourcenkombination vor und nach `attemptStarted`, falsche
  Child-/Handle-/Parentidentität, Reparse-/Junction-/Symlinktausch,
  Readinessmehrdeutigkeit, Outputcap, Wait-/Terminate-/Close- und
  Cleanupcapwege; die vollständige Creationmatrix muss nie versucht,
  möglicherweise versucht, sicher gebunden terminal und sicher gebunden
  verblieben unterscheiden;
- exakte Adapter-`execArgv`-Reihenfolge einschließlich `--no-warnings`, kein
  standardmäßiger VM-ExperimentalWarning-Write und dennoch keine positive
  Adapteroutput-Ableitung ohne unabhängigen Streamowner;
- die totale Cleanup-Fact-Abbildung `failed -> false` und
  `confirmed|unproven -> true`, ohne positive Promotion in der Foundation,
  einschließlich Cap-vor-Fact und late-Fact-inert;
- exakte Gateway-/Vite-Readinessbytes, zweites Vorkommen, ANSI, CRLF,
  Teilchunks und Fenstergrenze; Root-Childexit muss ohne Job-/Tree-Owner
  `unproven` bleiben, und nach möglichem Pfadcreate darf kein `rm`, `rmdir`
  oder `unlink` aufgerufen werden;
- alle 59 Replayzeilen mit `observed`, `not-observed`, `ambiguous`, Match und
  Mismatch; insbesondere `repository.state`, die nicht verfügbaren OS-Felder,
  Chrome-Versionsfelder, Operanden 37 bis 40 und `browser.engineBuild` immer
  unbewiesen sowie alle Frisches-Profil-ist-kein-Beweis-Zeilen; die exakten
  Projektionen `win32 -> windows` und `v24.19.0 -> 24.19.0` müssen Präfix-,
  Suffix- und Grammatikmutanten ablehnen; für Operand 53 müssen der rohe
  Child-Environmentwert Länge 4/[56,55,56,55], die allein dort erzeugte
  Vertragsprojektion Länge 6/[34,56,55,56,55,34], Raw-vs-Projection,
  bereits gequoteter Input, Whitespace, falscher Typ und eine geänderte Ziffer
  getrennt geprüft werden, ohne Double-Wrap oder Normalisierung;
- alle 17 Integritychecks und alle 20 Cleanupchecks jeweils positiv, negativ
  und unbewiesen aus der in den Tabellen genannten Ressourcenidentität;
- falschen Commit, Git-Blobdrift, Pfad-ABA, Actual-loaded-Byteabweichung,
  Realpath-/Reparse-/Linktausch, Adapter-Selbstattestierungsgrenze,
  Evaluationdrift und historischen Evidencehashdrift;
- in-process Repository-/Index-Postvergleich ohne neuen Prozess, passive
  Portquelle versus fehlende Quelle und endlichen Residuesuchraum;
- Redaction und Entfernung aller Rawbytes, Texte, Parsed-Graphen, Childoutputs,
  IDs, Fehlergründe, Stacks und Pfade aus erreichbaren Ergebnisgraphen;
- die sieben öffentlichen O0-Fallklassen aus Abschnitt 12 mit exakt den dort
  sichtbaren Intentfolgen und dem neuen synchronen Marker: kein Freeze vor
  Setup-ready-/Rejection-Quieszenz-Cancel, bei unbeobachtbarem Cancel zuerst
  Portschluss und erst danach `O0`, exakt ein Marker unmittelbar nach `O0` und
  vor Setup-/Capture-Old-Cap-Scan, Cleanup-Ledger, `cleanup-origin` oder
  portloser Finalisierung; Prestart ohne `O0`/Marker und portloser
  Cleanupfehler mit bestehendem `O0`/Ledger ohne zweiten Freeze; die
  Foundationseite ist durch ADR 0037 geprüft, die hier geforderten
  Adapterintegrationstests bleiben eine zukünftige Sollmatrix ohne Freigabe;
- `A_obs` vor jeder Wirkung nur dort, wo `O0` öffentlich eindeutig und
  rechtzeitig bindbar ist, unverändertes `O0`, `A_final` erst nach terminalem
  Cleanup, frische exakt 17-feldrige Recordform und referenzdisjunkte
  Neuberechnung; der Mutant, der Foundationplatzhalter für
  `controllerExclusivity`, `connectionProfile`, `foundationSha256`,
  `evaluationSha256`, Protocol Operations, Requestbudget,
  Integrity-/Cleanupaggregate oder Gate/Finding kopiert, muss sterben;
- beide exakt disjunkten Vier-Export-Kopieprofile aus Abschnitt 1, jeden
  privaten Bindingnamen samt Arity, Produktionsverwendung, den eindeutigen
  Evidence- und Capabilityselector-Bindepunkt sowie Demotion nur nach der
  Verletzungsentscheidung; reine Ableitung darf hypothetisches `PASS` prüfen,
  Testfinalisierung muss bei bestätigter Verletzung `FAIL`, sonst höchstens
  `UNPROVEN`, immer `NOT_EVIDENCE`, `runtimeRecord:null` und Writercount null
  liefern;
- `FAIL > UNPROVEN > PASS`, sticky Foundation-`FAIL`, `observer-invalid` bei
  `zero|unknown|multiple|one` Stimuli, genau einen Stimulus ausschließlich für
  PASS/die drei Produktfindings, alle fünf Findings und unverändertes
  ADR-0029-Gate; insbesondere müssen erster `Target.getTargets`-Sendreject,
  Evaluate-Sendreject oder malformed Evaluate-Send-Ack sowie ein später
  fehlgeschlagener Cleanup nach genau einem Stimulus `FAIL/observer-invalid`
  bleiben;
- Writertrennung: Fehler vor, während und nach einer späteren atomaren
  Persistenz darf den finalen Record nicht mutieren.

Disjunkte Mutanten müssen mindestens Umgehung des produktiven Owners,
Ignorieren seines Capabilityarguments, Null-/Doppelconsume des virtuellen
Selectors, Rückfall auf reale Nodefähigkeiten, direkt von der Fixture erzeugte
Effect-Acks, Parserumgehung der produktiven Eventgrenze, eine testlokale
Ersatzmaschine, Ack-before-write, freien Caller-Digest,
`true -> confirmed`, Queue-Leerfulfillment, zweiten Resolver, Timerreset,
zweiten Cancel sowie die Adaptermutanten `DEQUEUE_CLOCK_READ_EARLY`,
`CLOCK_SAMPLE_DOUBLE`, `CLOCK_SAMPLE_LEDGER_SPLIT`,
`FIFO_OLDER_PARSED_EVENT_BEATS_REACHED_CAP`, `RAW_PIPE_BYPASS`,
`PRODUCER_EVENT_BYPASS`, `DEQUEUED_MATERIAL_RELEASE_OMITTED` und
`CAPTURE_NUMERIC_CLOSE_WITHOUT_CAP_FIRED` töten. Fremde, späte und doppelte
Producerereignisse müssen außerdem am Owner-/Handle-/Generationguard sterben
oder nach bereits terminaler Generation inert bleiben. Ein Proxy-am-Deadline-
Mutant und die Änderung des Foundationguards von `>=` zu `>` gehören dagegen
zur getrennten Foundation-Testebene; eine grüne Foundation-Suite ersetzt
keinen Adapter-Wiringnachweis. Weitere Mutanten betreffen `O0`-Mutation,
rückwirkendes `A_obs`, fehlenden, frühen, doppelten oder nach Cleanup
aufgerufenen `observationClosed`-Marker, einen Marker erst im Old-Cap-Exchange
oder Runsettlement, vorzeitige Recordmaterialisierung, Demotion vor
Verletzungsableitung, Ein-Stimulus-Zwang für `observer-invalid`, direkte
Übernahme des rohen Vier-Codeunit-Portwerts in Operand 53, Double-Wrap,
Portziffernormalisierung, Standardimport-statt-byte-owned-Load, entfernte
Duplicate-Key-Prüfung, Response-vor-Ack-Auslieferung,
Connection-Close-Maskierung, FIFO-vor-Setup-/Cleanupdeadline,
Root-Exit-als-Tree-Erfolg und Check-before-path-Delete töten.

Die Tests dürfen keinen Browser, CDP, Listener, Port, Netzwerkrequest,
Gateway, Vite, echten Timer, echte Clock oder Diagnoselauf starten. Fake- und
Mutantenergebnisse bleiben durch `adapterEvidenceEligible:false`
`NOT_EVIDENCE`.

## Konsequenzen

Der vorliegende Vorschlag arbeitet K2 mit einem ausführbaren virtuellen Zugang
zur selben produktiven Adapterlogik und einer konstruktiven Sperre der
Ableitungskopie aus; der frühere R1–R4-Dokumentreview bleibt auf seine damaligen
Bytes begrenzt, der Review dieser Abgleichsfassung steht aus. Pipe-Framing,
JSON-Dubletten, FIFO, Acks, Caps, Ressourcen,
Provenienz und Finalrecord sind eingegrenzt. Für K4 ist belegt, dass der
beschlossene bounded syntaktische Tracker ohne die ADR-0037-Notification
keinen ausdrücklichen authentischen Pre-Cleanup-Marker besitzt und ein später Promisezaun bei Old-Cap- und
portlosem Cleanup zu spät kommt. `D_K4` ist dafür die unter den bestehenden
Architekturgrenzen gewählte minimale eindeutige Phasenbindung, nicht der Beweis
einer nicht injektiven Vollhistorie oder informationstheoretischen
Notwendigkeit. Diese Foundationabhängigkeit ist inzwischen angenommen,
implementiert, unabhängig geprüft und unverändert committet. Der Nachweis
eines authentischen adapterseitigen `A_obs` bleibt getrennt offen.

Die konservative Grenze verhindert zugleich ein vorgetäuschtes positives
Ergebnis. `repository.state`, mehrere OS-/Chrome-/Kontextoperanden,
`browser.engineBuild`, globale Portfreiheit, effektive Browser-Policy-/Netz-/
Storewerte, Prozessnachfahren, Pfadlöschung und unabhängige
Adapterattestierung bleiben ohne neue authentische Quellen `UNPROVEN`. Damit
ist ein späterer `PASS` nicht zugesagt.

Dieser vorgeschlagene ADR schafft keine Runtimefähigkeit und ist nicht
annahmereif. Als Nächstes folgt ausschließlich der unabhängige Review dieses
Dokumentationsdiffs; Jans spätere ausdrückliche ADR-0036-Annahme und eine
gesonderte Adapterimplementierungs- und Testfreigabe bleiben weitere Schritte.
Jeder sichtbare
Diagnoselauf bleibt zusätzlich durch die übrigen Laufblocker und eine eigene
nachgelagerte Autorisierung geschlossen. Ein Writer und Persistenz benötigen
weiterhin eine eigene Entscheidung.

## Erwogene Alternativen

### Standard-ESM-Import mit Vorher-/Nachherhash

Verworfen. Zwischen Read und Import ist ein ABA-Austausch möglich. Nur der
byte-owned Load bindet die tatsächlich ausgeführten Bytes.

### Send-Ack erst im Writecallback

Verworfen. Besonders beim Evaluate existiert vor dem atomaren Send-/Capstart
kein aktiver Capturetimer. Ein nie eintretender Callback würde einen zweiten
Timer oder eine Foundationänderung erzwingen. Lokale vollständige
`write`-Annahme ist die engere ehrliche Ackgrenze.

### Positive Ableitung aus Childexit, frischem Profil oder `cleanup-fact:true`

Verworfen. Diese Werte beweisen weder globale Portfreiheit noch effektive
Policy-/Netz-/Storefreiheit oder erfolgreichen identitätsgebundenen Cleanup.

### Siebtes CDP-Command für die Browserengine

Verworfen. `Browser.getVersion` würde die unveränderliche Sechs-Command-
Allowlist verletzen. Der Operand bleibt ehrlich unbewiesen.

### Adapterdigest in einem bestehenden Recordfeld

Verworfen. Das würde Schema 1 semantisch überladen und Selbstattestierung als
unabhängige Provenienz darstellen.

### Adapterinterne Auswahl gespeicherter Cancelcheckpoints

Verworfen für den beschlossenen bounded syntaktischen Tracker. Das Speichern
selbst wäre begrenzt möglich; ein einzelnes Cancelpayload und die spätere
`confirmed-violation`-Projection authentisieren aber keinen Pre-Cleanup-
Zeitpunkt. Weder Injektivität noch Nicht-Injektivität der vollständigen
öffentlichen Historie wird daraus abgeleitet. Eine Auswahl außerhalb der
geschlossenen syntaktischen Regeln müsste private Foundationsemantik
reproduzieren und könnte trotz Quellenhash gemeinsam divergieren.

### Vollständige semantische Foundation-Spiegelmaschine

Verworfen zugunsten der gewählten kleineren `D_K4`-Änderung. Sie müsste Zustände, CDP-Grammatik,
Descriptorfehler, Caps, Closegründe und alle Übergänge bis 128 Dequeues erneut
implementieren, separat ressourcenbegrenzen, an Foundationbytes binden und mit
Divergenzmutanten prüfen. Das wäre größer und riskanter als das eine monotone
öffentliche Übergangssignal.

### Achter O0-Intent, Cancelpayloadbit oder neue Clock-/Pollingprobe

Verworfen unter den bestehenden Architekturgrenzen. Ein eigener Intent änderte eine Kardinalität; ein Feld nur am Cancel
käme für portlose Terminalisierung zu spät oder gar nicht. Clock, Timer,
Polling, CDP-Command oder Request würden Beobachtung und Runtime erweitern.
Die synchrone argumentlose Notification am zentralen `O0`-Callsite ist die
kleinere totale Änderung.

### Promise-Reaktionszaun nach einem Exchange

Verworfen. Die atomare Foundationreaktion kann den Old-Cap bereits anfordern
und die Adapterwirkung linearisiert haben; portloser Foundationcleanup kann
bereits beendet sein. Der Zaun ist damit kein Pre-Cleanup-Zeitbeleg.

## Bedingungen für eine Neubewertung

Die Foundationentscheidung und ihre getrennte Implementierung samt unabhängigem
Review und Featurecommit sind gemäß der im Kontext gebundenen Kette erfüllt.
Abschnitte 2, 3, 10, 12 und 15 gleichen die aktiven Load-, Rohhash-, Port- und
Testverträge an diese unveränderten ADR-0037-Bytes an. Als Nächstes folgt
ausschließlich der unabhängige Review dieses neuen Dokumentationsdiffs.
Dieser Vorschlag ist dessen Übergabe und beansprucht kein eigenes
Review-PASS oder automatische Annahmereife. Eine
ausdrückliche spätere Statuspromotion durch Jan könnte erst danach einen
eigenen netzwerkfreien Adapterimplementierungs- und Testslice öffnen.
Ein sichtbarer Prozess-/Profil-Diagnoselauf dürfte erst nach dessen
identitätsgebundener Prüfung und einer getrennt angenommenen Lösung für
handlegebundene Windows-Prozessbaum- und Pfadcleanupfähigkeit separat erwogen
werden.

Bis dahin bleiben ADR 0035 mit der gezielten Ergänzung durch ADR 0037 die
aktuelle angenommene Foundationgrundlage,
ADR 0029 und sein historischer Evidence-Record unverändert,
`overallGate: FAIL`, `causeStatus: CAUSE_NOT_PROVEN`, die Foundation
`NOT_EVIDENCE` und Browserkomposition sowie Browser-E2E geschlossen.
