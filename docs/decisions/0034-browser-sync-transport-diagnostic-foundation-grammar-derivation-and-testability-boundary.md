# ADR 0034 – BrowserSyncTransport Diagnostic Foundation Grammar, Derivation and Testability Boundary

## Status

Ersetzt durch [ADR 0035](0035-browser-sync-transport-diagnostic-foundation-join-and-internal-transition-testability-boundary.md) – 2026-09-05

## Kontext

[ADR 0033](0033-browser-sync-transport-diagnostic-foundation-effects-protocol-boundary.md)
entscheidet den noch nicht implementierten Effects-as-Data-Vertrag der reinen
BrowserSyncTransport-Diagnosefoundation. Sein öffentlicher Vertrag, seine
Port- und Ablaufgrenze sowie seine Sicherheits- und Provenienzregeln bleiben
die notwendige Grundlage. Vor einer Implementierung müssen jedoch mehrere
Begriffe und Ableitungen vollständig totalisiert werden: die Klassen- und
Prototypgrammatik, `fresh` und `deep frozen`, die bisher unscharfen ASCII-,
Zeitzonen- und SemVer-Klassen, die Cross-Field-Invarianten `I1` bis `I8`, alle
Observer- und Integrityableitungen, sämtliche zehn Stages, partielle
Ressourcenzustände, die produktive Unerreichbarkeit von Candidate-`PASS` sowie
die Grenze zwischen netzwerkfreien Foundationtests und vorhandenen
Loopback-Regressionsfixtures.

ADR 0034 ist nur ein vorgeschlagener Dokumentationsslice. Bei einem späteren
unabhängigen Review-`PASS` und einer danach ausdrücklich vorgenommenen
Annahme würde ADR 0034 ADR 0033 formal ersetzen. Alle nicht ausdrücklich
korrigierten Regeln aus ADR 0033 und ADR 0032 würden fortgelten. Bis zu dieser
späteren Annahme bliebe ADR 0033 die geltende Entscheidung; insbesondere
bliebe die Foundationimplementierung geschlossen.

ADR 0034 würde keinen weiteren ADR ersetzen. ADR 0029, sein historischer
Evidence-Record, `overallGate: FAIL` und ausnahmslos
`causeStatus: CAUSE_NOT_PROVEN` blieben unverändert. Dieser Entwurf
implementiert oder autorisiert weder Foundation, Tests, Adapter noch einen
Runtimevorgang. Er autorisiert keinen Browser-, CDP-, Netzwerk-, Gateway-,
Vite- oder Diagnoselauf.

Für den Fall der späteren Annahme würden Schema, API und alle bestehenden
Kardinalitäten unverändert bleiben:

```text
schemaVersion: 1
FoundationProjection: 17 Rootfelder
Replay: 59 Vergleiche
Effects-Intents: 7
Protocol Operations: 6
Integrity Checks: 17
Stages: 10
Capzustände: 10
Cleanupchecks: 20
öffentliche Exports: 1
```

Die einzige öffentliche API bliebe
`createBrowserSyncTransportRuntimeDiagnosticObserver({ effectPort,
runBinding })`, ihr einziger Export bliebe die gleichnamige Factory, und die
einzige erfolgreiche API-Form bliebe die frische tief eingefrorene `{ run }`-
API. `FoundationResult`, `FoundationProjection`, die sieben Intentarten, die
sechs Protokolloperationen, die 17 Integritychecks, die zehn Stages, die 20
Cleanupchecks, sämtliche statischen Fehlerprofile und alle Cap-, Lease-,
Owner-, Snapshot- und Ledgerregeln aus ADR 0033 würden unverändert bleiben,
soweit die folgenden neun Entscheidungen sie nicht ausdrücklich totalisieren.

## Entscheidung

Die folgenden Festlegungen wären erst ab einer späteren Annahme normativ. In
diesem vorgeschlagenen Stand beschreiben sie ausschließlich den vollständig zu
prüfenden Vertrag.

### 1. Geschlossene Klassen-, Prototyp-, Frische- und Freezegrammatik

Bei Modulevaluation müssten mindestens die für diese Prüfungen benötigten
Intrinsics, darunter `Array.isArray`, `Object.getPrototypeOf`,
`Reflect.ownKeys`, `Object.getOwnPropertyDescriptor`, `Object.freeze`,
`Object.isFrozen`, der lokale `Object.prototype` und der lokale
`Array.prototype`, unveränderlich erfasst werden. Spätere freie
Propertyauflösung auf unvertrauenswürdigen Werten bliebe verboten.

Die Klassen wären vollständig und disjunkt wie folgt festgelegt:

| Vertragsklasse | Erkennung beziehungsweise Konstruktion | Direkter Prototyp | Key-/Descriptorregel | Traversierung und Freeze |
| --- | --- | --- | --- | --- |
| geschlossener unvertrauenswürdiger Record | exakt die nachstehende Record-Prüffolge | erfasster lokaler `Object.prototype` | vollständig geschlossene knotenspezifische String-Key-Folge; exakt ein Descriptor je Key | nur allowlistete gecachte Data-Werte synchron weiterprüfen; Fremdknoten nie freezen |
| geschlossenes unvertrauenswürdiges Array | exakt die nachstehende Array-Prüffolge | erfasster lokaler `Array.prototype` | dichte Indizes `0..n-1` plus eigener nativer `length`-Descriptor, keine weiteren Keys | nur gecachte Elementwerte synchron weiterprüfen; Fremdarray nie freezen |
| offene CDP-Hülle oder offener `targetInfos`-Eintrag | keine Gesamtklassenprüfung | nicht klassifiziert | keine Own-Key-Inventur; nur ausdrücklich allowlistete Descriptoren höchstens einmal | weder frei traversieren noch freezen |
| Promise-Kandidat | ausschließlich bestehendes Promiseprofil | nur nach dessen eigener geschlossener Prüfung | nur Constructor-, Species- und Then-Descriptoren des Promiseprofils | nicht als Record/Array traversieren und nicht freezen |
| Function oder Capability | primitiver Funktionstest nur an der ausdrücklich erlaubten Grenze | nicht klassifiziert | keine Own-Key- oder Descriptorinventur außer der vorgelagerten Data-Property, aus der die Referenz stammt | nie traversieren oder freezen |
| foundationeigener gewöhnlicher Record | neu durch die Foundation konstruiert | erfasster lokaler `Object.prototype` | geschlossene kanonische Own-Data-Keyfolge | nach Own-Data-Kanten gemäß `deep frozen` |
| foundationeigenes Array | neu, dicht und ohne Zusatzkeys durch die Foundation konstruiert | erfasster lokaler `Array.prototype` | dichte Indizes plus nativer `length`-Descriptor | nach Own-Data-Kanten gemäß `deep frozen` |
| `FoundationResult` | neu durch die Foundation konstruiert | exakt `null` | exakt sieben kanonische Own-Data-Keys, kein Own-Key `then` | Root und alle erreichbaren foundationeigenen Record-/Arrayknoten gemäß `deep frozen` |

Kein Wert dürfte zugleich über zwei inkompatible Zeilen klassifiziert werden.
Scheiterte die für die erwartete Zeile vorgeschriebene Erkennung, dürfte nicht
auf eine schwächere Klasse ausgewichen werden.

#### Geschlossene unvertrauenswürdige Records

Für jeden als geschlossen verlangten unvertrauenswürdigen Recordknoten müsste
exakt diese Reihenfolge genau einmal durchlaufen werden:

1. primitiver `typeof`-/Nulltest; nur `typeof value === "object"` und
   `value !== null` dürfte fortfahren;
2. exakt eine Anwendung der erfassten `Array.isArray`-Intrinsik; das Ergebnis
   müsste `false` sein;
3. exakt eine Anwendung der erfassten `getPrototypeOf`-Intrinsik;
4. der direkte Prototyp müsste referenzidentisch der bei Modulevaluation
   erfasste lokale `Object.prototype` sein;
5. exakt eine Anwendung der erfassten `Reflect.ownKeys`-Intrinsik;
6. die Own-Key-Folge müsste codeunitgenau der für den Knoten festgelegten
   String-Key-Folge entsprechen; Symbole, Zusatzkeys, fehlende Keys und eine
   andere Reihenfolge wären unzulässig;
7. für jeden erforderlichen Key müsste exakt einmal der Own-Descriptor gelesen
   werden; zulässig wäre nur eine eigene aufzählbare Data-Property ohne Getter
   oder Setter, und ihr Wert dürfte ausschließlich dem gecachten Descriptor
   entnommen werden;
8. danach dürfte derselbe Knoten nicht erneut durch Property-, Key-,
   Prototyp-, Brand- oder Descriptorlesung beobachtet werden.

Diese Recordgrammatik würde insbesondere für Factoryoptions, `effectPort`,
`runBinding`, dessen geschlossene Nachfahren, jeden Replayeintrag,
geschlossene Ackprofile und jeden geschlossenen Knoten des Main-World-v2-
Graphen gelten. Knotenspezifische Descriptoranforderungen aus ADR 0033,
beispielsweise fest verlangte `writable`- oder `configurable`-Werte, würden
zusätzlich gelten und nicht durch diese Basisklasse gelockert.

#### Geschlossene unvertrauenswürdige Arrays

Für jeden ausdrücklich geschlossenen unvertrauenswürdigen Arrayknoten müsste
exakt diese Reihenfolge genau einmal durchlaufen werden:

1. exakt eine Anwendung der erfassten `Array.isArray`-Intrinsik; das Ergebnis
   müsste `true` sein;
2. exakt eine Anwendung der erfassten `getPrototypeOf`-Intrinsik;
3. der direkte Prototyp müsste referenzidentisch der erfasste lokale
   `Array.prototype` sein;
4. exakt eine Anwendung von `Reflect.ownKeys`; die Folge müsste bei Länge `n`
   exakt `"0", ..., String(n - 1), "length"` enthalten, bei `n === 0` nur
   `"length"`; Symbole, Holes und Zusatzkeys wären verboten;
5. exakt ein eigener nativer `length`-Data-Descriptor müsste gelesen werden;
   sein Wert müsste der vorgeschriebenen nichtnegativen Safe-Integer-Länge
   `n` entsprechen;
6. für jeden Index `0..n-1` müsste in aufsteigender Reihenfolge exakt einmal
   der Own-Descriptor gelesen werden; nur aufzählbare Data-Properties ohne
   Getter oder Setter wären zulässig, und die Elementwerte dürften
   ausschließlich aus diesen gecachten Descriptoren stammen;
7. danach dürfte derselbe Arrayknoten nicht erneut durch Property-, Key-,
   Prototyp-, Brand-, Length- oder Descriptorlesung beobachtet werden.

Die strengeren bestehenden Maximal-, Element- und Typgrenzen würden danach
auf den gecachten Werten geprüft. Diese Arraygrammatik würde mindestens für
`replayOperands`, `targetInfos` und jeden weiteren ausdrücklich geschlossenen
Arrayknoten gelten.

#### Offene Hüllen und andere Ausnahmen

Die Klassen wären geschlossen getrennt:

- Promise-Kandidaten würden ausschließlich das in ADR 0033 definierte
  `currently-observable-local-native-promise-profile` verwenden. Die Record-
  und Arraygrammatik dürfte darauf nicht zusätzlich angewendet werden.
- Offene CDP-Hüllen und offene `targetInfos`-Einträge erhielten keine Record-,
  Array-, Realm-, Plain-Data- oder Proxyklassifikation. Ausschließlich die
  allowlisteten Descriptoren dürften in der bereits festgelegten Reihenfolge
  gelesen werden.
- Functions und Capabilities dürften weder traversiert noch eingefroren
  werden.
- `FoundationResult` bliebe der einzige ausdrücklich festgelegte
  Null-Prototyp-Root.
- Foundationeigene gewöhnliche Records und Arrays müssten durch Konstruktion
  den erfassten lokalen `Object.prototype` beziehungsweise `Array.prototype`
  besitzen. Ein foundationeigener Null-Prototyp-Record dürfte nur dort
  konstruiert werden, wo ADR 0033 ihn ausdrücklich verlangt.

`fresh` würde exakt bedeuten: Der betreffende Containerknoten wäre an dieser
Vertragsstelle neu durch die Foundation konstruiert, nicht referenzidentisch
mit einem caller- oder portgelieferten Knoten und nicht mit einem anderen an
einer getrennten Vertragsstelle ebenfalls als frisch verlangten Container
geteilt. Ein „frischer Baum“ würde diese Eigenschaft für jeden darin
enthaltenen Record- und Arraycontainer verlangen. Frische dürfte nur durch
Konstruktion hergestellt und niemals aus einer unbeschränkten Traversierung
eines Fremdgraphen abgeleitet werden.

`deep frozen` würde ausschließlich für foundationeigene Record- und
Arrayknoten gelten, die über foundationeigene Own-Data-Kanten erreichbar sind.
Ein solcher endlicher, azyklisch konstruierter Baum müsste von den Blättern
zum Root eingefroren werden. Für jeden erreichbaren Record- oder Arrayknoten
müssten anschließend `Object.isFrozen === true`, ausschließlich eigene
Data-Properties und die geschlossene knotenspezifische Keyfolge gelten;
enthaltene Record- und Arraywerte müssten dieselbe Regel rekursiv erfüllen.
Prototypen, Promises, Functions, Capabilities und fremde Eingabegraphen dürften
weder eingefroren noch über ihre Grenze hinaus verfolgt werden. Geteilte
Container wären nur erlaubt, wenn die konkrete Form dies ausdrücklich
festlegt; jede separat verlangte Frische würde Sharing verbieten.

Keine Klassen-, Prototyp-, Frische- oder Freezeprüfung würde Proxyfreiheit,
Erzeugungsrealm, Parser-, Pipe-, Byte- oder sonstige Provenienz beweisen.

### 2. Geschlossene Stringgrammatiken

Der bisher unbestimmte Begriff „sanitierter ASCII-String“ würde vollständig
durch `printable-ascii-v1` ersetzt. Für jeden Replaytyp `A<n>` würde exakt
gelten:

```text
printable-ascii-v1(A<n>) :=
  primitiver String
  && UTF-16-Codeunitlänge 1..n
  && jede Codeunit liegt einschließlich in U+0020..U+007E
```

Koerzierung, Normalisierung, Trimmung, Case-Faltung und Unicodeabbildung
wären verboten. Führende oder abschließende U+0020 wären typgültig; beim
codeunitgenauen Vergleich könnten sie regulär zu `mismatch` führen.
Bestehende speziellere Grammatiken wie `H64`, die geschlossenen ID-Grammatiken
und HTTP-`tchar` blieben vorrangig.

`timeZone` würde nicht länger eine behauptete `ASCII-IANA-ID`, sondern nur die
interne Syntaxklasse `iana-shaped-ascii-time-zone-v1` verlangen. Zulässig wäre
ausschließlich:

- exakt der case-sensitive String `UTC`; oder
- mindestens zwei durch `/` getrennte nichtleere Komponenten;
- jede Komponente begänne mit ASCII `A-Z` oder `a-z`;
- alle weiteren Zeichen einer Komponente wären ausschließlich ASCII-
  Buchstaben, ASCII-Ziffern, `.`, `_`, `+` oder `-`;
- die Gesamtlänge läge bei `1..64` UTF-16-Codeunits.

Leere Komponenten, Unicodezeichen, Backslashes und jedes Whitespace wären
unzulässig. Die Foundation dürfte dafür weder `Intl` noch eine Host-, TZDB-
oder Netzwerkabfrage verwenden. Die Klasse würde ausdrücklich keine
IANA-Mitgliedschaft, Kanonizität, Aliasauflösung oder konkrete TZDB-Version
bestätigen. `Europe/Berlin`, `Etc/GMT+1` und
`America/Argentina/Buenos_Aires` müssten die Syntax bestehen.
Die gesamte Syntaxklasse würde codeunitgenau und case-sensitive geprüft.

Der Replaytyp `S32` würde ausschließlich Core-SemVer nach dieser exakten
lexikalischen Grammatik bedeuten:

```regex
^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$
```

Zusätzlich müsste der primitive String `1..32` ASCII-Codeunits lang sein. Die
Prüfung wäre ausschließlich codeunitgenau; numerische Konvertierung wäre
verboten. Ein `v`-Präfix, Vorzeichen, Whitespace, führende Nullen außer der
einzelnen `0` sowie Prerelease- oder Buildsuffixe wären unzulässig. Die
historischen Werte `24.19.0` und `8.1.4` müssten bestehen.

Die bereits festgelegten Grammatiken für `diagnosticRunId`,
`replayContextId`, `repositoryCommit`, `observedAt`, ephemere IDs, URLs,
HTTP-Methoden und Digests würden unverändert fortgelten. Insbesondere bliebe
`observedAt` ein kanonischer `YYYY-MM-DDTHH:mm:ss.sssZ`-String mit echter
UTC-Rückprojektion.

### 3. Totale Replay- und `I1`-bis-`I8`-Ableitung

Shape-, Own-Key-, Descriptor-, Prototyp- und Typfehler des `runBinding`
blieben synchrone Factoryfehler mit exakt dem statischen Dependency-
`TypeError` aus ADR 0033. Semantische Cross-Field-Abweichungen typgültiger
kopierter Werte dürften dagegen keinen Factoryfehler erzeugen.

Für jeden der 59 Replayeinträge würde das öffentliche Comparisonresult
unverändert so entstehen:

```text
observationState = not-observed | ambiguous
  -> result = unproven

observationState = observed und replayValue codeunit-/typgleich historicalValue
  -> result = match

observationState = observed und replayValue nicht gleich historicalValue
  -> result = mismatch
```

Privat müssten `I1` bis `I7` je exakt einen Wert
`match | mismatch | unproven` erhalten. Allgemein wäre eine Invariante
`unproven`, sobald mindestens ein benötigter Replayoperand `not-observed` oder
`ambiguous` oder eine benötigte abgeleitete Beobachtung epistemisch unbekannt
wäre. Sie wäre `match`, wenn alle benötigten Operanden beobachtet wären und
die nachstehende exakte Relation erfüllten; andernfalls wäre sie `mismatch`.
Die 59 öffentlichen Comparisonresults dürften von diesen privaten
Invarianten weder ersetzt noch überschrieben werden.

Die Funktion `decimal(P)` würde für eine typgültige nichtnegative
Safe-Integer-Portnummer deren eindeutige kürzeste ASCII-Basis-10-
Ziffernfolge liefern: für `0` exakt `"0"`, sonst keine führende Null. Sie
dürfte ausschließlich aus der bereits typgeprüften internen Zahl berechnet
werden; eine erneute Fremdwertkoerzierung wäre verboten.

| Invariante | Benötigte Operanden | Exakte Relation für `match` | Vollständig beobachteter Gegenfall |
| --- | --- | --- | --- |
| `I1` | Rows 37 und 38 | `frontend.topLevelUrl === frontend.serializedOrigin + "/"` | `mismatch` |
| `I2` | Rows 45 bis 49 | `transportRequest.initialUrl === initialScheme + "://" + initialHost + ":" + decimal(initialPort) + initialPath` | `mismatch` |
| `I3` | Rows 46 bis 49 sowie 51 bis 53 und 56 | `initialHost === "127.0.0.1"`, `listenerHost === "127.0.0.1"`, `initialPort === listenerPort`, `portEnvironmentValue === "\"" + decimal(listenerPort) + "\""` und `gateway.endpoint === initialScheme + "://" + listenerHost + ":" + decimal(listenerPort) + initialPath` | `mismatch` |
| `I4` | Rows 38, 54 und 55 | `gateway.allowedOrigin.relationToFrontend === "matches-frontend-origin"` und `gateway.allowedOrigin.value === frontend.serializedOrigin` | `mismatch` |
| `I5` | Rows 45 und 56 | `transportRequest.initialUrl === gateway.endpoint` | `mismatch` |
| `I6` | Row 59 und `viteRuntimeVersionObservation` | Row 59 ist `observed`, der Runtimewert ist nicht `null`, und beide Core-SemVer-Strings sind codeunitgleich | bei beobachteter Row 59 und nichtnullischem Runtimewert mit Ungleichheit `mismatch`; bei `null`, `not-observed` oder `ambiguous` ausnahmslos `unproven` |
| `I7` | Row 25 und `profileInstanceObservation` | Row 25 ist `observed` mit `profile.lifecycle === "fresh-disposable"`, und `true/false` leitet eindeutig eine neue Profilinstanz ab | bei vollständig beobachteter eindeutiger Wiederverwendung oder einem beobachteten anderen Lifecycle `mismatch`; bei unbekannter Profilableitung oder nicht beobachteter/mehrdeutiger Row 25 `unproven` |

Diese Relationen dürften keinen URL-Parser, keine URL-Normalisierung und keine
Hostauflösung verwenden. Insbesondere wäre die in Row 53 historisch gebundene
Form einschließlich ihrer beiden Quote-Codeunits zu vergleichen.

`I8` bliebe ausschließlich eine Provenienzgrenze:

- Die acht historischen Artefaktdigests und ihre Comparison-Basen blieben
  privat fest.
- Callerwerte könnten ihren reinen Valuevergleich zu `match` oder `mismatch`
  führen, aber niemals Commit-, Checkout-, Git-Blob- oder Dateibyteprovenienz
  bestätigen.
- `I8` dürfte weder ein 60. Comparisonfeld erzeugen noch als scheinbare
  Authentizität in `EQUIVALENT` eingerechnet werden.
- `sourceUnmodified` bliebe in der reinen Foundation ohne spätere
  identitätsgebundene Adapterableitung ausnahmslos `unproven`.

`noUnexplainedCausalDeviation` würde weiterhin ausschließlich aus
`unexplainedCausalDeviationObservation` abgeleitet: `true/false` ergäbe
`confirmed`, `true/true` ergäbe `contradicted`, jede andere
nichtwidersprüchliche Kombination `unproven`; `false/true` bliebe malformed.

Die Replayableitung würde vollständig und mit dieser Präzedenz lauten:

```text
DIVERGED :=
  mindestens ein Row-mismatch
  || mindestens ein I1–I7-mismatch
  || noUnexplainedCausalDeviation = contradicted

UNPROVEN :=
  kein DIVERGED-Grund
  && (
    mindestens ein Row-unproven
    || mindestens ein I1–I7-unproven
    || noUnexplainedCausalDeviation = unproven
  )

EQUIVALENT :=
  alle 59 Rows match
  && I1–I7 jeweils match
  && noUnexplainedCausalDeviation = confirmed
```

Die privaten `I1`-bis-`I8`-Zwischenergebnisse dürften nicht als neue
öffentliche Felder ausgegeben werden.

### 4. Totale Observer- und Operationsableitung

Die geschlossene Observerform und ihre Keyreihenfolge aus ADR 0033 würden
unverändert bleiben. Ihre Felder müssten vollständig wie folgt abgeleitet
werden:

| Feld | Ausschließliche Quelle | Positiver beziehungsweise erwarteter Fall | Eindeutig bekannter Gegenfall | Fehlender, mehrdeutiger oder nicht authentisch gebundener Fall |
| --- | --- | --- | --- | --- |
| `deltaProfile` | private Konstante | immer `adr-0030-passive-external-observer-v1` | keiner | keiner |
| `controllerExclusivity` | erst ein späterer identitätsgebundener Adapter | produktiv in der reinen Foundation nicht erreichbar | produktiv in der reinen Foundation nicht erreichbar | ausnahmslos `unknown` |
| `connectionProfile` | erst ein späterer identitätsgebundener Adapter | produktiv in der reinen Foundation nicht erreichbar | produktiv in der reinen Foundation nicht erreichbar | ausnahmslos `unknown` |
| `targetProfile` | vollständig gültige, eindeutig korrelierte Auswertung der begrenzten `targetInfos`-Beobachtung | genau ein Kandidat mit `type === "page"`, exakt gebundener Top-Level-URL und danach `attached === false` ergibt `single-goldendawn-top-level` | jedes vollständig lesbare, typgültige und eindeutig auswertbare Gegenprofil, einschließlich null passender Kandidaten oder genau eines passenden Kandidaten mit `attached === true`, ergibt `other` | fehlend, malformed, mehrdeutig, unkorrelierbar, nicht ausgeführt oder mehrere passende Kandidaten ergeben `unknown` |
| `foundationSha256` | erst spätere Adapterbindung an tatsächliche Foundationbytes | produktiv nicht erreichbar | produktiv nicht erreichbar | ausnahmslos `null` |
| `evaluationSha256` | fester Soll-Digest plus exakt gültiger `Runtime.evaluate`-Send-Ack | ausschließlich Ack `sendState: "sent-and-capture-cap-started"` für den exakt einen gebundenen Evaluate-Intent ergibt den festen Digest `a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b` | kein anderer Digest wird ausgegeben | kein Intent, Rejection, malformed oder unobservables Ack und unbekannter Sendestatus ergeben `null` |
| `controllerEvaluateIntentCount` | foundationeigener Intentledger | vor Erzeugung `zero`, danach exakt `one` | `multiple` ist durch Konstruktion und Grammatik ausgeschlossen | keiner der beiden Zustände wird aus Port- oder Networkdaten abgeleitet |
| `protocolOperations` | foundationeigener Intent- und gültiger Send-Ack-Ledger | nach der nachstehenden Operationsmatrix | mindestens zwei bestätigte Send-Acks derselben Operation ergeben `multiple/mismatch` | nach der nachstehenden Operationsmatrix |
| `mainWorldEvaluationCount` | ausschließlich vollständig akzeptierte korrelierte Main-World-v2-Replies | `zero`, wenn Evaluate konstruktiv gegatet blieb; `one` bei genau einem vollständig akzeptierten Reply | `multiple` nur bei mindestens zwei eindeutig korrelierbaren Replykandidaten | nach Evaluate ohne genau einen akzeptierten Wert, bei malformed, unkorrelierbar oder unbekanntem Sendestatus `unknown` |
| `transportFactoryCallCount` | ausschließlich `execution.factoryCallCount` eines vollständig akzeptierten Main-World-v2-Werts | dessen `zero` oder `one` wird unverändert projiziert; konstruktiv gegatetes Evaluate ergibt `zero` | ein produktiver `multiple`-Wert ist von der v2-Grammatik ausgeschlossen | nach Evaluate ohne akzeptierten v2-Wert `unknown` |
| `primitiveProjectionProfile` | private Konstante | immer `immediate-closed-by-value-pretransport-context-and-settlement-v2-no-handle` | keiner | keiner |
| `integrityChecks` | ausschließlich Entscheidung 5 | nach der 17-zeiligen Matrix | nach der 17-zeiligen Matrix | nach der 17-zeiligen Matrix |
| `interferenceObservation` | ausschließlich die terminalen 17 Integrityresultate | `none-contract-visible-detected` nur wenn alle 17 `confirmed` und keines `violated` ist | `contract-visible-detected`, sobald mindestens ein Check `violated` ist | sonst `unknown` |

Networkereignisse oder Senddaten dürften `mainWorldEvaluationCount` und
`transportFactoryCallCount` niemals ersetzen. `targetProfile: other` würde
eine vollständig bekannte Gegenbeobachtung bezeichnen; es dürfte nicht als
Ersatz für fehlende, malformed oder mehrdeutige Beobachtung verwendet werden.

Für jede der sechs `protocolOperations` würde `observedCountClass`
ausschließlich gültige Send-Acks zählen. Das Operationsergebnis müsste
zusätzlich den konstruktiven Send- und Ressourcenzustand berücksichtigen:

| Tatsächlich belegter foundationeigener Zustand | `observedCountClass` | `result` |
| --- | --- | --- |
| Kein Intent, weil die zugehörige Ressource nach dem vollständigen lokalen Ledger konstruktiv sicher nie aktiviert wurde | `zero` | `match` |
| Kein Intent, obwohl die zugehörige Ressource möglicherweise aktiv wurde oder ihr Zustand nicht beweisbar ist | `zero` | `unproven` |
| Exakt ein Intent wurde erzeugt, aber ein tatsächlicher Sendestatus ist wegen beobachteter Rejection, malformed oder unobservablem Settlement oder eines sonst fehlenden gültigen Acks nicht belegbar | `unknown` | `unproven` |
| Exakt ein gültiger, intent- und commandkorrelierter Send-Ack liegt vor | `one` | `match` |
| Mindestens zwei gültige, intent- und commandkorrelierte Send-Acks derselben Operation liegen vor | `multiple` | `mismatch` |

`observedCountClass: zero` allein würde folglich niemals das
Operationsergebnis bestimmen. Antwortdubletten, CDP-Erfolgs- oder
Fehlerantworten würden den Sendcount nie verändern. Ein bestätigter zweiter
Intent, eine unzulässige Operation oder ein anderer bereits in ADR 0033
definierter Ablaufverstoß würde unabhängig von dieser Countklasse sticky `V`
beziehungsweise im Cleanup `cleanupViolation` behalten; eine solche
Verletzung dürfte nicht durch ein epistemisches `unproven` neutralisiert
werden.

### 5. Totale Matrix der 17 Integritychecks

Nur `protocolAllowlistOnly` und `closedPrimitiveProjectionConfirmed` könnten
in der reinen Foundation positiv by construction bestätigt werden. Alle
Adapter-, Parser-, Pipe-, Actual-Send-, Ressourcen-, Runtime- und
Abwesenheitsbehauptungen blieben auf einem nicht widersprüchlichen reinen
Foundationpfad `unproven`. Ein eindeutig beobachtbarer, bereits durch den
Foundationvertrag definierter Gegenpfad dürfte den zugehörigen Check
`violated` setzen; bloß positive Portwerte dürften nie Provenienz aufwerten.

| `checkId` | `confirmed` genau dann, wenn | `violated` genau dann, wenn | `unproven` genau dann, wenn | Erreichbarkeit in Foundation v1 |
| --- | --- | --- | --- | --- |
| `sourceUnmodified` | ein späterer identitätsgebundener Adapter Checkoutbytes, Git-Blob unter `repositoryCommit` und den daraus selbst berechneten `foundationSha256` bytegleich bindet | dieselbe authentische Bindung eine Byte- oder Digestabweichung feststellt | diese Dreifachbindung fehlt, mehrdeutig ist oder nur callerlieferbare Digests vorliegen | ausschließlich `unproven`; `confirmed` und `violated` sind ohne Adapter produktiv unerreichbar |
| `instrumentedSourceCopyAbsent` | eine spätere vollständige authentische Source- und Residueinventur genau die reale uninstrumentierte Transportquelle und keine instrumentierte Kopie belegt | dieselbe Inventur eine instrumentierte oder ersetzende Sourcekopie belegt | keine vollständige authentische Inventur vorliegt | ausschließlich `unproven`; ein Foundationinput kann weder Abwesenheit noch Fund authentifizieren |
| `compositionSeamsAbsent` | spätere Bytebindung, tatsächlicher Evaluation-Send und vollständiger Adapter-/Capabilityledger gemeinsam die geschlossene Komposition ohne zusätzlichen Seam belegen | dieselben authentischen Quellen einen zusätzlichen Composition-Seam belegen | eine dieser Quellen fehlt oder nur aus Portbehauptungen stammt | ausschließlich `unproven`; der Gegenpfad ist produktiv ohne Adapter unerreichbar |
| `protocolAllowlistOnly` | der vollständige foundationeigene Intentledger ausschließlich die sechs erlaubten CDP-Kommandos mit ihren geschlossenen Profilen enthält | der foundationeigene Ledger ein anderes CDP-Kommando oder ein nicht erlaubtes Commandprofil enthält | kein terminal selbstgeprüfter Ledger materialisiert werden kann | auf jeder `ok:true`-Projection `confirmed` by construction; ein interner Konstruktionsverstoß führt zum statischen Foundationfehler, daher ist ein ausgegebenes `violated` produktiv unerreichbar |
| `runtimeSurfaceMutationAbsent` | eine spätere authentische Bindung des tatsächlich ausgeführten Evaluationtexts und der vollständigen Runtimeaktionen deren Mutationsfreiheit belegt | dieselbe Bindung eine Runtimeoberflächenmutation durch den Observer belegt | Actual-Send-, Ausführungs- oder Aktionsprovenienz fehlt | ausschließlich `unproven`; ein produktiver Foundation-Gegenpfad existiert nicht |
| `fetchInterceptionAbsent` | spätere authentische Runtime-, Operations- und Adapterledger jede Fetch-Interception ausschließen | ein authentischer Ledger eine Observer-Fetch-Interception belegt | die authentische Vollständigkeit fehlt | ausschließlich `unproven`; `violated` ist produktiv ohne Adapter unerreichbar |
| `debuggerBreakpointsAndSteppingAbsent` | ein späterer vollständiger authentischer CDP-/Adapterledger die Abwesenheit der Debuggerdomain sowie von Breakpoints und Stepping belegt | derselbe Ledger eine solche Operation belegt | nur der geschlossene Foundation-Commandledger, aber keine Vollständigkeit der realen Verbindung vorliegt | ausschließlich `unproven`; eine verbotene Debuggeroperation ist über den Foundationport nicht erzeugbar |
| `profilerAndTracingAbsent` | ein späterer vollständiger authentischer CDP-/Adapterledger die Abwesenheit von Profiler- und Tracingoperationen belegt | derselbe Ledger eine solche Operation belegt | reale Verbindungsvollständigkeit fehlt | ausschließlich `unproven`; der Gegenpfad ist über Foundation v1 produktiv unerreichbar |
| `responseBodyReadAbsent` | späterer authentischer Command- und Feldzugriffsledger vollständig belegt, dass kein Responsebody gelesen wurde | derselbe Ledger ein Bodykommando oder Bodylesen belegt | Parser-, Pipe- oder Adaptervollständigkeit fehlt | ausschließlich `unproven`; zusätzliche Felder in einer offenen Hülle beweisen kein Lesen |
| `freeRawInspectionAbsent` | ein späterer authentischer Parser-, Pipe-, Queue- und Descriptorledger vollständig nur die allowlisteten begrenzten Reads belegt | derselbe Ledger freie Rohinspektion belegt | die Foundation nur ihre eigenen Descriptorreads, nicht den vorgelagerten Rohpfad kennt | ausschließlich `unproven`; Proxy- oder Hüllendaten dürfen den Check nicht bestätigen oder verletzen |
| `additionalNativeFetchAbsent` | spätere authentische Main-World- und Requestownership-Ledger exakt den erlaubten einzelnen Transportpfad und keinen zusätzlichen nativen Fetch belegen | dieselben authentischen Ledger mindestens einen zusätzlichen nativen Fetch belegen | Main-World-v2-Counts oder Networkdaten ohne authentische Ownership allein vorliegen | ausschließlich `unproven`; ein zweiter Endpointrequest bleibt ein Budget-/Ablaufgegenpfad, beweist aber ohne Ownership noch keinen nativen Fetch dieses Checks |
| `observerProductEndpointRequestAbsent` | spätere authentische Requestownership und vollständiges Endpointbudget keinen observereigenen Produktendpointrequest belegen | dieselben Quellen mindestens einen observereigenen Produktendpointrequest belegen | Requestownership oder Vollständigkeit fehlt | ausschließlich `unproven`; Foundation-Networkdaten allein können Ownership nicht authentifizieren |
| `rawPersistenceAbsent` | spätere authentische Capability-, Output-, Storage- und Post-Cleanup-Residueledger die vollständige Abwesenheit von Rohpersistenz belegen | dieselben Ledger eine Observer-Rohpersistenz belegen | Adapter-, Storage- oder Residuebindung fehlt | ausschließlich `unproven`; der reine Outputledger beweist keine Hostabwesenheit |
| `observerDiagnosticDuringRunOutputAbsent` | ein späterer vollständiger authentischer Output- und Adapterledger bis zur Recordmaterialisierung keinerlei Diagnoseausgabe während des Laufs belegt | derselbe Ledger eine solche Ausgabe belegt | nur die fehlende Foundation-Intentart, nicht aber die reale Adapteroberfläche bekannt ist | ausschließlich `unproven`; ein produktiver Gegenpfad ist in Foundation v1 nicht beobachtbar |
| `closedPrimitiveProjectionConfirmed` | die Foundation den vollständig kopierten, frischen, gewöhnlichen, geschlossenen, tief eingefrorenen und eingabereferenzfreien Projektionsbaum selbst konstruiert und vollständig selbstgeprüft hat | eine eigene Outputprojektion nach Selbstprüfung nicht frisch, nicht geschlossen, nicht tief eingefroren oder eingabereferenzhaltend wäre | keine erfolgreiche selbstgeprüfte Projection existiert | jede `ok:true`-Projection trägt `confirmed`; jeder Fehler in Copy, Frische, Referenzfreiheit oder Freeze erzeugt stattdessen den statischen Foundationfehler, daher ist ein öffentliches `violated` produktiv unerreichbar |
| `singleTargetAndSessionConfirmed` | erst spätere authentische Target-, Session- und Routingbindung genau ein Target und genau eine flache Session belegt | ein bereits eindeutig korrelierter Foundation-Gegenpfad zwei widersprüchliche gültige Target-/Sessionbindungen oder zwei verschiedene sicher gebundene Sessions belegt | der positive Fall nur auf Portdaten beruht, eine Session fehlt, eine Antwort fehlt/malformed/doppelt/unkorrelierbar ist oder das Targetset null beziehungsweise mehrere passende Kandidaten besitzt | positiv ausnahmslos `unproven`; nur der ausdrücklich widersprüchliche Mehrfachbindungspfad kann `violated` erreichen; ein gewöhnliches Setup-`U` bleibt `unproven` |
| `singleMainWorldEvaluationConfirmed` | erst spätere Actual-Send-/Adapterbindung zusammen mit genau einem gültigen Evaluate-Reply und Main-World-Wert exakt eine Auswertung belegt | mindestens zwei eindeutig korrelierbare Evaluate-Replykandidaten oder widersprüchliche akzeptable Auswertungswerte beobachtet werden | kein, genau ein nur portbehaupteter, malformed, unkorrelierbarer oder unbekannt gesendeter Evaluatepfad vorliegt | positiv ausnahmslos `unproven`; der bereits definierte Mehrfach-/Widerspruchspfad kann `violated` erreichen |

Ein einzelnes formal gültiges `Target.getTargets`-Resultat mit null oder
mehreren passenden Targets bliebe `U/setup-terminal-unproven` und dürfte
`singleTargetAndSessionConfirmed` nicht zu `violated` oder den Observer zu
`FAIL` promovieren. Bei null passenden Targets wäre das eindeutig bekannte
`targetProfile` gleichwohl `other`; bei mehreren passenden Targets bliebe es
`unknown`. Entsprechend dürfte ein gewöhnlicher anderer `U`-Pfad nicht durch
eine aggressive Integrityableitung umklassifiziert werden.

`interferenceObservation` würde ausschließlich aus den terminalen 17 Zeilen
entstehen:

```text
mindestens ein violated
  -> contract-visible-detected

alle 17 confirmed und kein violated
  -> none-contract-visible-detected

sonst
  -> unknown
```

Damit wäre `none-contract-visible-detected` über die unveränderte öffentliche
Foundation-API in diesem Slice produktiv unerreichbar.

### 6. Totale Quellen- und Ergebnismatrix der zehn Stages

Die zehn Slots, ihre IDs, Layer und Clockdomänen blieben unverändert. Für
jeden Slot würde allgemein gelten:

- genau eine gültige, eindeutig attribuierte Beobachtung ergäbe `observed`;
- keine bis `O0` akzeptierte Beobachtung ergäbe
  `not-observed/unproven/null/unavailable`;
- mehrere plausible, widersprüchliche oder nicht eindeutig auseinander
  attribuierbare Kandidaten ergäben
  `ambiguous/unproven/null/unavailable`;
- genau ein eindeutig attribuierter bekannter Gegenwert ergäbe
  `observed/mismatch`;
- nur `observed` erhielte eine positive, je Layer lückenlose `receiptOrder`;
- Timing dürfte nur aus einem gültigen Sample der fest zugeordneten
  Clockdomäne entstehen; eine gültige `receiptOrder` dürfte fehlendes Timing
  niemals ersetzen.

Für die Networkslots 3 bis 7 wäre ein Kandidat nur dann eindeutig
attribuiert, wenn Session, Capturephase, Request-ID-Kette und jeweilige
Eventart ihn genau einem Slot zuordnen. Der erste so attribuierte
Produktrequest wäre der Preflightslot, der nächste davon verschiedene
Produktrequest der POST-Slot. Ein Event dürfte nie zwei Slots füllen.
`Network`-Nullpunkt bliebe der Timestamp des ersten eindeutig attribuierten
Produkt-`requestWillBeSent`; ohne diesen Nullpunkt blieben alle Networktimings
`null/unavailable`, selbst wenn ein späterer Slot anderweitig eindeutig
klassifizierbar wäre.

| Slot / `stageId` | Ausschließliche Quelle | `observed/match` | `observed/mismatch` | `not-observed` | `ambiguous` | Timing |
| --- | --- | --- | --- | --- | --- | --- |
| 1 `observer-armed` | lokaler Übergang nach positivem Setupcap-Arm und vor `attemptStarted` | auf jeder `ok:true`-Projection exakt `receiptOrder: 1` | produktiv unerreichbar; ein fehlerhafter Übergang erzeugt vor Start den statischen Foundationfehler | produktiv auf `ok:true` unerreichbar | produktiv auf `ok:true` unerreichbar | exakt `0/measured` in `controller-monotonic` |
| 2 `transport-call-dispatched` | ausschließlich `execution.transportCallCount` eines genau einmal akzeptierten Main-World-v2-Werts | exakt `one` | exakt `zero` als eindeutig bekannter Gegenwert | kein akzeptierter v2-Wert oder kein akzeptierter Ausführungswert bis `O0` | mindestens zwei korrelierbare Replies oder widersprüchliche akzeptable Ausführungswerte | bei `one` nur dann exakt `0/measured`, wenn das akzeptierte Settlement desselben v2-Werts durch `measured` oder `at-or-above-cap` zugleich einen gültigen Main-World-Startsample belegt; sonst `null/unavailable` |
| 3 `preflight-request-observed` | erster eindeutig attribuierter Produkt-`Network.requestWillBeSent` | exakte Endpoint-URL und Methode `OPTIONS` | eindeutig attribuierter erster Produktrequest mit anderer URL oder Methode | kein akzeptierter Kandidat bis `O0` | mehrere oder widersprüchliche Kandidaten für den ersten Produktrequest | als erster eindeutiger Produktrequest exakt `0/measured`, sonst `null/unavailable` |
| 4 `preflight-204-observed` | eindeutig dem gebundenen Preflight-Request zugeordnetes `Network.responseReceived` | exakte Endpoint-URL und ganzzahliger Status `204` | eindeutig zugeordnete Response mit anderer URL oder anderem endlichen nichtnegativen Integerstatus | keine akzeptierte korrelierte Response bis `O0` | mehrere oder widersprüchliche korrelierbare Responses | gültige Differenz zum Networknullpunkt nach 10-ms-Regel, sonst `null/unavailable` |
| 5 `post-request-observed` | nächster vom Preflight verschiedener eindeutig attribuierter Produkt-`Network.requestWillBeSent` | exakte Endpoint-URL und Methode `POST` | eindeutig attribuierter zweiter Produktrequest mit anderer URL oder Methode | kein akzeptierter zweiter Kandidat bis `O0` | mehrere oder widersprüchliche Kandidaten für diesen Slot | gültige Differenz zum Networknullpunkt nach 10-ms-Regel, sonst `null/unavailable` |
| 6 `post-response-200-observed` | eindeutig dem gebundenen POST-Request zugeordnetes `Network.responseReceived` | exakte Endpoint-URL und ganzzahliger Status `200` | eindeutig zugeordnete Response mit anderer URL oder anderem endlichen nichtnegativen Integerstatus | keine akzeptierte korrelierte Response bis `O0` | mehrere oder widersprüchliche korrelierbare Responses | gültige Differenz zum Networknullpunkt nach 10-ms-Regel, sonst `null/unavailable` |
| 7 `post-loading-finished` / `post-loading-failed` / `post-loading-terminal` | ausschließlich dem gebundenen POST eindeutig zugeordnetes Terminalevent | genau ein `Network.loadingFinished` ergibt `post-loading-finished/observed/match` | genau ein `Network.loadingFailed` ergibt `post-loading-failed/observed/mismatch` | kein Terminalevent ergibt `post-loading-terminal/not-observed/unproven` | mehrere oder widersprüchliche Terminalevents ergeben `post-loading-terminal/ambiguous/unproven` | nur bei genau einem Terminalevent gültige Differenz zum Networknullpunkt, sonst `null/unavailable` |
| 8 `public-promise-settled` | ausschließlich `settlement` eines genau einmal akzeptierten Main-World-v2-Werts | Paar `static-redacted-rejection/match` | Paare `fulfilled/not-applicable` oder `other-rejection/mismatch` sind eindeutige bekannte Gegenwerte zur historischen Reproduktion | `settlement: null`, kein akzeptierter v2-Wert oder kein Settlement bis `O0` | mindestens zwei korrelierbare Settlementkandidaten oder widersprüchliche akzeptable Paare | ausschließlich `relativeMilliseconds/timingState` des akzeptierten Settlementpaars in `javascript-main-world`; ungültiges Timing wird `null/unavailable` |
| 9 `cleanup-started` | lokale Anlage des Cleanup-Ledgers und der Stage nach tief eingefrorenem `O0` | auf jeder `ok:true`-Projection `observed/match` mit Cleanup-`receiptOrder: 1` | produktiv unerreichbar; nicht herstellbare lokale Anlage erzeugt den statischen Foundationfehler | produktiv auf `ok:true` unerreichbar | produktiv auf `ok:true` unerreichbar | bei gültigem `m_cleanup` exakt `0/measured`, bei portlosem oder nicht gültig messbarem Cleanup `null/unavailable` |
| 10 `cleanup-completed` | ausschließlich terminale Cleanupfinalisierung | Checks 1..19 terminal, Cleanupcap exakt storniert und gültiger Completion-Sample ergeben `observed/match` unabhängig davon, ob einzelne terminale Checks `failed` oder `unproven` sind | irreversibler Cleanup-Controlfehler, ungültiger Completion-Sample, portlose Terminalisierung oder terminal fehlgeschlagener Abschluss ergeben `observed/mismatch` | Gewinn der Cleanupdeadline ergibt `not-observed/unproven` | produktiv unerreichbar; ein interner Mehrfach- oder Widerspruchszustand ist ein irreversibler Cleanup-Controlfehler und fällt in `observed/mismatch` | gültiger Sample relativ zu `m_cleanup` nach 10-ms-Regel; jeder nicht vollständig gültige Sample zwingend `null/unavailable` |

Bei Stage 8 würde `match` die historische Settlementklasse bezeichnen, nicht
nur die syntaktische Gültigkeit des zulässigen Paars. Alle drei zulässigen
Paare blieben typgültig; `fulfilled/not-applicable` könnte deshalb später das
Candidate-Finding `original-failure-not-reproduced` tragen, obwohl Stage 8
gegen die historische Reproduktion `mismatch` wäre.

Stage 10 würde die unveränderten drei Finalisierungsgründe behalten:

```text
all-steps-terminal      -> observed/match bei gültigem Completion-Sample
cleanup-cap             -> not-observed/unproven
cleanup-terminal-failure -> observed/mismatch
```

Für einen nicht vollständig gültigen Completion-Sample müsste ausnahmslos
`relativeMilliseconds: null` und `timingState: unavailable` gelten; kein
provisorischer Timingwert dürfte erhalten, gerundet, projiziert, gehasht oder
serialisiert werden.

### 7. Cleanup und partielle Ressourcen vollständig totalisieren

Für jede erfolgreiche `ok:true`-Projection müssten die fünf rein
foundationeigenen Cleanupchecks nach ihrem lokalen Abschluss `confirmed`
sein:

| Check | Exaktes lokales Abschlussprädikat |
| --- | --- |
| `cleanupStarted` | `O0` ist tief eingefroren; Cleanup-Ledger und Stage 9 sind danach lokal angelegt. |
| `controllerObservationClosed` | `O0` ist die irreversible Observationgrenze; `U`, `V`, `C`, `closeClass`, Stages 1..8, Replay, Settlement, Budget und Counts sind danach unveränderlich. |
| `objectGroupsAbsentOrReleased` | Es wurde kein Object-Group-Intent erzeugt, und jeder foundationeigene Object-Group-Zustand ist geschlossen; ADR 0033 erlaubt weiterhin kein Handle und keine Object-Group-Operation. |
| `rawEventsDiscarded` | Sämtliche gehaltenen Dequeue-, Ack-, offenen Hüllen-, Own-Key-, Descriptor- und transienten Nachfahrreferenzen wurden vor Projectionmaterialisierung verworfen. |
| `ephemeralIdentifiersDiscarded` | Sämtliche ephemeren Target-, Session-, Request-, Command-, Cap- und Intentbindungen wurden aus allen erreichbaren Outputgraphen entfernt, bevor die Projection materialisiert wurde. |

Könnte eines dieser foundationeigenen Abschlussprädikate nicht hergestellt
oder selbstgeprüft werden, müsste der statische Foundationfehler entstehen;
eine `ok:true`-Projection mit einem `failed` oder `unproven` dieser fünf
Checks wäre unzulässig.

#### Sendzustandsabhängige Target-Session-Ableitung

Die Pauschale „Session nie gebunden bedeutet Session geschlossen“ wäre
unzulässig. Ausschließlich die folgende Matrix dürfte gelten:

| Attach-/Sessionzustand | `targetSessionClosed` | Detachverhalten | Detach-Operation |
| --- | --- | --- | --- |
| `Target.attachToTarget` wurde nach dem vollständigen lokalen Intent-/Ack-Ledger sicher nie gesendet | `confirmed` | kein `Target.detachFromTarget` | `zero/match` |
| Ein Attach-Intent existiert, sein Sendstatus ist aber wegen fehlendem Ack, beobachteter Rejection, malformed oder unobservablem Settlement unbekannt; keine Session-ID ist sicher bindbar | `unproven` | keine Session-ID erfinden, kein Detach | `zero/unproven` |
| Attach wurde gültig gesendet, aber es fehlt eine exakt korrelierte gültige Erfolgsantwort; die Antwort ist fehlend, malformed, doppelt oder unkorrelierbar, enthält einen Fehler oder endet mit Connection-Close | `unproven` | keine Session-ID erfinden, kein Detach | `zero/unproven` |
| Genau eine Session ist sicher gebunden und ein Detach-Intent kann wegen irreversibel geschlossenem Port nicht erzeugt werden | `unproven` | kein weiterer Exchange | `zero/unproven` |
| Genau eine Session ist sicher gebunden; Detach-Intent wird erzeugt, aber kein gültiger Send-Ack ist belegbar | bei beobachteter Send-Rejection `failed`; bei malformed Ack `failed` plus `cleanupViolation`; bei unobservablem Settlement oder verlorener Finalisierbarkeit `unproven` plus `cleanup-terminal-failure` | kein offener Command ohne Ack; globale Port- und Terminalregeln gelten | `unknown/unproven` |
| Genau eine Session ist sicher gebunden; exakt ein gültiger Detach-Send-Ack liegt vor, aber keine exakt korrelierte Erfolgsantwort | bei korrelierter normaler Fehlerantwort `failed`; bei malformed korrelierter Antwort `failed` plus `cleanupViolation`; bei fehlender Antwort, Cleanupcap oder Connection-Close `unproven` | offene Command-ID wird nach der bestehenden Purposematrix terminalisiert | `one/match` |
| Genau eine Session ist sicher gebunden und die exakt korrelierte Detach-Antwort besitzt exakt `result: {}` | `confirmed` | Sessionbindung wird geschlossen | `one/match` |

Insbesondere dürften ein Attach-Sendeintent mit fehlendem oder unbekanntem
Send-Ack, eine beobachtete Attach-Senderejection, ein malformed oder
unobservables Attach-Send-Settlement, ein bestätigter Attach-Send ohne
bindbare korrelierte Erfolgsantwort, eine fehlende, malformed, doppelte oder
unkorrelierbare Attach-Antwort sowie ein Connection-Close ohne korrelierten
Detach-Erfolg niemals eine geschlossene Session beweisen. Kein Pfad dürfte
eine Session-ID erfinden oder aus deren Fehlen eine Schließung ableiten.

#### Symmetrische Network-Domain-Ableitung

Dieselbe epistemische Trennung müsste für `Network.enable` und
`Network.disable` gelten:

| Enable-/Domainzustand | `networkDomainClosed` | Disableverhalten | Disable-Operation |
| --- | --- | --- | --- |
| `Network.enable` wurde nach dem vollständigen lokalen Intent-/Ack-Ledger sicher nie gesendet | `confirmed` | kein `Network.disable` | `zero/match` |
| Ein Enable-Intent existiert, sein Sendstatus ist aber wegen fehlendem Ack, beobachteter Rejection, malformed oder unobservablem Settlement unbekannt | `unproven` | bei sicher gebundener Session und offenem Port Disable nach der bestehenden Matrix versuchen; sonst keine ID erfinden | bei keinem möglichen Folgeintent `zero/unproven`, bei Disable-Intent ohne Ack `unknown/unproven` |
| Enable besitzt einen gültigen Send-Ack oder könnte tatsächlich gesendet worden sein, ist aber nicht sicher deaktivierbar | `unproven` | bei gebundener Session und offenem Port Disable versuchen | abhängig vom Send-Ack `zero/unproven`, `unknown/unproven` oder `one/match`; das Operationsergebnis allein bestätigt die Schließung nicht |
| Disable-Intent wird erzeugt, aber kein gültiger Send-Ack ist belegbar | bei beobachteter Rejection `failed`; bei malformed Ack `failed` plus `cleanupViolation`; bei unobservablem Settlement oder verlorener Finalisierbarkeit `unproven` plus `cleanup-terminal-failure` | Detach folgt nur einem kontrolliert beobachteten terminalen Disable-Sendeversuch; unobservables Settlement verbietet ihn | `unknown/unproven` |
| Exakt ein gültiger Disable-Send-Ack liegt vor, aber keine exakt korrelierte Erfolgsantwort | bei korrelierter normaler Fehlerantwort `failed`; bei malformed korrelierter Antwort `failed` plus `cleanupViolation`; bei fehlender Antwort, Cleanupcap oder Connection-Close `unproven` | Detach darf bereits nach dem terminal beobachteten Sendversuch folgen und wartet nicht auf diese Antwort | `one/match` |
| Die exakt korrelierte Disable-Antwort besitzt exakt `result: {}` | `confirmed` | Networkdomain ist kontrolliert geschlossen | `one/match` |

Eine sicher gebundene Session bei sicher nie gesendetem `Network.enable`
würde weiterhin die besondere Folge verlangen:

```text
kein Network.disable
-> Network.disable zero/match
-> Target.detachFromTarget dennoch nach der Target-Session-Matrix versuchen
```

Ein möglicherweise oder bestätigt gesendetes Enable würde bei sicher
gebundener Session und offenem Port einen Disableversuch verlangen. Detach
würde jedem kontrolliert beobachteten terminalen Disable-Sendeversuch folgen,
aber nicht auf dessen CDP-Antwort warten. Ein gültiges pending Send-Promise
bliebe die Livenessgrenze. Ein `settlement-unobservable` würde Port und Lease
nach dem bestehenden Closed-Tupel schließen und jeden Folge-Exchange
einschließlich Detach verbieten. Connection-Close ohne exakt korrelierte
Disable- beziehungsweise Detach-Erfolgsantwort würde die jeweilige Ressource
niemals `confirmed` schließen.

Die zwölf externen Cleanupfacts würden unverändert `false -> failed` und
`true -> unproven` abbilden. Check 20, das Cleanupresultat und die drei Gründe
`all-steps-terminal`, `cleanup-cap` und `cleanup-terminal-failure` blieben
unverändert. `cleanup.result` bliebe `FAIL` bei
`observationClosedBeforeCleanup !== true`, `cleanupViolation === true` oder
mindestens einem `failed`; sonst `UNPROVEN` bei mindestens einem `unproven`;
nur alle 20 `confirmed` ohne Controlverstoß könnten `PASS` ergeben.

### 8. Candidate-`PASS`, vollständige private Ableitung und Testbarkeit

Über die unveränderte öffentliche Foundation-API wären
`candidateObserverGate: PASS`,
`none-contract-visible-detected` und sämtliche PASS-spezifischen Findings in
diesem Slice konstruktiv unerreichbar. Öffentliche erfolgreiche
Foundationprojektionen dürften deshalb ausschließlich
`FAIL/observer-invalid` oder `UNPROVEN/inconclusive` enthalten. Ursache wären
die bewusst unbewiesenen adapter-, runtime- und ressourcenabhängigen
Integrity- und Cleanupchecks; diese Grenze dürfte nicht durch positive
Portdaten umgangen werden.

Diese produktive Unerreichbarkeit würde die vollständige private reine
Ableitung nicht schwächen. Die privaten Funktionen müssten weiterhin exakt
enthalten und testen:

```text
hardViolation
  -> candidateObserverGate FAIL
  -> candidateFinding observer-invalid

kein hardViolation, aber proofIncomplete
  -> candidateObserverGate UNPROVEN
  -> candidateFinding inconclusive

PASS + EQUIVALENT + ein Stimulus
     + OPTIONS-204-POST-200-loadingFinished
     + static-redacted-rejection/match
  -> static-rejection-reproduced-after-http200

PASS + EQUIVALENT + ein Stimulus
     + OPTIONS-204-POST-200-loadingFinished
     + fulfilled/not-applicable
  -> original-failure-not-reproduced

PASS + EQUIVALENT + ein Stimulus
     + vollständig bekannte andere Produktnetzsignatur
  -> network-signature-diverged

sonst
  -> inconclusive
```

`FAIL` müsste vor `UNPROVEN` Vorrang besitzen. `DIVERGED` dürfte allein kein
Observer-`FAIL` erzeugen, müsste aber jedes historische
Reproduktionsfinding verhindern. Der hypothetische PASS-Fallback müsste
`inconclusive` bleiben.

Für den späteren Foundationimplementierungsslice wäre ausschließlich folgende
White-box-Testtechnik zulässig:

1. Die exakten Produktionsquellbytes würden in ein betriebssystemseitiges
   Temporärverzeichnis außerhalb des Repositorys kopiert.
2. Über einen zuvor und danach exakt einmal passenden lexikalischen Anker
   würden ausschließlich testlokale Exports der privaten reinen Gate- und
   Findingfunktionen ergänzt.
3. Funktionskörper, Konstanten, Inputs und produktive Call-Sites dürften nicht
   verändert werden.
4. Nur die temporäre Kopie dürfte seriell importiert werden.
5. Die vollständige Wahrheitstabelle einschließlich FAIL-Präzedenz,
   UNPROVEN-Präzedenz, `DIVERGED`, aller drei hypothetischen PASS-Findings und
   des PASS-Fallbacks müsste geprüft werden.
6. Die temporäre Kopie müsste in `finally` entfernt und ihre Entfernung
   bestätigt werden.

Ein permanenter `__test`-Export, Environment- oder Debugschalter, eine weitere
Produktdatei, ein bedingter Export, eine manipulierte öffentliche
PASS-Projection und die Nutzung der Testkopie als Runtimeevidenz blieben
verboten. Testkopie und Testresultate wären ausnahmslos `NOT_EVIDENCE`. Die
unveränderte öffentliche Original-API müsste zusätzlich black-box beweisen,
dass Candidate-`PASS`, `none-contract-visible-detected` und alle
PASS-spezifischen Findings produktiv unerreichbar bleiben.

Zusätzlich zu der gesamten Testmatrix aus ADR 0033 müsste der spätere
Implementierungsslice getrennte Fälle für Folgendes enthalten:

- Attach sicher nie gesendet;
- Attach-Intent mit unbekanntem Sendestatus;
- beobachtete Attach-Senderejection;
- exakter Attach-Sende-Ack ohne Antwort;
- malformed, doppelte und unkorrelierbare Attach-Antwort;
- gebundene Session mit exakt korreliertem Detach-Erfolg;
- gebundene Session mit Detachfehler;
- Connection-Close ohne Detach-Erfolg;
- `zero/match` gegenüber `zero/unproven` bei demselben
  `observedCountClass: zero`;
- die symmetrischen Enable-/Disablefälle einschließlich der Sonderfolge
  „Session gebunden, Enable sicher nie gesendet“;
- sämtliche Klassen-, Prototyp-, `fresh`-, Deep-Freeze-, ASCII-, Zeitzonen-,
  Core-SemVer-, `I1`-bis-`I8`-, Replay-, Observer-, Integrity- und
  Stageableitungen dieses ADRs;
- die komplette private Gate-/Finding-Wahrheitstabelle über die ausschließlich
  temporäre Testkopie und die öffentliche Unerreichbarkeitsprobe.

Keiner dieser Fälle dürfte aus einer fehlenden Session-ID auf eine
geschlossene Session schließen.

### 9. Netzwerkfreie Foundation und begrenzte Repository-Regression

„Vollständig netzwerkfrei“ würde ausschließlich für diese drei Bereiche
gelten:

- das spätere Foundationmodul;
- seine neuen fokussierten Tests und alle darin verwendeten Effects;
- jeden Diagnoselauf dieses Slices, wobei ein solcher weiterhin nicht
  autorisiert wäre.

Die spätere unveränderte vollständige Repository-Regressionsprüfung dürfte
ausschließlich die bereits bestehenden kurzlebigen Loopback-Fixtures dieser
beiden bestehenden Testdateien ausführen:

```text
tests/localSyncGatewayHttpServer.test.js
tests/n8nCloudIngressProbe.test.js
```

Diese enge Ausnahme würde keine neue Foundation-Netzwerkfixture, keine
Änderung dieser beiden Dateien, keine Abhängigkeit der Foundationtests von
ihnen, keine externe Verbindung, keine DNS-Auflösung, keinen manuell
gestarteten Listener, keinen Browser-, CDP-, Vite- oder Diagnoseprozess und
keinen neuen Childprozess außerhalb der bereits bestehenden Testfixtures
erlauben. Die bestehenden Cleanup- und Portfreigabeprüfungen müssten bestehen.

Ein späterer Abschlussbericht dürfte daher nicht pauschal „kein Netzwerk
überhaupt“ behaupten, sondern müsste exakt unterscheiden:

```text
Kein neues, externes oder diagnostisches Netzwerk.
Ausschließlich die zwei unveränderten etablierten Loopback-
Regressionsfixtures wurden durch die vorgeschriebenen bestehenden Suites
ausgeführt.
```

## Konsequenzen

Bei späterer Annahme wären sämtliche bislang implementierungshemmenden
Klassen-, String-, Replay-, Observer-, Integrity-, Stage-, Cleanup- und
Testbarkeitsbegriffe geschlossen. Typfehler und semantische Abweichungen wären
sauber getrennt, und ein gewöhnlicher epistemischer `U`-Pfad könnte nicht
durch eine Abwesenheitsbehauptung unzulässig zu `FAIL` werden.

Insbesondere würde eine nicht bindbare Session niemals als geschlossen
gelten. `zero/match` wäre nur bei konstruktiv sicher nie aktivierter Ressource
zulässig; derselbe Countwert wäre bei möglicherweise aktiver oder
unbeweisbarer Ressource `zero/unproven`. Dieselbe Grenze würde symmetrisch für
die Networkdomain gelten.

Die öffentliche Foundation bliebe bewusst nicht evidenzfähig und könnte kein
Candidate-`PASS` hervorbringen. Ihre privaten reinen Gate- und
Findingableitungen wären dennoch vollständig prüfbar, ohne die öffentliche API
oder den Produktionsquellvertrag um einen Testseam zu erweitern.

Die Foundation und ihre fokussierten Tests blieben netzwerkfrei. Zugleich
würde die vollständige Repository-Regression nicht fälschlich behauptet
netzwerkfrei, sondern dürfte ausschließlich ihre zwei bereits etablierten
Loopback-Fixtures ausführen.

## Erwogene Alternativen

### Fehlende Session-ID als Schließungsbeweis

Diese Alternative würde verworfen. Nach einem möglicherweise gesendeten
Attach könnte die fehlende oder unbindbare Antwort nicht beweisen, dass keine
Session entstand. Sie würde gerade bei Rejection, malformed Settlement,
fehlender Antwort und Connection-Close eine falsche positive Cleanupaussage
erzeugen.

### `observedCountClass: zero` stets als `unproven` oder stets als `match`

Beide Pauschalen würden verworfen. `zero/match` wäre korrekt, wenn das lokale
Ledger konstruktiv beweist, dass die Ressource nie aktiviert wurde und der
Cleanupbefehl deshalb entfallen musste. `zero/unproven` wäre dagegen nötig,
wenn eine Ressource möglicherweise aktiv wurde oder ihr Zustand nicht mehr
entscheidbar ist.

### Positive Portdaten als Adapterprovenienz behandeln

Diese Alternative würde verworfen. Sie könnte Abwesenheits-, Actual-Send-,
Dateibyte-, Ressourcen- und Runtimebehauptungen aus callerbeeinflussbaren
Werten fälschlich bestätigen und Candidate-`PASS` produktiv erreichbar
machen.

### Permanenter privater Testexport oder öffentlicher PASS-Fixturepfad

Diese Alternative würde verworfen. Ein permanenter Testseam würde den einzigen
öffentlichen Export und die produktive Angriffsfläche verändern; ein
öffentlicher PASS-Fixturepfad würde eine nicht evidenzfähige Projection mit
einer scheinbar erfolgreichen Laufzeitbeobachtung verwechseln. Die zunächst
byteidentische und danach ausschließlich testlokal instrumentierte temporäre
Kopie trennt reine Wahrheitstabellenprüfung und Produktionsoberfläche.

### Jede Regression pauschal als netzwerkfrei bezeichnen

Diese Alternative würde verworfen. Die bestehenden Gateway- und n8n-
Regressionssuites verwenden bereits kontrollierte Loopback-Fixtures. Die
präzise Ausnahme bewahrt sowohl die Netzwerksperre der Foundation als auch die
ehrliche Beschreibung der vollständigen Regression.

## Bedingungen für eine Neubewertung

Eine Annahme dieses ADRs würde zunächst ein unabhängiges vollständiges
Review-`PASS` des normativen Modells und danach eine ausdrücklich getrennte
Statuspromotion erfordern. Erst anschließend dürfte ein eigener,
netzwerkfreier Implementierungsslice für Foundation und fokussierte Tests
autorisiert werden.

Eine spätere technische Neubewertung der Evidenzgrenze würde weiterhin einen
eigenen angenommenen Adapter-ADR, seine identitätsgebundene netzwerkfreie
Implementierung und erst danach einen gesondert autorisierten sichtbaren
Diagnoselauf benötigen. Bis dahin blieben die Foundation nicht implementiert,
Browserkomposition und Browser-End-to-End-`syncTest` geschlossen,
`causeStatus: CAUSE_NOT_PROVEN` unverändert und das ADR-0029-Gesamtgate vor wie
nach jeder reinen Foundationprojection `FAIL`.
