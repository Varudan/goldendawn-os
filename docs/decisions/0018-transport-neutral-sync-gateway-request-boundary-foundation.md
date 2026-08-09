# ADR 0018: Transportneutrale SyncGateway Request Boundary Foundation

## Status

Angenommen – 2026-08-06

## Kontext

Die in
[ADR 0016](0016-transport-neutral-sync-contract-foundation.md) festgelegte
SyncContract Foundation definiert den geschlossenen transportneutralen Vertrag
für Version `1.0`, `syncTest` und den kanonischen Handler `SyncAgent`.
[ADR 0017](0017-transport-neutral-sync-service-foundation.md) ergänzt die
asynchrone ausgehende Servicegrenze mit einem injizierten Transport-Port. Beide
Entscheidungen bleiben unverändert und werden durch ADR 0018 weder rückwirkend
umgedeutet noch erweitert.

Vor einem realen HTTP-, Webhook- oder n8n-Slice benötigt GoldenDawn OS eine
kleine eingehende Request-Grenze, die einen bereits vollständig
materialisierten Raw-Body-Wert fail-closed einordnet. Sie soll einen gültigen
Request ausschließlich als neue defensive Datenprojektion ausgeben und
beherrschte Eingabeablehnungen über das bereits vorhandene frühe
Gateway-Fehlerprofil ausdrücken. Lokale Aufruf-, Clock-, Generator-, Builder-
oder Runtimefehler dürfen dagegen keine SyncContract-Response und keine
Verarbeitung durch einen noch nicht operativen `SyncAgent` erfinden.

Die Grenze erhält keine Raw-Wire-Bytes. Der JavaScript-String wurde vor ihrem
Aufruf bereits alloziert und möglicherweise bereits aus Bytes dekodiert. Eine
String-Längenprüfung kann deshalb weder die vorherige Body-Allokation noch die
spätere produktive HTTP-Grenze absichern. Auch native Same-Realm-Funktionen,
Reflection sowie injizierte Functions oder Function-Proxies können Code
ausführen, blockieren, werfen oder Seiteneffekte auslösen. Die Foundation ist
keine Sandbox und darf keine umfassendere Sicherheitsgarantie behaupten.

## Entscheidung

`src/gateways/syncGatewayRequestBoundary.js` exportiert ausschließlich:

```js
createSyncGatewayRequestBoundary({
  generateGatewayRequestId = defaultCryptoGatewayRequestIdGenerator,
  getCurrentTimestamp = defaultUtcClock,
} = {})
```

Die Factory liefert eine eingefrorene gewöhnliche API mit exakt der eigenen
Methode `processSyncRawBody`. Diese Methode arbeitet synchron, akzeptiert exakt
einen Wert und ist weder HTTP-Handler noch Transportadapter. Request-,
Response-, Header-, Stream-, Buffer-, Blob-, ArrayBuffer- oder andere
Transportobjekte gehören nicht zu ihrer API.

### Exakter Aufruf- und Resultvertrag

Bei fehlenden oder zusätzlichen Argumenten inspiziert oder konvertiert die
Boundary keinen Argumentwert. Sie führt weder Raw-Body-Validierung noch
Parsing, Clock- oder Generatorzugriff aus und liefert `invalidInvocation`.
Bei exakt einem Argument wird der Wert dagegen unverändert an
`validateSyncRawBodySize(rawBody)` übergeben. Auch ein nicht primitiver String
wird weder mit `String`, `toString`, `valueOf` oder `Symbol.toPrimitive`
konvertiert noch absichtlich über eigene Properties ausgelesen.

Jeder Aufruf liefert synchron ein tief eingefrorenes gewöhnliches Objekt mit
exakt denselben fünf eigenen aufzählbaren Dateneigenschaften:

```js
{
  ok,
  status,
  syncRequest,
  gatewayErrorResponse,
  error
}
```

Ein akzeptierter Request verwendet ausschließlich:

```js
{
  ok: true,
  status: "syncRequestAccepted",
  syncRequest: "<defensiver tief eingefrorener Sechs-Felder-Snapshot>",
  gatewayErrorResponse: null,
  error: null
}
```

`ok: true` bedeutet nur lokale Contractakzeptanz. Es wurde nichts gesendet und
kein `SyncAgent` ausgeführt.

Eine beherrschte Eingabeablehnung verwendet ausschließlich:

```js
{
  ok: false,
  status: "syncRequestRejected",
  syncRequest: null,
  gatewayErrorResponse: "<gültige defensive frühe Gateway-Fehlerresponse>",
  error: null
}
```

Die Gateway-Fehlerresponse ist ein gültiges SyncContract-Profil und kein
lokaler Programmfehler. Lokale Boundary-Fehler verwenden dagegen
`invalidInvocation` oder `boundaryFailed`, setzen `syncRequest` und
`gatewayErrorResponse` auf `null` und enthalten exakt einen statischen
Zwei-Felder-Error:

| Status | Code | Exakte Meldung |
| --- | --- | --- |
| `invalidInvocation` | `invalidSyncGatewayBoundaryInvocation` | `Die Sync-Gateway-Grenze erwartet genau einen Raw-Body-Wert.` |
| `boundaryFailed` | `syncGatewayBoundaryFailed` | `Die Sync-Anfrage konnte an der Gateway-Grenze nicht sicher verarbeitet werden.` |

Lokale Errors enthalten keine Causes, Details, Stacks, Validatorfehlerlisten,
Rohwerte oder fremden Exceptionmeldungen. Sie besitzen keine `gateway_`-ID,
keinen Handler und keine erfundene Verarbeitungskette.

### Fail-closed Verarbeitungsreihenfolge

Die verbindliche Reihenfolge lautet:

```text
materialisierten Raw-Body-Wert begrenzen
→ String exakt einmal ohne Reviver parsen
→ Parsed-Wert mit bestehendem SyncContract validieren
→ defensive Sechs-Felder-Projektion erzeugen
→ Projektion mit derselben Referenzzeit validieren
→ tief einfrieren
→ finalen Snapshot mit derselben Referenzzeit erneut validieren
```

Konkret prüft die Boundary zuerst die exakte Argumentanzahl und danach mit
`validateSyncRawBodySize` den unveränderten Wert. `rawBodyTooLarge` besitzt
Vorrang vor der JSON-Syntax und führt ohne Parsing zum Profil
`PAYLOAD_TOO_LARGE`; andere reguläre Raw-Body-Validierungsfehler werden
`VALIDATION_ERROR`. Nur nach bestandener Größenprüfung ruft die Boundary
`JSON.parse(rawBody)` exakt einmal, mit exakt einem Argument und ohne Reviver
auf. Ein nativer Parser-Throw wird vollständig verworfen und ergibt
`INVALID_JSON`.

Nach erfolgreichem Parsing wird eine kontrollierte Referenzzeit höchstens
einmal erfasst. Der unveränderte Parsed-Wert muss zuerst
`validateSyncRequest(parsedRequest, capturedTimestamp)` vollständig bestehen.
Zusatzfelder werden deshalb nicht vor der maßgeblichen Validierung entfernt.
Nur danach entsteht descriptor-basiert ein neuer gewöhnlicher Record aus exakt
`version`, `action`, `source`, `requestId`, `timestamp` und `payload`. Die fünf
skalaren Werte werden unverändert übernommen; `payload` ist zwingend ein
frisches exakt leeres gewöhnliches Objekt.

Die Projektion wird mit derselben Referenzzeit validiert, anschließend tief
eingefroren und als finaler Snapshot erneut mit derselben Zeit validiert. Der
Parsed-Wert wird weder verändert noch normalisiert, eingefroren, direkt
zurückgegeben, geloggt oder persistiert. Parsed-Wert und Ausgabe teilen keine
mutablen Recordidentitäten. Wird ein zuvor gültiger Parsed-Wert während
Projektion, Freeze oder erneuter Validierung unerwartet inkonsistent, ist dies
`boundaryFailed` und keine Client-`VALIDATION_ERROR`-Antwort.

Es gibt keinen Stringify-/Parse-Roundtrip, kein `Object.assign`, keinen Spread
aus dem Parsed-Record, kein Deep-Merge und keinen generischen Deep-Clone.
Unbekannte String- oder Symbolfelder, nicht aufzählbare Felder, Accessors,
ungeeignete Prototypen sowie `__proto__`, `constructor` und `prototype` werden
vom bestehenden geschlossenen Contract fail-closed abgelehnt und nicht
bereinigt.

### Statische Fehlerzuordnung

Die Boundary verwendet ausschließlich vorhandene SyncContract-Konstanten,
`SYNC_CONTRACT_VALIDATION_ERROR_CODES`,
`SYNC_CONTRACT_RESPONSE_ERROR_PROFILES`, `validateSyncRawBodySize`,
`validateSyncRequest` und `validateSyncGatewayErrorResponse`.

| Ursache | Gateway-Profil |
| --- | --- |
| `rawBodyTooLarge` | `PAYLOAD_TOO_LARGE` |
| anderer regulärer Raw-Body-Validierungsfehler | `VALIDATION_ERROR` |
| nativer `JSON.parse`-Throw | `INVALID_JSON` |
| exakt alleiniger Requestfehler `unsupportedVersion` | `UNSUPPORTED_VERSION` |
| exakt alleiniger Requestfehler `unknownAction` | `UNKNOWN_ACTION` |
| sonstiger oder kombinierter Requestfehler | `VALIDATION_ERROR` |

`invalidReferenceTimestamp` ist immer ein interner Clockfehler und führt zu
`boundaryFailed`. `UNSUPPORTED_VERSION` und `UNKNOWN_ACTION` werden nur dann
ausgegeben, wenn der jeweilige Fehlercode der einzige Request-Contractfehler
ist. Gemischte Fehlerbilder bleiben das statische `VALIDATION_ERROR` und werden
nicht zum detaillierten Validierungs-Oracle. Projektions-, Freeze-, Validator-
oder Builderinkonsistenzen nach einer erfolgreichen Requestvalidierung sind
ebenfalls lokale `boundaryFailed`-Pfade.

`FORBIDDEN` wird nicht erzeugt, weil diese Foundation keine Authentisierung,
Autorisierung oder vertrauenswürdige Herkunft besitzt. Sie erfindet auch keine
frühen `SERVICE_UNAVAILABLE`- oder `INTERNAL_ERROR`-Profile.

### Clock, Gateway-ID und frühe Fehlerresponse

Der Standard-Clockpfad liefert einen kanonischen UTC-Zeitstempel. Ein
injizierter Clockwert muss ein primitiver String sein und wird weder
konvertiert noch als Promise oder Thenable aufgelöst. Für einen akzeptierten
Request oder eine tatsächlich ausgegebene Gateway-Fehlerresponse wird die
Clock jeweils exakt einmal ausgewertet. Derselbe erfasste Wert dient bei der
Requestprüfung als `referenceTimestamp` und bei einer Ablehnung zugleich als
Response-`timestamp`.

Der Standard-ID-Generator verwendet ausschließlich:

```text
gateway_ + crypto.randomUUID()
```

`crypto.randomUUID()` wird exakt einmal mit seinem vorgesehenen Receiver
aufgerufen. Es gibt keinen `Math.random`-, Timestamp-, Zähler- oder fest
codierten Fallback. Der Generator wird nur aufgerufen, wenn tatsächlich eine
Gateway-Fehlerresponse benötigt wird, niemals bei `syncRequestAccepted`.
Nicht funktionale oder werfende Pfade sowie nicht primitive oder syntaktisch
ungültige Werte führen redigiert zu `boundaryFailed`.

Jede beherrschte Ablehnung baut pro Aufruf eine neue Response mit exakt zehn
Feldern. Sie verwendet `version: "1.0"`, `success: false`, eine neue
kontrollierte `gateway_`-ID, `action: null`, `handledBy: null`, `data: null`,
das zugeordnete statische Fehlerprofil mit frischem `details: []`, ein frisches
`warnings: []` und `meta: { durationMs: 0, processedBy: [] }`.
`durationMs: 0` ist ein statischer nicht gemessener Foundation-Wert und keine
Timing- oder Telemetrieaussage. Response, Error, Meta und alle Arrays sind pro
Aufruf frisch und teilen keine ausgabeseitigen Identitäten. Die vollständige
Response wird vor und nach dem Deep Freeze mit
`validateSyncGatewayErrorResponse` validiert. Ein Builder-, Generator-, Clock-
oder Validatorfehler gibt keine Teilresponse aus.

Die Boundary spiegelt niemals eine eingehende `req_`-ID. Sie setzt weder
`handledBy: "SyncAgent"` noch `processedBy: ["SyncAgent"]`. Syntaktische
`gateway_`- und `req_`-IDs beweisen keine sichere Herkunft, Identität,
Berechtigung, Kollisionsfreiheit oder Replay-Sicherheit.

### JSON-, Wire- und Laufzeitgrenzen

`validateSyncRawBodySize` prüft nur einen bereits materialisierten
JavaScript-String und dessen berechnete UTF-8-Länge bis einschließlich 65.536
Bytes. Der String wurde zu diesem Zeitpunkt bereits alloziert und möglicherweise
bereits aus Wire-Bytes dekodiert. Das ist keine HTTP-Bytebegrenzung, kein
Schutz vor vorheriger Body-Allokation, keine DoS-Garantie und keine produktive
Webhook-Durchsetzung.

Die spätere reale Reihenfolge bleibt:

```text
rohe Bodybytes am Transport begrenzen
→ kontrolliert in einen String dekodieren
→ diese Boundary genau einmal parsen lassen
→ ausschließlich die defensive Projektion weiterreichen
```

Die Boundary trimmt, repariert oder normalisiert den String nicht und entfernt
weder BOM noch Whitespace. Raw Body und Parserexception werden weder
zurückgegeben noch geloggt, persistiert oder weitergereicht. Native
Parserfehler können intern sensible Textausschnitte enthalten und werden
vollständig verworfen.

JSON mit doppelten Membernamen folgt bewusst der nativen ECMAScript-
`JSON.parse`-Semantik: Das letzte Vorkommen bestimmt den geparsten Wert. Die
Foundation behauptet deshalb weder duplikatfreies noch kanonisches JSON. Sie
führt keinen eigenen Parser, Reviver oder Duplicate-Key-Scanner ein. Eine
spätere reale Komposition muss gewährleisten, dass nur dieses eine
Parse-Ergebnis weitergereicht und der Raw Body nicht durch einen zweiten Parser
mit abweichender Semantik interpretiert wird.

`__proto__` entsteht bei nativem JSON-Parsing als eigene Dateneigenschaft und
verändert `Object.prototype` nicht. Als nicht erlaubtes Zusatzfeld wird es
zusammen mit `constructor`, `prototype` und allen anderen Zusatzfeldern vom
geschlossenen Request-Vertrag dennoch fail-closed abgelehnt.

Natives `JSON.parse` ohne Reviver erzeugt aus JSON selbst keine Proxies,
Accessors, Symbole, Functions oder Thenables. Manipulierte Same-Realm-
Intrinsics, Reflection sowie injizierte Clock- und Generator-Functions oder
Function-Proxies bleiben dennoch vertrauenswürdige ausführbare Konfiguration.
Sie können beliebigen Code ausführen, blockieren, werfen oder Seiteneffekte
auslösen. Beobachtbare Fehler werden redigiert; bereits ausgelöste Wirkungen
können weder verhindert noch rückgängig gemacht werden. Eine universelle
Proxy-/Thenable-Erkennung wird nicht eingeführt. Deep Freeze schützt nur die
neu erzeugten gewöhnlichen Snapshots und ist keine Sandbox.

### Sicherheits- und Datenschutzgrenzen

`source: "goldendawn-os"` bleibt eine syntaktische Klassifikation und kein
Authentisierungs-, Herkunfts-, Routing- oder Berechtigungsnachweis. Eine
gültige eingehende `req_`-ID ist nur syntaktisch gültig. Die
Timestamp-Toleranz ist kein Replay-, Idempotenz- oder Deduplizierungsschutz.
Der exakt leere Payload verhindert das vorgesehene Inhaltsfeld, beweist aber
nicht die semantische Privatheit anderer Metadaten.

Die Boundary liest, persistiert oder exportiert keine Daten aus PromptVault,
LearningHub oder LichtwaldLog. Eine gültige Projektion bedeutet nur
Contractakzeptanz, keinen ausgeführten Sync. Weil weder Transport noch
HTTP-Handler ausgeliefert oder komponiert werden, entsteht kein externer
Datenfluss.

## Konsequenzen

- Die bereits vorhandenen Contract-Validatoren bleiben die einzige Allowlist;
  der Request-Vertrag wird weder gelockert, dupliziert noch normalisiert.
- Materialisierter Raw Body, natives einmaliges Parsing, ursprüngliche
  Contractvalidierung und defensive Projektion werden als getrennte,
  überprüfbare Schritte sichtbar.
- Beherrschte Clientablehnungen und lokale Boundary-Fehler besitzen getrennte
  Semantik. Nur die erste Kategorie erzeugt eine gültige frühe
  Gateway-Fehlerresponse.
- Der Slice liest keine privaten lokalen Bestände und führt ohne Transport
  keinen externen Datenfluss ein.
- Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
  `v0.2.2` bleiben unverändert; `v0.3.0` bleibt unveröffentlicht und in Arbeit.
- Es entstehen kein HTTP-Handler, Endpoint, Webhook, konkreter Transport,
  n8n-Workflow, operativer `SyncAgent`, keine Authentisierung, Autorisierung,
  Signaturprüfung, Secrets, CORS- oder Rate-Limit-Durchsetzung, keine Header-,
  Methoden-, Statuscode-, Content-Type-, Charset- oder Encoding-Verarbeitung,
  keine Persistenz, Logs, Telemetrie, UI, AgentHub-, AutomationHub- oder
  `src/main.js`-Komposition.

## Erwogene Alternativen

### HTTP-Handler und Request Boundary gemeinsam einführen

Verworfen. Wire-Byte-Limit, Decodierung, Methoden, Header, Statuscodes,
Authentisierung und Deployment würden die transportneutrale Objektgrenze
unnötig koppeln und falsche Produktionsgarantien nahelegen.

### Zusatzfelder vor der Validierung entfernen

Verworfen. Eine bereinigte Projektion könnte einen ursprünglich ungültigen
Request entgegen dem geschlossenen SyncContract akzeptieren. Der Parsed-Wert
muss zuerst vollständig bestehen.

### JSON über Stringify-/Parse-Roundtrip klonen oder Duplicate Keys selbst scannen

Verworfen. Ein zweiter Parserpfad könnte abweichende Semantik einführen und
würde die verbindliche Single-Parser-Grenze verletzen. Doppelte Membernamen
folgen bewusst der nativen Last-Key-Wins-Semantik.

### Eingehende Request-ID spiegeln oder SyncAgent-Verarbeitung behaupten

Verworfen. Vor einem gültig korrelierbaren Request verwendet das bestehende
Contractprofil eine kontrollierte `gateway_`-ID und eine leere
Verarbeitungskette. Der Slice führt keinen Agenten aus.

### Stringlimit als vollständigen Wire- oder DoS-Schutz behandeln

Verworfen. Die Allokation und mögliche Decodierung sind bereits erfolgt. Ein
späterer Transport muss die tatsächlich empfangenen Bytes vorher begrenzen.

### JSON.parse oder universelle Proxy-Erkennung injizierbar machen

Verworfen. Der Parser bleibt eine feste Plattformgrenze. Eine portable
vollständige Proxy-/Thenable-Erkennung existiert nicht und würde Garantien
behaupten, die beliebiger Same-Realm-Code nicht erfüllt.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, bevor ein HTTP-Handler, konkreter Transport,
Webhook oder n8n-Workflow ausgeliefert, eine Raw-Wire-Byte- und
Decodierungsgrenze komponiert, Authentisierung, Autorisierung, Signaturen,
CORS, Rate Limits, Timeouts, Retries, Replay-, Idempotenz- oder
Deduplizierungsschutz eingeführt, frühe Gateway-Responses in den SyncService
integriert oder ein operativer `SyncAgent` angebunden wird. Neue Aktionen,
Quellen, Handler, Datenherkünfte oder Fehlerprofile benötigen weiterhin eine
eigene dokumentierte Contractentscheidung.
