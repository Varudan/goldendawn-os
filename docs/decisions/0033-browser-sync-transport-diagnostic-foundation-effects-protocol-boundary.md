# ADR 0033 – BrowserSyncTransport Diagnostic Foundation Effects Protocol Boundary

## Status

Ersetzt durch [ADR 0034](0034-browser-sync-transport-diagnostic-foundation-grammar-derivation-and-testability-boundary.md) – 2026-09-04

## Kontext

[ADR 0032](0032-browser-sync-transport-diagnostic-determinism-boundary.md)
totalisiert den späteren Diagnoseablauf, lässt aber die ausführbare Grenze
zwischen der reinen Zustandsmaschine und ihren notwendigen Effekten noch
unterbestimmt. Insbesondere fehlten eine geschlossene Portgrammatik, die
terminale Behandlung früher Port- und Clockfehler, eine atomare Kopplung des
Evaluate-Sends an den Capturecap, die genaue Herkunft sämtlicher Replaywerte
und die Trennung zwischen einer reinen Foundationprojektion und einem echten
Runtime-Evidence-Record.

ADR 0033 ersetzt ADR 0032 formal und übernimmt alle dortigen Regeln, die diese
Entscheidung nicht ausdrücklich korrigiert. ADR 0032 bleibt ebenso wie die
durch sie abgelösten ADR 0030 und ADR 0031 als historische Entscheidungsebene
erhalten. ADR 0029, dessen historischer Evidence-Record und dessen
`overallGate: FAIL` werden nicht geändert. `causeStatus` bleibt ausnahmslos
`CAUSE_NOT_PROVEN`.

Dieser Slice dokumentiert ausschließlich. Die Diagnosefoundation ist weiterhin
nicht implementiert; Foundationcode und Tests entstehen erst im getrennten
netzwerkfreien Implementierungsslice. Diese Entscheidung implementiert oder
autorisiert weder Adapter, Parser, Queue, Timer, Launcher noch Recordwriter und
autorisiert keinen Browser-, CDP-, Netzwerk-, Gateway-, Vite- oder
Diagnoselauf.

## Entscheidung

### 1. Einzige öffentliche API und Referenzgrenze

Der spätere Foundationpfad ist ausschließlich:

```text
scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js
```

Sein einziger Export ist:

```js
createBrowserSyncTransportRuntimeDiagnosticObserver({
  effectPort,
  runBinding,
})
```

Die Factory besitzt `length === 1`, verlangt exakt ein Argument, besitzt
keinen Default und akzeptiert als geschlossene Optionsform ausschließlich die
Own-Keys `effectPort`, `runBinding` in dieser Reihenfolge. `effectPort` besitzt
ausschließlich den Own-Key `exchange`. Ungültige Factoryeingaben werfen
ausschließlich:

```text
TypeError("invalidBrowserSyncTransportRuntimeDiagnosticObserverDependencies")
```

Dieser eine statische Dependency-`TypeError` ist der ausschließlich synchrone
Fehlerkanal für Factory-Arity, Options-, `effectPort`-, `exchange`-,
`runBinding`-, Reflection-, Kopier-, Projektions- und Freezefehler während der
Factorykonstruktion. Dann entstehen weder API noch öffentliches Promise,
FoundationResult oder Projection. Nach erfolgreich zurückgegebener Factory
liefert ausnahmslos jeder kontrollierte `run()`-Pfad ein lokales Promise und
wirft nicht synchron; falsche Run-Arity und Nicht-Ownerpfade werden darin
statisch erfüllt.

Factoryoptions, `effectPort`, `runBinding` und jeder seiner geschlossenen
Nachfahren werden genau einmal descriptorbasiert geprüft. Nur zulässige
primitive Blätter werden aus den dabei gecachten Descriptoren in frische
interne Records kopiert. Die Factory führt keinen Effekt aus. Jede erfolgreiche
Factory liefert eine frische gewöhnliche, geschlossene und tief eingefrorene
API exakt `{ run }`.

`run.length === 0`; `run` akzeptiert keine Argumente und verwendet privat
exakt:

```text
runState = unused | active | terminal
activeRunToken = primitive 1 | null
```

Der erste Aufruf wechselt synchron und vor jeder Arityprüfung von `unused` zu
`active`, setzt `activeRunToken` auf `1` und ist alleiniger Owner. Bei gültiger
Arity erfolgt synchron und für reentrante Aufrufe nicht beobachtbar der
Transfer:

```text
capturedExchange -> activeExchange
capturedExchange := null
```

Es existiert zu jedem Zeitpunkt genau ein ownerzugänglicher persistenter
Capabilityslot. Der unvermeidliche kurzzeitige Evaluationstackwert beim
Transfer wird nicht gespeichert und ist kein zweiter Slot. Bei falscher Arity
des ersten Aufrufs wird `capturedExchange` gelöscht, `activeRunToken` auf
`null` gesetzt und `runState` zu `terminal`; ohne Exchange wird das statische
Fehlerresultat erfüllt.

Zweit-, Parallel- und reentrante Aufrufe sind Nicht-Owner. Jeder erhält ein
eigenes lokal erzeugtes, statisch erfülltes Fehler-Promise. Solche Aufrufe
lesen, verwenden, ersetzen oder löschen weder `capturedExchange` noch
`activeExchange`, verändern weder Ownerzustand noch Intent- oder
Commandzähler und starten weder Effekt noch Cleanup. Nur der Owner darf
`active -> terminal` ausführen. Nachdem kein weiterer Exchange benötigt wird,
löscht er `activeExchange` exakt einmal und setzt `activeRunToken` auf `null`,
bevor sein öffentliches Result-Promise erfüllt wird. Späte Handler prüfen
zuerst Token und `runState`; ohne aktiven Owner verändern sie nichts und geben
ausschließlich den primitiven Wert `undefined` zurück.

Jeder `run()`-Aufruf liefert sofort ein lokales Promise aus dem bei
Modulevaluation erfassten Konstruktor. Kein
beherrschter Pfad weist es zurück. Innerhalb der Foundation-Effectport- und
öffentlichen Run-Promise-Maschinerie sind `await`, `Promise.resolve`,
`Promise.race`, `Promise.all` und freie Thenableassimilation verboten; der
fest gebundene Main-World-Evaluationtext in Abschnitt 8 bleibt davon
unberührt.

Das Verbot erhaltener Eingabereferenzen betrifft dauerhafte Datenhaltung und
sämtliche Outputgraphen. Die technisch notwendige einzige Ausnahme ist exakt
eine dauerhaft callerlieferte Capabilityreferenz im privaten, nicht
erreichbaren und löschbaren Slot `capturedExchange`:

1. `effectPort` wird über erfasste Reflection-Intrinsics genau einmal
   descriptorbasiert geprüft.
2. Seine aufzählbare Own-Data-Property `exchange` wird genau einmal über ihren
   Descriptor gelesen; Getter, Setter, Koerzierung und freie Auflösung sind
   verboten.
3. Der Wert muss ohne Koerzierung funktional sein. Nur diese exakte Referenz
   wird in `capturedExchange` gespeichert; der `effectPort`-Container wird
   danach verworfen und nie erneut gelesen.
4. Jeder Owner-Exchange-Aufruf über `activeExchange` verwendet ausschließlich
   die bei Modulevaluation erfasste Apply-Intrinsic, `undefined` als Receiver
   und exakt ein frisches, gewöhnliches, geschlossenes, tief eingefrorenes
   Intent.
5. Die exakte Capabilityreferenz wird unter keinem ihrer beiden zeitlich
   disjunkten Slotnamen `capturedExchange` oder `activeExchange` ausgegeben,
   serialisiert, eingefroren, persistiert, verglichen oder als
   Provenienznachweis verwendet. Für sie werden weder Plain-, Native-, Realm-
   noch Proxyfreiheit behauptet.
6. Throw, Rejection und vertragswidriges Verhalten werden in sämtlichen
   Foundationoutputs und kontrollierten Handlerkanälen nur statisch redigiert.
   Das ist keine Aussage über getrennte Host-Rejectionkanäle. Vor dem ersten
   Run bleibt allein `capturedExchange` erhalten;
   während des Ownerlaufs ausschließlich `activeExchange`. Bei einem dauerhaft
   pending Exchange darf der Owner-Slot bis zu dessen Settlement benötigt
   werden. Jeder terminal erreichbare Ownerpfad löscht ihn nach dem letzten
   benötigten Exchange und vor Erfüllung seines öffentlichen Result-Promises.

Neben dem einen Capabilityslot sind caller- oder portseitig ausschließlich
vier transiente Referenzrollen zulässig:

1. genau ein aktueller Exchange-Promise-Kandidat;
2. genau ein aktueller Fulfillmentgraph jeder Antwortart, ausdrücklich auch
   Probe-, Clock-, Arm-, Cancel-, Send- und Cleanup-Step-Acks;
3. genau ein vollständig unreflektierter Dequeue-Fulfillmentgraph während
   seines vorgeschriebenen Clock-Samples;
4. ausschließlich während derselben synchronen Prüfung benötigte allowlistete
   Nachfahr-, Descriptor- und Prototypreferenzen.

Ein Dequeue-Fulfillment wechselt unmittelbar und ohne Doppelhaltung aus der
generischen Fulfillmentverarbeitung in Rolle 3. Während Rolle 3 belegt ist,
darf Rolle 2 ausschließlich den zugehörigen Clock-Ack halten; Rolle 1 hält
genau den aktuellen Clock-Exchange-Promise-Kandidaten bis zu dessen Settlement.
Mit Beginn der Clock-Ack-Prüfung ist dieser Kandidat bereits settlend
beobachtet und wird unmittelbar verworfen. Jede andere Überlappung und jede
dauerhafte Eingabereferenz sind verboten. Own-Key-Arrays
und Descriptorrecords aus erfassten
Reflection-Intrinsics sind foundationeigene temporäre Prüfartefakte; darin
enthaltene fremde Werte bleiben Teil des jeweiligen Eingabegraphslots.

Rolle 1 wird unmittelbar nach ihrem Settlement verworfen, Rolle 2 nach
primitiver Projektion, Rolle 3 nach dem vorgeschriebenen Clock-Sample und der
unmittelbar folgenden Prüfung und Rolle 4 nach der jeweiligen synchronen
Teilprüfung. Sie erreichen keinen Outputgraphen und werden
nicht eingefroren, mutiert, geloggt, serialisiert oder persistiert. Der
Rejectionhandler ist formal nullstellig, besitzt keinen Parameter und liest
weder `arguments` noch den Rejectiongrund. Foundationeigene Resolver,
kontrollierte Handler und der spezifikationsbedingt erzeugte Folgepromise sind
keine Callerreferenzen; der Folgepromise wird nie gespeichert oder inspiziert.
Ein zweiter Port, Callback, EventEmitter, Iterator, Generator, Stream,
`AbortSignal` oder versteckter Seam ist verboten.

Für Factoryoptions, `runBinding`, den `effectPort`-Container und sämtliche
übrigen Eingabegraphen gilt weiterhin: keine erhaltene Container- oder
Datenreferenz. Nur zulässige primitive Blätter werden in frische gewöhnliche
interne Records kopiert. Die absolute Invariante lautet:

```text
Keine callerlieferte Objekt-, Array-, Promise-, Hüllen-, Capability-
oder sonstige Eingabereferenz erreicht FoundationResult,
FoundationProjection, PreCleanupObservationSnapshot oder CleanupLedger.
```

### 2. Geschlossenes `runBinding`

`runBinding` besitzt exakt neun Own-Data-Properties in dieser Reihenfolge:

```text
runBinding = {
  diagnosticRunId,
  observedAt,
  timeZone,
  replayContextId,
  repositoryCommit,
  profileInstanceObservation,
  unexplainedCausalDeviationObservation,
  replayOperands,
  viteRuntimeVersionObservation
}
```

Die skalaren Grenzen sind:

```text
diagnosticRunId   = ASCII [a-z0-9-]{1,32}
observedAt        = kanonisches YYYY-MM-DDTHH:mm:ss.sssZ mit UTC-Rückprojektion
timeZone          = ASCII-IANA-ID, 1..64 Codeunits
replayContextId   = ASCII [a-z0-9-]{1,32}, verschieden von chrome-stable-win-t0-01
repositoryCommit  = Lower Hex [0-9a-f]{40}
viteRuntimeVersionObservation = null | kanonischer SemVer-String, 1..32 ASCII-Codeunits
```

Die beiden festen Rohbeobachtungen besitzen exakt:

```text
profileInstanceObservation = {
  newInstanceObserved,
  historicalInstanceReuseObserved
}

unexplainedCausalDeviationObservation = {
  reviewCompleted,
  deviationObserved
}
```

Alle vier Blätter sind primitive Booleans oder `null`. Bei der
Profilbeobachtung bedeutet `true/false` eine neue Instanz, `false/true` eine
Wiederverwendung, und jede andere nicht widersprüchliche Kombination
`unknown`; `true/true` ist malformed. Bei der Abweichungsbeobachtung wird
`true/false` privat zu `confirmed`, `true/true` zu `contradicted` und jede
andere nicht widersprüchliche Kombination zu `unproven`; `false/true` ist
malformed. Das sind abgeleitete Kandidatenwerte, keine callerlieferbare
Provenienz.

`replayOperands` ist ein dichtes gewöhnliches Array mit exakt 59 Einträgen.
Jeder Eintrag besitzt ausschließlich und in dieser Reihenfolge:

```text
{ fieldId, observationState, replayValue }

observationState = observed | not-observed | ambiguous
```

Position und `fieldId` müssen der privaten kanonischen Tabelle entsprechen.
Bei `not-observed` oder `ambiguous` ist `replayValue` exakt `null`; bei
`observed` ist es ein typgültiger nichtnullischer primitiver Skalar. Der Caller
liefert niemals `historicalValue`, `comparisonBasis`, Vergleichsergebnis,
Gate, Finding, Cause, Count, Sequenz, Completion- oder Cleanupstatus,
Integritätsresultat, Hashgleichheit, Provenienzboolean, Runtime- oder
Persistenzautorisierung, Command-, Session-, Target- oder Request-ID oder den
Evaluationtext.

### 3. Private 59-Felder-Replaytabelle

Die Typcodes lauten: `H64` = Lower-Hex-String mit exakt 64 Zeichen; `A16`,
`A32`, `A64`, `A128`, `A256`, `A1024`, `A2048` = nichtleerer sanitierter
ASCII-String bis zur angegebenen UTF-16-Codeunitgrenze; `S32` = kanonischer
ASCII-SemVer bis 32 Codeunits; `P` = nichtnegative Safe-Integer-Portnummer
`0..65535`; `B` = primitiver Boolean. Jeder Typ erlaubt zusätzlich `null` nur
bei `not-observed` oder `ambiguous`. Es gibt keine Koerzierung,
Normalisierung, Case-Faltung oder implizite Stringkonvertierung.

Basis: `A` = `historical-commit-artifact-sha256`, `R` =
`historical-record-value`, `D` = `historical-record-closed-derivation`, `C` =
`historical-commit-closed-derivation`. `Ziel` benennt die frische interne
Projektion; `—` bedeutet, dass der Wert nur im Vergleichseintrag liegt.

| Nr. | `fieldId` | Basis | Historischer fester Wert | Typ/Grenze | Ziel | Invariante |
| ---: | --- | :---: | --- | --- | --- | --- |
| 1 | `artifact.transport.src/transports/browserSyncTransport.js.sha256` | A | `3c41b17e1d80e94e4b05e7c76f019d3fd3af281b451e85c8f90d80fd25391c28` | H64 | — | G, I8 |
| 2 | `artifact.contract.src/contracts/syncContract.js.sha256` | A | `96ad2c52fb4545d6e587d9b3fd86d76a4a735e8cb33e9b572a3d7d5f4e5a6aeb` | H64 | — | G, I8 |
| 3 | `artifact.gateway.server/startLocalSyncGateway.js.sha256` | A | `677be5e9cace926ba0a1f3540e39926f5b5c54dd57440bd1ac53de6f255ca6d5` | H64 | — | G, I8 |
| 4 | `artifact.gateway.server/localSyncGatewayRuntimeConfig.js.sha256` | A | `e9a4419666e33b57d1ed5712e00f3d954a5b82c1cc7956b9a7582e0462743836` | H64 | — | G, I8 |
| 5 | `artifact.gateway.server/localSyncGatewayHttpServer.js.sha256` | A | `70243e66f85448c23920ea30409a03be7ed349b6868535729f4a798f012fdbb8` | H64 | — | G, I8 |
| 6 | `artifact.gateway.src/gateways/syncGatewayRequestBoundary.js.sha256` | A | `b1e55f03283bfdd1d35562951503471b4a812ac61868af0b927a05623e597b79` | H64 | — | G, I8 |
| 7 | `artifact.gateway.src/agents/syncAgent.js.sha256` | A | `899e06d3a80925cab8680749d133e9a8d87f30a2fd1d509cf7339eb1c8d65db0` | H64 | — | G, I8 |
| 8 | `artifact.frontend.runtime-source-set.sha256` | A | `6f3d5740b043308b4d38df33b6293c9064d8dd1b3f0c5801d50844336c195591` | H64 | — | G, I8 |
| 9 | `repository.state` | R | `clean` | `clean\|dirty\|unknown` | `replay.repositoryState` | G |
| 10 | `hostRuntime.executionClass` | R | `local-disposable` | A64 | gleichnamiger `causalContext`-Pfad | G |
| 11 | `operatingSystem.family` | R | `windows` | A32 | gleichnamiger Pfad | G |
| 12 | `operatingSystem.edition` | R | `Windows 11 Home` | A64 | gleichnamiger Pfad | G |
| 13 | `operatingSystem.architecture` | R | `x64` | A16 | gleichnamiger Pfad | G |
| 14 | `operatingSystem.version` | R | `25H2` | A64 | gleichnamiger Pfad | G |
| 15 | `operatingSystem.build` | R | `26200` | A32 | gleichnamiger Pfad | G |
| 16 | `operatingSystem.patch` | R | `9168` | A32 | gleichnamiger Pfad | G |
| 17 | `node.version` | R | `24.19.0` | S32 | gleichnamiger Pfad | G |
| 18 | `browser.product` | R | `chrome` | A32 | gleichnamiger Pfad | G |
| 19 | `browser.channel` | R | `stable` | A32 | gleichnamiger Pfad | G |
| 20 | `browser.version` | R | `151.0.7922.174` | A64 | gleichnamiger Pfad | G |
| 21 | `browser.engine` | R | `blink` | A32 | gleichnamiger Pfad | G |
| 22 | `browser.engineBuild` | R | `@39c51c70dd5feca6b6aba5bb7997b595011c553d` | A128 | gleichnamiger Pfad | G |
| 23 | `browser.executionMode` | R | `visible` | A32 | gleichnamiger Pfad | G |
| 24 | `browser.privateMode` | R | `true` | B | gleichnamiger Pfad | G |
| 25 | `profile.lifecycle` | R | `fresh-disposable` | A64 | gleichnamiger Pfad | G, I7 |
| 26 | `profile.extensions` | R | `none` | A64 | gleichnamiger Pfad | G |
| 27 | `profile.startParameters` | R | `effective-non-bypassing` | A128 | gleichnamiger Pfad | G |
| 28 | `profile.featureFlags` | R | `none-effective` | A128 | gleichnamiger Pfad | G |
| 29 | `profile.enterprisePolicies` | R | `none-effective` | A128 | gleichnamiger Pfad | G |
| 30 | `networkEnvironment.proxy` | R | `inactive` | A32 | gleichnamiger Pfad | G |
| 31 | `networkEnvironment.vpn` | R | `inactive` | A32 | gleichnamiger Pfad | G |
| 32 | `initialState.serviceWorker` | R | `absent` | A64 | gleichnamiger Pfad | G |
| 33 | `initialState.permission` | R | `prompt` | A64 | gleichnamiger Pfad | G |
| 34 | `initialState.preflightCache` | R | `empty-confirmed` | A64 | gleichnamiger Pfad | G |
| 35 | `initialState.siteCache` | R | `empty-confirmed` | A64 | gleichnamiger Pfad | G |
| 36 | `bindingComparisonProfile` | R | `ephemeral-exact-effective-context-comparison-without-retention` | A128 | gleichnamiger Pfad | G |
| 37 | `frontend.topLevelUrl` | R | `http://127.0.0.1:5173/` | A2048 | gleichnamiger Pfad | G, I1 |
| 38 | `frontend.serializedOrigin` | R | `http://127.0.0.1:5173` | A2048 | gleichnamiger Pfad | G, I1, I4 |
| 39 | `frontend.contextKind` | R | `top-level` | A32 | gleichnamiger Pfad | G |
| 40 | `frontend.isSecureContext` | R | `true` | B | gleichnamiger Pfad | G |
| 41 | `transportRequest.factoryProfile` | R | `real-default-factory` | A64 | gleichnamiger Pfad | G |
| 42 | `transportRequest.compositionProfile` | R | `transport-only` | A64 | gleichnamiger Pfad | G |
| 43 | `transportRequest.requestProfile` | R | `synthetic-v1-syncTest-empty-payload` | A128 | gleichnamiger Pfad | G |
| 44 | `transportRequest.requestEqualityMethod` | R | `ephemeral-full-value-comparison-without-retention` | A128 | gleichnamiger Pfad | G |
| 45 | `transportRequest.initialUrl` | R | `http://127.0.0.1:8787/api/sync-test` | A2048 | gleichnamiger Pfad | G, I2, I5 |
| 46 | `transportRequest.initialScheme` | R | `http` | A16 | gleichnamiger Pfad | G, I2 |
| 47 | `transportRequest.initialHost` | R | `127.0.0.1` | A256 | gleichnamiger Pfad | G, I2 |
| 48 | `transportRequest.initialPort` | R | `8787` | P | gleichnamiger Pfad | G, I2, I3 |
| 49 | `transportRequest.initialPath` | R | `/api/sync-test` | A1024 | gleichnamiger Pfad | G, I2 |
| 50 | `transportRequest.requestInitProfile` | R | `adr-0028-fixed` | A64 | gleichnamiger Pfad | G |
| 51 | `gateway.listenerHost` | R | `127.0.0.1` | A256 | gleichnamiger Pfad | G, I3 |
| 52 | `gateway.listenerPort` | R | `8787` | P | gleichnamiger Pfad | G, I3 |
| 53 | `gateway.portEnvironmentValue` | R | `"8787"` | A16 | gleichnamiger Pfad | G, I3 |
| 54 | `gateway.allowedOrigin.value` | R | `http://127.0.0.1:5173` | A2048 | gleichnamiger Pfad | G, I4 |
| 55 | `gateway.allowedOrigin.relationToFrontend` | R | `matches-frontend-origin` | A64 | gleichnamiger Pfad | G, I4 |
| 56 | `gateway.endpoint` | R | `http://127.0.0.1:8787/api/sync-test` | A2048 | gleichnamiger Pfad | G, I3, I5 |
| 57 | `gateway.responderProfile` | R | `production-gateway` | A64 | gleichnamiger Pfad | G |
| 58 | `gateway.responseProfile` | D | `adr-0020-options204-post200-syncresponse-v1` | A128 | gleichnamiger Pfad | G |
| 59 | `toolchain.vite.lockfileVersion` | C | `8.1.4` | S32 | `causalContext.toolchain.vite.lockfileVersion` | G, I6 |

`G` verlangt exakt 59 dichte Einträge, kanonische Position und `fieldId`,
geschlossene Own-Key-Mengen, Symbolverbot, typstrikten Vergleich und
`not-observed|ambiguous => replayValue:null/result:unproven`. Die
Cross-Field-Invarianten sind:

- `I1`: Top-Level-URL und serialized Origin müssen ohne Normalisierung
  syntaktisch und portgenau zusammenpassen.
- `I2`: `initialUrl` muss exakt aus Scheme, Host, Port und Path bestehen.
- `I3`: Listenerhost/-port, dezimaler Environmentport und Gatewayendpoint
  müssen dieselbe Loopbackbindung beschreiben.
- `I4`: `matches-frontend-origin` gilt genau bei bytegleicher
  `allowedOrigin.value` und `frontend.serializedOrigin`.
- `I5`: Transport-Initial-URL und Gatewayendpoint müssen bytegleich sein.
- `I6`: Lockfile- und `viteRuntimeVersionObservation` bleiben getrennt;
  `null` ist `unproven`, bestätigte Abweichung `mismatch`. Callerwerte
  bestätigen keine tatsächlich geladene Runtime.
- `I7`: `profile.lifecycle` und die separat abgeleitete
  Profilinstanzbeobachtung dürfen sich nicht widersprechen.
- `I8`: Alle acht Artefaktwerte gehören zum privaten historischen Commit
  `8001cc7eb7d2fed68c5ca4061514b486a204ac44`; ein Callerhash bestätigt weder
  Commit- noch Dateibyteprovenienz.

Die Vergleichsbasis, historischen Werte und Resultate werden ausschließlich
privat ergänzt. Die Relation bleibt `adr-0032-causal-replay-v2`:

```text
DIVERGED  := mindestens ein mismatch
             || noUnexplainedCausalDeviation = contradicted
UNPROVEN  := kein DIVERGED-Grund
             && (mindestens ein unproven
                 || noUnexplainedCausalDeviation = unproven)
EQUIVALENT := alle 59 observed/match
              && noUnexplainedCausalDeviation = confirmed
```

### 4. Einziger effects-as-data-Port und Promiseprofil

Der einzige Effektvertrag des Owners lautet:

```text
activeExchange(frozenIntent)
  -> currently-observable-local-native-promise-profile
     <untrusted materialized observation>
```

Zu jedem Zeitpunkt darf höchstens ein kontrolliert beobachtbares
Exchange-Promise ausstehen. Bei
Modulevaluation werden mindestens der lokale Promise-Konstruktor und
`Promise.prototype`, die native `then`-Funktion samt vollständigem Descriptor,
`Symbol.species`, die vollständigen Promise-/Object-Prototypidentitäten, die
vollständigen Originaldescriptoren von `Promise.prototype.constructor` und
`Promise[Symbol.species]` sowie die benötigten Apply-, OwnKeys-, Prototype- und
Descriptor-Intrinsics erfasst.

Für jeden Exchange-Kandidaten wird unmittelbar vor genau einer Anwendung der
erfassten nativen `then`-Methode diese Reihenfolge eingehalten:

1. OwnKeys des Kandidaten exakt einmal lesen und als leer bestätigen;
2. seinen Prototyp exakt einmal lesen und mit dem erfassten lokalen
   Promiseprototyp vergleichen;
3. Constructor-, Species- und Then-Livedescriptor jeweils exakt einmal lesen
   und vollständig mit den erfassten Originaldescriptoren vergleichen;
4. ohne fremden Zwischenhook die erfasste `then`-Methode per erfasstem Apply
   mit exakt zwei kontrollierten Handlern anwenden.

Diese eine Anwendung ist zugleich die native Brandprüfung. Ein Throw macht den
Kandidaten malformed; eine zweite Brandprobe ist verboten. Beide Handler
fangen kontrollierte Throws vollständig ab, geben immer primitives
`undefined` zurück und liefern insbesondere nie einen Fulfillmentgraphen oder
fremden Wert an den spezifikationsbedingt erzeugten Folgepromise. Thenables
und Kandidaten mit einem beobachtbar fremden Prototyp-, Own-Key-, Constructor-,
Species- oder Then-Profil bleiben unzulässig. Ein Kandidat, der dieses
vollständige gegenwärtig beobachtbare Profil besteht, begründet keine
Same-Realm-, Erzeugungsrealm-, Constructor-Provenienz-, Subclass-, Native-
oder Proxyfreiheitsbehauptung; eine entsprechend verkleidete fremde oder
Subclass-Instanz kann das Profil
beobachtbar erfüllen. Das Profil bestätigt ebenso wenig Proxyfreiheit der
Capability.

Die Foundation bindet, liest, kopiert, serialisiert, persistiert, loggt oder
emittiert keinen fremden Rejectiongrund über Outputs oder kontrollierte
Handler. Nur diese Kanäle sind statisch redigiert. Ein bereits oder später
abgelehntes Promise, dessen Profil vor der Handlerinstallation scheitert, kann
weiterhin einen getrennten hostabhängigen `unhandledrejection`- oder
`unhandledRejection`-Kanal mit seinem ursprünglichen Grund auslösen. Eintritt,
Zeitpunkt, Häufigkeit, Inhalt, Prozessfortsetzung und Unterdrückbarkeit dieses
Hostkanals werden nicht behauptet. Ein niemals settelndes gültiges Promise darf
den Lauf unbegrenzt pending halten. Die Foundation simuliert dafür keinen
Timer.

Jedes öffentliche Run-Promise wird ausschließlich mit dem erfassten lokalen
Promise-Konstruktor erzeugt. Sein Reject-Resolver wird weder gespeichert noch
aufgerufen; Resolve wird exakt einmal verwendet. In dieser Foundation-
Promise-Maschinerie verboten bleiben insbesondere `await`, `Promise.resolve`,
`Promise.race`, `Promise.all`, freie `.then`-Auflösung und die Rückgabe eines
Fulfillmentgraphen aus einem Handler. Der unveränderte dokumentierte
Main-World-Evaluationtext besitzt eine getrennte By-Value-Grenze.

Die private Exchange-Lease besitzt exakt vier Zustände:

```text
idle
observable-pending
settlement-unobservable
closed
```

Nur `idle` erlaubt die Erzeugung einer neuen Intent-ID und einen Portaufruf.
Nach erfolgreichem Profilcheck und Installation beider kontrollierter Handler
ist die Lease `observable-pending`; der aktuell geprüfte
Exchange-Promise-Kandidat bleibt bis zu seinem Settlement die einzige zugehörige
transiente Referenz. Erst der Eintritt in einen kontrollierten Fulfillment- oder
Rejectionhandler ist ein `observed-settlement`. Der Handler gibt die Lease vor
jedem intent- und zustandsspezifischen Dispatch zu `idle` frei. Ein erst dort
festgestelltes malformed Fulfillment ist deshalb ebenfalls beobachtet und wird
nach der Leasefreigabe intent-spezifisch behandelt.

Ein synchroner Throw von `exchange`, ein malformed Promise-Kandidat, ein
Reflectionthrow während der Promiseprofilprüfung oder ein Throw der einzigen
nativen `then`-Anwendung vor Eintritt eines kontrollierten Handlers ist dagegen
ein `settlement-unobservable`. Diese Klasse hat vor jeder phasenlokalen Fehler-,
Rejection-, Catch-all- oder Cancelregel höchste Präzedenz und setzt atomar:

```yaml
lease: closed
portState: closed
activeCapability: null
affectedCapState: terminal-unknown
furtherExchangeCount: zero
```

`activeCapability` bezeichnet in dieser Terminalprojektion ausschließlich den
privaten `activeExchange`-Slot; er wird gelöscht und nicht nur logisch
unbenutzbar. Vor `attemptStarted` folgt ausschließlich der statische
Foundationabschluss ohne Snapshot, Ledger oder nachträglichen Portzugriff.
Während Observation setzt der Pfad sticky `V`, friert `O0` und führt Cleanup
ausschließlich lokal und portlos aus. Nach `O0` bleibt der Snapshot unverändert;
es werden ausschließlich `cleanupViolation: true` und erforderlichenfalls
`cleanup-terminal-failure` abgeleitet. Insbesondere folgen weder `cap-cancel`,
Retry noch irgendein anderer Exchange. Ein `settlement-unobservable` während
eines Cancelversuchs erzeugt niemals einen zweiten Cancelversuch. Nach dem
letzten regulär beobachteten und vollständig verarbeiteten Exchange darf die
Lease ebenfalls normal zu `closed` wechseln; das ist von
`settlement-unobservable` getrennt.

Jeder interne Versuch eines zweiten Exchange bei `observable-pending` wird vor
Intent-, ID-, Zähler- oder Portmutation abgefangen. Dabei entstehen weder ein
zweites Intent noch eine zweite ID oder ein zweiter Capabilityaufruf. Privat
wird exakt klassifiziert:

```text
pendingInternalExchangeViolation =
  false | prestart | observation | cleanup

!attemptStarted                         -> prestart
attemptStarted && Snapshot nicht frozen -> observation
Snapshot frozen                         -> cleanup
```

Der ursprüngliche Exchange bleibt die einzige Livenessgrenze. Bei seinem
Fulfillment werden Payload und gegebenenfalls gehaltener Dequeuegraph
vollständig unreflektiert verworfen; bei Rejection wird kein Grund gelesen.
Ein darin möglicherweise enthaltener Send-Ack wird nicht gezählt; die
betroffene Sendklasse bleibt `unknown` und wird niemals wegen der
unterdrückten Anforderung zu `multiple`. Danach wechselt die Lease atomar von
`observable-pending` zu `closed`, niemals
zu `idle`, `activeExchange` wird gelöscht, alle live gebliebenen Caps werden
`terminal-unknown`, und der Port wird nie wieder aufgerufen. „Live geblieben“
ist für diesen Join exakt
`arm-pending|armed|pending-activation|active|activation-unknown|cancel-pending`;
`absent|cancelled|fired|terminal-unknown` werden nicht umklassifiziert.
`prestart` erfüllt
nach Settlement ausschließlich den statischen Foundationfehler ohne Snapshot
oder Ledger; `observation` setzt sticky `V`, friert den Snapshot und führt nur
lokalen Cleanup aus; `cleanup` lässt den Snapshot unverändert, setzt
`cleanupViolation`, macht verbleibende Portchecks `unproven` und endet in
`cleanup-terminal-failure`. Bleibt der ursprüngliche Exchange ewig pending,
bleibt auch der Run ewig pending. Späte oder doppelte Handler sind
token-/zustandsgegatete `undefined`-No-ops. Ein Exchangeversuch bei bereits
`closed` ist unerreichbar und inert; dafür wird keine fingierte Joinverletzung
erzeugt.

Ausschließlich der Eintritt in einen kontrollierten Rejectionhandler ist ein
`observed-settlement`. Jeder solche Handler gibt zuerst die Lease zu `idle` frei
und dispatcht danach ausschließlich anhand des bereits intern gebundenen
Tupels:

```text
{ phase, intentKind, intentId, capKind, capState }
```

Innerhalb dieses beobachteten Settlements haben erstens der exakte intent- und zustandsspezifische
Rejectionübergang, zweitens die erforderliche Capquieszenz und erst drittens
Snapshot oder Cleanup. Der allgemeine Catch-all ist nur bei einem unmöglichen
internen Tupel zulässig. Er darf keinen spezifischen Probe-, Clock-, Arm-,
Send-, Cancel-, Dequeue- oder Cleanupübergang überspringen, schließt den Port
fail-closed, löscht `activeExchange`, setzt betroffene live Caps
`terminal-unknown` und verbietet jeden weiteren Exchange. Vor dem Snapshot
ergibt er sticky `V`, `O0` und portlosen Cleanup, danach ausschließlich
`cleanupViolation` und erforderlichenfalls `cleanup-terminal-failure` bei
unverändertem `O0`. Ein `settlement-unobservable` tritt vor keinem
kontrollierten Handler ein, umgeht diesen Dispatch samt Catch-all vollständig
und folgt ausschließlich der vorstehenden globalen Terminalregel.

Die Menge der erreichbar kontrollierten Rejection-Tupel ist geschlossen. Die
`intentId` bindet vor dem Capabilityaufruf unveränderlich auch den erwarteten
Clockgrund, Command, Cleanup-Purpose und gegebenenfalls die bereits entschiedene
Closeklasse; der Handler liest dafür weder Rejectiongrund noch fremde Daten.
Das private Dispatchfeld `capKind` ist exakt
`null|setup|capture|cleanup`; `null` ist ausschließlich beim
`capability-probe` mit `capState: absent` zulässig, während
`setup-origin` bereits `capKind: setup, capState: absent` bindet. Jede
`cap-cancel`-Intent-ID bindet zusätzlich eindeutig einen nicht callerlieferbaren
Purpose aus:

```text
prestart-arm-recovery | setup-ready-transition | rejection-quiescence |
capture-terminal-quiescence | post-o0-old-cap | cleanup-arm-recovery |
cleanup-recovery | cleanup-final
```

Dieser Purpose wird nur über die bereits im
Tupel enthaltene `intentId` aufgelöst und erweitert den Rejectionhandler um
keinen fremden Dispatchwert.
Für jede folgende, durch Eintritt in den kontrollierten Handler beobachtete
Rejection ist die Lease bereits zu `idle` freigegeben. Keine folgende
Rejection- oder Cancelmatrix gilt für `settlement-unobservable`:

- `prestart / capability-probe / capKind = null / capState = absent` und
  `prestart / controller-clock-sample(setup-origin) / capKind = setup /
  capState = absent` schließen
  den Port und erfüllen den statischen Foundationfehler ohne Snapshot oder
  Ledger;
- `prestart / cap-arm(setup) / cap = arm-pending` setzt den Setupcap
  `activation-unknown` und versucht für seine bekannte Arm-Intent-ID genau
  einen Best-effort-Cancel. Exakter Ack setzt `cancelled`; beobachtete
  Cancel-Rejection oder malformed Ack setzt `terminal-unknown`; unobservables
  Cancel-Settlement setzt das vollständige globale Closed-Tupel einschließlich
  `activeCapability: null` und `furtherExchangeCount: zero`. Jeder dieser
  terminalen Ausgänge erfüllt danach nur den statischen Foundationfehler; nach
  dem unobservablen Ausgang geschieht dies ausschließlich lokal und portlos.
  Ein gültiges pending Cancel hält den Run pending. Ein zweiter Cancel ist
  in jedem Fall ausgeschlossen;
- `prestart / cap-cancel(setup) / cap = cancel-pending` setzt
  `terminal-unknown`, schließt danach den Port und erfüllt den statischen
  Foundationfehler; es gibt weder Retry noch Snapshot oder Ledger;
- `observation / protocol-command-send(Target.getTargets |
  Target.attachToTarget | Network.enable) / setup = armed` setzt den
  betreffenden Sendcount `unknown`, das Operationsergebnis `unproven`, sticky
  `V` und schließt alle nachfolgenden Setup- und Evaluate-Sends;
- `observation / controller-clock-sample(setup-dequeue-before-reflection) /
  setup = armed` verwirft den gehaltenen Dequeuegraph vollständig
  unreflektiert und setzt sticky `V`;
- `observation / observation-dequeue(setup) / setup = armed` setzt sticky `V`,
  ohne eine Antwort oder Queueleere zu erfinden;
- `observation / cap-cancel(setup) / setup = cancel-pending` setzt den Cap
  `terminal-unknown`, sticky `V`, verbietet Capturearm und Evaluate und führt
  ohne zweiten Cancel zu `O0`; der gebundene Cancel-Purpose unterscheidet den
  normalen `setup-ready-transition` von einer `rejection-quiescence`, und die
  Cleanupableitung beginnt in beiden Rejectionfällen mit negativer
  Capbehauptung und `cleanupViolation`;
- `observation / cap-arm(capture) / capture = arm-pending` setzt zuerst sticky
  `V`, `Runtime.evaluate` auf `zero` und den Capturecap
  `activation-unknown`;
- `observation / protocol-command-send(Runtime.evaluate) / capture =
  pending-activation` folgt ausschließlich der unten ausgeschriebenen
  konservativen Evaluate-Rejectionmatrix;
- `observation / controller-clock-sample(capture-dequeue-before-reflection) /
  capture = active` verwirft den gehaltenen Dequeuegraph vollständig
  unreflektiert und setzt sticky `V` sowie `captureWindowState: truncated`;
- `observation / observation-dequeue(capture) / capture = active` setzt sticky
  `V` sowie `captureWindowState: truncated`, ohne Reply-, Network- oder
  Settlementwerte zu erfinden;
- `observation / cap-cancel(capture) / capture = cancel-pending` setzt
  `terminal-unknown`, promoviert eine gebundene Closeklasse `U` zu `V` oder
  erhält das bereits gebundene `V`, führt ohne zweiten Cancel zu `O0` und
  beginnt Cleanup mit negativer Capbehauptung und `cleanupViolation`;
- `cleanup / cap-cancel(setup|capture) / cap = cancel-pending` setzt den Cap
  `terminal-unknown` und `cleanupViolation`, verändert `O0` nicht und setzt nur
  die weiterhin sichere Cleanupfolge fort;
- `cleanup / controller-clock-sample(cleanup-origin) / cleanup = absent` setzt
  `cleanupViolation` und `cleanup-terminal-failure` und finalisiert
  ausschließlich lokal ohne Cleanupcap;
- `cleanup / cap-arm(cleanup) / cleanup = arm-pending` setzt den Cleanupcap
  `activation-unknown`, `cleanupViolation` und `cleanup-terminal-failure` und
  versucht nach diesem `observed-settlement`, solange Lease `idle` und der Port
  beobachtbar bleiben, genau einen Cancel. Dessen exakter Ack setzt `cancelled`,
  beobachtete Rejection oder malformed Ack setzt `terminal-unknown`,
  unobservables Settlement setzt dagegen das vollständige globale Closed-Tupel
  und erlaubt danach ausschließlich lokale Terminalisierung, und ein gültiges
  pending Promise hält den Run pending;
- `cleanup / protocol-command-send(Network.disable |
  Target.detachFromTarget) / cleanup = armed` setzt den Sendcount der Operation
  `unknown`, ihr Resultat `unproven` und nur den zugehörigen Closecheck
  `failed`; ohne offene Command-ID folgt der nächste weiterhin sichere
  terminale Sendeversuch beziehungsweise Cleanup-Step;
- `cleanup / observation-dequeue(cleanup) / cleanup = armed` setzt
  `cleanupViolation`: Im Purpose
  `await-cleanup-protocol-responses(openCommandIds)` werden die offenen CDP-
  Closechecks und alle späteren portabhängigen Checks `unproven`, im Purpose
  `await-cleanup-fact(checkId)` der aktuelle und alle späteren portabhängigen
  Checks. Beide ergeben
  `cleanup-terminal-failure`; ein beobachtbar gebliebener Cleanupcap wird genau
  einmal storniert, danach wird lokal finalisiert;
- `cleanup / controller-clock-sample(cleanup-dequeue-before-reflection) /
  cleanup = armed` verwirft den gehaltenen Dequeuegraph vollständig
  unreflektiert und hat für den jeweils gebundenen der beiden Purposes dieselbe
  ausschließlich ledgerlokale Wirkung wie die vorstehende
  Cleanup-Dequeue-Rejection;
- `cleanup / cleanup-step / cleanup = armed` setzt genau den durch die Intent-ID gebundenen
  aktuellen Check `failed` und fährt nur mit einem weiterhin sicheren Schritt
  fort;
- `cleanup / cap-cancel(cleanup) / cleanup = cancel-pending` setzt
  `terminal-unknown`, `cleanupViolation` und `cleanup-terminal-failure`; der
  Completion-Clock-Sample bleibt geschlossen und es gibt keinen zweiten
  Cancel;
- `cleanup / controller-clock-sample(cleanup-completion-after-cap-cancel) /
  cleanup = cancelled` setzt `cleanupViolation`, Stage 10
  `observed/mismatch` mit der nächsten lückenlosen Cleanup-Layer-
  `receiptOrder`, `relativeMilliseconds: null` und `timingState: unavailable`,
  Check 20 `failed` und
  `cleanup-terminal-failure` und finalisiert lokal.

Für die drei durch ein `observed-settlement` rejectionbedingten
Observation-Gruppen mit noch zu quieszierendem Cap – Setup-Send/Setup-Clock/
Setup-Dequeue, Capture-Arm sowie Capture-Clock/Capture-Dequeue – gilt vor `O0`
dieselbe vollständige Cancelmatrix: Der Cap wechselt zu `cancel-pending`;
exakter Ack setzt `cancelled` und führt mit unverändertem `V` zu `O0`;
beobachtete Cancel-Rejection oder malformed Ack setzt `terminal-unknown`,
erhält `V` und führt zu `O0` mit initialem `cleanupViolation`; unobservables
Cancel-Settlement setzt das vollständige globale Closed-Tupel, erhält `V`,
führt zu `O0` und danach ausschließlich lokaler portloser Cleanup-
Terminalisierung; ein gültiges pending Cancel hält den Run ohne `O0`
unbegrenzt pending. Der unobservable Ausgang erlaubt weder einen zweiten
Cancel noch irgendeinen anderen Exchange. Bei
Setup-Send, Setup-Clock und Setup-Dequeue wird der Setupcap, bei Capture-Arm,
Capture-Clock und Capture-Dequeue der Capturecap genau einmal anhand seiner
bekannten Arm-Intent-ID storniert.

Ein nach einem `observed-settlement` rejectionbedingt erforderlicher
`cleanup-arm-recovery`- oder `cleanup-recovery`-Cancel besitzt ebenfalls genau
vier Ausgänge: Exakter Ack setzt `cancelled`; beobachtete Cancel-Rejection oder
malformed Ack setzt `terminal-unknown`; unobservables Settlement setzt das
vollständige globale Closed-Tupel und verbietet jeden weiteren Exchange; ein
gültiges pending Promise hält den Run pending. Jeder der drei
terminalen Ausgänge behält `cleanupViolation` und
`cleanup-terminal-failure`, erlaubt keinen Completion-Clock-Sample und
totalisiert lokal alle noch offenen portabhängigen Checks zu `unproven`, Check
20 zu `failed` und Stage 10 zu `observed/mismatch` mit nächster lückenloser
Cleanup-Layer-`receiptOrder`, `relativeMilliseconds: null` und
`timingState: unavailable`. Dieselbe lokale Terminalprojektion gilt für die
Rejection von `cleanup-origin` und des finalen Cleanupcap-Cancels; bei der
Completion-Clock-Rejection ist ihre Handlerreihenfolge selbst die nächste
Receipt Order. `O0` bleibt in allen Fällen unverändert. Beim unobservablen
Ausgang geschieht die gesamte Terminalprojektion ausschließlich lokal und ohne
zweiten Cancel. Alle nicht vorstehend aufgeführten kontrolliert beobachteten
Rejection-Tupel sind intern unmöglich und nur deshalb dem Catch-all
vorbehalten.

Jedes Intent besitzt exakt die Own-Key-Reihenfolge:

```text
{ intentId, kind, payload }
```

`intentId` ist ein positiver Safe Integer, beginnt pro Instanz bei `1`, steigt
lückenlos und wird nie persistiert. Die einzige `kind`-Allowlist ist:

```text
capability-probe
controller-clock-sample
cap-arm
cap-cancel
protocol-command-send
observation-dequeue
cleanup-step
```

Alle foundationerzeugten Intentrecords sind frisch, gewöhnlich, geschlossen
und tief eingefroren. Unvertrauenswürdige Ack- und sonstige Antworten müssen
das jeweils verlangte geschlossene Descriptor-, Key-, Typ- und Wertprofil
erfüllen; Frische, Freeze, Herkunft oder Proxyfreiheit werden für sie nicht
behauptet. Sie werden über eigene aufzählbare Data-Descriptoren ohne
Koerzierung geprüft; ihre Own-Keyfolge muss exakt der folgenden Grammatik
entsprechen.

#### `capability-probe`

```text
payload = {
  profile: "adr-0033-foundation-effect-port-v1"
}

fulfillment = {
  kind: "capability-probe-result",
  profile: "adr-0033-foundation-effect-port-v1",
  capabilitySet: "clock-cap-send-dequeue-cleanup-v1"
}
```

Der Probe ist der erste und genau einmalige Exchange eines Runs. Nur sein
exaktes positives Profil erlaubt die Fortsetzung; es beweist keine Adapter-,
Pipe-, Parser-, Timer-, Queue-, Byte- oder Ressourcenprovenienz. Eine durch den
kontrollierten Handler beobachtete Rejection oder eine nach beobachtetem
Fulfillment malformed Antwort gibt die Lease zunächst frei und beendet den noch
nicht gestarteten Versuch mit dem statischen Foundationfehler. Synchroner
`exchange`-Throw, malformed Promise-Kandidat, Promiseprofil-Reflectionthrow und
native-Then-Throw folgen dagegen ausschließlich der globalen
`settlement-unobservable`-Regel samt Closed-Tupel und beenden ihn portlos
statisch. Eine Dublette ist unmöglich, weil die Zustandsmaschine keinen zweiten
Probe erzeugt; eine trotzdem beobachtete zweite Probe-Antwort ist malformed.

#### `controller-clock-sample`

```text
payload = { reason }

reason =
  setup-origin |
  setup-dequeue-before-reflection |
  capture-dequeue-before-reflection |
  cleanup-origin |
  cleanup-dequeue-before-reflection |
  cleanup-completion-after-cap-cancel

fulfillment = {
  kind: "controller-clock-sample-result",
  reason,
  monotonicMilliseconds
}
```

`monotonicMilliseconds` ist eine endliche nichtnegative primitive Zahl. Der
Grund muss exakt dem ausstehenden Intent entsprechen. `setup-origin`,
`cleanup-origin` und `cleanup-completion-after-cap-cancel` sind je genau einmal
in ihrem erreichbaren Pfad zulässig. Der Completion-Sample folgt ausschließlich
dem exakten Ack der abschließenden Cleanupcap-Stornierung und dient nur der
Stage-10-Zeitprojektion; er entscheidet keine Deadline rückwirkend neu. Jeder
erfüllte Dequeue verlangt vor jeder Reflection genau einen phasenpassenden
Dequeue-Sample. Ein zweites Sample für denselben Wert, ein falscher Grund,
Regression, eine negative oder nicht endliche Zahl ist vor `attemptStarted`
ein Foundationfehler, nach `attemptStarted` und vor `O0` sticky `V`, nach `O0`
jedoch ausschließlich `cleanupViolation` und bei verlorener sicherer
Finalisierbarkeit `cleanup-terminal-failure`. Während dieses Samples bleibt die
vollständige dequeuete Referenz im einzigen erlaubten transienten Slot
unreflektiert.

#### `cap-arm`

Jeder der drei Caps besitzt privat exakt einen Zustand aus:

```text
absent
arm-pending
armed
pending-activation
active
activation-unknown
cancel-pending
cancelled
fired
terminal-unknown
```

Setup und Cleanup wechseln nach positivem Arm-Ack von `arm-pending` zu
`armed`; dieser Zustand ist bereits live und bestätigt scharf. Capture
wechselt zunächst zu `pending-activation` und erst durch den atomaren
Evaluate-Sende-Ack zu `active`. Für die Cancelmatrix umfasst „live“ sowohl
`armed` als auch `active`. Ein unentscheidbarer Arm- oder
Aktivierungsübergang wird `activation-unknown`. Jeder Arm besitzt eine
flüchtige positive Intent-ID; pro Arm darf höchstens ein Cancel-Intent
entstehen. Eine verarbeitete absolute Deadline oder ein zulässiges korreliertes
`cap-fired` setzt den betreffenden Zustand zu `fired`; ein vorzeitiges
korreliertes Setup- oder Cleanup-`cap-fired` tut dies vor der anschließenden
`V`- beziehungsweise Cleanup-Control-Ableitung ebenfalls.

Die Payload besitzt abhängig von `capKind` exakt eines der drei Profile:

```text
setup = {
  capKind: "setup",
  mode: "absolute-controller-monotonic",
  deadlineMilliseconds: m_setup + 6000
}

capture = {
  capKind: "capture",
  mode: "pending-send-activation",
  windowMilliseconds: 6000
}

cleanup = {
  capKind: "cleanup",
  mode: "absolute-controller-monotonic",
  deadlineMilliseconds: m_cleanup + 60000
}

fulfillment = {
  kind: "cap-arm-result",
  capKind,
  armState
}

armState = "armed" für setup|cleanup
armState = "pending" für capture
```

Deadlines müssen endlich, nichtnegativ und sicher darstellbar sein. Setup- und
Cleanupcap sind bei positivem Ack scharf. Der Capturecap ist bei `pending`
noch nicht aktiv; seine Aktivierung ist ausschließlich Bestandteil des
atomaren Evaluate-Sende-Acks. Capereignisse werden nur über die zugehörige
flüchtige `cap-arm`-`intentId` korreliert. Ein zweites Arm derselben Phase oder
ein nach kontrolliert beobachtetem Fulfillment falsches Ackprofil ist vor Start
Foundationfehler, nach Start und vor `O0` sticky `V`, nach `O0` dagegen
ausschließlich `cleanupViolation` sowie je nach verlorener Finalisierbarkeit ein
fehlgeschlagener Cleanupcheck oder `cleanup-terminal-failure`. Ein malformed
Promise-Kandidat, Promiseprofil-Reflectionthrow oder native-Then-Throw vor
Handlerzutritt folgt stattdessen mit höherer Präzedenz der globalen
`settlement-unobservable`-Regel und niemals dieser phasenlokalen Ableitung.

Für den Capture-Arm nach `attemptStarted` ist die Ableitung enger und total:
Nur der exakte Ack setzt `pending-activation` und öffnet den einzigen
Evaluate-Send. Beobachtete Rejection oder ein nach beobachtetem Fulfillment
malformed Ack setzt vor jeder Quieszenz `closeClass: V`,
`controllerEvaluateIntentCount: zero`,
`Runtime.evaluate.observedCountClass: zero` und den Capturecap
`activation-unknown`; danach folgt genau ein Cancel nach der oben
ausgeschriebenen Rejection-Cancelmatrix. Wird dagegen bereits das
Capture-Arm-Settlement durch Portthrow, malformed Promisekandidat,
Promiseprofil-Reflectionthrow oder native-Then-Throw unobservable, wird das
vollständige globale Closed-Tupel gesetzt, der Capturecap bleibt
`terminal-unknown`, `closeClass` wird `V` und
`controllerEvaluateIntentCount` sowie
`Runtime.evaluate.observedCountClass` `zero`. Dann gibt es weder Cancel noch
weiteren Portaufruf; `O0` wird unmittelbar erzeugt und ausschließlich lokale
Cleanup-Terminalisierung ist zulässig. Ein gültiges pending Capture-Arm-Promise
hält den Run unbegrenzt pending.

Auch die beiden übrigen Arms sind total. Beim Setup-Arm vor `attemptStarted`
setzt nur der exakte Ack `armed`; beobachtete Rejection oder malformed Ack
setzt `activation-unknown` und verlangt den genau einen Best-effort-Cancel,
unobservables Arm-Settlement setzt das vollständige globale Closed-Tupel und
endet ohne Cancel statisch, pending bleibt pending. Beim
Cleanup-Arm nach `O0` setzt nur der exakte Ack `armed`; beobachtete Rejection
oder malformed Ack setzt `activation-unknown`, `cleanupViolation` und
`cleanup-terminal-failure` und verlangt den einmaligen
`cleanup-arm-recovery`-Cancel. Unobservables Arm-Settlement setzt das
vollständige globale Closed-Tupel und führt ohne Cancel oder Folge-Exchange
ausschließlich zur lokalen Cleanup-Terminalisierung; ein gültiges pending Arm-Promise hält den
Run pending. Keiner dieser Cleanupausgänge verändert `O0`.

#### `cap-cancel`

```text
payload = {
  capKind,
  armIntentId
}

fulfillment = {
  kind: "cap-cancel-result",
  capKind,
  armIntentId,
  cancelState: "cancelled"
}
```

Ein Cancel wechselt einen cancelbaren Zustand zu `cancel-pending`. Der exakte
Ack ergibt `cancelled`. Eine kontrolliert beobachtete Rejection oder ein nach
beobachtetem Fulfillment malformed beziehungsweise falsch korrelierter Ack ist
ein `observed-settlement`, gibt die Lease zu `idle` frei und ergibt
`terminal-unknown`. Portthrow, malformed Promisekandidat,
Promiseprofil-Reflectionthrow oder native-Then-Throw vor Handlerzutritt machen
das Settlement unobservable und setzen mit höchster Präzedenz das vollständige
globale Closed-Tupel. Es gibt keinen Retry. Nach einem beobachteten terminalen
Cancelergebnis wird der festgelegte Fehler- oder Cleanup-Pfad fortgesetzt,
solange dieser den weiterhin offenen Port verwenden darf. Nach unobservablem
Settlement wird ausschließlich lokal und portlos finalisiert; es folgen weder
ein zweiter Cancel noch irgendein anderer Exchange. Ein gültiges niemals
settelndes Cancel-Promise darf den gesamten Lauf unbegrenzt pending halten.

Die totale Cancelmatrix lautet:

- `setupReady`: den Setupcap vor Capturearm und Evaluate genau einmal canceln;
  beobachtete Cancel-Rejection oder malformed Ack setzt sticky `V`, Capture und
  Evaluate bleiben geschlossen; unobservables Settlement folgt dem globalen
  Closed-Tupel und lässt ausschließlich lokale portlose Finalisierung zu;
- nicht aus einer kontrollierten Rejection stammendes gewöhnliches
  `U/setup-terminal-unproven`, Setup-`V` und Capture-`V` bei live oder
  aktivierungsunklarem Cap, **nur solange Lease `idle` und der Port offen sind**:
  zuerst den
  Observation-Snapshot einfrieren, danach genau einen Cancel als erste
  Cleanup-Control-Aktion versuchen;
- erstes irreversibles `connection-closed` im Capture bei aktivem Capturecap:
  `U/capture-terminal-unproven`, `captureWindowState: truncated`, dann genau
  einen Capture-Cancel **vor** dem Snapshot; ein exakter Ack bewahrt `U`, ein
  beobachteter Rejection- oder malformed-Ack-Ausgang promoviert vor dem Snapshot
  zu sticky `V`; unobservables Settlement promoviert ebenfalls zu `V`, setzt
  jedoch zusätzlich das globale Closed-Tupel und lässt nach `O0` nur portlosen
  Cleanup zu. Ein gültiges pending Cancel-Promise hält den Run ohne Snapshot
  unbegrenzt pending;
- beobachtete Rejection des `Runtime.evaluate`-Exchange-Promises bei
  `pending-activation`: zuerst der spezifische sticky-`V`-Übergang, dann genau
  ein Capture-Cancel für die bekannte Arm-Intent-ID und erst nach dessen
  terminalem Ausgang der Snapshot; ein pending Cancel hält den Run ohne
  Snapshot pending;
- ein durch rohe Deadline oder korrektes `cap-fired` bereits `fired`
  gesetzter Cap erzeugt keinen Cancel;
- nach natürlicher Terminalität der Checks 1 bis 19 den Cleanupcap vor Check 20
  genau einmal canceln.

Ein vor `attemptStarted` nach beobachteter Rejection oder malformed Fulfillment
bei wieder `idle` nutzbarer Lease unklar gebliebener Setup-Arm erzeugt mit der
bekannten Arm-Intent-ID genau einen Best-effort-Cancel. Nach dessen terminalem
Ausgang entsteht ausschließlich der statische Foundationfehler ohne Projection
oder Ledger; ein pending Cancel-Promise hält auch diesen Pfad pending. Ist schon
das Arm-Settlement unobservable, bleiben Lease und Port dagegen `closed`, der
Cap wird `terminal-unknown`, und der statische Fehler folgt ohne Cancel oder
weiteren Exchange.

Ein durch beobachtete Rejection oder malformed Ack terminal fehlgeschlagener
Setup-Cancel nach `setupReady` bleibt sticky `V`; nach dem Snapshot beginnt
Cleanup ohne zweiten Setup-Cancel. Ein entsprechend beobachtet terminal
fehlgeschlagener Setup- oder Capture-Cancel als Cleanup-Control-Aktion setzt
`cleanupViolation` und lässt bei weiterhin offenem Port die sicheren
Cleanupschritte laufen. Ein unobservables Cancel-Settlement setzt stattdessen
das globale Closed-Tupel und erlaubt nur portlose lokale Terminalisierung. Beim
vor dem Snapshot ausgeführten Capture-Cancel nach
Evaluate-Rejection gilt enger: exakter Ack ergibt `cancelled`, sticky `V`
bleibt; beobachtete Cancel-Rejection oder malformed Ack ergibt
`terminal-unknown`, sticky `V` bleibt und das spätere Ledger startet mit
`cleanupViolation: true`; unobservable Settlement schließt die Lease und den
Port gemäß vollständigem Closed-Tupel und erlaubt nur lokale portlose
Cleanup-Terminalisierung; ein gültiges pending Cancel bleibt die unbegrenzte
Livenessgrenze. Eine fehlgeschlagene abschließende Cleanupcap-Stornierung ist
dagegen ein irreversibler Cleanup-Controlfehler mit
`cleanup-terminal-failure`.

#### `protocol-command-send`

Jede Payload besitzt exakt:

```text
{
  commandId,
  command,
  sessionId,
  captureArmIntentId,
  params
}
```

`commandId` ist ein flüchtiger, bei `1` beginnender, lückenlos steigender
positiver Safe Integer. `sessionId` ist `null` für `Target.getTargets`,
`Target.attachToTarget` und `Target.detachFromTarget`, sonst die gebundene
Session. `captureArmIntentId` ist nur bei `Runtime.evaluate` die positive ID
des pending Capture-Arms und sonst `null`. Die sechs allein zulässigen
Profile sind:

```text
Target.getTargets
  params = {}

Target.attachToTarget
  params = { targetId, flatten: true }

Network.enable
  params = {}

Runtime.evaluate
  params = {
    expression,
    awaitPromise: true,
    returnByValue: true,
    generatePreview: false
  }

Network.disable
  params = {}

Target.detachFromTarget
  params = { sessionId }
```

Reguläre Fulfillments besitzen exakt:

```text
{
  kind: "protocol-command-send-result",
  commandId,
  sendState: "sent"
}
```

Nur für `Runtime.evaluate` lautet `sendState` exakt
`sent-and-capture-cap-started`. Dieser eine Ack bestätigt atomar sowohl den
Evaluate-Sendeübergang als auch den Start des zuvor pending Capturefensters;
eine Send-zu-Arm-Lücke existiert nicht. Ein Send gilt erst mit gültigem Ack.
Falscher Command, Parameter, Session, Armbezug oder Ack, ein zweiter Send oder
eine Überschreitung setzt nach Start und vor `O0` sticky `V`. Nach `O0` setzen
Cleanupkommandofehler ausschließlich `cleanupViolation` und den zugehörigen
Cleanupcheck `failed` beziehungsweise bei verlorener sicherer
Finalisierbarkeit `cleanup-terminal-failure`; sie verändern den eingefrorenen
Sendcount nicht. Antworten und Dubletten verändern den Sendcount nie.

Eine durch den kontrollierten Handler beobachtete Rejection des genau einmal
übergebenen `Runtime.evaluate`-Exchange-Promises ist ein
`observed-settlement`,
aber weder ein bestätigter Send noch ein bestätigtes Nichtsenden. Der
intent-spezifische Übergang aus `cap = pending-activation` ist zwingend:

```text
lease = idle
closeClass = V
cap = activation-unknown
controllerEvaluateIntentCount = one
Runtime.evaluate.observedCountClass = unknown
Runtime.evaluate.result = unproven
mainWorldEvaluationCount = unknown
transportFactoryCallCount = unknown
factoryCallCount = unknown
transportCallCount = unknown
evaluateReplyCountClass = unknown
productEvidenceComplete = false
captureWindowState = truncated
publicSettlement = null
```

`truncated` bedeutet hier nur, dass das vorgesehene Capture keinen bestätigt
regulären Abschluss erreichte; es behauptet keine tatsächliche Capaktivierung.
Ohne den exakten Ack `sent-and-capture-cap-started` bleiben tatsächlicher Send,
Auswertung, Factoryaufruf, Transportaufruf und Capaktivierung unbekannt. Ein
möglicherweise später ausgeführter Stimulus wird weder ausgeschlossen noch als
beobachtet behauptet. Danach ist ausschließlich genau ein `cap-cancel` für die
bekannte Capture-Arm-Intent-ID zulässig. Es gibt keinen zweiten Evaluate-Send
und kein Capture-Dequeue.

Seine vier Ausgänge sind geschlossen:

```text
exakter Cancel-Ack
  -> cap = cancelled
  -> closeClass bleibt V
  -> O0, danach regulärer Cleanup

beobachtete Cancel-Rejection oder malformed Ack
  -> cap = terminal-unknown
  -> closeClass bleibt V
  -> O0, danach Cleanup mit cleanupViolation = true
     und ohne positive Cancel- oder Capquieszenzbehauptung

Cancel-Settlement unobservable
  -> vollständiges globales Closed-Tupel
  -> closeClass bleibt V
  -> O0, danach ausschließlich lokale portlose Cleanup-Terminalisierung
  -> kein zweiter Cancel und kein sonstiger Exchange

gültiges Cancel-Promise bleibt pending
  -> Run bleibt unbegrenzt pending; kein O0
```

Für diesen Übergang ist das Requestbudget exakt:

```text
defaultTransportCalls = unknown
retries = zero
directDiagnosticFetches = zero
negativeOriginRuns = zero
redirectRuns = zero
observerProductEndpointRequests = zero
endpointOptions = unknown
endpointPosts = unknown
endpointOtherMethods = unknown
sequence = incomplete
requestBudgetFinalized = true
```

Die `zero`-Werte bezeichnen ausschließlich durch die Foundation geschlossene
eigene Pfade; sie behaupten nichts über beliebige Wirkungen der fremden
Capability.

#### `observation-dequeue`

```text
payload = { phase }
phase = setup | capture | cleanup
```

Es gibt keinen Fulfillmentwert für „Queue leer“. Solange kein Wert verfügbar
ist, bleibt das native Promise pending. Ein Fulfillment ist ausschließlich
eine der folgenden geschlossenen Varianten mit exakt dieser Own-Keyfolge:

```text
{ kind: "cdp-message", value }
{ kind: "cap-fired", capKind, armIntentId }
{ kind: "connection-closed" }
{ kind: "cleanup-fact", checkId, fact }
```

`capKind` ist `setup`, `capture` oder `cleanup`; `armIntentId` ist die positive
`cap-arm`-Intent-ID des betreffenden Caps. `cleanup-fact` ist nur in der
Cleanup-Phase zulässig, `checkId` muss der aktuell erwarteten externen
Cleanup-Step-ID entsprechen und `fact` ist ausschließlich ein primitiver
Boolean. Setup und Capture akzeptieren nur CDP-Nachrichten, korrelierte
Capereignisse oder Connection-Close.

Jeder Fulfillmentgraph wird zunächst vollständig unreflektiert gehalten.
Danach erfolgt genau ein phasenpassendes Clock-Sample. Für Setup und Cleanup
hat anschließend der rohe Vergleich `m_answer >= deadline` Vorrang vor jeder
Envelope-Reflection: Der bereits bestätigt scharfe Cap wird allein aus seinem
gebundenen Zustand und der Rohzeit `fired`; der gesamte Dequeuewert wird
ungelesen verworfen. Setup geht zu `U/setup-cap`, Cleanup zu `cleanup-cap`.
Der Inhalt muss und darf dabei nicht als `cap-fired` erkannt werden; daraus
folgt keine Timer- oder Adapterprovenienz.

Nur unterhalb der absoluten Deadline wird die Hülle reflektiert. Ein dort exakt
korreliertes Setup- oder Cleanup-`cap-fired` ist vorzeitiges Feuern: Setup setzt
sticky `V`, Cleanup `cleanupViolation`. Der Capturecap wird dagegen
ausschließlich durch ein exakt korreliertes `cap-fired` des atomar aktivierten
Capture-Arms `fired`; ein bereits bestehendes `V` behält Präzedenz.
Envelope-Dublette, falsche Phase oder Korrelation ist nach Start und vor `O0`
sticky `V`; nach `O0` wird ausschließlich `cleanupViolation` gesetzt und der
betroffene Check beziehungsweise die Control-Ebene gemäß Abschnitt 12
totalisiert. Fehlende Antwort entsteht ausschließlich bei verarbeiteter
absoluter Deadline, verarbeitetem Capturecap oder irreversiblem
Connection-Close.

Das erste irreversible `connection-closed` im Setup ergibt
`U/setup-terminal-unproven`. Im Capture ergibt es ohne bereits sticky `V`
`U/capture-terminal-unproven`, setzt das Capturefenster `truncated`, verbietet
weitere CDP-Sends und verlangt bei aktivem Capturecap dessen einmaligen Cancel
vor dem Snapshot gemäß Cancelmatrix. Es behauptet weder ein Feuern noch ein
Nichtfeuern des Caps. Eine zweite Connection-Close-Hülle ist in Observation
sticky `V`, nach dem Snapshot ausschließlich `cleanupViolation`.
Connection-Close und Capturecap konkurrieren nur durch die bereits gebundene
controllerlokale Dequeue-Reihenfolge: Wird das korrelierte Capereignis zuerst
verarbeitet, gilt `C`; wird der erste Connection-Close zuerst verarbeitet,
gilt der vorstehende Capture-Terminalpfad, und ein späteres Capture-Dequeue ist
geschlossen.

#### `cleanup-step`

```text
payload = {
  checkId,
  action
}

fulfillment = {
  kind: "cleanup-step-result",
  checkId,
  stepState: "accepted"
}
```

Die einzige Step-Allowlist und Zuordnung lautet:

| `checkId` | `action` |
| --- | --- |
| `debugPipeClosed` | `close-debug-pipe` |
| `browserStopped` | `stop-browser` |
| `devServerStopped` | `stop-dev-server` |
| `gatewayStopped` | `stop-gateway` |
| `profileRemoved` | `remove-profile` |
| `harnessFragmentsRemoved` | `remove-harness-fragments` |
| `permissionSiteCacheAndServiceWorkerStateCleared` | `clear-profile-site-state` |
| `environmentRestored` | `restore-environment` |
| `portsFree` | `verify-bound-ports-free` |
| `repositoryAndIndexRestored` | `verify-repository-index-restored` |
| `historicalEvidenceHashUnchanged` | `verify-historical-evidence-hash` |
| `observerStorageLogAndTelemetryResidueAbsent` | `verify-observer-residue-absent` |

Nach dem Ack folgt genau ein passendes `cleanup-fact`. Für alle zwölf
adapterabhängigen Rohfakten gilt ausnahmslos: `false -> failed`, aber
`true -> unproven`. Ein positiver Callerwert bestätigt weder den gleichnamigen
Cleanup- oder Integritätscheck noch einen späteren Record; der
identitätsgebundene Adapter muss jede positive Provenienz neu ableiten.
Fertige Statuswerte wie `confirmed`, `failed`, `PASS` oder `UNPROVEN` sind als
Portdaten verboten.

Eine beobachtete Rejection oder ein nach beobachtetem Fulfillment malformed
Ack des exakt gebundenen aktuellen Steps setzt dessen Check `failed`; ein
malformed Profil setzt zusätzlich `cleanupViolation`, danach folgt der nächste
weiterhin sichere Schritt. Eine sicher lesbare fremde oder doppelte ID setzt
dagegen `cleanupViolation` ohne zufällige Checkattribution und erhält den
aktuellen Purpose. Portthrow, malformed Promisekandidat,
Promiseprofil-Reflectionthrow oder native-Then-Throw machen das Settlement
unobservable, schließen den Port und führen gemäß Abschnitt 12 ausschließlich
lokal zu `cleanup-terminal-failure`. Ein gültiges niemals settelndes Promise
bleibt pending. Nur ein durch kontrollierten Handler beobachteter Disablefehler
oder ein nach beobachtetem Fulfillment malformed Ack verhindert bei weiterhin
offenem Port den terminalen Detach-Sendeversuch oder die übrigen sicheren
Cleanupversuche nicht. Ein unobservables Disable-Settlement unterdrückt
dagegen Detach und jeden weiteren Exchange.

### 5. Startgrenze und Ablaufzustände

Der Versuch existiert erst nach exakt dieser Sequenz:

```text
capability-probe positiv
-> controller-clock-sample(setup-origin) liefert gültiges m_setup
-> setupDeadline = m_setup + 6000 sicher darstellbar
-> cap-arm(setup) positiv scharf
-> Stage 1 observer-armed frisch eingefroren
-> attemptStarted
```

Formal:

```text
attemptStarted :=
  Portprofil bestätigt
  && Clock- und Capfähigkeit bestätigt
  && m_setup gültig
  && setupDeadline sicher darstellbar
  && Setupcap bestätigt scharf
  && Stage 1 observer-armed eingefroren
```

Vor dieser Grenze führen falsche Factory- oder Run-Arity, malformed
`runBinding`, unbrauchbarer Port, ungültiges `m_setup`, Deadlineüberlauf sowie
interne Kopier- oder Freeze-Fehler ausschließlich zum statischen
Foundationfehler. Eine kontrolliert beobachtete Rejection oder ein nach
beobachtetem Fulfillment malformed Ack gibt die Lease zunächst zu `idle` frei
und folgt einschließlich eines gegebenenfalls vorgeschriebenen einmaligen
Setup-Arm-Cancels seiner intent-spezifischen Pre-start-Regel. Synchroner
`exchange`-Throw, malformed Port-Promise, Promiseprofil-Reflectionthrow oder
native-Then-Throw setzt stattdessen mit höchster Präzedenz das globale
Closed-Tupel und endet ohne Cancel oder weiteren Exchange statisch. In jedem
Fall existieren weder Projection, Pre-Cleanup-Snapshot noch Cleanup-Ledger.
Diese Regel ersetzt die frühere nicht terminale Behandlung eines ungültigen
`m_setup` als frühes `V`.

Nach Start laufen `Target.getTargets`, `Target.attachToTarget` und
`Network.enable` strikt sequenziell mit höchstens einer ausstehenden
Kommandoantwort unter derselben absoluten Deadline. Nur drei eindeutig
korrelierte, erfolgreiche und vollständig validierte Antworten setzen
`setupReady`. Danach wird zuerst der Setupcap terminal storniert. Nur sein
exakter positiver Cancel-Ack erlaubt, den Capturecap pending zu erzeugen und
`Runtime.evaluate` genau einmal zu senden. Beobachtete Cancel-Rejection oder
malformed Ack setzt den Setupcap `terminal-unknown`, sticky `V`, schließt
Capture und Evaluate und führt zu `O0` mit negativer Capbehauptung und initialem
`cleanupViolation`. Unobservables Settlement setzt zusätzlich Lease und Port
`closed` und erlaubt nach `O0` ausschließlich lokale Cleanup-Terminalisierung.
Ein gültiges pending Cancel hält den Run ohne `O0` pending. Es gibt keinen
zweiten Cancel. Der
gültige Evaluate-Sende-Ack startet das 6.000-ms-Capturefenster atomar.

Die Zustände bleiben:

```text
setupReady := alle drei Setupantworten gültig
U := Setup oder Capture ist terminal nicht beweisbar
V := sticky bestätigte Port-, Ack-, Descriptor-, Envelope-, Ablauf-
     oder Budgetverletzung
C := korreliertes verarbeitetes capture-cap-fired
closeClass := null | U | V | C

setupClosed       := setupReady || U || V
observationClosed := V || U || C

S := genau ein gültiger Main-World-Settlementkandidat
N := genau ein eindeutig dem POST zugeordnetes loadingFinished
     oder loadingFailed
productEvidenceComplete := S && N
```

Bei jedem Dequeue bleibt der Fulfillmentgraph zunächst vollständig
unreflektiert; danach wird genau ein phasenpassender Clockwert `m_answer`
erfasst. Für Setup entscheidet anschließend ausschließlich
`m_answer >= setupDeadline` vor jeder Envelope-Reflection. Gleichheit gehört
zum Cap. Der bestätigt scharfe Setupcap wird aus gebundenem Zustand und Rohzeit
`fired`, der Dequeuewert ungelesen verworfen und
`U/setup-cap` gesetzt. Nur `m_answer < setupDeadline` erlaubt die begrenzte
synchrone Prüfung. Ein darunter exakt korreliertes Setup-`cap-fired` ist
vorzeitiges Feuern und setzt sticky `V`.

Throw, negative, nicht endliche, vor `m_setup` liegende oder gegenüber dem
letzten gültigen Sample rückläufige Werte sind `V`. Es gibt keine zweite
Abtastung; persistierte Rundung beeinflusst die rohe Capentscheidung nie.
`U/setup-terminal-unproven` entsteht durch eindeutig terminale, aber nicht
erfolgreiche oder nicht eindeutige Setupresultate oder irreversibles
Connection-Close. Eine leere Queue oder bloßes Noch-nicht-Eintreffen reicht
nicht. Nach diesem Setup-`U` bleiben Evaluation, Factory und Stimulus `zero`, gegatete
Downstreamkommandos `zero/unproven`, nicht zuverlässig beobachtete
Networkcounts `unknown`, die Sequenz `incomplete` und das Capturefenster
`not-started`.

Ohne `V` bleibt Capture trotz `S && N` bis `C` offen. Ein bestätigt
korreliertes Capture-`cap-fired` des atomar aktivierten Arms setzt den Cap
`fired` und `C`; ein bestehendes `V` behält Präzedenz. Ansonsten entscheidet
bei Gleichzeitigkeit die controllerlokale Dequeue-Reihenfolge.

Beim ersten irreversiblen Connection-Close im Capture gilt ohne bereits sticky
`V` zunächst `U/capture-terminal-unproven`; `captureWindowState` ist
`truncated`, und ein aktiver Capturecap wird genau einmal **vor** dem Snapshot
storniert. Der exakte Cancel-Ack setzt `cancelled`, bewahrt `U` und führt zu
`O0` mit regulärem Cleanup. Beobachtete Cancel-Rejection oder malformed Ack
setzt `terminal-unknown`, promoviert zu sticky `V` und führt zu `O0` mit
negativer Capbehauptung und initialem `cleanupViolation`. Unobservables
Settlement setzt das vollständige globale Closed-Tupel, promoviert zu `V`,
führt zu `O0` und erlaubt danach ausschließlich lokale portlose Cleanup-
Terminalisierung. Ein gültiges pending Cancel-Promise hält den Run ohne `O0`
unbegrenzt pending. Kein Ausgang erlaubt einen zweiten Cancel oder ein weiteres
Capture-Dequeue; der unobservable Ausgang erlaubt überhaupt keinen weiteren
Exchange.

Die beobachtete Rejection des `Runtime.evaluate`-Exchange-Promises fällt
niemals in einen allgemeinen `V`-Catch-all. Nach Freigabe der Lease gilt der in
Abschnitt 4 festgelegte spezifische Übergang zu sticky `V` und
`activation-unknown`. Danach folgt ausschließlich der einmalige Capture-Cancel
für die bekannte Arm-Intent-ID; erst nach dessen terminalem Ausgang,
einschließlich unobservablem Settlement, entsteht der Snapshot. Der exakte Ack
ergibt `cancelled`; beobachtete
Cancel-Rejection oder malformed Ack ergibt `terminal-unknown` und initialisiert
nach dem Snapshot `cleanupViolation: true`; unobservable Settlement ergibt
das vollständige globale Closed-Tupel und ausschließlich lokale portlose
Cleanup-Terminalisierung; ein gültiges pending Cancel-Promise lässt den Run
unbegrenzt pending. Kein Pfad sendet ein zweites Evaluate oder dequeuet im
Capture.

In allen übrigen, nicht aus einer kontrollierten Rejection oder dem besonderen
Capture-Connection-Close stammenden `U`-, `V`- oder `C`-Pfaden entsteht nur bei
Lease `idle` und weiterhin offenem Port zuerst ein frischer tief eingefrorener
Pre-Cleanup-Observation-Snapshot. Danach wird ein live oder aktivierungsunklar
gebliebener Setup- beziehungsweise Capturecap gemäß der Cancelmatrix als erste
Cleanup-Control-Aktion genau einmal storniert. Bereits `fired` gesetzte Caps
werden nicht storniert. Unmittelbar danach werden die private Cleanupableitung,
Stage 9 und die zunächst internen Checkzustände angelegt. Erst dann wird
`m_cleanup` genau einmal erfasst, der absolute Cleanupcap `m_cleanup + 60000`
sicher berechnet und armiert. So können auch eine ungültige Cleanup-Origin-
Clock, eine unsichere Deadline oder ein nicht herstellbarer Cap total zu
`cleanup-terminal-failure` und einer Projection führen; das Cleanup-Ledger wird
erst nach dieser Totalisierung final eingefroren. Nur ein beobachtet terminal
fehlgeschlagener Setup- oder Capture-Cancel setzt `cleanupViolation`, ohne bei
offenem Port die weiterhin sicheren Cleanupschritte zu verhindern. Jeder
`settlement-unobservable`-Pfad ist von dieser Regel ausgeschlossen, erzeugt
`O0` unmittelbar nach der globalen Phasenregel und finalisiert danach portlos.
Nach dem Snapshot wird `V` nie mehr verändert.

### 6. Descriptor-, Ressourcen- und CDP-Grenzen

Eine zulässige konsumierte Eingabeproperty ist ausschließlich eine eigene,
aufzählbare Data-Property ohne Getter oder Setter. `writable` und
`configurable` begründen keine Provenienz. Für jeden geschlossenen
unvertrauenswürdigen Knoten gelten exakt:

- `Reflect.ownKeys` einmal;
- `getPrototypeOf` einmal;
- jeder erforderliche Own-Descriptor einmal;
- Werte ausschließlich aus den gecachten Descriptoren;
- danach keinerlei erneute Property-, Key-, Prototyp- oder Descriptorlesung
  desselben Knotens.

Geschlossene Records verlangen dabei die exakte Own-Key-Reihenfolge
einschließlich Symbolverbot. Für Arrays werden zusätzlich genau ein
`length`-Descriptor und genau ein Descriptor je erlaubtem Index gelesen.
Factoryoptions, `effectPort`, `runBinding`, dessen beide Beobachtungsrecords,
`replayOperands`, jeder seiner 59 Einträge sowie alle geschlossenen Ack- und
Dequeueprofile unterliegen derselben Exact-once-Regel.

Offene CDP-Hüllen werden nie vollständig aufgezählt. Ausschließlich die im
jeweiligen Profil erlaubten Descriptoren werden höchstens einmal gelesen;
nicht allowlistete Werte bleiben unangetastet. Auf unvertrauenswürdigen Graphen
sind `hasOwn`, `in`, Destructuring, Spread, `Object.assign`, freie
Propertyauflösung, Iteratoren, JSON-Roundtrip, nachträgliche
Validierungs-Rereads, Freezing und Mutation verboten. Reflection verwendet nur
bei Modulevaluation erfasste Intrinsics.

Ein Reflectionthrow während der synchronen Dependencyprüfung der Factory wird
auf den exakten Dependency-`TypeError` abgebildet. Nach erfolgreicher Factory
und Ownerübernahme gilt diese phasenlokale Ableitung ausschließlich für
Dependency-, Eingabe- oder Fulfillmenthüllen-Reflection nach einem
`observed-settlement`: vor `attemptStarted` statischer Foundationfehler, nach
`attemptStarted` und vor `O0` sticky `V`; nach `O0` bleibt der Snapshot
unverändert, im Cleanup wird ausschließlich `cleanupViolation` gesetzt und
zusätzlich der durch das konsumierte Profil betroffene Check `failed`. Ein
Promiseprofil-Reflectionthrow vor Handlerzutritt ist hiervon ausdrücklich
ausgenommen und folgt immer der globalen `settlement-unobservable`-Regel ohne
Cancel oder Folge-Exchange. Betrifft ein beobachteter Reflectionthrow die
Cleanup-Control-Ebene, greift deren totale
`cleanup-terminal-failure`-Ableitung. Frische Outputs besitzen
vor Freeze normale Deskriptoren und danach ausschließlich aufzählbare, nicht
schreibbare und nicht konfigurierbare Own-Data-Properties.

Die festen Grenzen lauten:

```text
targetInfosInspectionMaximum = 128
ephemeralIdentifierCodeUnitsMaximum = 256
dequeuedObservationsMaximum = 128
cdpUrlCodeUnitsMaximum = 2048
httpMethodTokenCodeUnitsMaximum = 16
```

`targetId`, `sessionId` und `requestId` sind nichtleere primitive Strings mit
höchstens 256 UTF-16-Codeunits. CDP-URLs sind primitive Strings mit 1 bis 2048
Codeunits und werden codeunitgenau ohne Normalisierung verglichen. Eine
HTTP-Methode ist ausschließlich ein ASCII-HTTP-Token aus Buchstaben, Ziffern
und der festen tchar-Zeichenmenge `! # $ % & ' * + - . ^ _ | ~` mit 1 bis 16
Codeunits. Die vier erwarteten
Network-Methoden sind ohnehin feste Literale.

`targetInfos.length` muss der eigene native Array-Längendescriptor und ein
nichtnegativer Safe Integer sein. `length > 128` erzeugt
`U/setup-terminal-unproven`, ohne irgendeinen Elementwert zu lesen. Bis 128
muss das Array gewöhnlich, dicht, ohne Hole, Symbol, Zusatzkey oder Accessor
sein. Ein Reflectionthrow oder Profilfehler nach eindeutiger Korrelation ist
`V`. Zuerst werden alle Einträge mit `type === "page"` und exakter gebundener
Top-Level-URL unabhängig von `attached` gezählt. Nur genau ein Kandidat erlaubt
die Prüfung `attached === false` und danach die Bindung seines `targetId`.
Andere IDs werden weder gespeichert noch ausgegeben.

Das Dequeue-Limit zählt jedes erfüllte `observation-dequeue` von
`attemptStarted` bis zur Cleanupfinalisierung. Der 129. Wert ist vor `O0`
sticky `V`; nach `O0` setzt er ausschließlich `cleanupViolation` und
`cleanup-terminal-failure`, ohne den Snapshot zu verändern. Byte-, Parser-,
Raw-Pipe-, Prozess- und Queuecaps bleiben Adapterthema.

Die sechs allein zulässigen CDP-Kommandos und Erfolgsresultate sind:

```text
Target.getTargets.result     = { targetInfos }
Target.attachToTarget.result = { sessionId }
Network.enable.result        = {}
Runtime.evaluate.result      = { result: Runtime.RemoteObject }
Network.disable.result       = {}
Target.detachFromTarget.result = {}
```

Ein Antwortkandidat benötigt die eigene Data-Property `id` mit der ausstehenden
Command-ID; sessiongebundene Antworten zusätzlich `sessionId` mit der
gebundenen Session. Setup-CDP-Fehler mit eigenem normalen `error` führen zu
`U`, ohne den Fehlerwert zu lesen. Malformed `error` oder angebliche
Erfolgsresultate sind nach `attemptStarted` und vor `O0` sticky `V`; nach `O0`
gelten ausschließlich die Purpose- und `cleanupViolation`-Regeln aus Abschnitt
12. Ein vor `O0` korrelierter Evaluate-Fehler,
`exceptionDetails`, Remote-Handle, Preview oder verbotenes Ergebnisprofil ist
`V`.

Für `Runtime.evaluate` ist die Konsumreihenfolge exakt: Response-ID und Session
korrelieren; Own-Presence von `error`; Methodenergebnis-`result`; Own-Presence
von `exceptionDetails`; darin RemoteObject-`result`; dessen eigene
Data-Properties `type` und `value`; anschließend Own-Presence der verbotenen
Felder `objectId`, `unserializableValue`, `deepSerializedValue`, `preview` und
`customPreview`. `type` muss exakt `object` sein. Es gibt weder Handle,
`Runtime.getProperties`, `Runtime.releaseObject`, Object-ID-Dereferenzierung
noch Folgeinspektion. Nur die erlaubten primitiven Blätter der geschlossenen
v2-Projektion werden sofort in einen frischen controller-eigenen Graph kopiert;
alle Hüllen und Routingwerte werden verworfen.

### 7. Network-Grammatik, Zählungen und Stage 7

Erlaubt sind ausschließlich:

```text
Network.requestWillBeSent
Network.responseReceived
Network.loadingFinished
Network.loadingFailed
```

Die offenen Eventhüllen stellen als eigene Data-Properties nur `method`,
`sessionId` und `params` zur Verfügung. Danach dürfen ausschließlich folgende
Pfade konsumiert werden:

```text
requestWillBeSent:
  params.requestId
  params.request.url
  params.request.method
  params.timestamp

responseReceived:
  params.requestId
  params.response.url
  params.response.status
  params.timestamp

loadingFinished:
  params.requestId
  params.timestamp

loadingFailed:
  params.requestId
  params.timestamp
```

`loadingFailed.errorText`, Header, Body, Initiator, Redirect-, Frame-, Loader-
und sonstige Metadaten bleiben ungelesen. Session muss exakt gebunden sein.
Status ist ein endlicher nichtnegativer Integer. Timestamp ist eine endliche
nichtnegative primitive Zahl in CDP-Network-Sekunden. Nur innerhalb dieser
Domäne gilt:

```text
d_ms := (timestamp - firstEndpointRequestTimestamp) * 1000
```

Rücklauf, Nichtendlichkeit oder unsicherer Überlauf nach eindeutiger
Endpointkorrelation ist vor `O0` sticky `V`; nach `O0` werden Networkevents
nicht mehr als Observation reflektiert. Es gibt keinen Vergleich mit Controller- oder
Main-World-Zeit. Falsche URL, Methode, Statusfolge oder `loadingFailed` bilden
eine bekannte Produktnetzsignatur `other`, nicht automatisch einen
Obserververstoß. Fehlende Attribution bleibt `unproven`.

`protocolOperations[].observedCountClass` zählt ausschließlich bestätigte
Send-Acks:

```text
kein Send-Intent                 -> zero
genau ein gültiger Send-Ack      -> one
mehrere bestätigte Sends         -> multiple
Send-Intent ohne beweisbaren Ack -> unknown
```

Antworten oder Antwortdubletten ändern diese Klasse nie.
`evaluateReplyCountClass` zählt dagegen ausschließlich eindeutig
korrelierbare Evaluate-Antwortkandidaten: `zero`, `one`, `multiple` oder bei
nicht entscheidbarem Routing `unknown`. Eine eindeutig korrelierte malformed
Antwort zählt vor `O0` als Kandidat und setzt zusätzlich sticky `V`; nach `O0`
wird sie nicht mehr in dieser Observationzählung verarbeitet. Eine formal gültige
`Target.getTargets`-Antwort mit null oder mehreren passenden Targets bleibt
eine Kommandoantwort; Targetprofil und Setup werden jedoch `U`.

Der siebte Stage-Slot ist total:

```text
genau ein loadingFinished
  -> post-loading-finished / observed / match
genau ein loadingFailed
  -> post-loading-failed / observed / mismatch
kein Terminalereignis
  -> post-loading-terminal / not-observed / unproven
mehrere oder widersprüchliche Terminalereignisse
  -> post-loading-terminal / ambiguous / unproven
```

Nur eindeutig beobachtete Varianten erhalten `receiptOrder` und Timing; die
Stagekardinalität bleibt zehn.

### 8. Exakter private Evaluationtext

Der folgende Codeblock enthält den vollständigen künftigen privaten Wert von
`Runtime.evaluate.params.expression`. Sein Inhalt ist exakt ein ASCII-String
ohne CR, LF oder abschließenden Zeilenumbruch. Die Hashdomäne ist ausschließlich
dessen UTF-8-Codierung ohne BOM, Wrapper, JSON-Serialisierung, Trim oder andere
Normalisierung. Der String besitzt 4259 Bytes und SHA-256:

```text
a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b
```

```javascript
(async()=>{const A=Reflect.apply,K=Reflect.ownKeys,D=Object.getOwnPropertyDescriptor,G=Object.getPrototypeOf,F=Object.isFrozen,H=Object.hasOwn,O=Object.prototype,N=Number.isFinite,L=Math.floor;const c=(f,e)=>{try{return f()===e?"match":"mismatch"}catch{return"unproven"}};const p={url:{contextResult:c(()=>globalThis.location.href,"http://127.0.0.1:5173/")},origin:{contextResult:c(()=>globalThis.location.origin,"http://127.0.0.1:5173")},topLevel:{contextResult:c(()=>globalThis.top===globalThis,true)},secureContext:{contextResult:c(()=>globalThis.isSecureContext,true)}};const o=(d,f,t,s)=>({preTransportContext:p,execution:{factoryCallCount:f,transportCallCount:t,dispatchState:d},settlement:s});if(p.url.contextResult==="mismatch"||p.origin.contextResult==="mismatch"||p.topLevel.contextResult==="mismatch"||p.secureContext.contextResult==="mismatch")return o("blocked-context-mismatch","zero","zero",null);if(p.url.contextResult==="unproven"||p.origin.contextResult==="unproven"||p.topLevel.contextResult==="unproven"||p.secureContext.contextResult==="unproven")return o("blocked-context-unproven","zero","zero",null);const q=(v,n,x)=>{const d=D(v,n);return d!==undefined&&H(d,"value")&&!H(d,"get")&&!H(d,"set")&&d.enumerable===true&&d.writable===false&&d.configurable===false&&d.value===x};const h=()=>{try{const v=globalThis.performance.now();return typeof v==="number"&&N(v)?v:null}catch{return null}};const z=(a,b)=>{if(a===null||b===null)return{relativeMilliseconds:null,timingState:"unavailable"};const d=b-a;if(typeof d!=="number"||!N(d)||d<0)return{relativeMilliseconds:null,timingState:"unavailable"};return d>=60000?{relativeMilliseconds:60000,timingState:"at-or-above-cap"}:{relativeMilliseconds:10*L(d/10),timingState:"measured"}};const e=v=>{try{if(v===null||typeof v!=="object"||G(v)!==O||!F(v))return false;const k=K(v),a=D(v,"code"),b=D(v,"message");return k.length===2&&k[0]==="code"&&k[1]==="message"&&a!==undefined&&b!==undefined&&H(a,"value")&&H(b,"value")&&!H(a,"get")&&!H(a,"set")&&!H(b,"get")&&!H(b,"set")&&a.enumerable===true&&a.writable===false&&a.configurable===false&&b.enumerable===true&&b.writable===false&&b.configurable===false&&a.value==="BROWSER_SYNC_TRANSPORT_FAILED"&&b.value==="Der lokale Browser-SyncTransport ist fehlgeschlagen."}catch{return false}};let fc="zero",tc="zero",pp,start;try{const m=await import("/src/transports/browserSyncTransport.js");const f=m.createBrowserSyncTransport;if(typeof f!=="function")throw 0;fc="one";const t=A(f,undefined,[]),tk=K(t),sd=D(t,"sendSyncRequest");if(t===null||typeof t!=="object"||G(t)!==O||!F(t)||tk.length!==1||tk[0]!=="sendSyncRequest"||sd===undefined||!H(sd,"value")||H(sd,"get")||H(sd,"set")||sd.enumerable!==true||sd.writable!==false||sd.configurable!==false||typeof sd.value!=="function")throw 0;const send=sd.value,cp=globalThis.crypto,rd=cp.randomUUID;if(typeof rd!=="function")throw 0;const id="req_"+A(rd,cp,[]),ts=new Date().toISOString(),payload=Object.freeze({}),r=Object.freeze({version:"1.0",action:"syncTest",source:"goldendawn-os",requestId:id,timestamp:ts,payload}),rk=K(r),pk=K(payload);if(G(r)!==O||G(payload)!==O||G(O)!==null||!F(r)||!F(payload)||rk.length!==6||rk[0]!=="version"||rk[1]!=="action"||rk[2]!=="source"||rk[3]!=="requestId"||rk[4]!=="timestamp"||rk[5]!=="payload"||pk.length!==0||D(r,"toJSON")!==undefined||D(payload,"toJSON")!==undefined||D(O,"toJSON")!==undefined||!q(r,"version","1.0")||!q(r,"action","syncTest")||!q(r,"source","goldendawn-os")||!q(r,"requestId",id)||!q(r,"timestamp",ts)||!q(r,"payload",payload)||typeof id!=="string"||id.length<5||id.length>64||!/^req_[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)||typeof ts!=="string"||ts.length!==24||new Date(ts).toISOString()!==ts)throw 0;tc="one";start=h();pp=A(send,undefined,[r])}catch{return o("failed-before-public-settlement",fc,tc,null)}let end,outcome,staticProfileResult;try{await pp;end=h();outcome="fulfilled";staticProfileResult="not-applicable"}catch(v){end=h();if(e(v)){outcome="static-redacted-rejection";staticProfileResult="match"}else{outcome="other-rejection";staticProfileResult="mismatch"}}const timing=z(start,end);return o("dispatched","one","one",{outcome,staticProfileResult,relativeMilliseconds:timing.relativeMilliseconds,timingState:timing.timingState})})()
```

Die Kontextprüfung liegt vor Import, Factory und Transport. Der Text enthält
exakt einen dynamischen Import von
`/src/transports/browserSyncTransport.js`, höchstens einen argumentlosen
Factoryaufruf, genau einen gültigen frischen tief eingefrorenen synthetischen
v1-`syncTest` mit leerem Payload und höchstens einen Transportaufruf. Er gibt
nur die geschlossene v2-Projektion zurück, liest keinen Fulfillmentwert und
führt keine Log-, Storage-, DOM-Mutations-, Debugger-, Fetch- oder
Zusatzoperation aus. Die Dokumentation hasht den String ausschließlich; sie
führt ihn nicht aus. `evaluationSha256` darf diesen Digest tragen, aber seine
Bindung an später tatsächlich gesendete Bytes bleibt bis zum Adapter-ADR
`unproven`.

### 9. FoundationResult und FoundationProjection

`run()` erfüllt ausschließlich mit einem frischen ordinary ECMAScript-Record
mit `[[Prototype]] === null`, exakt sieben Own-Keys in kanonischer Reihenfolge
und ohne Own-Key `then`:

```text
FoundationResult = {
  ok,
  resultType,
  evidenceStatus,
  runtimeAuthorized,
  persistenceAuthorized,
  recordProjection,
  error
}

resultType = "browser-transport-diagnostic-foundation-run-v1"
evidenceStatus = "NOT_EVIDENCE"
runtimeAuthorized = false
persistenceAuthorized = false
```

Der Rootrecord ist geschlossen und tief eingefroren. Die unvermeidliche
Promise-Resolution-Prüfung findet dadurch sicher `undefined`, ohne
Object-Prototype-Manipulations- oder freie Assimilationsgrenze. Die Profile der
verschachtelten Projection- und Errorrecords bleiben gewöhnlich und
unverändert. Das öffentliche Promise stammt ausschließlich aus dem bei
Modulevaluation erfassten lokalen Konstruktor; sein Reject-Resolver wird weder
gespeichert noch aufgerufen und sein Resolve-Resolver exakt einmal verwendet.

Eine terminal ausgewertete Zustandsmaschine erfüllt mit `ok: true`, einer
`FoundationProjection` und `error: null`. Ein lokaler Foundationfehler erfüllt
mit `ok: false`, `recordProjection: null` und exakt:

```text
error = {
  code: "BROWSER_TRANSPORT_DIAGNOSTIC_FOUNDATION_FAILED",
  message: "Die Browser-Transport-Diagnosefoundation ist fehlgeschlagen."
}
```

Falsche Run-Arity, verbrauchte Instanz, Pre-start-Portfehler sowie interne
Kopier-, Projektions- oder Freeze-Fehler verwenden dasselbe Profil. `ok: true`
bedeutet nur, dass die reine Zustandsmaschine terminal ausgewertet wurde.

`FoundationProjection` besitzt exakt 17 Rootfelder in dieser Reihenfolge:

```text
{
  schemaVersion,
  projectionType,
  diagnosticRunId,
  observedAt,
  timeZone,
  historicalEvidence,
  replay,
  observer,
  requestBudget,
  publicSettlement,
  stages,
  timing,
  cleanup,
  adr0029OverallGate,
  candidateObserverGate,
  candidateFinding,
  causeStatus
}

schemaVersion = 1
projectionType = "browser-transport-diagnostic-foundation-projection"
causeStatus = "CAUSE_NOT_PROVEN"
adr0029OverallGate = { before: "FAIL", after: "FAIL", unchanged: true }
```

Sie besitzt weder `recordType` noch echtes `observerGate` oder `finding`, darf
nicht persistiert, serialisiert, veröffentlicht oder als Runtimeevidenz
verwendet werden und ist kein `BrowserTransportDiagnosticRecord`.

Die historische Referenz ist ausschließlich privat fest und besitzt exakt:

```text
historicalEvidence = {
  recordPath,
  recordSha256,
  measurementRunId,
  baseContextId,
  overallGate
}

recordPath = "docs/evidence/browser-runtime-evidence.chrome-stable-windows-01.json"
recordSha256 = "ffad6b1de2e0c32ec5c2cdc3e88bfd455b14adc2eb4dd45f0d81e911e1a64b33"
measurementRunId = "chrome-stable-win-01"
baseContextId = "chrome-stable-win-t0-01"
overallGate = "FAIL"
```

`replay` besitzt exakt:

```text
replay = {
  replayContextId,
  repositoryCommit,
  repositoryState,
  profileInstanceBinding,
  causalContext,
  equivalence
}

profileInstanceBinding = {
  lifecycle,
  newInstanceConfirmed,
  historicalInstanceReused
}

equivalence = {
  relationId,
  comparisons,
  noUnexplainedCausalDeviation,
  result
}

comparison = {
  fieldId,
  comparisonBasis,
  observationState,
  historicalValue,
  replayValue,
  result
}
```

`causalContext` behält die geschlossene ADR-0032-Form mit `hostRuntime`,
`operatingSystem`, `node`, `browser`, `profile`, `networkEnvironment`,
`initialState`, `bindingComparisonProfile`, `frontend`, `transportRequest`,
`gateway` und `toolchain`; seine Blätter stammen ausschließlich aus den
frischen Kopien der Tabelle. `comparisons` ist ein tief eingefrorenes dichtes
Array mit exakt 59 Einträgen in Tabellenreihenfolge, ohne doppelte IDs.

`observer` besitzt exakt:

```text
observer = {
  deltaProfile,
  controllerExclusivity,
  connectionProfile,
  targetProfile,
  foundationSha256,
  evaluationSha256,
  controllerEvaluateIntentCount,
  protocolOperations,
  mainWorldEvaluationCount,
  transportFactoryCallCount,
  primitiveProjectionProfile,
  integrityChecks,
  interferenceObservation
}

deltaProfile = "adr-0030-passive-external-observer-v1"
controllerExclusivity = exclusive | not-exclusive | unknown
connectionProfile = remote-debugging-pipe | other-prohibited | unknown
targetProfile = single-goldendawn-top-level | other | unknown
controllerEvaluateIntentCount = zero | one
mainWorldEvaluationCount = zero | one | multiple | unknown
transportFactoryCallCount = zero | one | multiple | unknown
primitiveProjectionProfile =
  "immediate-closed-by-value-pretransport-context-and-settlement-v2-no-handle"
interferenceObservation =
  none-contract-visible-detected | contract-visible-detected | unknown
```

`foundationSha256` ist in der reinen Projection zwingend `null`;
`sourceUnmodified` bleibt damit `unproven`. `evaluationSha256` ist der
dokumentierte Lower-Hex-Digest oder `null`, aber
`actualEvaluationBytesSent` bleibt unbewiesen.

`protocolOperations` ist ein tief eingefrorenes Array mit exakt sechs
Einträgen in dieser Reihenfolge:

```text
Target.getTargets
Target.attachToTarget
Network.enable
Runtime.evaluate
Network.disable
Target.detachFromTarget

operation = {
  command,
  allowedMaximum,
  observedCountClass,
  result
}

allowedMaximum = 1
observedCountClass = zero | one | multiple | unknown
result = match | mismatch | unproven
```

`integrityChecks` ist ein tief eingefrorenes Array aus exakt
`{ checkId, result }`, `result = confirmed | violated | unproven`, in dieser
Reihenfolge:

```text
sourceUnmodified
instrumentedSourceCopyAbsent
compositionSeamsAbsent
protocolAllowlistOnly
runtimeSurfaceMutationAbsent
fetchInterceptionAbsent
debuggerBreakpointsAndSteppingAbsent
profilerAndTracingAbsent
responseBodyReadAbsent
freeRawInspectionAbsent
additionalNativeFetchAbsent
observerProductEndpointRequestAbsent
rawPersistenceAbsent
observerDiagnosticDuringRunOutputAbsent
closedPrimitiveProjectionConfirmed
singleTargetAndSessionConfirmed
singleMainWorldEvaluationConfirmed
```

Ein positiver Callerwert bestätigt keinen Check, der Commit-, Dateibyte-,
Actual-Send-, Parser-, Pipe-, Adapter- oder Ressourcenprovenienz benötigt.
Malformed Factoryinput benutzt ausschließlich den synchronen
Dependency-`TypeError`; malformed Portinput nach `attemptStarted` und vor `O0`
setzt sticky `V`, nach `O0` ausschließlich `cleanupViolation` und die totale
Cleanupableitung. Dabei gilt weiterhin:
`closedPrimitiveProjectionConfirmed` bleibt `unproven`, wenn keine frische
Outputprojektion existiert. Nur eine fehlerhafte, nicht gefrorene oder
referenzhaltende eigene Outputprojektion ergibt `violated`; nur eine frische,
gewöhnliche, geschlossene, tief eingefrorene und eingabereferenzfreie
Projektion ergibt `confirmed`. Das bewertet niemals die Proxy-, Parser-, Pipe-
oder Raw-Byte-Provenienz der Eingabe.

`requestBudget` besitzt exakt neun Zähler plus Sequenz:

```text
requestBudget = {
  defaultTransportCalls,
  retries,
  directDiagnosticFetches,
  negativeOriginRuns,
  redirectRuns,
  observerProductEndpointRequests,
  endpointOptions,
  endpointPosts,
  endpointOtherMethods,
  sequence
}

jeder Zähler = zero | one | multiple | unknown
sequence =
  OPTIONS-204-POST-200-loadingFinished | other | incomplete | ambiguous
```

Ein vor `O0` bestätigter zweiter Transportaufruf oder POST, Retry, direkter
Diagnose-Fetch oder Observerrequest am Produktendpoint ist sticky `V`. Nach
`O0` bleibt das eingefrorene Budget unverändert; eine dann im Cleanup-Purpose
auftretende fremde Eventhülle wirkt nur nach dessen `cleanupViolation`-Regeln.
Bei einem regulären Stimulus sind
die ersten sechs Zähler `one, zero, zero, zero, zero, zero`; die drei
Endpointzähler sind `one, one, zero`. Fehlende Attribution ist `unknown` und
die Sequenz `ambiguous` oder `incomplete`, niemals erfundene Abwesenheit.
`zero` ist ausschließlich zulässig, wenn die Foundation den betreffenden
eigenen Pfad konstruktiv geschlossen hat; ein Intent, POST oder Reply beweist
weder Transportaufruf noch Sendwiederholung.

`publicSettlement` ist entweder `null` oder besitzt exakt:

```text
{
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

`null` ist zwingend, wenn kein gültiger Main-World-Settlementwert akzeptiert
wurde, insbesondere beim intent-spezifischen Evaluate-Exchange-Rejectionpfad.
Networkereignisse oder ein möglicherweise später ausgeführter Stimulus dürfen
diesen Wert nicht synthetisieren.

### 10. Main-World-v2-Projektion

Der einzige akzeptierte frische primitive Projektionsbaum besitzt exakt:

```text
value = {
  preTransportContext,
  execution,
  settlement
}

preTransportContext = {
  url: { contextResult },
  origin: { contextResult },
  topLevel: { contextResult },
  secureContext: { contextResult }
}

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

Die totale `dispatchState`-Gesamtmatrix lautet:

| Bedingung | `dispatchState` | Factory/Transport | Settlement | Invariante |
| --- | --- | --- | --- | --- |
| mindestens ein Kontext-`mismatch` | `blocked-context-mismatch` | `zero/zero` | `null` | `mismatch` hat Vorrang; dynamischer Import, Factory und Transport bleiben unerreicht. |
| kein `mismatch`, mindestens ein `unproven` | `blocked-context-unproven` | `zero/zero` | `null` | Ohne viermal `match` bleiben dynamischer Import, Factory und Transport unerreicht. |
| viermal `match`, Fehler vor öffentlichem Settlement | `failed-before-public-settlement` | tatsächlich erreichte `zero\|one`-Stufen | `null` | Zulässig sind nur `zero/zero`, `one/zero` und `one/one`; `zero/one` ist verboten, und es wird kein Settlement erfunden. |
| viermal `match`, Transportpromise erreicht | `dispatched` | `one/one` | nicht `null` | Exakt ein Factory- und ein Transportaufruf sind erreicht; Settlement besitzt ausschließlich eines der drei erlaubten Paare. |

Zulässige Settlementpaare sind ausschließlich
`fulfilled/not-applicable`,
`static-redacted-rejection/match` und
`other-rejection/mismatch`. Eine fehlende oder mehrdeutige Evaluateprojektion
erzeugt keine erfundene Nullprojektion. Networkbeobachtungen ersetzen keine
Main-World-Counts.

Die vorstehende `zero | one`-Grammatik gilt ausschließlich für einen
vollständig akzeptierten zurückgegebenen Main-World-`value`-Graphen; ein vom
Port gelieferter String `unknown` wird dort nie akzeptiert. Davon getrennt
führt der Controller privat einen eigenen geschlossenen Record:

```text
derivedExecutionCounts = {
  factoryCallCount,
  transportCallCount
}

factoryCallCount = zero | one | unknown
transportCallCount = zero | one | unknown
```

Beim beobachteten Evaluate-Exchange-Rejectionpfad sind beide Werte `unknown`.
Der Factorywert projiziert auf `observer.transportFactoryCallCount`, der
Transportwert auf `requestBudget.defaultTransportCalls`; beide bleiben dort
`unknown`. Zugleich ist `observer.mainWorldEvaluationCount = unknown`. Keine
dieser Ableitungen behauptet Send, Nichtsenden, Auswertung oder
Capaktivierung.

In demselben Pfad ist der private `acceptedMainWorldValue` exakt `null`. Es
wird weder ein `value`-Graph noch ein `dispatchState` erfunden oder
serialisiert; `dispatchState` bleibt ausschließlich Bestandteil eines
tatsächlich akzeptierten Main-World-v2-Werts.

### 11. Stages, Timing und Completion

`stages` ist ein tief eingefrorenes Array mit exakt zehn Slots. Jeder Slot
besitzt exakt:

```text
{
  stageId,
  layer,
  observationState,
  receiptOrder,
  result,
  clockDomain,
  relativeMilliseconds,
  timingState
}
```

Die feste Reihenfolge und Zuordnung lautet:

| Slot | `stageId` | Layer | Clock |
| ---: | --- | --- | --- |
| 1 | `observer-armed` | `controller` | `controller-monotonic` |
| 2 | `transport-call-dispatched` | `javascript-main-world` | `javascript-main-world` |
| 3 | `preflight-request-observed` | `browser-network` | `browser-network` |
| 4 | `preflight-204-observed` | `browser-network` | `browser-network` |
| 5 | `post-request-observed` | `browser-network` | `browser-network` |
| 6 | `post-response-200-observed` | `browser-network` | `browser-network` |
| 7 | `post-loading-finished\|post-loading-failed\|post-loading-terminal` | `browser-network` | `browser-network` |
| 8 | `public-promise-settled` | `javascript-main-world` | `javascript-main-world` |
| 9 | `cleanup-started` | `cleanup` | `controller-monotonic` |
| 10 | `cleanup-completed` | `cleanup` | `controller-monotonic` |

`observationState = observed | not-observed | ambiguous`, `receiptOrder` ist
eine positive Safe-Integer-Zahl oder `null`, `result = match | mismatch |
unproven`, `relativeMilliseconds` ist `null`, ein 10-ms-Schritt von `0` bis
`59990` oder `60000`, und `timingState = measured | at-or-above-cap |
unavailable`. Receipt Order ist je Layer lückenlos; nur eindeutig beobachtete
Slots erhalten eine Zahl.

`timing` besitzt exakt:

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

`clockDomains` ist ein tief eingefrorenes Array aus exakt
`{ clockDomain, source, comparisonScope }` in dieser Reihenfolge:

| `clockDomain` | `source` | `comparisonScope` |
| --- | --- | --- |
| `controller-monotonic` | `controller-monotonic-fixed-v1` | `setup-observation-and-cleanup-only` |
| `javascript-main-world` | `window.performance.now` | `transport-dispatch-and-public-settlement-only` |
| `browser-network` | `cdp-network-monotonic-time` | `endpoint-network-events-only` |

Keine Domäne wird mit einer anderen verrechnet. Für eine rohe ebenenlokale
Dauer `d` gilt:

```text
d nicht endlich oder d < 0 -> null / unavailable
0 <= d < 60000             -> 10 * floor(d / 10) / measured
d >= 60000                 -> 60000 / at-or-above-cap
```

`durationCapMilliseconds` ist nur Sättigungs- und Projektionsgrenze, kein
vierter Timer. Setup und Capture entscheiden roh bei `6000`, Cleanup roh bei
`60000`.

`completion` besitzt exakt:

```text
{
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
  setup-cap | setup-terminal-unproven | capture-terminal-unproven |
  capture-cap | confirmed-violation
captureWindowState = not-started | elapsed | truncated
evaluateReplyCountClass = zero | one | multiple | unknown
cleanupFinalizeReason =
  all-steps-terminal | cleanup-cap | cleanup-terminal-failure
```

Jede ausgegebene Projection besitzt `observationClosed: true`,
`requestBudgetFinalized: true` und `cleanupFinalized: true`. Die Ableitung ist:

```text
Setup-U         -> Setupgrund / not-started / Reply zero / P false
Capture-Close   -> capture-terminal-unproven / truncated / Replyklasse
V vor Evaluate  -> confirmed-violation / not-started / Reply zero
V nach Evaluate -> confirmed-violation / truncated / tatsächliche Replyklasse
Evaluate-Exchange-Rejection
                -> confirmed-violation / truncated / Reply unknown / P false
C               -> capture-cap / elapsed / tatsächliche Replyklasse
```

Sticky `V` besitzt Präzedenz; sonst entscheidet controllerlokale
Verarbeitungsreihenfolge. `productEvidenceComplete` bleibt ausschließlich
`S && N`.

Im Evaluate-Exchange-Rejectionpfad sind beim Snapshot Stage 1
`observer-armed / observed / match` mit `receiptOrder: 1`,
`relativeMilliseconds: 0` und `timingState: measured`; Stages 2 bis 8 sind
jeweils `not-observed / unproven` mit `receiptOrder: null`,
`relativeMilliseconds: null` und `timingState: unavailable`. Dieses
`not-observed` ist rein epistemisch und behauptet kein Nichteintreten. Der
Snapshot enthält außerdem `mainWorldEvaluationCount: unknown`,
`transportFactoryCallCount: unknown`, `Runtime.evaluate`-Sendcount `unknown`,
`evaluateReplyCountClass: unknown`, das in Abschnitt 4 geschlossene
Requestbudget, `publicSettlement: null`, `captureWindowState: truncated`,
`productEvidenceComplete: false`, `requestBudgetFinalized: true` und sticky
`V`. Sobald dieser Snapshot als Observation-Freeze `O0` tief eingefroren ist,
wird kein darin enthaltenes Blatt, Array oder Record jemals verändert;
sämtliche späteren Abweichungen gehören ausschließlich zum getrennten
Cleanup-Ledger.

### 12. Cleanup, Snapshot und Ledger

Cleanup beginnt ausschließlich nach dem Frozen
`PreCleanupObservationSnapshot`. Privat wird der sticky Boolean
`cleanupViolation` geführt. Der Snapshot ist der irreversible
Observation-Freeze `O0`: Danach bleiben `U`, `V`, `C`, `closeClass`, Stages 1
bis 8, Replay, Settlement, Requestbudget, Counts und sämtliche
Observationwerte byte- und wertidentisch. Kein Cleanupereignis verändert diese
Werte rückwirkend; bestätigte Post-Snapshot-Verstöße setzen ausschließlich
`cleanupViolation` und gegebenenfalls `cleanup-terminal-failure`.

Nur wenn Lease und Port nach gegebenenfalls erforderlichen Setup-/Capture-
Cancels weiterhin beobachtbar offen sind, wird `m_cleanup` genau einmal
erhoben, die sichere absolute Deadline berechnet und der Cleanupcap scharf
geschaltet. Ist der Port wegen `settlement-unobservable` geschlossen, entfallen
Cleanup-Origin-Sample, Cleanupcap und sämtliche weiteren Exchanges; die
Terminalisierung erfolgt ausschließlich lokal. Eine ungültige Cleanup-Origin-
Clock, eine unsichere Deadline oder ein nicht herstellbarer Cleanupcap ist bei
offenem Port ein irreversibler Cleanup-Controlfehler.

Bei jedem Cleanup-Dequeue bleibt der Fulfillmentgraph bis zum exakt einen
`cleanup-dequeue-before-reflection`-Sample unreflektiert. Danach gewinnt
`m_answer >= cleanupDeadline` einschließlich Gleichheit allein aus gebundenem
Capzustand und Rohzeit: Der Cleanupcap wird `fired`, die Hülle ungelesen
verworfen und `cleanup-cap` ausgelöst. Nur unterhalb der Deadline darf die
Hülle reflektiert werden. Ein dort korrekt korreliertes Cleanup-`cap-fired`
setzt `cleanupViolation` und ist wegen der verlorenen verlässlichen
Finalisierungsdeadline ein `cleanup-terminal-failure`. Ein ungültiger oder
rückläufiger Cleanup-Dequeue-Clockwert ist ebenfalls irreversibel.

Falls der Port offen ist, `Network.enable` möglicherweise gesendet wurde und
eine Session gebunden ist, wird `Network.disable` versucht.
`Target.detachFromTarget` folgt nach einem kontrolliert beobachteten terminalen
Disable-Sendeversuch, nicht nur nach positivem Ack, und wartet nicht auf die
Disable-CDP-Antwort. Ein gültiges pending Send-Promise bleibt die
Livenessgrenze. Ein unobservables Disable-Settlement unterdrückt Detach und
alle weiteren Exchanges. Beide Antworten dürfen nach den beobachteten
Sendeversuchen in beliebiger Reihenfolge eintreffen und benötigen jeweils ein
exakt leeres `result: {}`.
Connection-Close verbietet weitere CDP-Sends, aber nicht weiterhin sichere
externe Cleanup-Steps.

Die beiden privaten Cleanup-Dequeue-Purposes sind geschlossen und
disjunkt:

```text
await-cleanup-protocol-responses(openCommandIds)
await-cleanup-fact(checkId)
```

Ein Dequeue wird nur für den gerade gebundenen Purpose konsumiert. Es gibt
keine zufällige oder heuristische Checkzuordnung bei unlesbarem Routing,
unlesbarer ID, fremder Variante oder unbekannter Korrelation. Erst nach den
terminalen Sendeversuchen von `Network.disable` und
`Target.detachFromTarget` werden alle offenen bekannten Command-IDs im ersten
Purpose drainiert; erst wenn diese Map leer oder terminal unentscheidbar ist,
beginnen die externen Cleanup-Steps und jeweils ihr zweiter Purpose.

Im Purpose `await-cleanup-protocol-responses(openCommandIds)` gilt total:

- eine exakt bekannte ID mit exakt leerem Erfolgsresultat bestätigt den
  zugeordneten Closecheck und wird aus der Map entfernt;
- eine exakt bekannte ID mit normalem eigenem `error` setzt den zugeordneten
  Check `failed`, liest den Fehlerwert nicht und entfernt die ID;
- ein malformed Profil für eine exakt bekannte ID setzt den Check `failed`,
  `cleanupViolation` und entfernt die ID;
- eine sicher lesbare bereits abgeschlossene Dubletten-ID setzt ausschließlich
  `cleanupViolation`, wird keinem Check zugerechnet und lässt Purpose und Map
  unverändert;
- eine sicher lesbare unbekannte ID setzt `cleanupViolation`, wird keinem Check
  zugerechnet und lässt Purpose und Map unverändert;
- unsicheres Routing, unlesbare ID oder Reflectionthrow setzt
  `cleanupViolation`, `cleanup-terminal-failure` und alle offenen Checks
  `unproven`;
- eine sichere `cleanup-fact`-Variante ist im falschen Purpose, setzt
  `cleanupViolation`, erhält aber Purpose und Map ohne Attribution;
- erstes `connection-closed` setzt alle offenen CDP-Closechecks `unproven`,
  leert die Map, schließt den CDP-Port und erlaubt externe Cleanup-Steps;
  eine Dublette setzt ausschließlich zusätzlich `cleanupViolation`;
- Deadline, Clockfehler, beobachtete Dequeue-Rejection, malformed oder
  unobservables Dequeue-Settlement folgen den nachstehenden Cap- und
  Terminalregeln; ein gültiges pending Dequeue bleibt die Livenessgrenze.

Im Purpose `await-cleanup-fact(checkId)` gilt total:

- der exakt aktuelle Check mit `fact: false` wird `failed`, mit `fact: true`
  mangels Adapterprovenienz `unproven`; danach folgt der nächste sichere Step;
- ein malformed Fakt für die exakt lesbare aktuelle ID setzt diesen Check
  `failed` und `cleanupViolation`, danach folgt der nächste sichere Step;
- eine sicher lesbare andere oder bereits abgeschlossene Check-ID setzt
  `cleanupViolation`, wird nicht zugerechnet und lässt den aktuellen Purpose
  pending;
- eine sichere CDP-Nachricht im falschen Purpose setzt `cleanupViolation`, wird
  verworfen und lässt den aktuellen Purpose bestehen;
- erstes `connection-closed` schließt nur die CDP-Seite, lässt den aktuellen
  externen Faktpurpose bestehen; eine Dublette setzt `cleanupViolation`;
- unlesbares Routing, Reflectionthrow, beobachtete Dequeue-Rejection oder ein
  terminales malformed Fulfillment setzt `cleanupViolation`, den aktuellen und
  alle verbleibenden Portchecks `unproven` sowie
  `cleanup-terminal-failure`. Sind Lease durch `observed-settlement` wieder
  `idle` und Cleanupcap sowie
  Port beobachtbar, bleibt genau ein `cleanup-recovery`-Cancel die einzige
  weitere Portverwendung; nach seinem terminalen Ausgang wird lokal
  finalisiert. Ein unobservables Settlement setzt sofort das globale Closed-
  Tupel, erlaubt keinen Cancel oder sonstigen Exchange und finalisiert
  ausschließlich lokal; ein gültiges
  pending Dequeue hält den Run pending.

Ein Send-Intent wird erst nach exactem Send-Ack in `openCommandIds`
eingetragen. Beobachtete Send-Rejection ist bei offenem Port recoverable: der
zugehörige Closecheck wird `failed`, ohne offene ID folgt der nächste terminale
Sendeversuch. Ein malformed Send-Ack setzt zusätzlich `cleanupViolation`.
Unobservable Send-Settlement setzt das globale Closed-Tupel, unterdrückt jeden
weiteren Sendeversuch und führt zur lokalen portlosen Cleanup-Terminalisierung.
Sicher nie aktivierte Ressourcen ergeben
Operation `zero/match` und Closecheck `confirmed`; möglicherweise aktive, aber
nicht bindbare Ressourcen bleiben `unknown/unproven`.

Ein durch beobachtete Cancel-Rejection oder malformed Fulfillment terminal
fehlgeschlagener Setup- oder Capture-Cancel im Cleanup setzt
`cleanupViolation`, aber bei offenem Port erlaubt die eigene sichere
Cleanupdeadline die Fortsetzung der übrigen Schritte. Ein unobservables
Cancel-Settlement schließt dagegen den Port nach dem globalen Closed-Tupel und
terminalisiert ohne weitere Schritte lokal. Fehlgeschlagene abschließende
Cleanupcap-Stornierung, ungültige Cleanup-Origin- oder Dequeue-Clock,
unsichere Cleanupdeadline und nicht herstellbarer Cleanupcap sind dagegen
irreversible Controlfehler mit `cleanup-terminal-failure`. Kein `pending` darf
ausgegeben werden.

Die Cleanupcap-Matrix ist ebenfalls total. Bei
`m_answer >= cleanupDeadline` einschließlich Gleichheit wird der Cap allein
aus Rohzeit und gebundenem Zustand `fired`; der Envelope bleibt vollständig
ungelesen, offene Checks werden `unproven`, und der Grund ist `cleanup-cap`.
Ein exakt korreliertes Cleanup-`cap-fired` unterhalb der Deadline ist vorzeitig,
setzt `fired`, `cleanupViolation` und `cleanup-terminal-failure`. Eine sicher
lesbare fremde Cap-ID lässt den erwarteten Cleanupcap `armed`, setzt
`cleanupViolation` und setzt den bisherigen Purpose fort. Unsicheres Routing
oder eine unlesbare Cap-ID sowie ungültige, rückläufige oder werfende
Cleanupclock, die 129. Dequeuehülle und beobachtete Dequeue-Rejection setzen
`cleanupViolation` und `cleanup-terminal-failure`; soweit noch beobachtbar,
wird bei Lease `idle` und offenem Port ein live gebliebener Cap genau einmal
storniert. Nach einem `settlement-unobservable` erfolgt kein Cancel. Nach `O0`
erzeugt keiner dieser Pfade rückwirkend `V`.

Sind Checks 1 bis 19 terminal, kein Cleanup-Purpose offen und der Cleanupcap
noch live, Lease `idle` und der Port offen, folgt genau ein abschließender
`cap-cancel`. Sein gültiges pending Promise hält den Run pending. Nur der exakte
Cancel-Ack setzt `cancelled` und erlaubt danach genau einen
`controller-clock-sample(cleanup-completion-after-cap-cancel)`. Dieser Sample
dient ausschließlich Timing und Receipt Order von Stage 10; er kann die zuvor
entschiedene Cleanupdeadline nicht rückwirkend gewinnen lassen. Ein gültiger
Sample ergibt Stage 10 `observed/match`, die nächste lückenlose
Cleanup-Layer-`receiptOrder`, Timing ausschließlich aus der rohen Differenz zu
`m_cleanup`, Check 20 `confirmed` und `all-steps-terminal`. Ein ungültiger,
rückläufiger oder werfender Sample setzt
`cleanupViolation`, Stage 10 `observed/mismatch` mit der nächsten lückenlosen
Cleanup-Layer-`receiptOrder`, `relativeMilliseconds: null` und
`timingState: unavailable`, Check 20 `failed` und
`cleanup-terminal-failure`. Beobachtete Cancel-Rejection oder malformed Ack
ergeben ebenfalls die vorstehend definierte lokale Stage-10-/Check-20-
Terminalprojektion mit `cleanup-terminal-failure`. Ein unobservables
Cancel-Settlement setzt das vollständige globale Closed-Tupel, erlaubt keinen
Completion-Clock-Sample, keinen zweiten Cancel und keinen sonstigen Exchange
und erzeugt dieselbe Terminalprojektion ausschließlich lokal. Bei dauerhaft
pending Cancel bleibt der Run dauerhaft pending.

Ist der Port bereits irreversibel geschlossen, erfolgt ausschließlich lokale
Cleanup-Terminalisierung: Stage 9 bleibt `observed/match` mit
der nächsten Cleanup-Layer-`receiptOrder`, `relativeMilliseconds: null` und
`timingState: unavailable`; Stage 10 wird `observed/mismatch` mit der darauf
folgenden lückenlosen `receiptOrder`, `relativeMilliseconds: null` und
`timingState: unavailable`. Offene Portchecks werden `unproven`, Check 20 wird
`failed`, und der Grund ist `cleanup-terminal-failure`.

`cleanup.checks` ist ein tief eingefrorenes Array aus exakt
`{ checkId, result }`, `result = confirmed | failed | unproven`, in dieser
Reihenfolge:

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

`cleanupStarted`, `controllerObservationClosed`,
`objectGroupsAbsentOrReleased`, `rawEventsDiscarded` und
`ephemeralIdentifiersDiscarded` werden ausschließlich aus dem
foundation-eigenen Ablaufledger abgeleitet. `networkDomainClosed` und
`targetSessionClosed` folgen aus den korrelierten CDP-Cleanupantworten oder
dem Beweis, dass die Ressource nie aktiviert wurde. Die zwölf externen
Stepchecks folgen nur aus ihren geschlossenen Rohfakten; weil selbst `true`
ohne Adapterprovenienz `unproven` bleibt, kann die reine Foundation allein
praktisch kein Cleanup-`PASS` beweisen.

Interne Cleanupzustände sind `pending | confirmed | failed | unproven`;
`pending` wird nie ausgegeben. Der Zirkelschluss ist ausgeschlossen. Check 20,
Stage 10 und der Finalisierungsgrund werden exakt so abgeleitet:

```text
Checks 1..19 terminal, Cleanupcap erfolgreich cancelled und
Completion-Clock gültig:
  cleanupCompleted = confirmed
  Stage 10 = observed/match
  cleanupFinalizeReason = all-steps-terminal

Cleanupdeadline gewinnt:
  verbleibende Checks 1..19 = unproven
  cleanupCompleted = unproven
  Stage 10 = not-observed/unproven
  cleanupFinalizeReason = cleanup-cap

Irreversibler Cleanup-Controlfehler einschließlich ungültiger
Completion-Clock nach erfolgreichem Cancel:
  verbleibende Checks 1..19 = unproven
  cleanupCompleted = failed
  Stage 10 = observed/mismatch
  cleanupFinalizeReason = cleanup-terminal-failure
```

Für jeden nicht vollständig gültigen Completion-Clock-Sample gilt zwingend und
ohne Ausnahme:

```yaml
relativeMilliseconds: null
timingState: unavailable
```

Kein zuvor, teilweise oder provisorisch berechneter Timingwert wird erhalten,
gerundet, projiziert, gehasht oder serialisiert. Die bestehenden Ableitungen für
`observationState`, `result`, `receiptOrder`, `cleanupCompleted` und
`cleanupFinalizeReason` bleiben unverändert. Insbesondere behält ein ungültiger
Completion-Sample seine nach Handlerreihenfolge gültige nächste lückenlose
`receiptOrder`; diese beweist oder ersetzt niemals gültiges Timing.
`all-steps-terminal` bleibt auch bei einzelnen
terminalen `failed`- oder `unproven`-Checks zulässig; maßgeblich sind die
Terminalität der Checks 1 bis 19, der erfolgreiche abschließende
Cleanupcap-Cancel und der gültige Completion-Clock-Sample.

Die Projectionform lautet exakt:

```text
cleanup = {
  observationClosedBeforeCleanup,
  checks,
  result,
  projectionMaterializedAfterCleanup
}

result = PASS | FAIL | UNPROVEN
projectionMaterializedAfterCleanup = true
```

`result` ist `FAIL`, wenn `observationClosedBeforeCleanup !== true`,
`cleanupViolation === true` oder mindestens ein Check `failed` ist;
sonst `UNPROVEN`, wenn ein Check `unproven` ist; nur bei allen 20 `confirmed`
und ohne Control-Verstoß ist es `PASS`. Der Wert
`projectionMaterializedAfterCleanup` entsteht ausschließlich by construction
in der frischen Projection, ist keine Eingabe der Cleanupableitung und wird
nie `false` ausgegeben. `recordMaterializedAfterCleanup` bleibt dem späteren
echten Record vorbehalten.

Die beiden privaten Zwischenformen besitzen exakt:

```text
PreCleanupObservationSnapshot = {
  historicalEvidence,
  replay,
  observerObservation,
  requestBudget,
  publicSettlement,
  stagesOneThroughEight,
  timingObservation,
  observationCompletion,
  stickyViolation
}

CleanupLedger = {
  cleanupProtocolOperations,
  cleanupStages,
  checks,
  cleanupViolation,
  result,
  cleanupFinalizeReason,
  cleanupFinalized
}
```

`observerObservation` besitzt dieselbe geschlossene Observer-Keyfolge wie die
Projection, aber `protocolOperations` enthält exakt die ersten vier
Operationen. `stagesOneThroughEight` ist ein dichtes `Stage[8]`;
`timingObservation` besitzt exakt `{ roundingMilliseconds,
durationCapMilliseconds, setupWindowMilliseconds, captureWindowMilliseconds,
clockDomains, calibration, crossDomainComparison }`;
`observationCompletion` besitzt exakt `{ productEvidenceComplete,
observationCloseReason, observationClosed, captureWindowState,
evaluateReplyCountClass, requestBudgetFinalized }`; `stickyViolation` ist ein
Boolean. Der Snapshot enthält nur frische geschlossene Projektionen und
primitive Blätter. Das Ledger enthält die letzten zwei
Operationen, Stages 9 und 10, exakt 20 Checks, den privaten primitiven Boolean
`cleanupViolation` und nur den Materialisierungszustand
`cleanupFinalized`. Der Boolean ist kein Feld von
`FoundationProjection.cleanup`. Weder
`projectionMaterializedAfterCleanup` noch
`recordMaterializedAfterCleanup` liegen darin. Beide Graphen sind gewöhnlich,
geschlossen, tief eingefroren und enthalten keine callerlieferte Referenz.
Die FoundationProjection wird nach Cleanupfinalisierung aus frischen Kopien
der primitiven Blätter beider unveränderter Projektionen zusammengesetzt; kein
Snapshot- oder Ledgercontainer wird dadurch öffentlich erreichbar. Scheitern
von Projektion oder Freeze ergibt den statischen Foundationfehler und keine
Projection.

### 13. Hash-, Provenienz- und Candidategrenze

SHA-256 ist ausschließlich Lower Hex `[0-9a-f]{64}` über die ausdrücklich
benannten rohen Bytedomänen. Es gibt keine BOM-, EOL-, Unicode-, Case-, Trim-
oder sonstige Normalisierung. Callerlieferbare Digests oder Matchwerte
bestätigen nie Provenienz. `foundationSha256` bleibt `null`, und Commit-,
Dateibyte-, Actual-Send-, Parser-, Pipe-, Queue-, Timer-, Ressourcen- und
Adapterbindungen bleiben im Foundationslice `unproven`. Syntaktische
Widersprüche dürfen fail-closed wirken; positive Callerangaben dürfen keinen
Integritätscheck authentisch bestätigen.

Die Foundation berechnet nur Kandidaten:

```text
hardViolation :=
  V
  || bestätigter Integritäts-, Ablauf-, Freeze-, Operations-
     oder Requestbudgetverstoß
  || cleanup.result = FAIL

proofIncomplete :=
  U
  || replay.equivalence.result = UNPROVEN
  || erforderlicher Check = unproven
  || cleanup.result = UNPROVEN
  || Pflichtantwort, Attribution oder Projektion unbewiesen

candidateObserverGate =
  FAIL       bei hardViolation
  UNPROVEN   sonst bei proofIncomplete
  PASS       sonst
```

`DIVERGED` ist allein kein Observer-`FAIL`, verhindert aber jedes historische
Reproduktionsfinding. `candidateFinding` wird mit dieser Präzedenz abgeleitet:

```text
candidateObserverGate = FAIL
  -> observer-invalid

candidateObserverGate = UNPROVEN
  -> inconclusive

PASS + EQUIVALENT + genau ein Stimulus
     + OPTIONS-204-POST-200-loadingFinished
     + static-redacted-rejection/match
  -> static-rejection-reproduced-after-http200

PASS + EQUIVALENT + genau ein Stimulus
     + OPTIONS-204-POST-200-loadingFinished
     + fulfilled/not-applicable
  -> original-failure-not-reproduced

PASS + EQUIVALENT + genau ein Stimulus
     + vollständig bekannte andere Produktnetzsignatur
  -> network-signature-diverged

sonst -> inconclusive
```

Auch ein hypothetisches Kandidaten-`PASS` bleibt wegen
`evidenceStatus: NOT_EVIDENCE`, `runtimeAuthorized: false` und
`persistenceAuthorized: false` ohne Beweis-, Freigabe- oder Laufzeitwirkung.
Die spätere Überführung in einen echten `BrowserTransportDiagnosticRecord`
benötigt einen eigenen Adapter-ADR und eine erneute identitätsgebundene
Ableitung aus authentischen Quellen.

### 14. Verbindliche spätere Testmatrix

Der getrennte spätere Foundationimplementierungsslice muss mindestens prüfen:

- Factory-, Port-, Binding-, API-, Referenz- und Freezeform einschließlich
  Owner-Latch, `unused|active|terminal`, synchronem Capabilitytransfer von
  `capturedExchange` nach `activeExchange`, exakter Löschung beider zeitlich
  disjunkter Slots und absoluter Outputinvariante;
- falsche Factory- und Run-Arity, Erst-, Zweit-, Parallel- und reentrante
  Aufrufe, Nicht-Owner-Isolation sowie späte Handler als Token-/State-gegatete
  `undefined`-No-ops;
- die Lease `idle|observable-pending|settlement-unobservable|closed`, niemals
  mehr als ein ausstehender Exchange, alle vier Ack-/Referenzrollen und nur
  ihre erlaubte Clock-Überlappung sowie unterdrückte interne Zweit-Exchanges in
  Pre-start, Observation und Cleanup mit Settlement- und Forever-pending-Join;
  für jedes unobservable Settlement das exakte Closed-Tupel mit gelöschtem
  `activeExchange`, `affectedCapState: terminal-unknown` und
  `furtherExchangeCount: zero` sowie keinerlei Cancel oder Folge-Exchange;
- das `currently-observable-local-native-promise-profile`, hostile Thenables,
  beobachtbar fremde und entsprechend verkleidete Cross-Realm-/Subclass-
  Kandidaten, malformed Promises, Constructor-/Species-/Then-Mutationen,
  einzige Brandprobe, ausschließlich `undefined` zurückgebende Handler,
  Foundation-kontrollierte Redaction und den ausdrücklich offenen
  hostabhängigen Rejectionrestkanal;
- lokale Public-Promise-Erzeugung ohne Rejectnutzung, Resolve exakt einmal,
  Null-Prototyp-FoundationResult ohne Own-`then` und Assimilationsangriffe;
- alle sieben Intentarten, exakte Payload-/Ackformen, Dubletten und Übergänge;
- jedes erreichbare kontrollierte Rejection-Tupel der geschlossenen Pre-start-,
  Observation- und Cleanupmatrix, `capKind: null` nur beim Probe-Tupel, alle
  acht intent-ID-gebundenen Cancel-Purposes, Freigabe der Lease vor Dispatch,
  unreflektiertes Verwerfen gehaltener Dequeuegraphen, exakte Count-/Check-
  Ableitungen, jede erforderliche Cancel-vor-`O0`-Quieszenz, die vier
  Cleanup-Recovery-Cancel-Ausgänge und den allgemeinen Catch-all ausschließlich
  als Gegenprobe für unmögliche interne Tupel;
- Setupreihenfolge und sämtliche Pre-start-Abbrüche ohne Projection, Snapshot
  oder Cleanup;
- rohe Setup-, Capture- und Cleanupcap-Grenzen einschließlich
  Deadlinegleichheit, am absoluten Cap vollständig ungelesener
  Dequeue-Envelopes, vorzeitiger Capereignisse, nur eventgeschlossenem Capture,
  pending Capture, atomarem Evaluate-Ack und erstem Capture-Connection-Close
  vor beziehungsweise nach einem möglicherweise gleichzeitig eingereihten
  Capturecap;
- alle zehn privaten Capzustände, höchstens einen Cancel je Arm und die
  vollständige Setup-/Capture-/Cleanup-Cancelmatrix einschließlich
  `fired`, `terminal-unknown`, Best-effort-Pre-start-Cancel, exaktem Ack,
  beobachteter Rejection oder malformed Ack, unobservablem Settlement und
  pending Liveness; jeder Cancel-Rejectionpfad ist ausdrücklich
  `observed-settlement`, und unobservable Cancel-Settlements erzeugen weder
  zweiten Cancel noch anderen Exchange;
- beobachtete Evaluate-Exchange-Rejection vor und nach einem möglicherweise
  tatsächlichen Send, intent-spezifische Tupelpräzedenz vor dem unmöglichen
  Catch-all, exakt einen Cancel der bekannten Arm-ID mit allen vier Ausgängen,
  keinen zweiten Evaluate-Send oder Capture-Dequeue sowie sämtliche
  konservativen `unknown`-Counts, `truncated`, `publicSettlement: null` und die
  exakten Stage-1-bis-8-Werte;
- `targetInfos` bei 128 und 129, sparse Arrays, Symbole, Accessors,
  Zusatzkeys, Reflectionthrows und Antwortdubletten;
- primitive ID-, URL- und Methodentoken-Grenzen sowie Dequeue 128/129;
- Network-Sekunden zu Millisekunden, Rücklauf, `NaN`, Infinity, unsicheren
  Überlauf und Cross-Domain-Verbot;
- alle vier Stage-7-Ausgänge, Sendcount unabhängig von Antwortdubletten und
  Evaluate-Reply `zero|one|multiple|unknown`;
- die vollständige v2-Kontext-, Factory-, Dispatch- und Settlementmatrix;
- Proxy-, Exact-once-OwnKeys-/Prototyp-/Descriptorpfade für geschlossene
  Records, Arrays und offene CDP-Hüllen, Reflection- sowie Projectionthrows;
- Disable/Detach bei Erfolg, terminalem Sendefehler, Dublette, fehlender
  Antwort, Connection-Close und partiellem Setupzustand sowie alle zwölf
  Cleanup-Step-Rohfakten mit `false -> failed` und `true -> unproven`;
- beide Cleanup-Dequeue-Purposes, bekannte, unbekannte, doppelte und unlesbare
  IDs, falsche Varianten, beliebige Disable-/Detach-Antwortreihenfolge,
  Connection-Close-Dublette, Purposeerhalt ohne zufällige Checkattribution und
  Portschluss mit ausschließlich lokaler Cleanup-Terminalisierung;
- `cleanupViolation`, sämtliche Cleanupfehlerpräzedenzen, den
  Check-20-Zirkelschluss und exakt die drei Gründe `all-steps-terminal`,
  `cleanup-cap`, `cleanup-terminal-failure` samt abschließendem Cap-Cancel,
  `cleanup-completion-after-cap-cancel`, Stage-10- und
  Projectionmaterialisierung ohne Snapshot- oder Ledgermutation; für jeden
  nicht vollständig gültigen Completion-Sample zwingend
  `relativeMilliseconds: null` und `timingState: unavailable`, ohne Retention,
  Rundung, Projektion, Hash oder Serialisierung eines provisorischen Timings und
  ohne Verwechslung einer gültigen `receiptOrder` mit gültigem Timing;
- Gegenbeispielspuren für jeden Clock-, Routing-, Reflection-, Dequeue- und
  Cleanupfehler vor und nach `O0`, wobei nach `O0` niemals `U`, `V`, `C`,
  `closeClass`, Stages 1 bis 8, Replay, Settlement, Budget oder Counts mutieren;
- Timingwerte `0`, `9`, `10`, `59999`, `60000`, negative Werte, `NaN` und
  Infinity;
- alle 59 Replayvergleiche, 17 Integritätschecks, 20 Cleanupchecks und alle
  Candidate-/Findingpräzedenzen;
- Lower-/Upper-Hex- und Hashlängenfälle sowie keinerlei Provenienzaufwertung
  durch Callerwerte;
- `NOT_EVIDENCE`, beide Autorisierungswerte `false` und die Abwesenheit von
  Browser, CDP, Timer, Dateisystem, Netzwerk und echtem Record.

### 15. Slice- und Folgereihenfolge

Die pure Foundation bleibt importinaktiv und vollständig netzwerkfrei. Sie
besitzt keinen Realdefault, CLI-, Main-Guard-, Browser-, CDP-, Pipe-, Parser-,
Queue-, Timer-, Prozess-, Socket-, Port-, Vite-, Gateway-, Dateisystem-,
Storage-, Logging-, Telemetrie- oder Recordwriterzugriff. Sie verarbeitet nur
ihre unveränderlichen effects-as-data-Intents und unvertrauenswürdige bereits
materialisierte In-Memory-Beobachtungen.

Der aktuelle nächste Schritt ist ausschließlich die getrennte, netzwerkfreie
Implementierung der hier entschiedenen Effects-as-Data-Foundation. Die
Diagnosefoundation ist weiterhin nicht implementiert. Danach sind Raw-Pipe-,
Parser-, Queue-, Ressourcen-, Cap-/Timer-, Hash-, Launcher- und
Adapterbindung in einem eigenen ADR zu entscheiden und getrennt netzwerkfrei
zu implementieren; erst anschließend darf ein sichtbarer Diagnoselauf
gesondert autorisiert werden. Davor darf kein echter
`BrowserTransportDiagnosticRecord` materialisiert werden. Browserkomposition
und Browser-End-to-End-`syncTest` bleiben geschlossen.

## Konsequenzen

- Die reine Zustandsmaschine besitzt eine ausführbare Ein-Port-Grenze ohne
  versteckten Effektseam.
- Die einzige notwendige Capabilityreferenz und alle zulässigen transienten
  Verarbeitungsslots sind eng begrenzt und von sämtlichen Outputs getrennt.
- Frühfehler, Setup, Capture, Cleanup und unbegrenzt pending Exchanges sind
  terminal beziehungsweise bewusst nicht live garantiert.
- Send-, Reply- und Networkzählungen bleiben getrennt; Caps und Clockdomänen
  sind nicht austauschbar.
- Die Foundation kann nur einen nicht evidenzfähigen Kandidaten projizieren.
  Adapter- und Runtimeprovenienz bleibt ausdrücklich unbewiesen.

## Erwogene Alternativen

### Capability bei jedem Intent erneut aus `effectPort` lesen

Verworfen, weil dies den Callercontainer dauerhaft erhalten und eine
nachträglich austauschbare Effektoberfläche schaffen würde.

### Keine Capabilityreferenz halten

Verworfen, weil ein asynchrones Mehrschrittprotokoll ohne versteckten zweiten
Adapter dann nicht ausführbar wäre. Die einzige enge, ownergebundene Ausnahme
mit synchronem Transfer `capturedExchange -> activeExchange` schließt diese
Lücke ohne parallele persistente Slots oder Outputreferenz.

### Reale Timer, Queue oder CDP-Verbindung in der Foundation

Verworfen, weil dadurch die reine effects-as-data-Grenze und die getrennte
Adapterentscheidung vorweggenommen würden.

### FoundationProjection unmittelbar als Evidence-Record speichern

Verworfen, weil Caller- und Portdaten keine Parser-, Byte-, Ressourcen- oder
Adapterprovenienz beweisen und das ADR-0029-Gate unverändert `FAIL` bleibt.

## Bedingungen für eine Neubewertung

Eine spätere technische Neubewertung benötigt den getrennten, netzwerkfrei
geprüften Foundationcode, einen eigenen angenommenen Adapter-ADR, dessen
identitätsgebundene netzwerkfreie Implementierung und eine danach ausdrücklich
autorisierte neue Runtimeoperation. Bis dahin bleibt die Ursache
`CAUSE_NOT_PROVEN`, das ADR-0029-Gesamtgate `FAIL` und jeder reale
Diagnosevorgang geschlossen.
