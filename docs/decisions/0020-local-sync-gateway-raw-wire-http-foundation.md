# ADR 0020: Lokale SyncGateway Raw-Wire- und HTTP-Foundation

## Status

Angenommen – 2026-08-15

## Kontext

Die transportneutralen Foundations aus
[ADR 0016](0016-transport-neutral-sync-contract-foundation.md),
[ADR 0017](0017-transport-neutral-sync-service-foundation.md) und
[ADR 0018](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
sind implementiert. Sie definieren den geschlossenen `syncTest`-Vertrag, den
einzigen ausgehenden SyncService-Port und die kanonische Request Boundary für
einen bereits vollständig materialisierten JavaScript-String.

[ADR 0019](0019-local-sync-gateway-before-n8n-cloud.md) entscheidet als
zusätzliche Sicherheitsgrenze einen separaten lokalen Node-Prozess auf
GD-WS01. Dieser Prozess soll tatsächlich empfangene Wire-Bytes begrenzen,
streng als UTF-8 dekodieren und erst danach exakt einmal die vorhandene
Request Boundary aufrufen. ADR 0019 legt die Architektur- und Policygrenzen
fest, implementiert aber selbst keinen Server, HTTP-Handler oder Transport.

Eine Prüfung des bereits allozierten Strings durch
`validateSyncRawBodySize` kann die vorherige HTTP-Body-Allokation nicht
begrenzen. Vor einem Browsertransport oder Cloud-Hop wird deshalb zunächst
eine kleine lokal testbare HTTP-Foundation benötigt. Sie muss die reale
Reihenfolge von HTTP-Policy, Streamzählung, Decodierung und Boundary-Aufruf
belegen, ohne einen noch nicht vorhandenen Upstream oder einen operativen
`SyncAgent` zu simulieren.

ADR 0020 setzt Schritt 2 der in ADR 0019 festgelegten Slice-Reihenfolge um.
ADR 0016 bis ADR 0019 bleiben unverändert und werden nicht rückwirkend
umgedeutet.

## Entscheidung

### Enger Implementierungsumfang

Die lokale Foundation implementiert ausschließlich diesen Pfad:

```text
lokaler HTTP-Client
  → Loopback-only Local SyncGateway
  → frühe HTTP-, Host- und Origin-Policy
  → begrenzter Byteempfang
  → exakt eine strikte UTF-8-Decodierung
  → exakt ein Aufruf der bestehenden SyncGateway Request Boundary
  → kontrollierte lokale HTTP-Response
```

Das lokale SyncGateway bleibt eine schmale Transport- und Sicherheitsgrenze.
Es ist kein Agent, keine Fachlogik, kein allgemeines Backend, kein Storage,
kein Ersatz für SyncService oder `SyncAgent` und keine UI-Komponente. Es liest
weder PromptVault, LearningHub, LichtwaldLog noch den GoldenDawn-Vault.

Die Implementierungen von SyncContract, SyncService und SyncGateway Request
Boundary bleiben unverändert. Das Gateway wird nicht aus `src/main.js`
importiert und gehört nicht zum Vite-Browser-Buildgraph.

### Produktionsartefakte und öffentliche API

Die Node-spezifische Komposition besteht aus:

```text
server/
├── localSyncGatewayRuntimeConfig.js
├── localSyncGatewayHttpServer.js
└── startLocalSyncGateway.js
```

Sie verwendet ausschließlich Node-Plattformmodule und keine neue
npm-Abhängigkeit. `package.json` stellt den expliziten Prozesseinstieg bereit:

```text
npm run gateway:local
```

Ein Modulimport startet keinen Listener. `npm run dev` startet das Gateway
nicht. Nur der explizite Gateway-Einstieg liest die Runtime-Konfiguration,
komponiert den Server und startet den lokalen Prozess.

`server/localSyncGatewayRuntimeConfig.js` exportiert ausschließlich:

```js
readLocalSyncGatewayRuntimeConfig(environment = process.env)
```

Die Funktion liefert einen tief eingefrorenen gewöhnlichen Result mit exakt:

```js
{
  ok,
  status,
  config,
  error
}
```

Erlaubte Statuswerte sind `runtimeConfigurationAccepted` und
`runtimeConfigurationRejected`. Eine Ablehnung verwendet ausschließlich:

```js
{
  code: "invalidLocalSyncGatewayRuntimeConfiguration",
  message: "Die lokale SyncGateway-Runtime-Konfiguration ist ungültig."
}
```

Ein akzeptierter Result enthält ausschließlich die validierten Werte `port` und
`allowedOrigin` in `config` sowie `error: null`. Bei einer Ablehnung ist
`config: null`; der ungültige Eingabewert wird weder gespiegelt noch in eine
Fehlermeldung aufgenommen.

`server/localSyncGatewayHttpServer.js` exportiert ausschließlich die
eingefrorene Konstante `LOCAL_SYNC_GATEWAY_HTTP_LIMITS` und die Factory:

```js
createLocalSyncGatewayHttpServer({
  port,
  allowedOrigin,
  syncGatewayRequestBoundary = createSyncGatewayRequestBoundary(),
  createTextDecoder = defaultStrictUtf8TextDecoderFactory,
  onFatal = () => {},
  useTestTimeoutPolicy = false,
} = {})
```

Die Factory liefert eine eingefrorene gewöhnliche API mit exakt den beiden
Promise-basierten, argumentlosen Methoden:

```js
{
  start,
  stop
}
```

Jeder Lifecycle-Result besitzt exakt:

```js
{
  ok,
  status,
  host,
  port,
  error
}
```

Die Statuswerte lauten `started`, `alreadyStarted`, `startFailed`, `stopped`,
`notStarted`, `alreadyStopped` und `stopFailed`. Ein erfolgreicher Start gibt
ausschließlich den festen Host `127.0.0.1` und den tatsächlich gebundenen Port
aus. Ein erfolgreicher Stop verwendet `host: null`, `port: null` und
`error: null`.

Lifecycle-Fehler verwenden ausschließlich:

| `status` | `error.code` | Exakte Meldung |
| --- | --- | --- |
| `alreadyStarted` | `localSyncGatewayAlreadyStarted` | `Das lokale SyncGateway wurde bereits gestartet.` |
| `startFailed` | `localSyncGatewayStartFailed` | `Das lokale SyncGateway konnte nicht gestartet werden.` |
| `notStarted` | `localSyncGatewayNotStarted` | `Das lokale SyncGateway wurde noch nicht gestartet.` |
| `alreadyStopped` | `localSyncGatewayAlreadyStopped` | `Das lokale SyncGateway wurde bereits gestoppt.` |
| `stopFailed` | `localSyncGatewayStopFailed` | `Das lokale SyncGateway konnte nicht kontrolliert gestoppt werden.` |

Diese Fehler geben weder Exceptiontexte noch Konfigurations- oder Requestwerte
aus.

`onFatal` ist ein interner minimaler Kompositionsport für einen Serverfehler
nach erfolgreichem Start. Die Factory ruft ihn ohne Argumente und höchstens
einmal auf. Synchrone Throws und zurückgegebene Rejections werden vollständig
konsumiert; weder der Callback noch ein Completionobjekt wird Teil der
eingefrorenen öffentlichen API, die exakt `{ start, stop }` bleibt.

Der Prozesseinstieg behandelt `SIGINT` und `SIGTERM` kontrolliert und schließt
den Listener. Ein doppelter Start, ein Stop vor dem Start und ein wiederholter
Stop besitzen die beschriebenen eindeutigen Resultzustände.

Jeder Startfehler durchläuft denselben irreversiblen fail-closed Cleanup-Pfad:
`boundPort` wird verworfen, der Listener best effort geschlossen und alle
verfolgten Sockets werden zerstört. Wirft der erste synchrone Close-Versuch,
wird er genau einmal wiederholt; ein weiterhin werfender Listener wird
wenigstens dereferenziert. Erst danach wird ausschließlich der bestehende
statische `startFailed`-Result ausgegeben, und der Prozesseinstieg versucht
`stop` zusätzlich ohne zweite Meldung.

Der Listening-Handler behandelt dabei den vollständigen Zugriff auf
`server.address()` als Teil des noch nicht erfolgreichen Starts. Der
Funktionsaufruf, die Resultprüfung sowie das jeweils einmalige Lesen der
Eigenschaften `address` und `port` liegen zusammen in der kontrollierten
Fehlerbehandlung. Wirft einer dieser Zugriffe, bleibt `start()` nicht offen,
kein privater Wert wird ausgegeben und der normale `startFailed`-Cleanup läuft
vollständig. `onFatal` wird für diesen Startfehler nicht aufgerufen.

Ein erfolgreicher Start verlangt zusätzlich einen als Safe Integer gemeldeten
Port im vollständigen Bereich `1` bis `65535`. Wurde ein Produktionsport
ungleich `0` angefordert, muss der gemeldete Port diesem Wert exakt entsprechen.
Nur bei Factory-Port `0` darf der Betriebssystemport abweichen, muss aber
ebenfalls zwischen `1` und `65535` liegen. Gemeldete Werte wie `0`, `-1`,
`65536` oder ein anderer gültiger Produktionsport durchlaufen denselben
statischen `startFailed`- und Cleanup-Pfad ohne `onFatal`.

Ein Serverfehler nach einem erfolgreichen Start setzt die Instanz irreversibel
auf `failed` und verwirft `boundPort` sofort. Der Listener wird anschließend
best effort geschlossen und alle verfolgten Sockets werden zerstört. Bereits
eingeplante oder noch laufende Requestpfade prüfen den Betriebszustand erneut;
im Fehlerzustand erreichen weder Decodierung noch Boundary weitere Eingaben.
Der beobachtete Serverfehler wird weder in einen Result übernommen noch als
Exceptiontext ausgegeben. Nach dem payloadlosen `onFatal`-Signal entfernt der
Prozesseinstieg seine `SIGINT`- und `SIGTERM`-Handler, setzt
`process.exitCode = 1`, versucht die Bereinigung idempotent und schreibt genau
einmal ausschließlich die statische Meldung
`Das lokale SyncGateway wurde nach einem internen Serverfehler beendet.`.
Mehrfache Signale, ein Throw oder eine Rejection des Fatal-Ports sowie
fehlschlagende Cleanup-Versuche erzeugen keine zweite Meldung und keine
unbehandelte Exception.

### Serverseitige Runtime-Konfiguration

Die produktive Runtime liest ausschließlich:

| Variable | Bedeutung |
| --- | --- |
| `GOLDENDAWN_SYNC_GATEWAY_PORT` | dezimaler lokaler Listener-Port |
| `GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN` | exakt eine erlaubte Browser-Origin |

Es gibt keine `VITE_*`-Konfiguration, keine Default-Origin, keine
konfigurierbare Bind-Adresse und keine committed `.env`- oder sonstige
Produktivkonfiguration. Der Prozess startet bei fehlender oder ungültiger
Konfiguration nicht.

Der Runtime-Port muss ein eindeutig auswertbarer dezimaler Port im produktiven
Bereich sein. Port `0` ist über die Runtime-Konfiguration verboten. Die direkt
komponierte Serverfactory darf Port `0` ausschließlich verwenden, damit
automatisierte Tests einen temporären Betriebssystemport erhalten.

Die erlaubte Origin muss ein primitiver String und eine einzelne absolute
Loopback- beziehungsweise `localhost`-Origin sein. Credentials, Pfad, Query
und Fragment sind verboten. Es findet keine Erweiterung auf Subdomains,
verwandte Hosts oder mehrere Origins statt. Ein Maschinenname-Check wird nicht
eingeführt; die Implementierung bleibt auf unterstützten Node-Laufzeiten
portabel.

Unabhängig von der Origin bindet der Listener immer exakt an:

```text
127.0.0.1
```

Er bindet weder an `0.0.0.0`, eine LAN-Adresse noch ein öffentliches
Interface. Loopback und Prozesseigentümerschaft beweisen dennoch keine
Calleridentität.

### Fester Pfad, Host und Request-Target

Das Gateway besitzt exakt den serverseitig festgelegten Pfad:

```text
/api/sync-test
```

Andere Pfade, Querystrings und absolute Request-Targets werden abgelehnt. Der
Client wählt weder Route, Umgebung, Handler noch einen Cloud-Endpunkt.

Der `Host`-Header wird gegen den tatsächlich gebundenen lokalen Gateway-Host
und Port geprüft. Bei einem tatsächlich gebundenen Port `80` sind ausschließlich
die kanonische Loopback-Autorität `127.0.0.1` und ihre explizite Form
`127.0.0.1:80` zulässig. Bei jedem anderen Port ist ausschließlich die exakte
Form `127.0.0.1:<tatsächlicher Port>` zulässig. Sicherheitsrelevante Header
werden aus der unveränderten Raw-Header-Struktur ausgewertet. Dadurch werden
mehrere Vorkommen nicht durch eine vorherige Node-Zusammenführung verborgen.
Doppelte oder mehrdeutige Policyheader werden fail-closed abgelehnt.

Die Node-Option `requireHostHeader: false` ist dabei ausdrücklich gesetzt. Sie
lockert die Hostpflicht nicht, sondern deaktiviert ausschließlich Nodes eigene
vorgezogene HTTP/1.1-`400`-Antwort. Im ansonsten regulären Requestpfad, sofern
keine frühere fail-closed Target- oder Sonderpfadablehnung greift, erreichen
regulär parsebare fehlende, doppelte und falsche Hostwerte zuerst die
anwendungsseitige Request-Admission und anschließend unter demselben
Response-Owner die eigene Raw-Header-Prüfung. Sie werden als statischer lokaler
`400 invalidHttpRequest`-Envelope mit kontrolliertem `Content-Length`
abgelehnt. Falsches Target, `CONNECT` und Erwartungen behalten ihre früheren
fail-closed Antworten `404`, `405` beziehungsweise `417`. Die portabhängige
Host-Allowlist bleibt unverändert; die Option öffnet keinen akzeptierenden
Pfad.

Die Implementierung aktiviert `insecureHTTPParser` nicht. Node-Parser- und
Socketgrenzen bleiben trotzdem eine eigene Laufzeitvertrauensgrenze und werden
nicht als universeller Schutz gegen Request Smuggling behauptet.

### HTTP-Version und Request-Admission

Das Gateway unterstützt ausschließlich HTTP/1.1. Ein von Node als HTTP/1.0
geparster Request wird mit dem statischen lokalen Profil
`invalidHttpRequest` abgelehnt, bevor `rawHeaders` projiziert, ein Decoder
erzeugt oder die Boundary aufgerufen wird.

Jede Factoryinstanz hält zusätzlich eine eigene Request-Admission pro
physischem Socket. Dieser Zustand ist unabhängig vom Response-Owner. Die
Ereignisse `request`, `checkContinue` und `checkExpectation` durchlaufen als
ersten Anwendungsschritt dasselbe Gate. Nur das erste Requestereignis eines
Sockets wird zugelassen. Jedes weitere Ereignis beansprucht den terminalen
Response-Owner, pausiert und zerstört den Socket ohne zweite Response, bevor
HTTP-Version, Headerprojektion, Decoder oder Boundary ausgewertet werden.
Diese anwendungsseitige Regel ist die maßgebliche Ein-Request-Durchsetzung;
Nodes `maxRequestsPerSocket` und `dropRequest` bleiben Defense-in-Depth.
Die Reihenfolge ist eine beobachtbare Sicherheitsgarantie: Ein erster gültiger
HTTP/1.1-Request erreicht Decoderfactory, Decode und Boundary jeweils exakt
einmal mit seinem unveränderten Raw Body. Für jedes zweite Request-,
`checkContinue`- oder `checkExpectation`-Ereignis wird `rawHeaders` kein
einziges Mal ausgewertet und Response beziehungsweise Socket ist nach dem
Dispatch terminal beendet.

### Methoden- und Preflight-Policy

`POST` ist die einzige fachliche Methode. `OPTIONS` darf ausschließlich einen
vollständig gültigen CORS-Preflight beantworten. Ein Preflight:

- verlangt als angeforderte Methode exakt `POST`;
- erlaubt als angeforderten nicht simplen Header ausschließlich
  `Content-Type`;
- liefert bei Erfolg HTTP `204` ohne Body;
- ruft weder Decoder noch Boundary, Clock oder Gateway-ID-Generator auf;
- führt niemals den Syncfluss aus.

Andere Methoden liefern HTTP `405` und den kontrollierten
`Allow: POST, OPTIONS`-Header. `CONNECT`, Upgrade-Requests und unerwartete
`Expect`-Flows können keinen Syncfluss auslösen. Eine nicht unterstützte
Erwartung wird mit HTTP `417` abgelehnt.

### Origin- und CORS-Policy

Jeder zugelassene Browserrequest benötigt genau einen vorhandenen
`Origin`-Header. Sein primitiver String wird exakt mit der serverseitig
konfigurierten Origin verglichen. Es gibt weder `*`, ein unkontrolliertes
Origin-Echo noch eine Normalisierung zu einem breiteren Match.

Eine fehlende, doppelte oder abweichende Origin wird mit HTTP `403` abgelehnt
und erhält keinen lesbaren CORS-Zugriff. CORS-Responseheader werden nur für die
exakt erlaubte Origin gesetzt. `Access-Control-Allow-Credentials` wird nicht
freigegeben.

CORS ist ausschließlich eine Browserpolicy. Es ist keine Authentisierung oder
Autorisierung. Nicht-Browser-Clients und bösartige lokale Prozesse werden
davon nicht kontrolliert.

### Content-Type, Content-Encoding und Content-Length

Ein fachlicher Request akzeptiert ausschließlich kontrolliertes JSON:

- `application/json`;
- optional mit genau `charset=utf-8`;
- HTTP-Tokenvergleiche dürfen RFC-gerecht ohne Beachtung der
  Groß-/Kleinschreibung erfolgen;
- zusätzliche oder doppelte Parameter und andere Charsets sind verboten.

`Content-Encoding` darf fehlen oder eindeutig `identity` sein. Komprimierte,
doppelte oder andere Encodings werden ohne Dekompression mit HTTP `415`
abgelehnt.

`Content-Length` ist nur ein frühes Signal. Ein vorhandener Wert muss
eindeutig, dezimal, nicht negativ und sicher auswertbar sein. Ein deklarierter
Wert oberhalb des kanonischen Maximums wird vor Decoder und Boundary mit HTTP
`413` abgelehnt. Ein kleinerer deklarierter Wert ersetzt niemals die reale
Streamingzählung. Ein fehlender `Content-Length` bleibt für einen kontrollierten
chunked Request erlaubt. Doppelte, widersprüchliche oder syntaktisch ungültige
Längenangaben werden fail-closed behandelt.

Die HTTP-Schicht ruft niemals `request.setEncoding()` auf, verwendet keinen
Bodyparser und konvertiert einzelne Chunks nicht in Strings.

### Raw-Wire- und Anwendungspuffergrenze

Die einzige fachliche Wahrheit für das Bodymaximum bleibt:

```js
SYNC_CONTRACT_MAX_RAW_BODY_BYTES
```

aus `src/contracts/syncContract.js`. Der HTTP-Code dupliziert `65_536` nicht
als unabhängige Vertragskonstante.

Während des Empfangs behandelt die Foundation Node-Bodychunks ausschließlich
als Bytes und addiert ihre tatsächlichen `byteLength`-Werte unabhängig von
`Content-Length`. Sie bewahrt Chunks nur auf, solange die Gesamtlänge höchstens
65.536 Bytes beträgt.

Sobald ein Chunk Byte 65.537 erreichen würde:

- wird kein weiterer Teil dieses Chunks in die Bodyprojektion übernommen;
- wird keine vollständige übergroße Gesamtkopie erzeugt;
- wird der eigene Empfangs- und Verarbeitungsfluss kontrolliert beendet;
- werden Decoder und Boundary nicht aufgerufen;
- wird HTTP `413` beziehungsweise bei einer nicht mehr sicher beantwortbaren
  Verbindung ein kontrollierter Verbindungsabschluss verwendet.

Erst nach einem vollständig beendeten Empfang innerhalb der Grenze wird genau
ein begrenzter Gesamtpuffer materialisiert.

Diese Garantie betrifft die Anwendungspufferung des Gateways. Node, das
Betriebssystem und der Socketstack können einen aktuell gelieferten Chunk oder
andere Netzwerkressourcen bereits alloziert haben. ADR 0020 behauptet keine
Kernel-, Socket-, Plattform- oder Preallocation-Garantie und keinen
vollständigen DoS-Schutz.

### Strikte einmalige UTF-8-Decodierung

Der begrenzte Gesamtpuffer wird exakt einmal mit einem so erzeugten Decoder
dekodiert:

```js
new TextDecoder('utf-8', {
  fatal: true,
  ignoreBOM: true,
})
```

Vor dem Decode wird fail-closed geprüft, dass der verwendete Decoder tatsächlich
`fatal === true` und `ignoreBOM === true` besitzt. Pro vollständig empfangenem
Body gibt es genau einen `decode(...)`-Aufruf und kein Per-Chunk-Decoding.

Ungültiges UTF-8 oder eine unvollständige Mehrbytefolge wird ohne Replacement
Character als HTTP `400` abgelehnt. Gültige Mehrbytefolgen dürfen sich über
Chunkgrenzen erstrecken, weil erst der Gesamtpuffer dekodiert wird.

Bei Node bedeutet `ignoreBOM: true`, dass eine vorhandene UTF-8-BOM im Ergebnis
als U+FEFF erhalten bleibt. Die Foundation entfernt oder repariert sie nicht.
Sie trimmt nicht, normalisiert Unicode nicht und führt keine sonstige
Inhaltsreparatur aus.

### Exakt ein Übergang zur kanonischen Boundary

Nach erfolgreicher Decodierung wird der primitive unveränderte String exakt
einmal an `processSyncRawBody` der vorhandenen SyncGateway Request Boundary
übergeben.

Die HTTP-Schicht besitzt keinen JSON-Parser, keinen Reviver, keinen
Duplicate-Key-Scanner, keinen Stringify-/Parse-Roundtrip und keine vorherige
Objektprojektion oder Feldbereinigung. Die native Single-Parser- und
Last-Key-Wins-Semantik aus ADR 0018 bleibt unverändert.

Eine erhaltene BOM erreicht die Boundary als U+FEFF. Eine BOM vor ansonsten
gültigem JSON folgt deshalb weiterhin der nativen `JSON.parse`-Semantik der
Boundary und ergibt deren kontrolliertes `INVALID_JSON`-Profil. Sie wird nicht
als Encodingfehler umgedeutet.

Bei einer akzeptierten Boundary verwendet die HTTP-Foundation ausschließlich
deren defensive, tief eingefrorene `syncRequest`-Projektion zur lokalen
Policyentscheidung. Dafür muss die Projektion exakt die sechs kanonischen
eigenen Dateneigenschaften besitzen, den bestehenden Requestvalidator bestehen
und sowohl am Root als auch am leeren Payload eingefroren sein. Andernfalls
gilt der Boundary-Result als strukturell ungeeignet und endet statisch mit
HTTP `500`. Eine geeignete Projektion wird weder an den Client gespiegelt noch
an n8n oder einen anderen Port weitergegeben.

### Getrennter lokaler HTTP-Fehlervertrag

Selbst erzeugte lokale HTTP- und Transportfehler sind keine
SyncContract-Responses. Ihr JSON-Body besitzt exakt:

```js
{
  ok: false,
  status: "<statischer Status>",
  error: {
    code: "<statischer Code>",
    message: "<statische Meldung>"
  }
}
```

Die exakten lokalen Profile lauten:

| HTTP | `status` | `error.code` | Exakte Meldung |
| --- | --- | --- | --- |
| `400` | `invalidHttpRequest` | `invalidLocalSyncGatewayHttpRequest` | `Die lokale SyncGateway-HTTP-Anfrage ist ungültig.` |
| `403` | `originRejected` | `localSyncGatewayOriginRejected` | `Die Anfrage ist für diese lokale Origin nicht erlaubt.` |
| `404` | `routeNotFound` | `localSyncGatewayRouteNotFound` | `Die angeforderte lokale SyncGateway-Route ist nicht verfügbar.` |
| `405` | `methodNotAllowed` | `localSyncGatewayMethodNotAllowed` | `Die HTTP-Methode ist für das lokale SyncGateway nicht erlaubt.` |
| `413` | `payloadTooLarge` | `localSyncGatewayPayloadTooLarge` | `Die lokale SyncGateway-Anfrage überschreitet die zulässige Größe.` |
| `415` | `unsupportedMediaType` | `localSyncGatewayUnsupportedMediaType` | `Medientyp oder Inhaltskodierung der lokalen SyncGateway-Anfrage wird nicht unterstützt.` |
| `417` | `expectationRejected` | `localSyncGatewayExpectationRejected` | `Die HTTP-Erwartung wird vom lokalen SyncGateway nicht unterstützt.` |
| `431` | `requestHeadersTooLarge` | `localSyncGatewayRequestHeadersTooLarge` | `Die HTTP-Header der lokalen SyncGateway-Anfrage überschreiten die zulässige Größe.` |
| `500` | `gatewayFailed` | `localSyncGatewayFailed` | `Die lokale SyncGateway-Anfrage konnte nicht sicher verarbeitet werden.` |
| `503` | `upstreamUnavailable` | `localSyncGatewayUpstreamUnavailable` | `Der lokale SyncGateway-Upstream ist noch nicht implementiert.` |

HTTP `204` besitzt keinen Body und damit keinen lokalen Fehler-Envelope. Im
regulären Requestpfad wird HTTP/1.0 vor der Raw-Header-Projektion zum statischen
`400 invalidHttpRequest`. Ein falsches Request-Target wird `404`, eine andere
Methode oder `CONNECT` wird `405`, eine fehlende, doppelte oder abweichende
Origin wird
`403`, und eine ungeeignete oder doppelte Content-Type-/Content-Encoding-
Angabe wird `415`. Ungültige Host-, Preflight-, Framing-, Trailer- oder UTF-8-
Eingaben sowie ein Upgrade werden `400`. Deklarierte oder tatsächlich
empfangene Übergröße wird `413`, eine nicht unterstützte Erwartung `417` und
ein Parser-Headerüberlauf `431`. Parserpfade ohne ausreichend vertrauenswürdigen
Origin-Kontext setzen keine CORS-Freigabe.

Eine kontrollierte Ablehnung der bestehenden Request Boundary ist die einzige
Ausnahme vom lokalen Envelope. Sie liefert HTTP `400`, und ausschließlich die
bereits vollständig validierte `gatewayErrorResponse` der Boundary wird als
Body serialisiert. Sie wird weder in einen lokalen Fehler noch in eine normale
SyncResponse umgeschrieben.

Ein lokaler Boundary- oder unerwarteter Gatewayfehler liefert das statische
HTTP-`500`-Profil und erfindet keine Gateway- oder SyncAgent-Response.

Ein vollständig gültiger und von der Boundary akzeptierter `syncTest` endet in
diesem Slice absichtlich mit dem statischen HTTP-`503`-Profil. Dieser Status
bedeutet ausschließlich, dass noch kein Upstream implementiert ist. Er ist kein
fachlicher Contractfehler, keine normale SyncResponse und keine behauptete
Verarbeitung durch den `SyncAgent`. Insbesondere werden weder
`handledBy: "SyncAgent"` noch `processedBy: ["SyncAgent"]` erzeugt.

Lokale Fehler enthalten keine eingehenden IDs, Bodywerte, Header, Origins,
URLs, Parsermeldungen, Validatorlisten, Stacks, Causes oder fremden
Exceptiontexte.

### Responseheader

Jede selbst erzeugte JSON-Response verwendet:

- `Content-Type: application/json; charset=utf-8`;
- `Cache-Control: no-store`;
- `X-Content-Type-Options: nosniff`.

CORS-Header werden ausschließlich für die exakt erlaubte Origin gesetzt. Eine
abgelehnte Origin erhält keine lesbare CORS-Freigabe. Der Server gibt keine
unnötigen Produkt- oder Frameworkinformationen aus. Abbruchpfade dürfen
kontrolliert `Connection: close` setzen.

Vor dem ersten selbst erzeugten Application- oder Raw-Socket-Responsewrite wird
für den physischen Socket genau ein Response-Owner beansprucht. Hat ein
Anwendungspfad oder ein Raw-Socket-Pfad den Socket bereits übernommen, darf ein
späteres `clientError` keine zweite Statuszeile oder Response mehr schreiben,
sondern zerstört den Socket ohne Write. Ein Parserfehler, der vor jeder
Anwendungsübernahme eintritt, darf weiterhin genau eine kontrollierte statische
Raw-Socket-Response übernehmen. Jeder Raw-Socket-Pfad versucht seine statische
redigierte Response best effort zu senden und zerstört den Socket nach dem
akzeptierten Write beziehungsweise im Fallback unmittelbar. Ein asynchroner
Raw-Schreibfehler wird ausschließlich zum idempotenten Destroy verwendet und
nicht ausgegeben. Ist der Owner
bereits beansprucht, schreibt der kollidierende Raw-Pfad nichts und zerstört den
Socket sofort. Damit bleiben auch halb offene CONNECT-, Upgrade- und
Parserfehler-Sockets endlich, wenn der Client nach Response oder FIN weiter
Bytes sendet. Die Regel verhindert konkurrierende Gateway-Responses; sie
garantiert nicht, dass ein bereits unbeschreibbarer Socket die übernommene
Response vollständig zustellt.

### Endliche HTTP-Ressourcengrenzen

`LOCAL_SYNC_GATEWAY_HTTP_LIMITS` ist tief eingefroren und besitzt exakt:

```js
{
  maxHeaderSize: 8192,
  maxHeaderFields: 32,
  headersTimeoutMs: 5000,
  requestTimeoutMs: 10000,
  socketTimeoutMs: 10000,
  connectionsCheckingIntervalMs: 100,
  keepAliveTimeoutMs: 1000,
  maxRequestsPerSocket: 1
}
```

Die Anwendung akzeptiert höchstens 32 Headerfelder. Eine interne Grenze mit
einem 33. Sentinelfeld stellt sicher, dass ein Überlauf erkannt und mit HTTP
`431` abgelehnt wird, statt durch vorherige Begrenzung stillschweigend als
zulässiger 32-Header-Request zu erscheinen.

Der Server begrenzt Header auf 8.192 Bytes, den Headerempfang auf eine absolute
Frist von 5 Sekunden, den vollständigen Request auf eine absolute Frist von 10
Sekunden und einen inaktiven Socket auf 10 Sekunden. Regelmäßig eintreffende
Teilbytes setzen die Header- und Requestfrist nicht zurück. Node prüft diese
beiden Fristen mit dem fest gesetzten `connectionsCheckingInterval` von 100 ms.
Bei einem responsiven Eventloop beträgt die konfigurierte Erkennungstoleranz
damit höchstens einen Prüftakt: Ein unvollständiger Header wird spätestens nach
5.100 ms und ein unvollständiger Request spätestens nach 10.100 ms erkannt und
fail-closed beendet. Keep-Alive ist auf 1 Sekunde begrenzt; pro Socket wird
höchstens ein Request verarbeitet und die kontrollierte Response beendet die
Verbindung mit `Connection: close`. Maßgeblich setzt dies das separate
factory-lokale Admission-Gate bereits bei jedem Requestereignis durch.
Zusätzlich beansprucht und zerstört ein expliziter synchroner
`dropRequest`-Handler den physischen Socket, sobald Node wegen
`maxRequestsPerSocket: 1` einen pipelinierten Folgerequest verwirft. Er schreibt
weder eine zusätzliche Node- noch Gateway-Response; die erste bereits
übernommene Response bleibt höchstens best effort zustellbar.

Für schnelle reale Timeoutregressionen besitzt nur die direkt komponierte
Factory eine private Testnaht. Ausschließlich der primitive boolesche Wert
`useTestTimeoutPolicy: true` zusammen mit Factory-Port `0` aktiviert die festen
Testwerte `headersTimeoutMs: 250`, `requestTimeoutMs: 500`,
`socketTimeoutMs: 500` und `connectionsCheckingIntervalMs: 25`. Die Naht ist
weder eine Environmentvariable noch Teil der Runtime-Konfiguration; sie kann
Produktionsfristen nicht verlängern oder anderweitig abschwächen. Die
eingefrorene zurückgegebene API bleibt exakt `{ start, stop }`.

Die Werte sind konservative lokale Ressourcenlimits für die unterstützten
Node-Linien `20.19.0` und `22.12.0`. Sie sind kein Rate Limit, keine
Calleridentität, kein vollständiger Slowloris- oder DoS-Schutz und kein
Timeout für einen späteren Browser- oder Cloud-Netzaufruf. Eine blockierte oder
stark verzögerte Eventloop-Ausführung sowie zusätzliche Betriebssystem- und
Netzwerkplanung können den tatsächlichen Schließzeitpunkt über die konfigurierte
Erkennungstoleranz hinaus verschieben; die Fristen sind keine vom Zustand der
Laufzeit unabhängige harte Wall-Clock-Garantie.
Ein abgelaufener Header-, Request- oder Socketpfad wird fail-closed beendet.
Abhängig vom erreichten Node-Parserzustand kann nur ein kontrollierter
Verbindungsabschluss oder eine minimale laufzeiteigene Timeoutantwort möglich
sein; ADR 0020 verspricht für diesen Parserpfad keinen stets auslieferbaren
lokalen JSON-Envelope.

### Daten-, Logging- und Betriebsgrenze

Der Gateway-Prozess besitzt keinen langlebigen Requestzustand, keine
Persistenz, kein Requestlogging, keine Telemetrie und kein Monitoring. Raw
Bodies, Header, Origins, Parser- oder Exceptionwerte werden weder gespeichert
noch als Diagnoseersatz ausgegeben. Tests verwenden ausschließlich erfundene
synthetische Werte und lokale Loopback-Kommunikation.

Bei explizitem Start entsteht ein lokaler Listener. GoldenDawn-Browser,
SyncService und `src/main.js` verwenden ihn noch nicht. Ohne den separaten
Start existiert kein Listener; `npm run dev` bleibt davon unabhängig.

Dieser Slice implementiert ausdrücklich keinen Browser-SyncTransport, keinen
Cloudtransport, keinen n8n-Webhook oder Workflow, kein Boundary-Bundle, kein
Credential oder Secret, keinen operativen `SyncAgent`, keine normale
erfolgreiche SyncResponse und keinen externen Datenfluss. Paketversion
`0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release `v0.2.2` bleiben
unverändert.

## Bedrohungen und verbleibende Risiken

| Bedrohung | Implementierte Schutzschicht | Verbleibende Grenze |
| --- | --- | --- |
| unbeabsichtigte LAN- oder Public-Bindung | Host fest auf `127.0.0.1`; keine Bind-Environmentvariable | lokale Prozesse können Loopback direkt ansprechen |
| bösartige Webseite | exakte einzelne Origin, Hostprüfung, POST-only und enger Preflight | kompromittierte erlaubte Origin; Nicht-Browser werden durch CORS nicht kontrolliert |
| Headerduplikate und uneindeutige Policywerte | Auswertung von Raw Headers, maximal 32 Felder plus Sentinel, 8.192-Byte-Grenze, kein `insecureHTTPParser` | Node-Parser, Proxy und Betriebssystem bleiben Laufzeitgrenzen |
| manipulierte Request-Targets | exakt ein Pfad; Querystrings und absolute Targets abgelehnt | vorgeschaltete lokale Software kann Requests bereits beeinflusst haben |
| falsche oder komprimierte Inhalte | enge JSON-/UTF-8- und Identity-Policy; keine Dekompression | die Policy ist keine semantische Privatheits- oder Herkunftsgarantie |
| falscher oder fehlender `Content-Length` | Header nur als Signal; unabhängige reale Streamzählung | Parser- und Socketressourcen entstehen vor der Anwendungszählung |
| übergroßer Body | begrenzte Chunksammlung; Abbruch ab Byte 65.537; keine vollständige übergroße Gesamtkopie | der aktuelle Node-Chunk kann bereits alloziert sein; kein Kernel- oder vollständiger DoS-Schutz |
| langsamer oder unvollständiger Request | absolute Header- und Requestfristen; 100-ms-Prüftakt; endliche Socket- und Keep-Alive-Grenzen; ein Request pro Socket | kein Rate Limit; Eventloop-, Betriebssystem- und Netzwerkplanung können den tatsächlichen Abschluss verzögern; Verbindungen verbrauchen vor dem Abbruch Ressourcen |
| ungültiges UTF-8 oder BOM-Veränderung | ein verifizierter fataler Decoder; `ignoreBOM: true`; keine Reparatur | TextDecoder und Same-Realm-Intrinsics bleiben vertrauenswürdige Laufzeitgrenzen |
| abweichende JSON-Semantik | kein Parser in HTTP; exakt ein Aufruf der kanonischen Boundary | natives Last-Key-Wins bleibt bewusst bestehen; kein kanonisches JSON |
| Daten- oder Fehlerleck | statische lokale Profile; Boundary-Response nur validiert; keine Requestlogs | unvermeidbare lokale HTTP- und Prozessmetadaten bleiben |
| erfundener Sync-Erfolg | akzeptierter Request endet statisch mit `503`; Projektion wird weder gespiegelt noch weitergeleitet | ein echter Upstream und eine normale Response existieren noch nicht |
| bösartiger lokaler Prozess | kleine leere, nebenwirkungsfreie `syncTest`-Capability | keine Calleridentität, lokale Authentisierung oder Rate-Limit-Durchsetzung |

Die Anwendung einzelner Schutzprinzipien ist kein vollständiger
Defense-in-Depth-, Zero-Trust-, DSGVO-, AI-Act- oder sonstiger
Compliance-Nachweis.

## Konsequenzen

Positive Auswirkungen:

- Die tatsächlich empfangenen Anwendungsbytes werden vor Stringmaterialisierung
  und Boundary-Aufruf begrenzt.
- UTF-8-, BOM- und Single-Parser-Semantik sind in einer realen lokalen
  HTTP-Komposition reproduzierbar testbar.
- Browser-Build, SyncService und kanonische Boundary bleiben von
  Node-spezifischen Details getrennt.
- Ein gültiger Request kann nicht versehentlich einen noch nicht vorhandenen
  Upstream oder Agentenerfolg vortäuschen.
- Feste Host-, Pfad-, Origin-, Methoden- und Content-Regeln halten die anonyme
  lokale Capability eng.
- Statische lokale Fehler bleiben von frühen Gateway-Contractresponses und
  normalen SyncResponses unterscheidbar.

Kosten und Einschränkungen:

- Der Gateway-Prozess muss getrennt gestartet, beendet und betrieben werden.
- Der Browser ist noch nicht mit dem Prozess verbunden.
- Loopback, Host und CORS authentisieren keinen lokalen Caller.
- Node und das Betriebssystem können Ressourcen vor der
  Anwendungspuffergrenze allozieren.
- Konservative Timeouts und eine Verbindung pro Request erhöhen den lokalen
  Verbindungsaufwand.
- Ohne Upstream endet auch ein vollständig gültiger Request absichtlich mit
  HTTP `503`.
- Rate Limits, Cloudgrenze, Secrets, Responsevalidierung und End-to-End-Betrieb
  bleiben getrennte spätere Slices.

## Erwogene Alternativen

### Gateway automatisch mit dem Vite-Dev-Server starten

Verworfen. Das würde die Node-Sicherheitsgrenze an den Browserentwicklungs-
und Buildpfad koppeln, einen Listener implizit starten und die getrennte
Betriebsgrenze verschleiern.

### Konfigurierbare Bind-Adresse

Verworfen. Für diesen anonymen lokalen `syncTest` gibt es keinen Bedarf für
LAN- oder Public-Erreichbarkeit. Eine Environmentvariable für die Bind-Adresse
erhöht das Risiko einer unbeabsichtigten Exposition.

### Serverframework oder Bodyparser einführen

Verworfen. Node-Plattformmodule reichen für den engen Pfad aus. Framework- und
Bodyparserdefaults könnten Header-, Allokations-, Decodierungs- oder
JSON-Reihenfolgen verbergen und würden eine unnötige Abhängigkeit einführen.

### `Content-Length` als verbindliches Bodylimit behandeln

Verworfen. Der Header kann fehlen, falsch oder mehrdeutig sein. Nur die
unabhängige Zählung der tatsächlich empfangenen Chunks setzt die lokale
Anwendungspuffergrenze durch.

### Chunks einzeln als Strings dekodieren

Verworfen. Mehrbytefolgen können Chunkgrenzen überschreiten. Per-Chunk-
Decodierung würde die Semantik verändern und ungültige Sequenzen reparieren
oder fragmentieren können.

### `Buffer.toString()` oder nicht fatalen TextDecoder verwenden

Verworfen. Ein nicht fataler Decoder kann ungültige Eingabe durch Replacement
Characters reparieren. Die BOM-Semantik muss außerdem ausdrücklich erhalten
bleiben.

### JSON bereits in der HTTP-Schicht parsen

Verworfen. Ein zweiter Parser würde ADR 0018 verletzen, Drift ermöglichen und
die native Duplicate-Key-Semantik potenziell unterschiedlich auswerten.

### Akzeptierten Request als synthetischen Erfolg spiegeln

Verworfen. In diesem Slice laufen weder Upstream noch `SyncAgent`. Eine normale
SyncResponse würde eine nicht erfolgte Verarbeitung behaupten. Das statische
HTTP-`503`-Profil bildet den realen Zustand ab.

### Alle Fehler als Gateway-Contractresponse ausgeben

Verworfen. HTTP-, Runtime- und lokale Programmfehler vor oder außerhalb eines
gültigen Contractrequests besitzen keine `gateway_`-Korrelation und dürfen
keine SyncContract-Response erfinden.

### Default-Port oder Default-Origin bereitstellen

Verworfen. Der Prozess soll nur nach einer ausdrücklichen, vollständig
validierten serverseitigen Konfiguration starten.

## Verifikation

Die Foundation wird mit echten Node-HTTP-Requests gegen temporäre Listener auf
`127.0.0.1` und Factory-Port `0` sowie bei Bedarf kontrollierten lokalen
Raw-Socket-Requests geprüft. Tests dürfen weder n8n noch das Internet oder ein
anderes externes Ziel aufrufen. Server, Clients und Sockets werden in
Cleanup-Pfaden geschlossen.

Die Regressionen prüfen insbesondere genau einen Response-Owner bei ungültigen
Transfer-Encoding-Profilen und Parserfehlern, tröpfelnde unvollständige Header
und Bodies innerhalb der Testfrist plus einem 25-ms-Prüftakt und einer nur im
Testharness erlaubten, auf 250 ms begrenzten Timer-Scheduling-Toleranz, den
irreversiblen fail-closed Zustand nach Start- und späterem Serverfehler, den
payloadlosen Fatal-Prozessabschluss, halb offene CONNECT-, Upgrade- und
Parserfehler-Sockets, zehn gepipelinete HTTP/1.0-Keep-Alive-Requests, mehrere
HTTP/1.1-Requests und Expect-/`checkContinue`-/`checkExpectation`-Pipelines auf
je einem Socket, verworfene pipelinierte Folgerequests sowie beide
Port-80-Hostformen ohne privilegierten Port-80-Bind. Raw-Pfade liefern höchstens
eine Statuszeile und schließen zeitnah; Request-Admission und `dropRequest`
erzeugen keine zweite Antwort und höchstens ein Request erreicht Decoder oder
Boundary. Werfende `address`- und `port`-Getter im Listening-Abschluss ergeben
den statischen Startfehler mit vollständigem Cleanup und ohne Fatal-Aufruf.

Die Hostregression deaktiviert `maxRequestsPerSocket`, sendet ein hostloses
HTTP/1.1-`OPTIONS` und einen gültigen POST in demselben Pipeline-Write und
beobachtet exakt zwei Anwendungsereignisse ohne `dropRequest`. Trotzdem
erreichen weder Decoder noch Boundary eine Eingabe; die höchstens einmalige,
vollständig zugestellte Antwort ist der eigene statische
`invalidHttpRequest`-Envelope. Weitere mutationsgerichtete Instrumentierungen
belegen beim ersten gültigen HTTP/1.1-Request exakt einen Decoderfactory-,
Decode- und Boundary-Aufruf mit dem ersten Raw Body und beim zweiten regulären
oder Expect-Ereignis exakt null `rawHeaders`-Zugriffe sowie den terminalen
Response-/Socketzustand. Diese globalen Instrumentierungen laufen mit
`concurrency: false` und werden im `finally` vollständig restauriert.

Für den Listening-Abschluss werden außerdem die gemeldeten Ports `0`, `-1`,
`65536` und ein vom angeforderten gültigen Produktionsport abweichender Wert
regressionsgeprüft. Alle ergeben den redigierten `startFailed`-Result,
vollständigen Listener-/Socket-Cleanup und keinen `onFatal`-Aufruf; Funktions-
und Getterzugriffe bleiben jeweils auf einen Versuch begrenzt.

Mindestens auszuführen sind:

```text
node --test tests/localSyncGatewayHttpServer.test.js
node --test tests/localSyncGatewayHttpServer.test.js tests/syncGatewayRequestBoundary.test.js tests/syncContract.test.js tests/syncService.test.js
npm test -- --test-concurrency=1
npm run build
```

Die gezielte Local-SyncGateway-Suite bestand mit 50/50 Tests. Zusammen mit
SyncGateway Request Boundary, SyncContract und SyncService bestanden 192/192
Tests; die vollständige serielle Suite bestand mit 1125/1125 Tests. Alle drei
Läufe hatten 0 Fehlschläge, 0 Skips und 0 Todos und verwendeten für das Gateway
ausschließlich synthetische Werte sowie lokale Loopback-Kommunikation. Der
Produktions-Build war erfolgreich und transformierte weiterhin exakt 46
Browsermodule.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn:

- das Gateway an etwas anderes als exakt `127.0.0.1` binden soll;
- mehrere Origins, Pfade oder fachliche Methoden benötigt werden;
- der Browser-SyncTransport oder eine `src/main.js`-Komposition eingeführt
  wird;
- ein Cloudtransport, n8n-Webhook, Credential oder Secret komponiert wird;
- ein akzeptierter Request an einen Upstream weitergegeben oder eine normale
  SyncResponse ausgegeben werden soll;
- eine andere Aktion, ein nicht leeres Payload, private Daten oder eine
  Nebenwirkung zugelassen werden;
- lokale Caller authentisiert oder autorisiert werden sollen;
- Body-Binding, Signaturen, Replay-, Idempotenz- oder
  Deduplizierungsmechanismen eingeführt werden;
- konkrete lokale oder Cloud-Rate-Limits implementiert werden;
- der lokale Fehler-Envelope, die Statuszuordnung oder die Ressourcenlimits
  geändert werden;
- ein Serverframework, Bodyparser oder eine neue Produktionsabhängigkeit
  eingeführt wird;
- eine unterstützte Node-Version Header-, Timeout-, Stream-, TextDecoder- oder
  Socketsemantik abweichend bereitstellt;
- die Anwendungspuffergrenze als weitergehende Kernel-, Socket- oder
  DoS-Garantie verwendet werden soll.

Jede private oder schreibende Capability benötigt weiterhin eine neue
Contract-, Identitäts-, Berechtigungs-, Replay-, Idempotenz- und
Datenschutzentscheidung.

## Verwandte Dokumente

- [ADR 0002: SyncAgent als einziges externes Gateway](0002-syncagent-gateway.md)
- [ADR 0005: Version 1 bleibt auf drei Agenten begrenzt](0005-v1-three-agent-scope.md)
- [ADR 0016: Transportneutraler SyncContract-Kern](0016-transport-neutral-sync-contract-foundation.md)
- [ADR 0017: Transportneutrale SyncService Foundation](0017-transport-neutral-sync-service-foundation.md)
- [ADR 0018: Transportneutrale SyncGateway Request Boundary](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
- [ADR 0019: Lokales SyncGateway vor n8n Cloud](0019-local-sync-gateway-before-n8n-cloud.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`README.md`](../../README.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/roadmap.md`](../roadmap.md)
- [`docs/security.md`](../security.md)
- [`server/localSyncGatewayRuntimeConfig.js`](../../server/localSyncGatewayRuntimeConfig.js)
- [`server/localSyncGatewayHttpServer.js`](../../server/localSyncGatewayHttpServer.js)
- [`server/startLocalSyncGateway.js`](../../server/startLocalSyncGateway.js)
- [`tests/localSyncGatewayHttpServer.test.js`](../../tests/localSyncGatewayHttpServer.test.js)
