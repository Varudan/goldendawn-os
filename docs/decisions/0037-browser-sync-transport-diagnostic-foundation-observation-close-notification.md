# ADR 0037 – BrowserSyncTransport Diagnostic Foundation Observation-Close Notification

## Status

Angenommen – 2026-09-08

Jan hat ADR 0037 nach dem unabhängigen dokumentarischen Review ausdrücklich
angenommen. ADR 0037 ergänzt ADR 0035 gezielt und ersetzt keinen ADR formal.
Die Annahme entscheidet das beschriebene `D_K4`-Delta, implementiert es aber
nicht. Foundationänderung und zugehörige Tests benötigen weiterhin eine
gesonderte Beauftragung. ADR 0036 bleibt `Vorgeschlagen – 2026-09-06` und nicht
annahmereif.

Der unveränderte Hauptteil ab `## Kontext` enthält den unabhängig geprüften
Entscheidungsstand. Seine auf eine damals zukünftige Annahme bezogenen
Formulierungen sind im Licht der durch Jan erteilten Annahme zu lesen; alle
separaten Implementierungs-, Review- und Laufgates gelten fort. Der
unabhängige Review ist an die zuvor vollständig geprüften Dokumentbytes mit
SHA-256 `fb82c223ac75f5a5a90fc06796175323ece478ecc4a973268b27ee9ace87990e`
gebunden; dieser Wert ist nicht der Hash dieser statusgeänderten Datei.

## Kontext

Die nach ADR 0035 implementierte netzwerkfreie Foundation besitzt genau einen
öffentlichen Export, die Factory
`createBrowserSyncTransportRuntimeDiagnosticObserver({ effectPort, runBinding })`,
und einen exakt einfeldrigen Effectport `{ exchange }`. Sie friert bei einem
Beobachtungsabschluss zuerst ihren privaten Pre-Cleanup-Snapshot `O0` ein und
beginnt danach Cleanup. Die sieben Effects-Intents transportieren keine
authentische öffentliche Notification genau an dieser Grenze.

[ADR 0036](0036-browser-sync-transport-runtime-diagnostic-adapter-boundary.md)
benötigt dort den getrennten Adapterfreeze `A_obs`: nach vollständig gebildetem
`O0`, aber vor jeder danach folgenden Cleanupwirkung. Sein beschlossener
begrenzter syntaktischer Tracker darf Foundationsemantik nicht spiegeln,
Cancelcheckpoints nicht rückwirkend promoten und fehlende Intents nicht als
positive Evidenz werten. Ein Promise-Reaktionszaun kommt nach der atomaren
Foundationreaktion und damit für post-`O0`-Old-Cap-Cancels und portlose
Finalisierung zu spät. Gleiche Cancelpayloads oder Endprojektionen beweisen
weder Injektivität noch Nicht-Injektivität vollständiger öffentlicher Historien.

Der unabhängige Astra-Review der R1–R4-Dokumentkorrektur hat ausschließlich für
diesen begrenzten Dokumentationsscope keinen weiteren belegbaren
Dokumentblocker gefunden. Er ist an die ADR-0036-Rohbytes mit SHA-256
`08ba627230077020f2b3ae50b9903ebf768f4413ede242aac35294d2c1453d2e`
gebunden. Er ist weder ein ausgeführter Adapter-/Testkopiennachweis noch ein
Review dieses neuen ADR. Die ADR-0036-Datei bleibt in diesem Slice bytegleich.

Die gewählte Abhängigkeit `D_K4` ist genau eine synchrone, argumentlose,
einmalige `effectPort.observationClosed()`-Notification unmittelbar nach `O0`.
Ihre Portgrammatik, Referenzhaltung und Fehlerbehandlung benötigen eine eigene
Entscheidung, weil ADR 0033 in der von ADR 0035 fortgeführten Form nur eine
callerlieferte Capabilityreferenz zulässt und einen zweiten Callback verbietet.
Diese Regeln dürfen nicht durch einen Adapter oder einen Testhelper umgangen
werden.

## Entscheidungsvorschlag

### 1. Enges Delta und Fortgeltung

Bei Annahme würde ADR 0037 ADR 0035 gezielt ergänzen, keinen ADR formal
ersetzen und ADR 0036 weder annehmen noch implementieren. Nur die nachfolgend
ausdrücklich bezeichneten Port-, Referenz-, Maschinen- und Testregeln würden
die fortgeführten ADR-0033-/ADR-0034-/ADR-0035-Klauseln korrigieren. Alle übrigen
Regeln blieben unverändert.

Das Delta wäre ausschließlich:

1. ein zweites erforderliches Feld im bestehenden Effectport;
2. genau ein zusätzlicher zweckgebundener, löschbarer Capabilityslot;
3. ein synchroner zentraler Aufruf nach dem ersten erfolgreichen `O0`-Freeze;
4. dessen monotone Konsum-, Fehler- und Reentranzbehandlung;
5. die explizite Anpassung des privaten produktiven `RunMachineInput` und
   seiner erlaubten Konformitätsbeobachtung, ohne zusätzlichen Export;
6. die getrennte zukünftige Testmatrix einschließlich des offenen
   Deadline-Proxytrap-Nachweises.

Unverändert blieben ein öffentlicher Export, Factoryarity `1`, Runarity `0`,
die geschlossene `{ run }`-API, sieben Intentarten, sechs Protocol Commands,
59 Replayvergleiche, 17 Integritychecks, zehn Stages, zehn Capzustände,
20 Cleanupchecks, drei Clockdomänen und die Caps `6000/6000/60000 ms`.
`FoundationResult`, die 17 Rootfelder der `FoundationProjection`, Schema 1,
Candidate-Gate/Finding und `NOT_EVIDENCE` erhielten kein neues Feld. Die
Notification wäre kein achter Intent, kein weiterer Port, kein Ack und keine
Erweiterung eines Intentpayloads. Der bisherige Effects-Probe-Profilstring
und die sieben Intent-/Ack-Grammatiken blieben unverändert; das neue Feld wäre
eine erforderliche Factorydependency, keine dynamische Probenverhandlung.

Die vorhandenen `intentCount`, `nextIntentId`, `portCallCount`,
`capabilityCallCount` und Exchange-/Command-/Dequeuezähler blieben auf die
Sieben-Intent-Exchange-Strecke bezogen. Insbesondere würde der bisherige
`capabilityCallCount` weiterhin nur Exchangeaufrufe zählen, nicht die neue
Notification. Deren tatsächliche Aufrufzahl wäre getrennt am kontrollierten
Callback zu prüfen; ihr produktiver monotoner Konsumzustand dürfte keinen
zusätzlichen Exchange oder eine versteckte Intent-ID vortäuschen.

`overallGate: FAIL`, `causeStatus: CAUSE_NOT_PROVEN`, Evaluationstring,
Produktartefakte, historischer Evidence-Record, Browserkomposition und
Browser-End-to-End-Gates blieben unverändert.

### 2. Geschlossene Factory- und Notificationgrammatik

Die Optionsform bliebe exakt `{ effectPort, runBinding }`. Der Effectport
müsste künftig exakt die Own-Key-Folge `exchange`, `observationClosed`
besitzen. Seine gewöhnliche lokale Recordgrammatik, einmalige Reflectionfolge
und ausschließliche Own-Data-Lesung folgten unverändert ADR 0034. Die beiden
aufzählbaren Datendeskriptoren würden genau einmal in dieser Reihenfolge
gelesen; allein ihre gecachten Werte würden weiterverwendet. Kein freier
Propertyread, Getteraufruf oder späterer Read des Containers wäre zulässig.

`exchange` bliebe unverändert eine funktionale Capability. Für
`observationClosed` gälten zusätzlich exakt:

- `typeof` des gecachten Werts ist `function`;
- genau ein Read seines eigenen `length`-Deskriptors über die erfasste
  Reflectionintrinsik; erforderlich ist ein nicht aufzählbarer Own-Data-
  Descriptor mit primitivem Wert exakt `0`, ohne Getter oder Setter;
- keine zusätzliche Funktions-, Prototyp-, Quelltext-, Realm- oder
  Nativeklassifikation und kein zweiter Read dieses Deskriptors;
- beim späteren Aufruf exakt null Argumente und `undefined` als Receiver
  durch die bei Modulevaluation erfasste Apply-Intrinsik;
- synchrone Rückgabe ausschließlich des primitiven Werts `undefined`.

Die übrigen Descriptorflags der Funktions-`length` begründeten keine
Zusatzanforderung; die Funktion würde weder eingefroren noch mutiert. Eine
beobachtete Arity wäre kein Beweis für Harmlosigkeit, Synchronität, Proxyfreiheit
oder die Abwesenheit von Nebenwirkungen. Die Rückgaberegel wäre erst am
tatsächlichen Aufruf prüfbar, niemals durch einen Probeaufruf der Factory.

Ein fehlendes Feld, die alte Ein-Feld-Form, vertauschte oder zusätzliche Keys,
Accessors, falsche Funktion/Arity oder beherrschte Reflectionfehler ergäben
weiterhin ausschließlich den synchronen
`TypeError("invalidBrowserSyncTransportRuntimeDiagnosticObserverDependencies")`.
Dann entstünden weder API noch Run-Promise oder Effekt. Es gäbe keine optionale
Notification, keinen Default-No-op und keinen kompatiblen Legacyfallback.
Factory und Import blieben aufrufinaktiv; der neue inkompatible Inputvertrag
dürfte erst im getrennten autorisierten Foundationimplementierungsslice gelten.

### 3. Zwei getrennte Capabilityrollen, keine Datenreferenz

Die bisher einzige Ausnahme von der Eingabereferenzfreiheit würde eng um
genau die Notificationrolle erweitert. Für jede der beiden Rollen gäbe es
höchstens einen ownerzugänglichen persistenten Slot, zeitlich disjunkt:

```text
vor run:        capturedExchange, capturedObservationClosed
im Ownerlauf:   activeExchange, activeObservationClosed
nach Konsum:    activeObservationClosed = null
terminal:       beide Capabilityrollen gelöscht
```

Die Feldwerte müssten nicht unterschiedliche Funktionsidentitäten besitzen;
zwei Rollen wären kein Unabhängigkeits- oder Provenienzbeweis. Auch bei gleicher
Identität müsste der Konsum der Notificationrolle die noch benötigte
Exchangerolle unverändert lassen. Die spätere Referenz-/One-shot-Testgruppe
müsste diese Aliasvariante ausdrücklich mitprüfen.

Der erste öffentliche Run-Aufruf würde beide Rollen gemeinsam und synchron
ohne fremden Hook transferieren und die Factoryslots löschen. Bei falscher
Arity des ersten Runs würden beide Factoryslots gelöscht, ohne eine Funktion
aufzurufen. Nicht-Owner-Runs erhielten unverändert nur ihr eigenes statisch
erfülltes Fehler-Promise und dürften keine der beiden Rollen lesen, verändern
oder konsumieren.

Der bereits bestehende Exchange-Portschluss müsste weiterhin sofort
`activeExchange` und die Exchange-/Lease-/Dequeue-Referenzen verwerfen.
Er dürfte die noch benötigte `activeObservationClosed`-Referenz gerade nicht
löschen: Bei unbeobachtbarem Exchange und bestimmten Handler-/Joinfehlern
schließt die Foundation den Exchangeport vor `O0`. Der nur für `O0` bestimmte
Notification-Slot bliebe bis zum unmittelbar folgenden Freeze verfügbar,
ohne einen Exchange zu reaktivieren. Ein Prestartabschluss ohne `O0` würde ihn
dagegen ohne Aufruf verwerfen. Jeder terminal erreichbare Pfad müsste ihn vor
dem öffentlichen Runsettlement löschen.

Unmittelbar vor dem einmaligen Notificationaufruf würde der Owner die Funktion
in einen nur synchronen Stackwert übernehmen, den persistenten Slot löschen
und den Zustand auf `invoking` setzen. Reentranz dürfte die Referenz daher
nicht erneut konsumieren. Nach Rückkehr oder beherrschtem Throw würde auch
dieser Stackwert verworfen. Solange ein gültiger Exchange vor `O0` forever
pending bleibt, dürfte die noch nicht verbrauchte Notificationrolle gehalten
werden; daraus entstünde kein zusätzlicher Timer oder Abschluss.

Der `effectPort`-Container, Funktionsdeskriptoren und Callergraphen würden
nicht erhalten. Beide Funktionsidentitäten wären weder Output noch Daten,
Provenienz, Hashinput oder Gegenstand eines Freeze. Die vier bisherigen
transienten Datenrollen blieben unverändert. Lediglich für die unmittelbare
synchrone Notificationauswertung wäre ein Rückgabewert bis zum Vergleich mit
`undefined` erlaubt; kein Referenzwert dürfte einen weiteren Übergang,
Outputgraph, Promisehandler oder Cleanup-Ledger erreichen. Throwgründe würden
nicht gebunden, gelesen oder inspiziert.

### 4. Ein zentraler Linearisierungspunkt

Es gäbe genau einen produktiven Notificationcallsite in
`freezeObservationSnapshot`. Die atomare Reihenfolge wäre:

```text
gültiges O0 vollständig neu erzeugen und tief einfrieren
→ preCleanupObservationSnapshot einmalig an O0 binden
→ Notificationreferenz aus persistentem Slot konsumieren
→ observationClosed() synchron genau einmal aufrufen und Ergebnis behandeln
→ erst danach Phasenwechsel, Old-Cap-Scan oder Cleanup-Ledgerinitialisierung
→ bestehender regulärer oder portloser Cleanup
```

Die Notification bekäme weder `O0` noch Maschine, `purpose`, Closegrund,
Clockwert oder andere Daten. Ein fehlerfreier Aufruf würde nur den Zeitübergang
melden. Er bewiese nicht, dass ein fremder Empfänger tatsächlich `A_obs`
gebildet hat; die Foundation bliebe unabhängig davon `NOT_EVIDENCE`.

Die Kardinalität wäre exakt ein Aufruf pro tatsächlich erstmals erfolgreich
gebildetem `O0`, sonst null: vor `attemptStarted` und bei einem noch nicht
abgeschlossenen Pre-`O0`-Exchange kein Aufruf. Wiederverwendung eines bereits
vorhandenen `O0`, ein späterer portloser Cleanupfehler oder ein erneuter
idempotenter Aufruf des Freezers dürfte keinen zweiten Marker erzeugen. Ein
fehlgeschlagener Freeze ohne gebundenes `O0` dürfte keinen Erfolgsmarker oder
Ersatzsnapshot erzeugen. Ohne authentisches `O0`/`A_obs` bliebe ein Record
verboten; bestehende kontrollierte Foundationfehlerkanäle gälten fort.

Der neue Slot wäre von `portState` und der Exchange-Lease unabhängig. Die
Notification dürfte daher nach Exchange-Portschluss laufen, aber niemals vor
`O0` oder nach einer bereits begonnenen post-`O0`-Cleanupwirkung. Insbesondere
`cleanup-origin` wäre kein Ersatzcallsite, da ihm die Initialisierung des
Cleanup-Ledgers bereits vorausgeht.

### 5. Totale Fehler- und Reentranzbehandlung

Der produktive Zustand wäre geschlossen
`armed -> invoking -> consumed` beziehungsweise `armed -> discarded` für
terminales Ende ohne `O0`. Daneben gäbe es ein monotones primitives
`observationNotificationViolation: false -> true`. Der Zustand bliebe während
des gesamten fremden Aufrufs `invoking`, auch wenn eine Verletzung bereits
gelatcht wurde. Es gäbe weder Retry noch Rückkehr zu `armed`.

| Eintritt | Behandlung | Fortsetzung |
| --- | --- | --- |
| Rückgabe exakt `undefined` ohne Verletzung | konsumierter Slot bleibt null, Zustand `consumed` | ursprünglicher Cleanupweg, keine zusätzlichen Effects |
| beherrschter Throw oder beliebiger Nicht-`undefined`-Wert | Grund ungelesen; Ergebnis nur strikt mit `undefined` vergleichen, dann verwerfen; Verletzung sticky, Zustand `consumed` | ursprünglicher Cleanupweg mit gelatchter Cleanupverletzung |
| erforderlicher Slot fehlt am ersten gültigen `O0` oder Konsumzustand ist unmöglich | kein Ersatzaufruf, kein Default; Slot null, Notificationzustand `consumed`, bestätigte Kontrollverletzung | Cleanup fail-closed, kein erfundener Marker; `consumed` allein beweist keinen erfolgten Aufruf |
| öffentlicher reentranter oder paralleler `run()` | unveränderter Nicht-Ownerpfad, kein Zugriff auf Capabilityslots | Owner läuft unverändert weiter; das zurückgegebene Fehler-Promise ist kein Notificationergebnis, sofern der Callback es nicht zurückgibt |
| interner zweiter Exchange derselben Maschine während `invoking` | nach Maschinenidentität und vor Profilreflection, Pending-Join, Intent/ID, Ledger oder Portaufruf sperren; Notificationverletzung latchen, `undefined` zurückgeben | kein verschachtelter Effect; nach Callbackrückkehr ursprünglicher Cleanup |
| späte Promisehandler oder bereits vorhandenes `O0` | bestehende Token-/Terminal- und Snapshotguards | kein weiterer Notificationaufruf, keine eingefrorene Mutation |

Der interne Reentranzguard würde die bestehende zentrale Exchange-Grenze
ergänzen, keinen zweiten Dispatcher eröffnen. Außerhalb des synchronen
`invoking`-Intervalls blieben die ADR-0035-Pending-Join-Regeln unverändert.
Insbesondere bliebe eine allein gelatchte Pending-Join-Verletzung bis zum
ersten kontrollierten Handler ohne Cleanupwirkung; ein forever-pending
Exchange würde durch die neue Notification nicht beendet.

Ein Notificationfehler träte nach dem Freeze auf. Deshalb dürfte er `O0`,
dessen Closegrund und Stages 1–8 weder ändern noch durch einen zweiten Freeze
ersetzen. Er würde stattdessen vor jeder Cleanupinitialisierung die bestehende
monotone Cleanupverletzung (`cleanupInitialViolation` beziehungsweise
`cleanupViolation`) setzen. Das spätere Cleanup-Ledger und die frische
Candidate-Ableitung müssten diese Verletzung übernehmen:
`FAIL/observer-invalid` hätte Vorrang vor jedem `UNPROVEN` und jeder
Stimulusklasse. Ein offener zulässiger Exchange dürfte dennoch pending
bleiben; `FAIL` wäre keine Behauptung bereits erfolgten Settlements.

Die Notificationbehandlung würde keinen Port automatisch wieder öffnen,
keinen Old-Cap vorziehen, keine Cleanupaktion auslassen und keinen äußeren
Fehler werfen. Die vorhandenen Cleanupcaps, terminalen Fehlerkanäle und
statisch erfüllten öffentlichen Foundationfehler blieben maßgeblich. Könnte
keine gültige Erfolgsprojection materialisiert werden, gäbe es nur den
bestehenden statischen Fehler, keinen Ersatzrecord.

Thenables, native Promises, Proxywerte, Objekte und sonstige Rückgaben würden
weder assimiliert noch reflektiert, abonniert, eingefroren oder persistiert.
Ein vertragswidrig zurückgegebenes bereits abgelehntes Promise könnte deshalb
einen getrennten hostabhängigen Rejectionkanal besitzen. Die Foundation dürfte
dessen Eintritt, Zeit oder Ausgabenfreiheit nicht verneinen; Same-Realm ist
keine Sandbox. Ebenso könnte kein synchroner Guard einen nie zurückkehrenden
Callback oder einen blockierten Host präemptieren. Es gäbe keinen Ersatzclock-
oder Livenessbeweis.

### 6. Sieben reale Ablaufklassen

| Klasse | Lage des ersten Markers | Unveränderte Folge / Gegenprobe |
| --- | --- | --- |
| Setup-ready-Cancel | noch kein Marker beim Pre-`O0`-Cancel; erst nach einem später tatsächlich gebildeten `O0` | gültiger Cancelerfolg setzt Setup/Capture fort; beobachteter Reject oder malformed Settlement schließt danach; unbeobachtbar zuerst Portschluss, dann `O0`/Marker, dann portloser Cleanup; pending bleibt ohne Marker |
| Rejection-Quieszenz | nach dem beobachteten terminalen Quieszenz-Cancel und `O0`; bei unbeobachtbarem Cancel nach Portschluss und `O0` | vor diesem Cancel kein Marker; forever-pending bleibt ohne `O0`/Marker |
| post-`O0` Old-Cap-Cancel, Setup und Capture | genau einmal vor dem Scan, der Setup vor Capture prüft | beobachtetes Terminalsettlement setzt den Scan fort; unbeobachtbar portlos; pending hält das vorhandene `O0`, ohne zweiten Marker oder vorgezogenes Cleanup-Ledger |
| regulärer Cleanup | nach `O0`, vor Phase `cleanup`, optionalem Old-Cap-Scan und `initializeCleanupLedger` | `cleanup-origin`, Cleanupcap, Commands, Schritte und Finalisierung erst danach |
| portlos nach `attemptStarted` | Exchange-Portschluss zuerst, dann `O0` und trotzdem genau ein Marker | vor `initializeCleanupLedger` und portloser Finalisierung; kein neuer Exchange; gleiches Oracle beim erst später verarbeiteten Pending-Join-Verstoß |
| Fehler vor `attemptStarted` | null Marker und kein `O0` | beobachtete Prestart-Arm-Recovery bleibt unverändert; terminaler Fehler verwirft die Notificationrolle, pending hält sie; kein Record |
| portloser Fehler während begonnenem Cleanup | kein zusätzlicher Marker | bestehendes `O0` unverändert wiederverwenden, vorhandenes Cleanup-Ledger markieren/finalisieren; keine neue `A_obs`-Behauptung |

Diese Matrix dokumentiert den künftigen Vertrag auf Grundlage der bestehenden
Produktionsreihenfolge. Sie ist keine Behauptung bereits implementierter oder
ausgeführter Notificationtests. Ein späterer Adapter würde seinen eigenen
Fehler lokal latchen und synchron `undefined` zurückgeben; daraus könnte die
Foundation keinen erfolgreichen Adapterfreeze ableiten. Fehlender, früher,
doppelter, reentranter oder später Adaptermarker bliebe gemäß ADR 0036
Verletzung/no-record.

### 7. Ausführbarer späterer Testzugang ohne neuen Export

Der bestehende ADR-0035-Anker und seine Exportdeklaration blieben unverändert:
Factory plus exakt vier private produktive Exports, insgesamt fünf Namen.
Keine neue Testdatei, kein neuer Inspector, Adapterexport oder permanenter
Produktionsseam wäre erforderlich. Tests blieben seriell in der vorhandenen
Foundation-Suite; temporäre bytegeprüfte Testkopien würden weiterhin außerhalb
des Repositorys erzeugt und in `finally` entfernt.

Die private Factory mit Arity `1`
`createBrowserSyncTransportRuntimeDiagnosticRunMachine` müsste künftig exakt
folgenden internen Record entgegennehmen, in dieser Keyreihenfolge:

```text
{ activeExchange, activeObservationClosed, runBinding }
```

Die zwei Funktionen wären bereits vom öffentlichen Owner transferierte
Capabilities; `runBinding` bliebe die interne defensive Frozen-Projektion.
Der Konstruktor würde die beiden Funktionen auf Funktionalität prüfen, aber
weder aufrufen noch die öffentliche Notification-`length`-Prüfung wiederholen.
Der direkte private Testpfad dürfte die öffentliche Factorygrammatik nicht als
belegt ausgeben. Er müsste dieselbe Produktionsmaschine erzeugen, dieselben
Notificationzustände initialisieren und denselben ersten Exchange vorbereiten.

Die bisherige Konformitätsbeobachtung würde ausschließlich um die drei ohnehin
produktiven Werte `activeObservationClosed`,
`observationNotificationState` und `observationNotificationViolation`
erweitert. Das erlaubte bereits bestehende `preCleanupObservationSnapshot`
und `cleanupLedger` genügten für das Callsite-Oracle. Keine Testdaten würden
zusätzlich in die Maschine oder Projection aufgenommen.

Ein kontrollierter nullstelliger Callback dürfte in der temporären Kopie die
vom echten Konstruktor erhaltene Maschine in seiner Testclosure referenzieren.
Er würde während des
Aufrufs `O0 !== null`, Deep Freeze, `cleanupLedger === null`, Phase noch vor
Cleanup, konsumierten Capabilityslot und Zustand `invoking` prüfen. Gemeinsam
mit der aufgezeichneten echten Intentfolge belegte dies das synchrone Oracle;
der Callback bekäme weiterhin keine Argumente. Für portlose Pfade müsste er
zusätzlich `portState === "closed"` und `activeExchange === null` beobachten.
Nach dem Lauf würden Snapshotidentität und -werte unverändert bestätigt.

Die Pflichtmatrix des späteren Implementierungsslices wäre:

| Testgruppe | Positives und negatives Oracle | Verpflichtender kausaler Mutant |
| --- | --- | --- |
| öffentliche Factory | zwei Required-Keys in exakter Reihenfolge, Funktion/Own-Data-`length:0`, null Funktionsaufrufe; fehlend/alt/extra/falsche Arity/Accessor/Reflectionthrow statisch ablehnen; späterer Port-/Propertyaustausch ändert erfasste Identität nicht | Pflichtfeld oder einmalige Descriptorprüfung umgehen; Funktion später frei neu lesen |
| öffentliche One-shot-API | null Marker bei Import/Factory, falscher erster Run-Arity und Nicht-Owner; Owner höchstens einmal; kein neuer Export/Intent | Marker in Factory/Prestart oder Nicht-Owner einfügen |
| sieben Ablaufklassen | jede Zeile einschließlich beider Old-Caps und portlosen Observation-/Cleanupfällen; exakter Freeze-/Marker-/Cleanupzeitpunkt am produktiven privaten Pfad, entsprechende Markerzahl/Intentfolge zusätzlich black-box | Callsite entfernen, vor Freeze, nach Phasenwechsel, nach Old-Cap oder nach Ledgerinitialisierung verschieben; zweiten Aufruf ergänzen |
| Portschluss und Referenzen | Notification überlebt vor-`O0`-Portschluss; vor Invocation Slot null; terminal alle Slots null; vorhandenes `O0` unverändert | Notification zusammen mit Exchange zu früh löschen; nach Invocation/Terminalisierung behalten |
| Fehler und Reentranz | Throw und Nicht-`undefined` ohne Reflection/Assimilation; Cleanupverletzung sticky, `O0` unverändert, Cleanup weiterhin geordnet; öffentlicher Nicht-Owner inert; privater Exchange vor jeder Profiltrap gesperrt | Verletzung demoten; Callbackreturn assimilieren; internen Reentranzguard entfernen/verschieben |
| Pending-Join-Regression | alle 18 finiten ADR-0035-Fälle und das getrennte Drei-Microtask-Präfix-/strukturelle Forever-pending-Oracle unverändert; Pre-`O0` pending null Marker, post-`O0` pending genau ein Marker | neuer Marker beendet einen pending Exchange oder erzeugt vor dessen Handler Cleanup |
| Deadline-Reflection | Setup/Cleanup jeweils `deadline-1`, `deadline`, `deadline+1`; bei `=`/`>` alle vier Proxytraps null; eindeutiger Kontrollfall unterhalb der Deadline erreicht tatsächlich die Envelopeprüfung | inklusive Deadlineprüfung in exklusiv ändern oder Envelopeprüfung vor den Guard ziehen |

Für die Deadlinegruppe wären auf der Foundationebene ausdrücklich getrennte
Zähler für `get`, `getPrototypeOf`, `ownKeys` und
`getOwnPropertyDescriptor` des übergebenen Dequeue-Envelopes erforderlich.
Mutanten müssten den passenden identischen Vektor rot machen; ein Gettercount
allein genügte nicht. Der bestehende Test `entscheidet Setup- und Cleanup-Caps
unterhalb, exakt und oberhalb roh vor Reflection` beweist heute lediglich null
Getteraufrufe bei `=`/`>`. Andere vorhandene Proxytests adressieren Pending-Join
und den 129. Dequeue, nicht diese Deadlinegrenze. Diese Lücke bleibt bis zum
späteren tatsächlichen Testlauf offen; Raw-JSON-Adapterfixtures könnten sie
nicht schließen. Capture bliebe ausschließlich FIFO-`cap-fired`-gesteuert.

Die Fehlerreturntests würden kontrollierte Werte ohne unbeaufsichtigte
Hostrejections verwenden: primitive Nicht-`undefined`-Werte, getter-/trap-
gezählte Thenables/Proxies und ein bereits erfülltes natives Promise. Sie
belegten nur fehlende Reflection/Assimilation, keine vollständige Hoststille.
Notificationreentranz wäre über die bestehenden vier privaten Exports
erreichbar: derselbe echte Owner und die echte zentrale Exchange-Grenze, kein
nachgebauter Dispatcher. Während des Markers muss noch kein neuer
`nextExchangeRequestProfile` vorbereitet sein. Der negative Zweitaufruf würde
deshalb ausdrücklich ein früheres gespeichertes Produktionsprofil sowie
getrennt ein adversariales Proxyprofil verwenden. Der neue Guard müsste beide
bereits nach der Maschinenidentität und vor jeder Profilvalidierung oder
Reflection sperren. Diese ungültigen Testaufrufe würden keinen normalen
Exchange autorisieren; außerhalb `invoking` bliebe die Bindung an das aktuell
produktive Profil unverändert erforderlich.

Jeder Mutant dürfte nur eine deklarierte zusätzliche Änderung an der ansonsten
bytegleichen bereits freigeschalteten Testkopie besitzen. Unmutierte Baseline
müsste zuerst bestehen; Assertionbruch am betroffenen Oracle wäre der
Mutantennachweis, kein Syntax-/Importfehler. Keine feste zukünftige Testanzahl
würde erfunden. Die bestehende Baseline bleibt heute `422/422`.

### 8. Hash-, Versions- und Aktivierungsgrenze

In diesem Dokumentationsslice blieben Foundation und vorhandene Tests, alle
angenommenen/historischen ADRs, ADR 0036, sieben Produktartefakte,
Evidence-Record, Evaluationstring und Frontendmanifest bytegleich. Die
Baseline lautet `HEAD = main = origin/main =
c35aab4d8c3f87c5838e5d2ecf8727dfbb075801`, 162 getrackte Pfade und leerer
Index; die bereits vorhandenen sieben Living-Document-Änderungen und die
ungetrackte ADR-0036-Datei sind keine saubere Worktreebaseline.

Eine spätere implementierte Notification würde notwendigerweise neue
Foundation- und Testbytes erzeugen. Deren neue Rohhashes dürften erst aus der
tatsächlich getrennt autorisierten Implementierung abgeleitet werden. Die
alten festen Foundation-/Testhashes in ADR 0036 dürften bis dahin weder durch
erfundene Sollwerte ersetzt noch rückwirkend als neue Bytes ausgegeben werden.
Vor ADR-0036-Annahme wäre ein eigener dokumentierter Abgleich seines Load-,
Hash- und Testvertrags gegen die dann tatsächlich neue Foundation erforderlich.
Historischer Evidence-, Evaluation- und Produktartefaktbezug blieben davon
getrennt; ein neuer Foundationhash wäre kein Runtime- oder Ursachenbeweis.

## Konsequenzen und Sicherheitsgrenzen

Die Notification macht die ausgewählte Pre-Cleanup-Grenze synchron adressierbar,
ohne interne Beobachtungsdaten freizugeben oder zusätzliche Clock-, Timer-,
Protocol- oder Requestwirkungen einzuführen. Dafür wächst die erlaubte
Capabilityreferenzmenge gezielt von einer auf zwei Rollen; diese Änderung und
die notwendige Anpassung aller bestehenden Foundationfixtures sind ausdrücklich
Teil einer späteren Implementierung, nicht eine verdeckte optionale API.

Die Auswahl ist eine Architekturentscheidung unter dem begrenzten
Trackervertrag, kein Injektivitätsbeweis und kein Ausschluss aller denkbaren
Alternativdesigns. Die Foundation könnte weder einen fremden Callback
sandboxen noch dessen tatsächlichen `A_obs`-Freeze oder unabhängige Provenienz
bestätigen. `FAIL` hätte weiterhin Vorrang; positive Runtimeclaims wären
weiterhin nicht aus der Foundation allein ableitbar.

Der neue Callback löst weder die in ADR 0036 offen gehaltene Windows-
Prozessbaumownership noch handle-relative Profil-/Fragmentlöschung,
Adapterattestierung, effektive Browser-/Netz-/Storezustände oder Hostliveness.
Kein sichtbarer Prozess-/Profillauf wird dadurch zulässig. Phase 0/Tor A bleibt
für diesen Dokumentationsslice ohne Modell, Inferenz, Provider, private
Payloads, Credentials, neue Persistenz, Telemetrie oder fachliche Nebenwirkung.

## Verworfene Alternativen

- Promise-Reaktionszaun oder Runsettlement: nach möglichen Cleanupwirkungen,
  daher kein unmittelbarer Pre-Cleanup-Zeitpunkt.
- Cancelpayloadbit oder `cleanup-origin`: für portlose Pfade nicht allgemein
  erreichbar beziehungsweise erst nach Cleanup-Ledgerinitialisierung.
- Semantische Spiegelmaschine oder rückdatierte Cancelcheckpoints: außerhalb
  des beschlossenen begrenzten syntaktischen Trackers und kein kleineres Delta.
- Achter Intent, neuer Timer/Clockread, Payload mit `O0` oder zusätzlicher
  Export: unnötige Erweiterung von Effects-, Daten- oder Testgrenzen.
- Optionale Notification mit No-op-Default: verbirgt eine fehlende erforderliche
  Phasenbindung und ließe die alte Factoryform scheinbar konform bestehen.
- Notificationreferenz beim ersten Portschluss löschen: verhindert gerade den
  erforderlichen Marker im portlosen post-Start-Pfad.

## Bedingungen für Annahme und nächste Schritte

1. Diesen neuen Vorschlag unabhängig auf Portgrammatik, Referenzlebensdauer,
   zentrale Callsite, Fehler-/Reentranzverhalten, alle sieben Klassen und
   ausführbaren unvergrößerten Exportzugang prüfen. Der frühere R1–R4-PASS
   ersetzt diesen Review nicht.
2. Nur Jan kann ADR 0037 ausdrücklich annehmen. Bis dahin bleibt der bestehende
   Ein-Feld-Effectport die implementierte und angenommene Foundationbaseline.
3. Erst danach und nach gesonderter Beauftragung Foundation und vorhandene
   Tests netzwerkfrei anpassen, einschließlich Deadline-Proxytrap-Nachweis,
   Regressionen, Mutanten, Rohhashaudit und erneutem unabhängigen Review.
4. ADR 0036 anschließend gegen diese konkrete Foundation samt neuen Rohhashes
   erneut abgleichen und unabhängig prüfen; seine Annahme bleibt eine weitere
   ausdrückliche Entscheidung, nicht Folge dieses Dokumententwurfs.
5. Adapterimplementierung/-tests, Writer/Persistenz und ein sichtbarer
   Diagnoselauf bleiben getrennte spätere Autorisierungen. Die Windows-
   Prozessbaum-/Pfadcleanupabhängigkeit bleibt vor einem sichtbaren Lauf offen.

Dieser Slice erstellt weder Foundationcode, neue Tests oder Testkopieprofile,
Adapter noch Prototyp und führt keinen Browser-, CDP-, Gateway-, Vite-
Devserver-, Netzwerk- oder Diagnoselauf aus. Build und bestehende netzwerkfreie
Fokustests sind nur Bestandsprüfungen, keine Implementierungs- oder
Evidenznachweise für ADR 0037. Die bestehende Fokussuite verwendet ihre
unveränderten temporären ADR-0035-Konformitätskopien und entfernt sie wieder;
deren Ausführung ist kein Test der vorgeschlagenen Notification.

## Referenzen

- [ADR 0035 – angenommene Foundation-Testbarkeitsgrenze](0035-browser-sync-transport-diagnostic-foundation-join-and-internal-transition-testability-boundary.md)
- [ADR 0034 – fortgeführte Grammatik- und Ableitungsregeln](0034-browser-sync-transport-diagnostic-foundation-grammar-derivation-and-testability-boundary.md)
- [ADR 0033 – fortgeführte Effects- und Referenzgrenze](0033-browser-sync-transport-diagnostic-foundation-effects-protocol-boundary.md)
- [ADR 0032 – fortgeführte Determinismusgrenze](0032-browser-sync-transport-diagnostic-determinism-boundary.md)
- [ADR 0036 – vorgeschlagene Adaptergrenze und D_K4](0036-browser-sync-transport-runtime-diagnostic-adapter-boundary.md)
