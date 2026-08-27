# ADR 0026 – Browser SyncTransport Contract

## Status

Ersetzt durch [ADR 0027](0027-browser-sync-transport-proof-boundaries.md) – 2026-08-27

## Kontext

Die transportneutrale SyncService Foundation aus
[ADR 0017](0017-transport-neutral-sync-service-foundation.md) besitzt bereits
den einzigen Port:

```js
syncTransport.sendSyncRequest(syncRequest)
```

Der separat und ausschließlich explizit startbare lokale HTTP-Prozess aus
[ADR 0020](0020-local-sync-gateway-raw-wire-http-foundation.md) bindet fest an
`127.0.0.1` und stellt ausschließlich `/api/sync-test` bereit. Nach
[ADR 0023](0023-local-syncagent-before-optional-external-providers.md) liegt
der lokale SyncAgent vor allen optionalen Providern. Die durch
[ADR 0025](0025-local-syncgateway-syncagent-composition.md) entschiedene
Gateway-/SyncAgent-Komposition ist implementiert: Ein exakt geeigneter leerer
synthetischer `syncTest` kann über einen bewusst gestarteten lokalen Gateway
mit HTTP `200` und einer defensiv projizierten normalen SyncResponse enden.

Zwischen dem SyncService im Browser und diesem Gateway fehlt weiterhin ein
konkreter Transport. Vor dessen Implementierung müssen Modulgrenze, Ziel,
Requestserialisierung, Fetch-Policy, Deadline, Responsebegrenzung und
Fehlersemantik verbindlich entschieden werden. Die Entscheidung darf den
bestehenden SyncContract, den Service-Port, das Gateway oder den SyncAgent
nicht verändern und noch keinen Browserrequest ermöglichen.

Browser-JavaScript, Same-Realm-Abhängigkeiten und Fetch-Responses bleiben
unvertrauenswürdig. Deep Freeze und Loopback sind keine Sandbox. Eine
Clientgrenze kann beobachtbare Fehler redigieren und eigene Materialisierung
begrenzen, aber bereits ausgelöste Proxy-, Browser-, Netzwerk-, Betriebssystem-
oder Serverwirkungen weder verhindern noch rückgängig machen.

## Formale ADR-Wirkung

ADR 0026 ergänzt:

- [ADR 0017](0017-transport-neutral-sync-service-foundation.md);
- [ADR 0020](0020-local-sync-gateway-raw-wire-http-foundation.md);
- [ADR 0023](0023-local-syncagent-before-optional-external-providers.md);
- [ADR 0025](0025-local-syncgateway-syncagent-composition.md).

ADR 0026 ersetzt keine bestehende Entscheidung. SyncContract, SyncService-Port,
Local SyncGateway, SyncAgent und die bestehenden Implementierungen bleiben
unverändert.

Dieser Slice ist ausschließlich ein Dokumentations- und Entscheidungsgate für
den folgenden isolierten Implementierungsslice. Er autorisiert und implementiert
noch keinen Transport, Fetch-Aufruf, Browserfluss, Browser-End-to-End-Test,
Nutzertrigger oder eine Komposition in `src/main.js`.

## Entscheidung

### Geplantes Modul und öffentliche API

Der spätere Browsertransport liegt ausschließlich in:

```text
src/transports/browserSyncTransport.js
```

Das Modul exportiert ausschließlich:

```js
createBrowserSyncTransport
```

Jeder Factoryaufruf liefert eine frische gewöhnliche und eingefrorene API mit
exakt einer eigenen aufzählbaren Dateneigenschaft:

```js
{
  sendSyncRequest
}
```

`sendSyncRequest(syncRequest)` besitzt genau einen formalen Parameter und
akzeptiert exakt ein Argument. Eine fehlende oder zusätzliche Eingabe wird vor
Argumentinspektion, Composition-Dependency-Zugriff oder -Aufruf, Timer oder
Netzwerk als abgelehntes Promise beendet. Die Methode erzeugt und liefert bei
jedem Aufruf unmittelbar ein echtes Same-Realm-Promise mit exakt dem bei
Modulevaluation erfassten nativen Promise-Prototyp. Sie liefert weder einen
synchronen Result-Envelope noch ein benutzerdefiniertes Thenable und verwendet
für fremde asynchrone Werte niemals `Promise.resolve` oder eine frei gelesene
`.then`-Property.

Modulimport und Factory starten weder Fetch, Timer, Listener noch Request- oder
Runtimeverarbeitung. Bei erfolgreicher Modulevaluation werden die tatsächlich
benötigten Referenzen privat erfasst. Dazu gehören mindestens:

- `Reflect.ownKeys`, `Object.getOwnPropertyDescriptor`,
  `Object.getPrototypeOf`, `Object.hasOwn`, `Object.freeze`,
  `Object.isFrozen`, `Array.isArray` sowie eine sichere Funktionsanwendung mit
  dem richtigen Receiver;
- die Identitäten von `Object.prototype`, `Array.prototype`,
  `Promise.prototype`, `Uint8Array.prototype`, `ArrayBuffer.prototype`,
  `TextEncoder.prototype` und `TextDecoder.prototype` samt ihren benötigten
  Ketten bis `null`;
- den nativen Same-Realm-`Promise`-Konstruktor, `Promise.prototype`,
  `Promise.prototype.then`, die Identität von `Symbol.species`, den
  ursprünglichen Own-Property-Descriptor von
  `Promise.prototype.constructor`, den ursprünglichen Own-Property-Descriptor
  von `Promise[Symbol.species]` und die ursprüngliche Species-Getteridentität;
- `JSON.stringify`, `JSON.parse`, `TextEncoder.prototype.encode`,
  `TextDecoder.prototype.decode`, die nativen Typed-Array-Buffer-, ByteLength-
  und Kopier-Intrinsics sowie die zur ArrayBuffer-Brand- und ByteLength-Prüfung
  sowie, sofern unterstützt, zur Resizable-Prüfung benötigten Prototypgetter;
- die übrigen benötigten nativen Konstruktoren und die Browserdefaults
  `fetch`, `AbortController`, `setTimeout` und `clearTimeout`.

Das bloße Erfassen eines Konstruktors genügt nicht: Insbesondere Encoder-,
Decoder- und Promise-Prototypmethoden werden selbst erfasst und später mit dem
kontrollierten richtigen Receiver angewendet. Dasselbe gilt für Typed-Array-
und ArrayBuffer-Getter. JSON-, Encoding-, Reflection-, Typed-Array-,
ArrayBuffer- und Promise-Intrinsics sind nicht injizierbar.

`createBrowserSyncTransport(composition)` besitzt genau einen formalen
Parameter. `createBrowserSyncTransport()` mit null Argumenten prüft vor der
API-Ausgabe die Verwendbarkeit der erfassten Browserdefaults und verwendet
private Wrapper darum. `createBrowserSyncTransport(undefined)` mit explizit
einem Argument, jeder Aufruf mit zusätzlichen Argumenten sowie ein fehlender
oder unbrauchbarer erforderlicher Browserdefault sind ungültig.

Bei exakt einem Composition-Argument liest die Factory mit der erfassten
Reflection dessen vollständige Own-Key-Menge genau einmal und anschließend in
fester Reihenfolge jeden erforderlichen Own-Property-Descriptor genau einmal.
Zulässig ist ausschließlich ein gewöhnlicher Record mit den vier
aufzählbaren Own-Data-Funktionen `fetchRequest`, `createAbortController`,
`setDeadlineTimer` und `clearDeadlineTimer`. Symbole, Accessors, Zusatzfelder,
ungeeignete Prototypen, leere oder partielle Container, nicht funktionale Werte,
Descriptor-Throws und widersprüchliche Beobachtungen werden abgelehnt. Nach der
Erfassung wird keine Composition-Property erneut gelesen; die Funktionen
werden während der Factoryerzeugung nicht aufgerufen.

Jeder Factoryfehler wirft vor API-Ausgabe, Seam-Aufruf, Timer oder Netzwerk
ausschließlich einen `TypeError` mit der statischen Meldung
`Ungültige BrowserSyncTransport-Komposition.`. Beobachtete Reflection-,
Descriptor- oder Proxy-Trap-Throws werden in denselben Fehler redigiert;
bereits ausgelöste Seiteneffekte können nicht verhindert oder rückgängig
gemacht werden, und blockierender Trapcode bleibt vertrauenswürdige
Same-Realm-Composition.

Die einzigen Seam-Aufrufe sind exakt:

```text
fetchRequest(fixedEndpoint, freshRequestInit)
createAbortController()
setDeadlineTimer(onDeadline, 5000)
clearDeadlineTimer(timerHandle)
```

Jede Seam wird mit `undefined` als Receiver und nur in den dokumentierten
Pfaden aufgerufen. Die Defaultwrapper kapseln einen etwaig erforderlichen
nativen Browserreceiver. Andere Composition-Seams sind unzulässig. Endpoint,
Deadline, Request- und Responsegrößenlimits sind feste private Modulwerte und
nicht injizierbar. Der Transport garantiert höchstens einen Aufruf von
`fetchRequest` mit der festen URL und dem unten geschlossenen Argumentgraphen.
Er kann nicht beweisen, dass eine absichtlich bösartige injizierte Test- oder
Compositionfunktion intern nur einen Netzwerkrequest ausführt. Der produktive
Defaultpfad verwendet ausschließlich die erfasste native Browserfunktion.

Bereits vor Modulevaluation kompromittierte Primordials, Browserengine oder
Modulcode sowie OOM und Prozessabbruch bleiben außerhalb der Garantie.
Same-Realm-Composition ist keine Sandbox.

Der bestehende Port und der SyncService bleiben unverändert:

```js
syncTransport.sendSyncRequest(syncRequest)
```

Der SyncService erhält keinen Transport-Result-Envelope, keine HTTP-Metadaten
und kein zweites Methodenargument.

### Fester lokaler Endpoint

Version 1 verwendet ausschließlich:

```text
http://127.0.0.1:8787/api/sync-test
```

Scheme, IPv4-Literal, Port und Pfad sind private feste Modulwerte. Unzulässig
sind:

- `localhost`;
- IPv6;
- relative URLs;
- DNS-Auflösung;
- URL-, Host-, Port- oder Pfadparameter;
- Discovery oder Portscan;
- alternative Endpoints;
- Redirect-Follow;
- Fallbacks;
- Werte aus UI, Request, Payload, Query, DOM, Storage oder Environment.

Der Port `8787` ist damit für den späteren Browserpfad kanonisch. ADR 0020
behält trotzdem seine explizite variable Server-Runtime-Konfiguration und
erhält keinen Default. Vor dem späteren Browserfluss muss der Operator den
Gateway ausdrücklich passend starten:

```powershell
$env:GOLDENDAWN_SYNC_GATEWAY_PORT = '8787'
```

`GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN` bleibt eine getrennte serverseitige
Konfiguration und muss exakt der tatsächlichen lokalen Frontend-Origin
entsprechen. Sie ist nicht die Ziel-URL. Der Browsertransport erhält, erzeugt
oder setzt keine Origin. `Origin`, `Host` und `Content-Length` bleiben
browserverwaltet.

### Defensive Requestgrenze

Auch das einzige Methodenargument bleibt unvertrauenswürdig. Nach bestandener
Arity-Prüfung entsteht genau ein autoritativer descriptor-basierter Snapshot.
Es gibt keine getrennte Callervalidierung mit anschließendem erneuten Auslesen:

1. Mit der erfassten Own-Key-Reflection wird die vollständige Own-Key-Menge des
   Callerroots genau einmal erfasst. Sie muss ausschließlich aus den sechs
   Stringkeys `version`, `action`, `source`, `requestId`, `timestamp` und
   `payload` bestehen. Symbole, Zusatzkeys, fehlende Keys und widersprüchliche
   Beobachtungen werden fail-closed abgelehnt.
2. Danach wird die Root-Prototypidentität genau einmal erfasst und muss exakt dem bei
   Modulevaluation erfassten gewöhnlichen `Object.prototype` entsprechen.
3. In der festen Reihenfolge `version`, `action`, `source`, `requestId`,
   `timestamp`, `payload` wird jeder erforderliche Own-Property-Descriptor
   genau einmal erfasst. Zulässig sind ausschließlich vorhandene aufzählbare
   Own-Data-Properties. Accessors, Descriptor-Throws oder eine nicht zum
   einmaligen Keysnapshot passende Beobachtung werden abgelehnt.
4. Die Payloadidentität wird ausschließlich aus dem bereits erfassten
   `payload`-Rootdescriptor übernommen. Die Rootproperty wird dafür nicht
   erneut gelesen.
5. Die vollständige Payload-Own-Key-Menge wird genau einmal erfasst und muss
   exakt leer sein.
6. Danach wird die Payload-Prototypidentität genau einmal erfasst und muss
   exakt dem erfassten gewöhnlichen `Object.prototype` entsprechen. Damit ist
   nur ein exakt leeres gewöhnliches Datenrecord zulässig. Payload-Symbole,
   Accessors, Zusatzkeys, Reflection-Throws oder widersprüchliche Beobachtungen
   werden abgelehnt.
7. Die fünf erfassten Werte `version`, `action`, `source`, `requestId` und
   `timestamp` müssen primitive Strings sein. Nach Abschluss dieses Snapshots
   wird keine Caller- oder Caller-Payload-Property, kein Descriptor, Key oder
   Prototyp erneut gelesen.
8. Ausschließlich aus diesen Snapshotwerten entsteht descriptor-basiert ein
   vollständig frischer gewöhnlicher Sechs-Felder-Requestgraph mit einem
   ebenfalls frischen exakt leeren Payload. Callerroot, Callerpayload und
   andere fremde verschachtelte Identitäten werden nicht übernommen.
9. Ausschließlich dieser eine frische Graph ist Validatorinput. Derselbe Graph
   wird mit dem erfassten Requesttimestamp als Referenzzeit genau einmal vor
   seinem Deep Freeze und genau einmal nach seinem Deep Freeze vollständig
   gegen den bestehenden SyncRequest-Vertrag validiert. Callerroot,
   Callerpayload und die interne Snapshotmenge werden niemals an den Validator
   übergeben; es gibt keinen dritten Aufruf oder alternativen Validierungspfad.

Der autoritative Snapshot ist kein zweites Requestobjekt, sondern nur die
intern erfasste Menge aus Root- und Payload-Own-Key-Ergebnissen,
Prototypidentitäten, Deskriptoren, fünf primitiven Stringwerten und der belegten
exakt leeren Payload.

Die Referenzdifferenz null beweist ausschließlich die interne Konsistenz des
transportierten Snapshots. Sie ist kein unabhängiger Frische-, Replay-,
Uhrzeit- oder Identitätsnachweis. Die operative Frischeprüfung bleibt Aufgabe
der bestehenden Gatewaygrenze; ADR 0026 führt weder Browserclock noch neue
Replaygarantie ein.

Ein stateful Proxy kann nach Abschluss des autoritativen Snapshots keine
anderen Callerwerte mehr zwischen maßgeblicher Vertragsprüfung und
Serialisierung einschleusen. Eine universelle Proxyerkennung oder
Same-Realm-Sandboxgarantie wird nicht behauptet. Bereits während der einmaligen
Reflection beobachtete Inkonsistenzen stoppen fail-closed. Der Callergraph wird
weder verändert noch eingefroren.

### Geschlossene Requestserialisierung

Vor der Serialisierung muss der frische Requestgraph terminal ausschließlich
mit erfassten Intrinsics bestätigen:

- Root und Payload besitzen exakt die festgelegten aufzählbaren
  Own-Data-Properties und keine Symbole, Accessors oder Zusatzfelder;
- Root und Payload besitzen exakt die Kette
  `Record → capturedObjectPrototype → null`;
- beide Records sind tatsächlich eingefroren;
- weder Root noch Payload besitzen eine eigene `toJSON`-Property;
- der erfasste `Object.prototype` besitzt nach bestätigter Kette ebenfalls
  keine eigene `toJSON`-Property;
- der Graph enthält außer dem frischen Payload keine verschachtelte
  Objektidentität.

Danach liegt vor dem Serialisierungsaufruf kein weiterer absichtlicher
unvertrauenswürdiger Hook. Es folgt exakt:

1. ein Aufruf der erfassten nativen `JSON.stringify`-Referenz ohne Replacer;
2. Annahme ausschließlich eines primitiven Strings;
3. ein Aufruf der erfassten `TextEncoder.prototype.encode`-Referenz mit dem
   kontrollierten zugehörigen Encoder als richtigem Receiver;
4. eine Brand-, Prototyp- und ByteLength-Prüfung des echten, nicht
   unterklassifizierten `Uint8Array`-Encoderresultats mit erfassten
   Typed-Array-Intrinsics;
5. Annahme höchstens bis einschließlich `65.536` Bytes; Byte `65.537` wird
   abgelehnt.

Es gibt keinen zweiten Stringify- oder Encode-Durchlauf, keinen Replacer,
Reviver, Stringify-/Parse-Roundtrip, Clone, Merge, Trim, keine Reparatur,
Normalisierung oder Bereinigung. Nur aus den Snapshotwerten wird der eine
frische Graph gebildet; ausschließlich dieser wird genau zweimal validiert
sowie genau einmal serialisiert und als UTF-8 gemessen. Post-import ersetzte globale JSON-,
Encoder-, Reflection-, Freeze-/Frozen- oder Typed-Array-Funktionen sowie später
installierte relevante `toJSON`-Properties dürfen keinen fremden Requestbody,
Sentinel oder Exceptiontext erzeugen.

### Exakte Fetch-Policy

Nach vollständig bestandener Requestgrenze beginnt höchstens ein einziger
Aufruf der erfassten beziehungsweise ausdrücklich injizierten Fetchfunktion.
Nach erfolgreicher Serialisierung wird davor über die erfasste Seam genau ein
frischer AbortController erzeugt. Seine Signalidentität und Abortmethode werden
jeweils genau einmal kontrolliert aufgelöst und zusammen mit dem Controller als
richtigem Receiver gespeichert. Ein werfender Controller-/Signalzugriff oder
eine nicht funktionale Abortmethode endet vor RequestInit, Timer und Fetch als
statischer Transportfehler. Das Signal bleibt ansonsten eine opake, exakt
einmal erfasste Identität ohne separate Brand-, Typ-, Eigentums- oder
Freezegarantie; eine spätere native Fetch-Brandablehnung endet ebenfalls
statisch redigiert. Erst dann entsteht ein pro Aufruf frischer, tatsächlich eingefrorener
Null-Prototyp-`RequestInit`-Record mit exakt diesen zehn eigenen aufzählbaren
Dateneigenschaften:

```text
method
mode
credentials
cache
redirect
referrerPolicy
keepalive
headers
body
signal
```

Die Werte sind unveränderlich festgelegt:

```text
method: POST
mode: cors
credentials: omit
cache: no-store
redirect: error
referrerPolicy: no-referrer
keepalive: false
body: exakt der einmal erzeugte JSON-String
signal: ausschließlich die einmal erfasste Signalidentität des frischen
        internen AbortControllers
```

`headers` ist ein separates, pro Aufruf frisches und tatsächlich eingefrorenes
Null-Prototyp-Record mit exakt einer eigenen aufzählbaren Dateneigenschaft:

```text
Content-Type: application/json; charset=utf-8
```

RequestInit und Headers werden vor Fetch mit erfassten Intrinsics auf exakte
Own-Key-Menge, ausschließlich Own-Data-Properties, Nullprototyp und tatsächlichen
Frozen-Zustand geprüft. Sie besitzen keine geerbten Eigenschaften. Das
Einfrieren des RequestInit-Records friert das fremde beziehungsweise native
Signalobjekt nicht ein und begründet weder Eigentum noch Mutabilitäts- oder
Freezegarantien für dieses Signal.

`Content-Type` ist der einzige vom Anwendungscode gesetzte Header. Der Browser
verwaltet insbesondere `Origin`, `Host`, `Content-Length`, Connection- und
Fetch-Metadaten selbst.

Nicht eingeführt werden:

- Authorization;
- Cookies oder Credentials;
- Secret- oder Providerheader;
- frei konfigurierbare Header;
- ein Caller-`AbortSignal`;
- ein zweites Methodenargument;
- Retry oder Backoff;
- Redirect;
- HTTPS-, Proxy- oder Remote-Fallback;
- alternativer Host oder Port;
- alternativer Pfad;
- ein zweiter Transportversuch.

Genau ein Fetch-Aufruf ist keine Behauptung über genau einen HTTP-Wirevorgang.
Der Browser kann wegen CORS einen Preflight ausführen; Netzwerk-
Retransmissionen oder bereits begonnene Serververarbeitung bleiben ebenfalls
möglich.

### Event-loop-basierte Deadline- und Abort-Zustandsmaschine

Die spätere Implementierung verwendet eine event-loop-basierte Deadline von
exakt `5.000 ms` ausschließlich für die asynchrone Fetch- und
Response-Stream-Phase. Sie kann synchrone UTF-8-Decodierung und `JSON.parse`
nicht präemptiv unterbrechen. Diese synchrone Terminalphase beginnt erst nach
vollständig abgeschlossenem, transport-eigenem Empfang von höchstens `16.384`
Bytes. Bei blockiertem Eventloop besteht keine harte Echtzeitgarantie.

Nach vollständig bestandener lokaler RequestInit-Vorbereitung werden die bereits
erfassten Controller-, Signal- und Abortwerte weder erneut aufgelöst noch
ersetzt. Timer und Fetch verwenden ausschließlich diesen einen Aufrufzustand.

Jeder Methodenaufruf besitzt genau einen ersten terminalen Owner:

```text
active → success | transportFailure | deadline
```

Nur der erste ausgeführte terminale Übergang darf den Zustand des äußeren
Promises bestimmen. Alle späteren Übergänge sind wirkungslos. Unmittelbar vor
Fetch wird `setDeadlineTimer(onDeadline, 5000)` genau einmal aufgerufen:

- Feuert `onDeadline` bereits synchron während dieses Seam-Aufrufs, gewinnt die
  Deadline, `fetchRequest` wird nullmal aufgerufen und ein danach
  zurückgegebener Timerhandle wird genau einmal best effort gelöscht.
- Wirft `setDeadlineTimer`, ohne dass die Deadline vorher gewonnen hat, gewinnt
  `transportFailure`; Fetch wird nullmal aufgerufen. Wurde kein Handle
  zurückgegeben, wird keines erfunden oder gelöscht.
- Bleibt der Zustand aktiv, wird unmittelbar vor dem Aufruf intern
  `fetchStarted` gesetzt und danach `fetchRequest(fixedEndpoint,
  freshRequestInit)` genau einmal aufgerufen. Ein synchroner Throw oder ein
  Rückgabewert ohne das unten festgelegte native Promiseprofil gewinnt
  `transportFailure`; es gibt keinen Retry.

Für Fetch, jeden Reader-Read und jedes zulässige Cleanup-Promise ist
ausschließlich ein echtes Same-Realm-Promise zulässig. Unmittelbar vor jeder
Anwendung der erfassten `Promise.prototype.then`-Referenz und ohne
zwischenliegenden unvertrauenswürdigen Hook wird mit erfassten Intrinsics
bestätigt:

1. Der Kandidat besitzt exakt den erfassten `Promise.prototype`.
2. Seine vollständige Own-Key-Menge ist exakt leer; insbesondere besitzt er
   keine eigene `constructor`-Property.
3. Seine Promise-/Object-Prototypkette bis `null` ist unverändert.
4. `Promise.prototype.constructor` besitzt noch exakt den bei Modulevaluation
   erfassten ursprünglichen Own-Data-Descriptor mit der erfassten nativen
   Promise-Konstruktoridentität.
5. `Promise[Symbol.species]` besitzt noch exakt den erfassten ursprünglichen
   Own-Accessor-Descriptor mit der erfassten Species-Getteridentität.
6. Erst danach wird die erfasste `then`-Methode mit dem Kandidaten als
   richtigem Receiver angewendet.

Brand-, Own-Key-, Descriptor-, Konstruktor-, Species-, Prototyp- oder
Applyfehler enden statisch fail-closed. Eine frei aufgelöste `.then`-Property
oder `Promise.resolve` wird nie verwendet. Promise-Subclassen, Proxies, fremde
Thenables, eigene Promisekeys und eine eigene `constructor`-Property werden
abgelehnt.

Alle installierten Fulfillment- und Rejectionhandler sind vollständig intern
kontrolliert. Sie fangen jeden beherrschten Throw ihrer Verarbeitung selbst ab,
geben weder Response-, Reader-, Chunk-, Parsed-, Sentinel- noch andere fremde
Werte zurück und liefern auf jedem Pfad exakt den primitiven Wert `undefined`.
Späte Settlementhandler prüfen zuerst den terminalen Zustand, starten nach
verlorenem Rennen keine weitere Verarbeitung und geben ebenfalls ausschließlich
`undefined` zurück. Damit kann auch das von der nativen `then`-Operation
erzeugte und nicht verwendete Folgepromise keinen fremden Handlerrückgabewert
assimilieren.

Gewinnt die Deadline, wird das äußere Promise sofort statisch abgelehnt. Diese
Ablehnung wartet weder auf Abort noch auf Reader-Cancel, Release oder Fetch-
Settlement. Sobald `fetchStarted` gesetzt ist, ruft jeder anschließend
gewinnende Zustand `transportFailure` oder `deadline` die gespeicherte
Abortmethode mit dem Controller als Receiver höchstens einmal nicht blockierend
best effort auf. Das gilt auch für synchronen Fetch-Throw, ungültiges
Fetch-Promiseprofil, Fetch-Rejection, Non-200, Redirect, falsche finale URL,
falschen Response-Typ, Responsegetter-/Snapshot-, Header-, Body-, `getReader`-
oder Methodenauflösungsfehler sowie jeden späteren Reader-, Chunk-, Cap-, EOF-,
Release-, UTF-8-, JSON- oder Promise-Handoff-Fehler. Vor Fetch wird kein Abort
erfunden; Erfolg ruft Abort nullmal auf. Ein
übernommener Reader wird zusätzlich
nicht blockierend best effort höchstens einmal gecancelt und höchstens einmal
freigegeben. Cleanup-Throws ändern den Owner nicht; zurückgegebene zulässige
native Cleanup-Promises werden ausschließlich über erfasste Promiseintrinsics
mit konsumierenden Handlern beobachtet. Fremde Thenables werden nicht
assimiliert.

Vor Readerübernahme wird keine zusätzliche Bodymethode zu Cleanupzwecken
aufgelöst; der gespeicherte Controllerabort ist dort der einzige
Netzwerkcleanup. Kein Cleanup wartet auf Fetch-, Abort-, Cancel- oder
Releaseabschluss, erzeugt einen zweiten Abschluss oder startet einen weiteren
Fetch. Der vorhandene Timerhandle bleibt unabhängig davon genau einmal best
effort zu löschen.

Ein Fetch oder Reader, der Abort oder Cancel ignoriert und nie endet, blockiert
die bereits gewonnene Deadline-Rejection nicht. Späte Fulfillments und
Rejections werden konsumiert, starten keine Bodyverarbeitung und können weder
einen zweiten Abschluss noch einen zweiten Fetch auslösen. Jeder tatsächlich
zurückgegebene Timerhandle wird auf allen terminalen Pfaden genau einmal best
effort über `clearDeadlineTimer(timerHandle)` gelöscht; Vortimerpfade greifen
nullmal auf diese Seam zu.

Abort beweist nicht, dass keine Bytes übertragen wurden oder der Server den
Request nicht bereits verarbeitet hat. Es gibt keine Exactly-once-,
Rücknahme-, Replay-, Deduplizierungs- oder Idempotenzgarantie, keinen Retry und
keinen parallelen Fetch. Die Per-Call-Grenze ersetzt keine globalen Rate-,
Parallelitäts-, Queue-, Prozess-, CPU- oder Heapgrenzen.

### Geschlossene Response- und Headerbeobachtung

Nach Fulfillment des zulässigen Fetch-Promises werden aus dem unvertrauenswürdigen
Responsewert in genau dieser Reihenfolge jeweils genau einmal gelesen und
unmittelbar geprüft, bevor das nächste Feld gelesen wird:

1. `status`
2. `redirected`
3. `url`
4. `type`
5. `headers`
6. `body`

Ein Getter- oder Reflection-Throw, ein fehlender oder ungeeigneter Wert oder
eine widersprüchliche Beobachtung endet sofort fail-closed; alle nachfolgenden
Felder werden dann nullmal gelesen. Ausschließlich HTTP-Status exakt `200`,
`redirected === false`, die exakte finale URL
`http://127.0.0.1:8787/api/sync-test`, `type === "cors"`, eine geeignete
Headergrenze und ein vorhandener geeigneter Streambody dürfen weiterlaufen.
`basic`, `default`, `opaque`, `opaqueredirect`, `error` und jeder andere Typ
werden abgelehnt. Ein Non-200 beendet die Prüfung bereits nach `status`; weder
weitere Responsefelder noch Header oder Bodymethoden werden gelesen, der Body
wird nicht geparst und der Controller wird wegen `fetchStarted` höchstens
einmal abortiert.

Von der bestandenen Headeridentität wird die Methode `get` genau einmal sicher
aufgelöst. Danach wird jeder browserexponierte Wert mit `headers` als richtigem
Receiver in dieser festen Reihenfolge genau einmal gelesen und unmittelbar
geprüft, bevor der nächste Header gelesen wird:

1. `content-type`
2. `content-length`
3. `content-encoding`

Verbindlich sind:

- Content-Type exakt `application/json; charset=utf-8`;
- Content-Length als vorhandene kanonische vorzeichenlose ASCII-Dezimalzahl
  `0` oder `[1-9][0-9]*`, ohne Whitespace oder alternative Darstellung, und
  höchstens `16384`;
- browserexponiertes Content-Encoding exakt `null`.

Erst nach allen drei bestandenen Headerprüfungen wird das Responsefeld `body`
gelesen. Ein früher Headerfehler liest spätere Header und `body` nullmal.

`Content-Encoding` ist kein automatisch CORS-safelisted Responseheader. Der
aktuelle Gateway exponiert ihn nicht durch eine zusätzliche CORS-Expose-Policy;
der Transport sieht ausschließlich das CORS-gefilterte `Headers`-Objekt. Der
Wert `null` bedeutet daher nur „im gefilterten Browserheadersobjekt nicht
sichtbar“. Er unterscheidet nicht zwischen einem auf der tatsächlichen Response
fehlenden und einem vorhandenen, aber nicht exponierten Wire-Header. Ein
browserexponierter nicht-null-Wert ist inkompatibel und wird abgelehnt. ADR 0026
behauptet weder Wire-Abwesenheit noch fehlende Browserdekompression.

Diese Regeln begrenzen nur vom Browser exponierte, möglicherweise bereits
normalisierte Headerwerte und möglicherweise bereits decodierte Responsebytes.
Die Gleichheit von browserexponierter Content-Length und kopierter Bytezahl ist
ein enger Kompatibilitäts- und Konsistenzcheck für den kanonischen Gatewaypfad,
kein allgemeiner Kompressions- oder Wire-Oktett-Beweis. Ein künftig verlangter
beweiskräftiger sichtbarer Content-Encoding-Nachweis benötigt einen neuen
Entscheidungsslice für Gateway-/CORS-Änderung und zusätzliche Expose-Header.
Der aktuelle Gateway und seine CORS-Header bleiben in diesem Slice unverändert.
Die Regeln behaupten außerdem keinen Schutz vor einer bereits vorher erfolgten
Browser-, Provider-, Betriebssystem- oder Netzwerkallokation.

### Geschlossene Reader- und Chunkkopiergrenze

Vom einmal erfassten Body wird `getReader` genau einmal aufgelöst und mit dem
Body als richtigem Receiver genau einmal aufgerufen. Nach erfolgreicher
Readerübernahme werden `read`, `cancel` und `releaseLock` jeweils genau einmal
aufgelöst und mit dem Reader als dauerhaft gespeichertem richtigem Receiver
verwendet. Reads erfolgen strikt seriell; ein weiterer Read beginnt erst nach
vollständiger Prüfung und Kopie des vorherigen Chunks.

Für die deklarierte Länge wird genau ein transport-eigener echter
`Uint8Array`-Puffer dieser Länge und damit von höchstens `16.384` Bytes auf
einem festen, nicht geteilten transport-eigenen `ArrayBuffer` angelegt. Es gibt
keinen zweiten Bodypuffer. Jeder Reader-Read muss das oben festgelegte native
Promiseprofil besitzen. Für seinen Fulfillmentwert wird der Prototyp genau
einmal erfasst; danach muss die einmal erfasste vollständige
`Reflect.ownKeys`-Sequenz exakt `['value', 'done']` entsprechen. Anschließend
werden die Own-Property-Deskriptoren trotzdem in der festen Reihenfolge zuerst
`done`, dann `value` jeweils genau einmal erfasst und danach ausschließlich
diese Snapshotwerte verwendet. Zulässig ist nur ein gewöhnlicher exakter
Zwei-Felder-Own-Data-Record mit exakt dem erfassten `Object.prototype`;
Symbole, Accessors, Zusatzfelder, malformed Resultformen sowie beobachtbare
Proxy-Traps oder Snapshotinkonsistenzen werden abgelehnt. Eine universelle
Erkennung transparenter Record-Proxies wird nicht behauptet.

- Bei `done === false` muss `value` eine echte, brandgeprüfte, nicht
  unterklassifizierte `Uint8Array`-Instanz mit exakt dem erfassten
  `Uint8Array.prototype` sein. Ihre backing-buffer-Identität wird ausschließlich
  über die erfasste native Typed-Array-Buffer-Intrinsic mit dem Chunk als
  richtigem Receiver ermittelt. Der Buffer muss ein echter Same-Realm-
  `ArrayBuffer` mit exakt dem erfassten `ArrayBuffer.prototype` sein.
  `SharedArrayBuffer`, Growable SharedArrayBuffer, Proxy, fremder, detached oder
  malformed Buffer werden abgelehnt. Unterstützt die Plattform resizable
  ArrayBuffers und ist ihr Zustand über die erfasste native Intrinsic prüfbar,
  muss `resizable` exakt `false` sein.
- Bei `done === true` müssen beide Datenfelder vorhanden sein und `value`
  exakt `undefined` entsprechen.

ByteLength und Kopie verwenden ausschließlich erfasste Typed-Array- und
ArrayBuffer-Intrinsics mit richtigen Receivern. Die Chunk-ByteLength muss eine
sichere positive Ganzzahl sein. `byteLength === 0` gewinnt unmittelbar den
statischen Transportfehler: Der leere Chunk wird nicht kopiert, ein zweiter
Read beginnt nicht und der Post-Fetch-Pfad führt zu Abort sowie Reader-Cleanup.
Vor jeder anderen Kopie werden deklarierte Restlänge und absolute Grenze
geprüft. Exakt `16.384` kopierte Bytes sind zulässig. Würde ein Chunk Byte
`16.385` oder die deklarierte Länge überschreiten, gewinnt der statische
Transportfehler vor Kopie, weiterer Allokation oder weiterem Read. Zwischen
der letzten Bufferprüfung und der sofortigen Kopie liegt kein absichtlicher
unvertrauenswürdiger Hook. Jeder akzeptierte Chunk wird sofort mit erfassten
Intrinsics in den einen transport-eigenen Puffer kopiert; seine fremde
Identität wird danach nicht aufbewahrt. Wiederverwendete oder später mutierte
Readerchunks können bereits kopierte Bytes daher nicht verändern.

Da jeder akzeptierte Nicht-EOF-Chunk mindestens ein Byte beiträgt und die
deklarierte Gesamtlänge höchstens `16.384` beträgt, sind höchstens `16.384`
akzeptierte Nicht-EOF-Reads möglich. Es gibt keine zusätzliche frei
konfigurierbare Readgrenze und keine endlose Null-Chunk-Microtaskfolge.

Ein sauberer EOF ist nur bei exakter Gleichheit von deklarierter und kopierter
Bytezahl zulässig. Dann wird `cancel` nullmal und `releaseLock` genau einmal mit
dem Reader als Receiver aufgerufen; ein Throw beim normalen `releaseLock`
verhindert den Erfolg. Nach einem Fehler ab Readerübernahme werden `cancel` und
`releaseLock` jeweils höchstens einmal nicht blockierend best effort versucht.
Bei Deadline gilt dieselbe nicht blockierende Best-Effort-Grenze. Cleanup kann
keinen zweiten terminalen Owner erzeugen.

### Strikte Decodierung, Parsing und Promise-Handoff

Nach sauberem EOF, exakter Längengleichheit und erfolgreichem normalem
`releaseLock` wird die Deadline logisch deaktiviert und der vorhandene
Timerhandle genau einmal best effort gelöscht. Erst danach beginnt die
ressourcenbegrenzte synchrone Terminalphase; ein späterer Timercallback darf
keinen Deadline-Owner mehr gewinnen.

Der eigene Bytepuffer wird genau einmal über die erfasste
`TextDecoder.prototype.decode`-Referenz mit dem kontrollierten Decoder als
richtigem Receiver streng als UTF-8 decodiert. Der Decoder verwendet
`fatal: true` und `ignoreBOM: true`. Eine exponierte UTF-8-BOM bleibt damit als
U+FEFF für den Parser sichtbar, wird weder entfernt, getrimmt noch repariert und
führt zu einem statischen Transportfehler, wenn der unveränderte String dadurch
kein gültiges JSON ist. Danach wird exakt einmal die erfasste native
`JSON.parse`-Referenz ohne Reviver aufgerufen. Es gibt keine zweite Decodierung
oder Parseoperation und keine Reparatur oder Normalisierung.

Vor dem unmittelbaren Fulfillment wird die native Promise-
Assimilationsgrenze terminal geprüft:

- primitive Parsed-Werte einschließlich `null` sind ohne Objektprüfung
  zulässig;
- ein Objektroot muss exakt den erfassten `Object.prototype` besitzen;
- ein Arrayroot muss exakt den erfassten `Array.prototype` besitzen;
- die Ketten müssen weiterhin exakt
  `Objectroot → capturedObjectPrototype → null` beziehungsweise
  `Arrayroot → capturedArrayPrototype → capturedObjectPrototype → null`
  lauten;
- `Object.prototype` und `Array.prototype` dürfen keine eigene
  `then`-Property besitzen;
- eine eigene top-level `then`-Property des Parsed-Werts ist ausschließlich als
  Own-Data-Property mit einem nicht aufrufbaren Wert zulässig. Accessor- oder
  aufrufbare `then`-Formen werden abgelehnt.

Nach dieser Prüfung liegt vor dem unmittelbaren Aufruf des äußeren nativen
Promise-Resolvers kein absichtlicher unvertrauenswürdiger Hook. Eine nach dem
Import installierte geerbte `Object.prototype.then`- oder
`Array.prototype.then`-Funktion kann den Parsed-Wert deshalb nicht ersetzen,
hängen lassen oder exfiltrieren. Eine universelle Erkennung beliebiger Proxies
oder Thenables wird nicht behauptet; der Parsed-Wert stammt ausschließlich aus
der einmal erfassten nativen JSON-Parseoperation.

### Erfüllungs- und Fehlersemantik

Der BrowserSyncTransport führt keinen eigenen Fulfillment-Result-Envelope ein.
Ein vollständig bestandener HTTP-`200`-Pfad erfüllt sein natives Promise
ausschließlich mit dem einmal geparsten, weiterhin unvertrauenswürdigen
JSON-Wert.

Der Transport:

- validiert keine normale SyncResponse semantisch;
- korreliert keine Response;
- projiziert keine Response;
- erzeugt keine Gateway- oder SyncContract-Response.

Diese Aufgaben bleiben unverändert beim SyncService beziehungsweise an den
bestehenden serverseitigen Grenzen.

Alle beherrschten Methodenfehler aus Arity, Requestsnapshot, Reflection,
Projektion, Freeze/Revalidierung, Serialisierung, Größenprüfung, Controller-,
Signal- oder Abortauflösung, Timerregistrierung, Fetch, nativem Promiseprofil,
CORS, Netzwerk, Deadline, Redirect, URL, Responsebeobachtung, HTTP-Status,
Header, Content-Length, Content-Encoding, Reader, Chunk, Kopie, Cleanup, UTF-8,
JSON-Parsing oder terminalem Promise-Handoff rejecten ausschließlich mit
demselben statischen, gewöhnlichen und tief eingefrorenen exakten
Zwei-Felder-Datenrecord:

```js
{
  code: "BROWSER_SYNC_TRANSPORT_FAILED",
  message: "Der lokale Browser-SyncTransport ist fehlgeschlagen."
}
```

Er enthält keine fremde URL, keinen `statusText`, Headerwert, Raw Body,
Bodyausschnitt, keine Bytefolge, Request-ID, Sentinel-, Proxy-, Timer-,
Dependency-, Browser-, Validator- oder Exceptiondetails. Ein nativer Error,
Error-Stack oder eine Exceptionnachricht wird nicht als Rejectiongrund
ausgegeben. Es gibt keine Consoleausgabe, kein Logging, keine Telemetrie,
Persistenz oder Storagewirkung. Ein bereits ausgelöster Seiteneffekt einer
vertrauenswürdigen Composition-Funktion kann nicht rückgängig gemacht werden.

Der statische synchrone Factory-`TypeError` bleibt davon getrennt und liegt vor
Ausgabe einer API außerhalb des Methoden-Promisevertrags. Nach erfolgreicher
Factoryerzeugung erfüllt ausschließlich ein erfolgreich geparster Wert; jeder
beherrschte Methodenfehler verwendet nur das Transportfehlerprofil.

Die bestehende Servicezuordnung bleibt:

| Transportbeobachtung | Ergebnis im SyncService |
| --- | --- |
| Fetch-, CORS-, Netzwerk-, Deadline-, Abort-, Non-200-, Header-, Cap-, UTF-8- oder JSON-Fehler | `transportFailed` |
| parsebares HTTP-200-JSON mit falscher Shape oder Korrelation | `invalidResponse` |
| irrtümlich unter HTTP `200` gelieferte frühe Gateway-Response | `invalidResponse` |
| gültige korrelierte normale Erfolgsresponse | `syncResponseReceived` |
| gültige korrelierte normale Contract-Fehlerresponse | äußerer Service-Result `ok: true`; fachlicher Erfolg ausschließlich über `syncResponse.success` |

Gateway-Fehler werden niemals in normale SyncResponses umgeschrieben.

### Vertrauens- und Datengrenzen

Für diesen Vertrag gilt ausdrücklich:

- Browser, UI, Same-Origin-JavaScript und Methodenaufrufer bleiben
  unvertrauenswürdig.
- Der Transport behandelt Fetch- und Responsewerte ebenfalls als
  unvertrauenswürdig.
- Die serverseitig erlaubte Browser-Origin kann kompromittiert sein.
- Loopback, exakter Host, Originprüfung und CORS sind weder Authentisierung,
  Autorisierung noch Calleridentität.
- Ein lokaler Nicht-Browser-Prozess kann den Gatewayendpoint direkt ansprechen
  und Originwerte nachbilden.
- Die fehlende lokale Calleridentität bleibt nur für den exakt leeren,
  synthetischen und nebenwirkungsfreien `syncTest` vertretbar.
- `source`, `requestId`, `timestamp` und Origin können private Bedeutung
  tragen.
- Leeres Payload und `dataOrigin: "synthetic"` beweisen weder semantische
  Nicht-Privatheit noch Datenschutz, Herkunft oder Serveridentität.
- Browserextensions, kompromittierter Anwendungscode, Service Worker und eine
  vollständige Same-Realm-Kompromittierung sind keine beherrschte Sandbox.
- PromptVault, LearningHub, LichtwaldLog und GoldenDawn-Vault werden nicht
  gelesen.
- Es gibt kein Storage, Logging, Telemetrie, Background Sync, Provider-,
  Modell-, Workflow- oder Cloudziel.

Ein bösartiger lokaler Prozess kann insbesondere Port `8787` vor dem echten
Gateway belegen. URL-, CORS- und Responseprüfung beweisen nicht, welcher lokale
Prozess geantwortet hat.

### Browserverwaltete Metadaten und Datenschutzgrenze

Der Anwendungscode schließt Cookies, Credentials, Authorizationheader,
anwendungsseitigen Referrer, private Inhalts-Payloads und Providersecrets aus.
Der Browser kann abhängig von Kontext und Version dennoch automatisch
Metadaten senden, beispielsweise:

- `Origin`;
- `User-Agent`;
- `Accept`;
- `Accept-Language`;
- `Sec-Fetch-*`;
- Client Hints;
- PNA-/LNA-Preflightmetadaten.

Diese Werte können von jedem Prozess beobachtet werden, der den lokalen Port
kontrolliert. `credentials: "omit"` und `referrerPolicy: "no-referrer"`
unterdrücken nicht sämtliche browserverwalteten Metadaten. Der Vertrag beweist
daher weder vollständige Metadatenfreiheit noch Datenschutz. PromptVault,
LearningHub, LichtwaldLog und GoldenDawn-Vault bleiben bestimmungsgemäß
außerhalb des Datenpfads.

### Browser-Aktivierungsgate für PNA/LNA und Mixed Content

Die isolierte spätere Transportimplementierung darf vollständig mit Doubles und
ohne Netzwerk geprüft werden. Vor Browserkomposition oder lokalem Browser-End-
to-End-Pfad ist jedoch ein separat freigegebener realer Runtime-Nachweis
erforderlich, gebunden an:

- das konkrete Betriebssystem;
- den konkreten Browser und seine Version;
- die tatsächliche GoldenDawn-Origin beziehungsweise den realen
  Auslieferungskontext;
- den festen Loopbackendpoint
  `http://127.0.0.1:8787/api/sync-test`.

Der Nachweis prüft mindestens CORS und Preflight, Private Network Access
beziehungsweise Local Network Access, erforderliche lokale
Netzwerkberechtigungen, Secure-Context- und Mixed-Content-Verhalten, die
tatsächliche Erreichbarkeit von `127.0.0.1`, `Response.type`, sichtbare und
blockierte Responseheader, Redirectverhalten, Browserunterschiede und nötige
Benutzerfreigaben.

Verlangt der Zielbrowser einen zusätzlichen PNA-/LNA-Requestheader, einen
zusätzlichen Responseheader wie eine Private-Network-Freigabe, eine Berechtigung
oder eine andere CORS-Änderung, bleibt die Browserkomposition geschlossen. ADR
0020 und ADR 0026 müssen dann in einem neuen Entscheidungsslice neu bewertet
oder ergänzt werden. Es gibt keinen Fallback auf `localhost`, HTTPS, Proxy,
Remotehost oder Cloud. Ein Runtime-PASS ist immer kontext- und versionsgebunden
und keine allgemeine Browsergarantie.

### Enger Phase-0-Nachweis / EU-Tor A

Dieser ADR-Slice ist rein dokumentarisch und führt weder Browsercode noch eine
reale menschliche Interaktion ein.

Nur dieser aktuelle Entscheidungs- und Vertragsslice ist modell-, provider-,
workflow- und credentialfrei. Daraus folgt ausschließlich für diesen
Dokumentationsslice eine enge vorläufige Nicht-KI-Arbeitshypothese. Die noch
fehlende Implementierung ist durch den ADR allein nicht abschließend
klassifiziert.

Vor Merge des späteren Implementierungsslices muss anhand des tatsächlichen
Codes, der verwendeten Browser-APIs, Dependencies und Datenflüsse erneut
scopegebunden bestätigt werden:

- kein Modell und keine modell-, lern- oder statistikbasierte Inferenz;
- kein Training, Lernen oder Adaptieren;
- keine Provider- oder Workflowanbindung;
- kein privates Inhalts-Payload;
- keine neue Telemetrie, Persistenz oder Nebenwirkung.

Die spätere Browserkomposition und menschliche Interaktion benötigen nochmals
ihr eigenes vollständiges Gate. Diese Einordnung ist keine Rechtsberatung,
keine Klassifikation von GoldenDawn OS insgesamt, keine Anbieter- oder
Betreiberfestlegung und keine Compliance-, Konformitäts- oder
Sicherheitsgarantie. Phase 1 bis Phase 3 bleiben offen.

Eine neue Entscheidung und scopegebundene Prüfung ist mindestens erforderlich
bei:

- Remote-, HTTPS-, Hostname- oder zweitem Endpoint;
- Port-, URL- oder Umgebungswahl;
- Redirect oder Fallback;
- Retry oder Hintergrundaufruf;
- Caller-Signal oder neuer API;
- Cookie, Credential, Authorization oder Secret;
- nicht leerem oder privatem Payload;
- neuer Aktion;
- Provider, Modell, Workflow oder Tool;
- Logging, Telemetrie oder Persistenz;
- Service Worker oder Background Sync;
- Authentisierung, Autorisierung, Replay oder Idempotenz;
- systemweiten Betriebsgrenzen;
- Hosting oder Fremdnutzung.

## Verbindliche spätere Testmatrix

Der spätere, separat freizugebende Implementierungsslice verwendet
ausschließlich den Zielpfad:

```text
C:\Users\jslom\Documents\Projekte\GoldenDawn\tests\browserSyncTransport.test.js
```

Diese Tests werden in ADR 0026 nicht implementiert. Sie arbeiten mit Doubles,
führen keine echten Netzwerkrequests aus und decken mindestens folgende Fälle
mutationswirksam ab.

### Import und Factory

- importinaktives Modul und inaktive Factory;
- Factoryaufruf mit null Argumenten;
- explizites `undefined` als ungültiges einzelnes Argument;
- zusätzliche Factoryargumente;
- exaktes Vier-Felder-Compositionrecord;
- Accessors, Symbole, zusätzliche, fehlende oder nicht funktionale Werte;
- fehlende oder unbrauchbare Browserdefaults;
- exakte frische gewöhnliche eingefrorene API;
- exakte Methodenarity.

### Requestgrenze

- exakte einmalige autoritative Snapshotbeobachtung ohne zweites Request- oder
  Snapshotobjekt;
- exakte beobachtbare Reflection-/Trap-Reihenfolge: Root-Own-Keys,
  Rootprototyp, die sechs Rootdeskriptoren in Vertragsreihenfolge,
  Payloadidentität ausschließlich aus dem erfassten `payload`-Descriptor,
  Payload-Own-Keys, Payloadprototyp;
- zusätzliche, fehlende und symbolische Keys;
- Accessors und Descriptor-Throws;
- stateful Proxy und ABA zwischen den einmaligen Beobachtungen;
- keine Caller-Rereads nach dem Snapshot;
- unveränderter und nicht eingefrorener Callergraph;
- descriptor-basiert exakt leeres Payload;
- ausschließlich derselbe frische disjunkte Requestgraph mit identischen Root-
  und Payloadidentitäten als Validatorinput, genau einmal vor und genau einmal
  nach seinem Freeze mit derselben Timestampreferenz; weder Callerroot noch
  Callerpayload noch separates Snapshotobjekt, kein dritter oder alternativer
  Validierungspfad;
- ausschließlich interne Timestampkonsistenz ohne behauptete unabhängige
  Frische;
- `JSON.stringify` exakt einmal ohne Replacer;
- erfasste Encoder-Prototypmethode exakt einmal mit richtigem Receiver;
- `65.536` gegenüber `65.537` UTF-8-Bytes;
- post-import mutierte JSON- und Encoder-Prototypfunktionen;
- eigene beziehungsweise geerbte `toJSON`-Mutation.

### Fetchargumente

- feste URL;
- auf einem vollständig zulässigen Fetchpfad exakt ein Fetch-Seam-Aufruf, auf
  jeder Vor-Fetch-Ablehnung null und niemals mehr als ein Aufruf; kein Retry;
- Null-Prototyp-RequestInit mit exakt zehn Own-Data-Feldern;
- Null-Prototyp-Headersrecord mit exakt einem Own-Data-Feld;
- tatsächlicher Frozen-Zustand beider Records;
- exakt die einmal erfasste Signalidentität;
- Mutation von `Object.prototype`;
- keine Cookies, Credentials, Authorizationheader oder Referrer;
- kein Redirect, Fallback oder zweiter Versuch.

### Deadline und Promisezustand

- jeweils einmalige Controller-, Signal- und Abortauflösung;
- korrekte Receiver;
- synchron während der Timerregistrierung feuernder Deadlinecallback;
- werfende Timerregistrierung;
- synchron werfender Fetch;
- Fetch-Rejection;
- fremdes Thenable und ungültiges Promiseprofil;
- eigenes `constructor`-Accessorproperty auf einem echten Promise und
  zusätzliche eigene Promisekeys;
- post-import ersetzter `Promise.prototype.constructor`, Getter anstelle des
  ursprünglichen Constructor-Datendescriptors und fremde Konstruktoridentität;
- post-import ersetztes `Promise[Symbol.species]`, fremder Species-Getter oder
  Species-Konstruktor sowie weiterhin ersetztes globales
  `Promise.prototype.then`;
- vollständig kontrollierte Settlementhandler, die auf jedem Pfad nur
  `undefined` zurückgeben und keinen Sentinel-, Species-, Constructor- oder
  Exceptionwert leaken;
- Deadline gegen nahezu gleichzeitigen Erfolg;
- Fetch ignoriert Abort;
- nie endender Fetch;
- nie endender Reader;
- Cleanup-Throw und Cleanup-Rejection;
- `fetchStarted` unmittelbar vor Fetch sowie Abort auf synchronem Fetch-Throw,
  ungültigem Promiseprofil, Fetch-Rejection, Non-200, Redirect, falscher finaler
  URL, falschem Response-Typ, Responsegetter-/Snapshot-, Header-, Body-,
  `getReader`-/Methodenauflösungs-, Reader-, Chunk-, Cap-, EOF-, Release-,
  UTF-8-, JSON- oder Handoff-Fehler;
- kein Abort vor Fetch, kein Abort bei Erfolg und Abort höchstens einmal;
- Timer-Cancellation genau einmal;
- keine zweite Settlementwirkung.

### Response und Stream

- fail-fast Responsebeobachtungsreihenfolge und exakte Getterzahlen bei jeder
  frühen Ablehnung;
- Status, Redirect, URL und `Response.type`;
- einmalige Header-`get`-Auflösung, richtige Receiver und fail-fast exakte
  Aufrufzahlen bei jeder frühen Headerablehnung;
- exakter Content-Type;
- kanonische Content-Length;
- fehlende, malformed, zu große oder abweichende Content-Length;
- browserexponiertes `Content-Encoding` exakt `null` als zulässige gefilterte
  Beobachtung ohne Wire-Abwesenheits- oder Dekompressionsbehauptung;
- browserexponierter nicht-null-Content-Encoding-Wert als Transportfehler und
  keine Behauptung über einen verborgenen tatsächlichen Wire-Header;
- fehlender Body;
- `getReader`, `read`, `cancel`, `releaseLock` und ihre Receiver;
- exakte Read-Resultform;
- native Iterator-Own-Key-Sequenz exakt `['value', 'done']`, anschließend
  Deskriptorreihenfolge `done`, `value`;
- einmaliger Read-Result-Own-Key-/Descriptor-Snapshot ohne Rereads sowie
  stateful, werfende und inkonsistente Record-Proxies;
- echte nicht unterklassifizierte `Uint8Array`;
- Proxy, Subclass, detached und malformed Chunk;
- erster Read liefert ein echtes natives Same-Realm-Promise mit exakter leerer
  `Uint8Array` und `done: false`: Rejection nach genau diesem Read, keine Kopie,
  kein zweiter Read, keine Microtask-Starvation, Abort und Cleanup gemäß
  Fehlervertrag;
- SharedArrayBuffer-backed `Uint8Array`, Growable SharedArrayBuffer und, sofern
  unterstützt, resizable Buffer;
- detached Buffer, falscher Bufferprototyp, post-import ersetzte Buffer-/Typed-
  Array-Getter und unmittelbare saubere Kontrollkopie eines normalen festen
  ArrayBuffers;
- ungültige Bytewerte in Fake-/malformed Chunks;
- sofortige Kopie in den einzigen eigenen Puffer;
- mutierter oder wiederverwendeter Fremdchunk;
- exakt `16.384` gegenüber `16.385` exponierten Bytes;
- deklarierte gegenüber kopierter Bytezahl;
- Erfolgscleanup und Fehlercleanup.

### Terminale Verarbeitung

- strikte UTF-8-Decodierung über die erfasste Prototypmethode;
- sichtbare, nicht normalisierte BOM-Semantik;
- ungültiges UTF-8;
- `JSON.parse` exakt einmal ohne Reviver;
- post-import ersetztes `JSON.parse`, `TextDecoder.prototype.decode` und
  `Promise.prototype.then`;
- post-import ersetzte Reflection-/Apply-/Freeze- und Typed-Array-Brand-/
  Kopier-Intrinsics;
- ungültiges JSON;
- Parsed-Primitiven einschließlich `null`;
- Object- und Arrayroot;
- mutierte Object-/Array-Prototypketten;
- geerbtes `Object.prototype.then`;
- geerbtes `Array.prototype.then`;
- zulässiges eigenes nicht aufrufbares `then`;
- Accessor- oder callable-`then`;
- keine Sentinel-, Body-, Header-, Byte- oder Exceptionleaks.

### Serviceintegration

- Transportrejection wird `transportFailed`;
- erfolgreich geparste, aber malformed Response wird `invalidResponse`;
- nicht korrelierte Response wird `invalidResponse`;
- vollständig korrelierte normale Erfolgsresponse bleibt erfolgreich;
- vollständig gültige fachliche Contract-Fehlerresponse bleibt eine normale
  SyncResponse;
- keine echten Netzwerkrequests.

## Nicht Bestandteil dieses Slices

ADR 0026 implementiert oder verändert insbesondere nicht:

- `src/transports/browserSyncTransport.js` oder irgendeinen anderen Code;
- Tests, Testdateien, Fixtures oder historische Testzahlen;
- `src/main.js`, UI, Nutzertrigger oder sichtbare Statuscopy;
- Browserkomposition oder lokalen Browser-End-to-End-`syncTest`;
- realen Fetch, Browser-Runtime-Nachweis, Vite-Server oder Gatewaystart;
- Gateway-, CORS-, PNA-/LNA-Header oder Runtimekonfiguration;
- SyncContract, Schema, SyncService oder SyncAgent;
- Authentisierung, Autorisierung oder Calleridentität;
- Replay, Deduplizierung oder Idempotenz;
- globale Rate-, Parallelitäts-, Queue-, CPU-, Heap- oder Prozesslimits;
- Provideradapter, n8n, OpenAI, lokale Modelle oder Airtable;
- private Daten, neue Aktionen, Tools oder Nebenwirkungen;
- Dependencies, Bundle, Manifest, Generator oder Evidence;
- Storage, Logging, Telemetrie oder Background Sync.

Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
`v0.2.2` bleiben unverändert. Ein explizit gestarteter Gateway kann den leeren
synthetischen `syncTest` weiterhin nur über einen separaten HTTP-Client lokal
mit HTTP `200` ausführen. Es existiert weiterhin kein Browserrequest und kein
lokaler Browser-End-to-End-Fluss.

## Konsequenzen

Positive Auswirkungen:

- Der bestehende SyncService-Port erhält eine einzige konkrete, eng begrenzte
  lokale Browserbedeutung, ohne den Service zu verändern.
- Ziel, Header, Credentials, Redirects, Retry, Deadline und Größenlimits sind
  nicht durch Browserwerte oder Runtime-Environment wählbar.
- Callerrequest und Responsebytes werden vor Serialisierung beziehungsweise
  Parsing defensiv begrenzt.
- HTTP-, Gateway- und normale SyncResponse-Semantik bleiben getrennt.
- Der spätere Implementierungsslice besitzt eine mutationswirksam prüfbare
  Abfolge und eine statisch redigierte Fehlergrenze.

Kosten und verbleibende Einschränkungen:

- Der feste Port `8787` muss ausdrücklich mit der weiterhin variablen
  Gateway-Runtime koordiniert werden und kann bereits durch einen anderen
  lokalen Prozess belegt sein.
- Der Browser kann einen CORS-Preflight und die Plattform zusätzliche Wire-
  oder Allokationswirkung auslösen, obwohl Anwendungscode Fetch nur einmal
  aufruft.
- Abort kann bereits begonnene Serververarbeitung nicht rückgängig machen.
- Clientdeadline und Caps sind keine globale Verfügbarkeits-, DoS-, CPU-,
  Heap-, Socket- oder Exactly-once-Garantie.
- Browser, Extensions, Service Worker, erlaubte Origin, lokale Prozesse und
  Same-Realm-Code bleiben Vertrauensrisiken.
- Ohne Implementierung und Komposition entsteht noch kein nutzbarer
  Browserfluss.

## Erwogene Alternativen

### Endpoint aus Environment, UI oder Factorykonfiguration wählen

Verworfen. Browserwerte und frei injizierbare Ziele würden die feste lokale
Capability aufweiten und könnten Requests an einen anderen Host oder Port
leiten.

### `localhost`, IPv6 oder relative URL verwenden

Verworfen. ADR 0020 bindet den Gateway an das IPv4-Literal `127.0.0.1`; DNS,
Hostname- und relative Auflösung sind für diesen engen Pfad unnötig.

### Redirects, Retry, Backoff oder Fallback erlauben

Verworfen. Diese Mechanismen würden Ziel- und Versuchszahl erweitern und die
fehlende Exactly-once-Semantik verschleiern.

### Caller-`AbortSignal` oder zweites Methodenargument übernehmen

Verworfen. Der bestehende Service-Port bleibt exakt einargumentig. Der
Transport besitzt eine feste interne Deadline und keine generische Caller-
Steuerfläche.

### Cookies, Authorization oder Secret-Header senden

Verworfen. Der Browser kann kein dauerhaftes Secret schützen. Der aktuelle
leere nebenwirkungsfreie `syncTest` rechtfertigt keine Credential- oder
Authentisierungsgrenze.

### Non-200-Bodies parsen oder Gatewayfehler umschreiben

Verworfen. HTTP- und Gatewayfehler sind keine normal korrelierten
SyncResponses. Ihre Inhalte dürfen weder in den Service-Port noch in eine neu
erfundene Response gelangen.

### `response.text()`, `response.json()` oder unbeschränktes `arrayBuffer()`

Verworfen. Diese APIs materialisieren den Body ohne die verbindliche
browserseitige 16.384-Byte-Streaminggrenze.

### Response bereits im Transport semantisch validieren und projizieren

Verworfen. Korrelation und normale SyncResponse-Projektion bleiben die
Verantwortung des bestehenden SyncService. Doppelte Semantik würde Drift
erzeugen.

### Entscheidung, Implementierung und Browserkomposition gemeinsam ausführen

Verworfen. Der enge Vertrag, seine mutationswirksame isolierte Implementierung
und die reale Browserkomposition besitzen unterschiedliche Review- und
Tor-A-Grenzen.

## Bedingungen für eine Neubewertung

Diese Entscheidung wird überprüft, wenn der spätere Implementierungsslice von
Modulort, Export, Einargument-API, nativem Promise, festem Ziel, defensiver
Requestgrenze, einmaliger Serialisierung, Fetch-Policy, Deadline,
Response-Streaminggrenze, Erfüllungs- oder Redactionsemantik abweichen soll.

Eine neue Architektur-, Sicherheits-, Datenschutz- und Tor-A-Entscheidung ist
außerdem vor jedem in der Phase-0-Liste genannten Trigger erforderlich. Das
gilt besonders vor Browserkomposition und menschlicher Interaktion, vor
privaten oder schreibenden Capabilities und vor jedem Provider- oder
Cloudziel.

## Nächster getrennt freizugebender Slice

Als Nächstes folgt ausschließlich die isolierte Implementierung von:

```text
src/transports/browserSyncTransport.js
```

einschließlich der oben vollständig dokumentierten mutationswirksamen Unit-
und Serviceintegrationsmatrix unter
`tests/browserSyncTransport.test.js`. Dieser Folgeslice verwendet nur Doubles,
führt keinen echten Netzwerkrequest aus, komponiert nichts in `src/main.js`,
startet keinen realen Gateway oder Browser und führt keinen Browser-End-to-End-
`syncTest` aus. Vor seinem Merge wird Tor A erneut anhand des tatsächlichen
Codes, der Browser-APIs, Dependencies und Datenflüsse geprüft.

Danach folgt zunächst als eigener freizugebender Slice der kontext- und
versionsgebundene reale PNA-/LNA-/Mixed-Content-Runtime-Nachweis. Nur bei dessen
PASS und ohne notwendige Vertragsausweitung darf ein weiterer gesonderter Slice
Transport, SyncService und UI lokal komponieren und den Browser-End-to-End-
Fluss prüfen. Globale Betriebsgrenzen und Provider bleiben danach geordnet.

## Verwandte Dokumente

- [ADR 0016: Transportneutraler SyncContract-Kern](0016-transport-neutral-sync-contract-foundation.md)
- [ADR 0017: Transportneutrale SyncService Foundation](0017-transport-neutral-sync-service-foundation.md)
- [ADR 0018: Transportneutrale SyncGateway Request Boundary](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
- [ADR 0020: Lokale SyncGateway Raw-Wire- und HTTP-Foundation](0020-local-sync-gateway-raw-wire-http-foundation.md)
- [ADR 0023: Lokaler SyncAgent vor optionalen externen Providern](0023-local-syncagent-before-optional-external-providers.md)
- [ADR 0025: Local SyncGateway–SyncAgent Composition](0025-local-syncgateway-syncagent-composition.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`README.md`](../../README.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
