# ADR 0017: Transportneutrale SyncService Foundation

## Status

Angenommen – 2026-08-04

## Kontext

Die in
[ADR 0016](0016-transport-neutral-sync-contract-foundation.md) festgelegte
SyncContract Foundation definiert den geschlossenen transportneutralen Vertrag
für Version `1.0`, die einzige Aktion `syncTest`, die Quelle
`goldendawn-os`, den Handler `SyncAgent` und als `synthetic` klassifizierte
Erfolgsdaten. ADR 0016 bleibt unverändert und wird nicht rückwirkend zu einer
Serviceentscheidung umgedeutet.

Vor einem realen HTTP-, Webhook- oder n8n-Transport benötigt GoldenDawn OS eine
kleine Anwendungsgrenze, die gültige Requests kontrolliert erzeugt, die Methode
des einzigen injizierten Transport-Ports höchstens einmal aufruft und deren
Rückgabewert nicht bereits als vertrauenswürdig behandelt. Diese Grenze darf
keinen generischen Aktions- oder Payloadpfad, keine Endpointkonfiguration und
keinen Zugriff auf private lokale Module einführen.

Eine normale SyncContract-Fehlerresponse ist bereits ein vollständig
validiertes fachliches Vertragsresultat. Lokale Fehler beim Aufruf, Request-
Build, Port oder bei der Response-Verarbeitung sind dagegen keine
SyncResponses. Beide Ebenen müssen getrennt bleiben, damit lokale Fehler keine
Verarbeitung durch einen noch nicht operativen `SyncAgent` behaupten.

JavaScript-Composition-Dependencies sind zudem ausführbarer Same-Realm-Code.
Function-Proxies, Reflection und Promise-/Thenable-Auflösung können
Seiteneffekte auslösen, blockieren oder werfen. Der Service kann beobachtbare
Fehler redigieren, ist aber keine Sandbox und kann bereits ausgelöste
Seiteneffekte nicht rückgängig machen.

## Entscheidung

`src/services/syncService.js` implementiert:

```js
createSyncService({
  syncTransport,
  generateRequestId = defaultCryptoRequestIdGenerator,
  getCurrentTimestamp = defaultUtcClock,
} = {})
```

Die Factory liefert ein eingefrorenes Serviceobjekt mit exakt der öffentlichen
Methode `runSyncTest`.

### Argumentloser asynchroner Aufruf

`runSyncTest()` bleibt immer Promise-basiert und akzeptiert keine Argumente.
Zusätzliche Argumente werden fail-closed abgelehnt, ohne ihre Properties zu
lesen, Getter oder Proxy-Traps gezielt auszulösen, sie zu konvertieren oder an
eine Dependency weiterzugeben. In diesem Pfad werden Generator und Clock nicht
ausgewertet; auf `syncTransport` oder seine `sendSyncRequest`-Property wird
nicht zugegriffen.

Es gibt keinen generischen `execute(action, payload)`-Pfad. Version, Aktion,
Quelle, Payload, Endpoint oder Client-Modus sind nicht durch den
`runSyncTest()`-Aufrufer konfigurierbar. Der Factory-/Composition-Aufrufer kann
dagegen Transport, Generator und Clock injizieren und bleibt vertrauenswürdige
ausführbare Anwendungskonfiguration.

### Kontrollierter interner Request-Builder

Vor dem Request-Build versucht der Service zuerst genau einmal sicher,
`syncTransport.sendSyncRequest` aufzulösen. Bei fehlender, nicht funktionaler
oder werfend aufgelöster Methode endet der Aufruf mit `unavailable`; Generator
und Clock werden nicht ausgewertet. Erst nach erfolgreicher Methodenauflösung
erzeugt der Request-Build einen frischen Request mit exakt:

```js
{
  version: "1.0",
  action: "syncTest",
  source: "goldendawn-os",
  requestId: "<kontrollierte req_-ID>",
  timestamp: "<kontrollierter kanonischer UTC-Zeitstempel>",
  payload: {}
}
```

Die bestehenden SyncContract-Konstanten und `validateSyncRequest` bleiben die
einzige Contract-Allowlist. `generateRequestId` und `getCurrentTimestamp`
werden während dieses Builds jeweils exakt einmal ausgewertet. Ihre Ergebnisse
müssen primitive Strings sein und werden nicht mit `String`, `toString`,
`valueOf`, `Symbol.toPrimitive` oder anderen impliziten Konvertierungen
repariert.

Der einmal erfasste Clock-Wert ist sowohl Request-`timestamp` als auch lokale
Referenzzeit der Request-Validierung. Nur die eigentliche Portmethode wird nach
vollständiger Requestvalidierung aufgerufen.

Der Standard-ID-Generator verwendet ausschließlich:

```text
req_ + crypto.randomUUID()
```

Es existiert kein schwächerer Zufalls-, Timestamp- oder sonstiger Fallback.
Generator und Clock dürfen ihre Werte nicht aus Nutzerinhalten, PromptVault,
LearningHub, LichtwaldLog oder anderen privaten Beständen ableiten. Injizierte
Varianten bleiben vertrauenswürdige Composition-Dependencies. Die syntaktische
ID-Prüfung beweist weder Kollisionsarmut noch semantische Freiheit von privaten
Informationen.

### Unveränderliche Korrelation

Die Portmethode erhält einen frischen tief eingefrorenen Request. Eine
getrennte, ebenfalls tief eingefrorene Kopie mit eigenem Payload-Record bleibt
intern als Korrelationsgrundlage erhalten. Beide besitzen dieselben
kontrollierten Werte, teilen aber keine veränderlichen Records.

Sequenzielle und parallele Aufrufe besitzen vollständig getrennte Requests und
Korrelationen. Der Service führt keinen globalen Request-, In-flight-,
Kollisions- oder Idempotenzspeicher.

### Asynchroner Transport-Port

Der einzige Port lautet:

```js
syncTransport.sendSyncRequest(syncRequest)
```

Die bereits vor dem Request-Build einmal sicher aufgelöste Methode wird mit dem
vorgesehenen Receiver erst nach vollständiger Requestvalidierung und pro
Serviceaufruf höchstens einmal aufgerufen. Sie darf synchron einen Wert oder
asynchron ein Promise liefern. Synchrones Werfen, Promise-Rejections und
beobachtbare Thenable-Fehler werden statisch redigiert.

Der Slice führt keinen Retry, Backoff, Timeout oder zweiten Transportversuch
ein. In `src/` wird kein produktiver Mock-, HTTP-, Fetch-, Webhook- oder
n8n-Transport ausgeliefert.

### Defensive Response-Projektion

Der Rückgabewert der Portmethode ist unvertrauenswürdige Eingabe. Der Service
erzeugt eine neue allowlist-basierte gewöhnliche Datenprojektion und validiert
sie mit:

```js
validateSyncResponse(syncResponse, correlatedRequest)
```

Nur eine vollständig gültige, normal korrelierte Projektion wird tief
eingefroren und ausgegeben. Das originale Transportobjekt wird weder verändert,
eingefroren noch direkt zurückgegeben. Zusätzliche, symbolische oder
Accessor-Felder, ungeeignete Records sowie falsche Version, Aktion,
`requestId`, Handler, Verarbeitungskette oder Datenherkunft werden nicht
repariert.

Frühe Gateway-Fehler gehören nicht zum lokalen Transportprofil. Der Service
ruft nicht versuchsweise mehrere Validatoren auf; ein Gateway-Profil ist hier
eine ungültige Transportresponse. Seine Integration wird gemeinsam mit der
späteren realen Gateway-Grenze entschieden.

### Getrennter lokaler Service-Result

Jeder Service-Result besitzt exakt:

```js
{
  ok,
  status,
  requestId,
  syncResponse,
  error
}
```

Eine vollständig gültige normale SyncResponse liefert
`status: "syncResponseReceived"` und `ok: true`. Das gilt auch für eine
vollständig gültige normale Contract-Fehlerresponse. Der fachliche Erfolg wird
ausschließlich durch `syncResponse.success` ausgedrückt.

Lokale Fehler verwenden ausschließlich die Statuswerte
`invalidInvocation`, `unavailable`, `requestBuildFailed`,
`transportFailed` und `invalidResponse` mit den in
`docs/data-contracts.md` festgelegten statischen Code-/Meldungspaaren. Vor
einem vollständig gültigen Request bleibt `requestId: null`; danach darf nur
die bereits validierte ausgehende ID verwendet werden. Rohwerte,
Validatorfehlerlisten, Stacks und fremde Dependency-Meldungen werden nicht
übernommen oder geloggt.

Lokale Servicefehler sind keine SyncResponses und besitzen weder
`handledBy: "SyncAgent"` noch `processedBy: ["SyncAgent"]`.

### Testseitige Simulation und Vertrauensgrenzen

Der kontrollierte Erfolgsfluss wird ausschließlich in
`tests/syncService.test.js` mit einem klar gekennzeichneten deterministischen
In-Memory-Test-Double bewiesen. Seine vollständig erfundenen Responses
simulieren die bestehende Contract-Rolle. `handledBy: "SyncAgent"` und
`processedBy: ["SyncAgent"]` beweisen keinen operativen oder extern
ausgeführten Agenten.

Injizierte Functions und Function-Proxies sind vertrauenswürdiger
Anwendungscode und können beliebige Seiteneffekte ausführen. Reflection auf
Proxies sowie Promise-/Thenable-Auflösung kann fremden Code ausführen. Der
Service redigiert beobachtbare Throws und Rejections, kann ausgelöste
Seiteneffekte aber weder verhindern noch rückgängig machen. Eine portable
universelle Proxy- oder Thenable-Erkennung wird nicht eingeführt. Für stabile,
seiteneffektfreie gewöhnliche Werte arbeitet der Service deterministisch und
ohne Inputmutation.

Der Service verwendet `validateSyncRawBodySize` nicht und verarbeitet keine
Wire-Bytes oder JSON. Die spätere Wire-Reihenfolge bleibt:

```text
Raw Body begrenzen
→ JSON ohne benutzerdefinierten Reviver kontrolliert parsen
→ weiterhin unvertrauenswürdigen datenförmigen Wert validieren
```

## Konsequenzen

- Request-Erzeugung, Transportaufruf, Korrelation und Response-Validierung sind
  als kleine testbare Verantwortlichkeiten getrennt.
- Der `runSyncTest()`-Aufrufer kann keine Aktion, Payload, Quelle, ID, Zeit,
  Umgebung oder Route einschleusen. Der Factory-/Composition-Aufrufer kann
  dagegen `syncTransport`, Generator und Clock injizieren und bleibt
  vertrauenswürdige ausführbare Anwendungskonfiguration.
- Getrennte eingefrorene Requests verhindern eine gemeinsame veränderliche
  Korrelationsgrundlage; Deep Freeze ist jedoch keine Sandbox.
- Normale SyncResponses und lokale Servicefehler behalten unterschiedliche
  Semantik und können nicht miteinander verwechselt werden.
- Der Service liest, persistiert oder exportiert keine lokalen privaten
  Bestände.
- Da kein konkreter Transport ausgeliefert oder in `src/main.js` komponiert
  ist, existiert kein externer Datenfluss.
- Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
  `v0.2.2` bleiben unverändert; `v0.3.0` ist unveröffentlicht und in Arbeit.
- Der Slice implementiert keinen Webhook, Gateway, operativen `SyncAgent`,
  n8n-Workflow, keine Authentisierung, Signaturprüfung, CORS- oder
  Rate-Limit-Durchsetzung, keine Timeouts, Retries, Storage-, Logging- oder
  Telemetrieschicht, Hub-UI oder `src/main.js`-Komposition.

## Erwogene Alternativen

### Generische Aktion und Payload annehmen

Verworfen. Ein generischer Execute-Pfad würde den geschlossenen
`syncTest`-Vertrag umgehen und unnötige Nutzer- oder Modulwerte an die
Transportgrenze bringen.

### Contractwerte vom runSyncTest()-Aufrufer übernehmen

Verworfen. Die Korrelation muss aus kontrollierten Composition-Dependencies
entstehen und darf nicht aus Eingaben des `runSyncTest()`-Aufrufers,
Nutzereingaben oder privaten lokalen Beständen abgeleitet werden. Der Factory-/
Composition-Aufrufer injiziert diese vertrauenswürdigen Dependencies bewusst.

### Transportrequest selbst als interne Korrelation behalten

Verworfen. Getrennte Records verhindern, dass eine Transportdependency die
spätere Korrelation durch den Austausch geteilter verschachtelter Werte
verändert.

### Originale Transportresponse validieren und direkt zurückgeben

Verworfen. Das würde fremde Objektidentität, nachträgliche Mutation und
Accessor-/Proxy-Strukturen in die öffentliche Serviceausgabe übernehmen.

### Normale und frühe Gateway-Responses versuchsweise akzeptieren

Verworfen. Das Gateway-Profil gehört erst an die reale serverseitige
Transportgrenze und ist keine normale korrelierte SyncAgent-Response.

### Bereits einen HTTP-, Mock- oder n8n-Transport in `src/` ausliefern

Verworfen. Endpoint-, Wire-, Gateway- und Netzwerksicherheitsentscheidungen
werden bewusst in einem späteren Slice getroffen. Das aktuelle Test-Double
bleibt ausschließlich in der Testsuite.

### Universelle Proxy- oder Thenable-Erkennung versprechen

Verworfen. Eine portable vollständige Erkennung existiert nicht und würde
Sicherheitsgarantien behaupten, die JavaScript für beliebigen Same-Realm-Code
nicht bietet.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, bevor ein konkreter Transport ausgeliefert
oder in `src/main.js` komponiert, ein Gateway-Fehlerprofil lokal akzeptiert,
eine weitere Aktion oder Datenherkunft eingeführt oder ein Timeout-, Retry-,
Backoff-, Idempotenz-, Persistenz-, Logging- oder Telemetrieverhalten ergänzt
wird. Webhook-Terminierung, Raw-Body- und JSON-Verarbeitung, Authentisierung,
Signaturen, CORS und Rate Limits benötigen weiterhin eine eigene
serverseitige Sicherheitsentscheidung.
