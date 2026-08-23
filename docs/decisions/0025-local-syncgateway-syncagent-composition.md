# ADR 0025: Local SyncGateway–SyncAgent Composition

## Status

Angenommen – 2026-08-23

## Kontext

[ADR 0023](0023-local-syncagent-before-optional-external-providers.md)
entscheidet den lokalen `SyncAgent` als einzigen Einstieg und als verbindliche
Policy-, Validierungs-, Routing- und Responsegrenze des Agentensystems hinter
dem lokalen SyncGateway. [ADR 0024](0024-local-model-free-syncagent-core-foundation.md)
implementiert dafür einen isolierten, synchronen, modell- und providerfreien
Kern, verlangt aber vor seiner ersten operativen Komposition eine neue
Entscheidung über Übergabe, Responsebesitz und Lifecycle.

Die unveränderten Foundations aus
[ADR 0016](0016-transport-neutral-sync-contract-foundation.md),
[ADR 0017](0017-transport-neutral-sync-service-foundation.md),
[ADR 0018](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
und [ADR 0020](0020-local-sync-gateway-raw-wire-http-foundation.md) stellen den
geschlossenen SyncContract, den transportneutralen Browser-Service, die
defensive Request Boundary und den separat startbaren lokalen HTTP-/Wire-Pfad
bereit. Der lokale HTTP-Server gibt einen von der Boundary akzeptierten
Request derzeit nicht weiter, sondern antwortet weiterhin statisch mit HTTP
`503 upstreamUnavailable`.

Vor der operativen Verbindung der beiden vorhandenen lokalen Komponenten muss
feststehen:

- wo und mit welchen sichtbaren Dependencies die Komposition später erfolgt;
- welche konkrete Requestidentität die Agentengrenze erreichen darf;
- wie das Agentenergebnis erneut als unvertrauenswürdige Eingabe geprüft wird;
- wie eine normale SyncResponse defensiv neu erzeugt und korreliert wird;
- welche HTTP-Zuordnung für jeden frühen und späten Fehlerpfad gilt;
- welche Komponente Response, Serialisierung, Socket und Lifecycle besitzt.

Dieser Slice entscheidet ausschließlich diese Grenzen. Er implementiert keine
Komposition und ändert weder Server-, Agenten-, Browser- noch Contractcode. Der
verbindliche Referenzstand ist
`45dc7b9bb101b2dba445679a3237fb510ca6f33c`.

## Formale ADR-Wirkung

ADR 0025 ergänzt ADR 0023 und erfüllt das in ADR 0024 verlangte neue
Entscheidungsgate vor der ersten operativen Gateway-/SyncAgent-Komposition.
ADR 0023 und ADR 0024 bleiben angenommen und inhaltlich unverändert; keiner
von beiden wird ersetzt.

ADR 0002 und ADR 0019 bleiben durch ADR 0023 ersetzt. ADR 0016, ADR 0017,
ADR 0018 und ADR 0020 bleiben die unveränderten Contract-, Service-, Boundary-
und HTTP-Grundlagen. Das nach
[ADR 0021](0021-generated-n8n-boundary-bundle-foundation.md) erzeugte
n8n-Boundary-Derivat und die Evidence Foundation aus
[ADR 0022](0022-n8n-cloud-ingress-runtime-evidence-gate.md) bleiben
unkomponiert und inaktiv.

Evidence-Schema 1 bleibt unverändert. Insbesondere bleiben:

- `stableOssCompatibility: FAIL`;
- `testUrlTenantMeasurementStatus: UNPROVEN`;
- `providerExecutionEvidenceStatus: UNPROVEN`;
- `productionUrlMeasurementStatus: UNPROVEN`;
- `activationDecision: FAIL`;
- das Fehlen eines Felds `overallGate`.

ADR 0025 autorisiert weder Cloud- noch Tenantzugriff und deutet keinen
negativen oder unbewiesenen n8n-Befund in `PASS` um.

## Entscheidung

### Entscheidungsumfang und aktueller Laufzeitstand

Der nachfolgende Kompositionsvertrag ist für den nächsten getrennten
Implementierungsslice verbindlich. In diesem ADR-0025-Dokumentationsslice wird
er noch nicht operativ umgesetzt.

Bis zur tatsächlichen Implementierung gilt unverändert:

- das lokale Gateway ruft den isolierten SyncAgent-Kern nicht auf;
- es existiert kein lokaler HTTP-Erfolgspfad mit einer normalen SyncResponse;
- jeder lokal akzeptierte Request endet statisch mit HTTP
  `503 upstreamUnavailable`;
- Browser-SyncTransport und lokaler End-to-End-`syncTest` existieren nicht.

Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
`v0.2.2` bleiben unverändert.

### Zieltopologie dieses Schrittes

Die später zu implementierende lokale Komposition lautet:

```text
lokaler HTTP-/Wire-Pfad
→ SyncGateway Request Boundary
→ defensive sechs Felder umfassende SyncRequest-Projektion
→ lokaler SyncAgent
→ defensiv projizierte und erneut validierte normale SyncResponse
→ lokales SyncGateway als alleiniger HTTP-Response-Owner
```

Der gesamte Pfad läuft ausschließlich im bestehenden lokalen Gateway-Prozess
auf GD-WS01. Dieser Schritt führt keinen zweiten Listener, keinen zweiten
Dienst, keine IPC-Grenze, keinen Worker, keine Queue, keinen Netzwerkhop,
keinen Browsertransport und keinen Provideradapter ein.

Das lokale SyncGateway bleibt die autoritative Raw-Wire-, HTTP-, UTF-8- und
Boundary-Grenze. Der lokale SyncAgent bleibt logisch getrennt die
autoritative Policy-, Defense-in-depth-Validierungs-, Routing- und
Responsegrenze. Same-Realm-Komposition ist keine Sandbox und keine
Prozessisolation.

### Produktions-Kompositionsroot und erforderliche Dependency

Der spätere Produktions-Kompositionsroot ist ausschließlich:

```text
server/startLocalSyncGateway.js
```

Dort wird für genau eine HTTP-Server-Factory genau eine lokale
SyncAgent-Instanz über `createSyncAgent()` erzeugt und ausdrücklich als
`syncAgent` an die bestehende HTTP-Server-Factory injiziert.

Für den späteren Implementierungsslice gilt verbindlich:

- `syncAgent` wird eine erforderliche HTTP-Factory-Dependency;
- die HTTP-Factory besitzt keinen versteckten Default-SyncAgent;
- die bestehende Boundary-Factory und ihr aktueller Default werden durch
  ADR 0025 nicht verändert;
- `syncAgent.processSyncRequest` wird bei der Factory-Komposition genau einmal
  sicher aufgelöst;
- eine fehlende, nicht funktionale oder werfend aufgelöste Methode verhindert
  den Serveraufbau, bevor ein Listener entsteht;
- die öffentliche Gateway-API bleibt exakt `{ start, stop }`;
- der SyncAgent erhält keine eigene Start-, Stop-, Listener-, Socket- oder
  Fatal-Lifecycle-API.

Die einmal erfasste Methode wird auf dem späteren Requestpfad mit dem
vorgesehenen `syncAgent`-Receiver aufgerufen; die Methodenproperty wird dort
nicht erneut gelesen.

Die Factorydependency ist vertrauenswürdiger ausführbarer Same-Realm-
Composition-Code. Ihre sichere Auflösung begrenzt beobachtete Fehler und
redigiert sie, kann bereits ausgelöste Accessor-, Proxy- oder andere
Seiteneffekte aber nicht rückgängig machen.

### Exakte Übergabe an den SyncAgent

Ausschließlich ein von der bestehenden Boundary erfolgreich akzeptierter und
defensiv projizierter `syncRequest` darf den SyncAgent erreichen. Übergeben
wird exakt die von der Boundary ausgegebene defensive Requestidentität.

Nicht übergeben werden:

- Raw Bytes oder ein Buffer;
- Raw Body oder decodierter Rohstring;
- das Parsed-JSON-Original;
- HTTP-Header oder Origin;
- Socket-, Request- oder Responseobjekte;
- lokale HTTP-, Boundary- oder Gateway-Fehlerresults;
- frühe Gateway-Fehlerresponses;
- Secrets oder private Modulwerte.

Das Gateway ruft die einmal sicher aufgelöste Methode
`processSyncRequest` synchron, mit exakt einem Argument und pro akzeptiertem
Requestpfad höchstens einmal auf. Es gibt keinen Retry, keinen Fallbackhandler,
keine dynamische Aktion und keine Handlerregistry. Das Gateway verwendet weder
`await` noch `Promise.resolve` und führt keine Promise- oder Thenable-
Assimilation beziehungsweise -Auflösung durch.

Ein echter Promise, ein Result mit zusätzlicher eigener `then`-Property oder
ein anderweitig malformed Result scheitert an der geforderten gewöhnlichen
Vier-Felder-Resultform. Eine geerbte oder nur durch einen Proxy-`get`-Trap
virtuell angebotene `then`-Property wird dagegen
nicht eigens gelesen oder assimiliert und darf den synchronen Kontrollfluss
nicht bestimmen. ADR 0025 behauptet keine portable universelle Proxy- oder
Thenable-Erkennung. Tatsächlich benötigte, werfende oder widersprüchliche
Reflection bleibt fail-closed.

Die belegbare Aufrufaussage bleibt eng: Pro akzeptiertem Requestpfad erfolgt
höchstens ein SyncAgent-Aufruf. ADR 0025 behauptet keine globale
Exactly-once-Zustellung, keine Atomizität, keine Deduplizierung und keine
Parallelitätsgarantie.

### Das Agentenergebnis bleibt unvertrauenswürdig

Auch das Result des lokal komponierten SyncAgents ist an der Gateway-Grenze
unvertrauenswürdige Eingabe. Zulässig ist ausschließlich der exakte
ADR-0024-Erfolgsresult:

```js
{
  ok: true,
  status: "syncResponseCreated",
  syncResponse: "<normale SyncResponse>",
  error: null
}
```

Der äußere Result muss descriptor-basiert bestätigen:

- den gewöhnlichen `Object.prototype`;
- exakt die vier eigenen aufzählbaren Dateneigenschaften `ok`, `status`,
  `syncResponse` und `error`;
- ausschließlich Dateneigenschaften und keine Accessors;
- keine zusätzlichen String- oder Symboleigenschaften;
- die exakten Werte `ok: true`, `status: "syncResponseCreated"` und
  `error: null`;
- eine vorhandene normale `syncResponse`;
- den tatsächlich tief eingefrorenen Zustand des zurückgegebenen Graphen.

Ein lokaler Agentenfehler, Throw, echter Promise, Result mit zusätzlicher
eigener `then`-Property oder anderweitig malformed Result, eine zusätzliche
eigene Eigenschaft, ein falscher Prototyp, ein Accessor, eine bei der
tatsächlich benötigten Reflection beobachtete Inkonsistenz oder eine nicht tief
eingefrorene Rückgabe wird fail-closed behandelt. Weder der Wrapper noch ein
lokaler Errorrecord wird als SyncContract-Response ausgegeben. Auch eine
abstrakt contractgültige normale Fehlerresponse mit `success: false` gehört
nicht zum festen Erfolgsprofil dieses Slices.

### Defensive Projektion der normalen SyncResponse

Das Gateway serialisiert niemals den Agent-Result-Wrapper und niemals
unmittelbar eine Agent-eigene Objektidentität.

Das später für die terminale Responsegrenze zuständige Modul
`server/localSyncGatewayHttpServer.js` erfasst unmittelbar bei erfolgreicher
Modulevaluation private Referenzen und Identitäten. Dazu gehören mindestens:

- `Object.prototype` und `Array.prototype`;
- `Object.getPrototypeOf`, `Object.getOwnPropertyDescriptor` und
  `Object.hasOwn`;
- `Object.freeze` und `Object.isFrozen`;
- `Reflect.ownKeys`;
- `Array.isArray`;
- `JSON.stringify`.

Jede weitere für terminale Projektion, Shape-, Prototype-, Freezeprüfung oder
Vorabserialisierung tatsächlich verwendete Intrinsic wird ebenfalls zu diesem
Zeitpunkt erfasst. Diese terminalen Schritte lösen keine gleichnamige globale
Funktion live auf.

Die spätere Implementierung muss in exakt dieser Reihenfolge:

1. die unveränderte Agent-SyncResponse vollständig gegen denselben von der
   Boundary ausgegebenen Request mit dem kanonischen Contract validieren;
2. ausschließlich nach bestandener Originalprüfung mit den erfassten
   terminalen Referenzen descriptor-basiert einen frischen gewöhnlichen
   Responsegraphen erzeugen;
3. keine fremde verschachtelte Objekt- oder Arrayidentität übernehmen;
4. exakt die zehn normalen Responsefelder `version`, `success`, `requestId`,
   `action`, `handledBy`, `timestamp`, `data`, `error`, `warnings` und `meta`
   projizieren;
5. ausschließlich das feste ADR-0024-Erfolgsprofil akzeptieren:
   - `version: "1.0"`;
   - `success: true`;
   - eine mit dem Boundary-Request korrelierte `requestId`;
   - `action: "syncTest"`;
   - `handledBy: "SyncAgent"`;
   - den unveränderten validierten Agent-Response-`timestamp`;
   - `data: { status: "ok", dataOrigin: "synthetic" }`;
   - `error: null`;
   - `warnings: []`;
   - `meta: { durationMs: 0, processedBy: ["SyncAgent"] }`;
6. die frische Projektion gegen denselben Boundary-Request vollständig
   validieren;
7. den gesamten frischen Responsegraphen mit der erfassten Freeze-Referenz tief
   einfrieren und jeden erforderlichen Freeze-Zustand mit der erfassten
   Frozen-Referenz prüfen;
8. denselben eingefrorenen Graphen final erneut gegen denselben
   Boundary-Request validieren;
9. nach dieser letzten möglicherweise unvertrauenswürdigen Reflection und
   unmittelbar vor der Serialisierung mit ausschließlich den erfassten
   Referenzen terminal bestätigen:
   - jeder gewöhnliche Response-Record besitzt exakt den erfassten
     `Object.prototype`;
   - jedes Response-Array besitzt exakt den erfassten `Array.prototype`;
   - der vollständige Graph besitzt weiterhin ausschließlich die erlaubten
     eigenen Dateneigenschaften und die festgelegten primitiven oder frisch
     erzeugten verschachtelten Werte;
   - der Root sowie jeder verschachtelte Record und jedes Array sind nach der
     erfassten `Object.isFrozen`-Referenz weiterhin tatsächlich eingefroren;
   - die erfasste `Object.getPrototypeOf`-Referenz bestätigt exakt
     `capturedGetPrototypeOf(capturedArrayPrototype) === capturedObjectPrototype`;
   - dieselbe erfasste Referenz bestätigt danach exakt
     `capturedGetPrototypeOf(capturedObjectPrototype) === null`;
   - erst nach beiden bestandenen Identitätsprüfungen besitzt der erfasste
     `Array.prototype` keine eigene `toJSON`-Property, unabhängig davon, ob sie
     eine Datenproperty oder ein Accessor wäre;
   - danach besitzt der erfasste `Object.prototype` ebenfalls keine eigene
     `toJSON`-Property, unabhängig davon, ob sie eine Datenproperty oder ein
     Accessor wäre;
10. ohne einen weiteren absichtlichen Aufruf eines unvertrauenswürdigen Hooks
    ausschließlich die erfasste `JSON.stringify`-Funktion exakt einmal auf den
    final validierten und eingefrorenen Graphen anwenden und ausschließlich
    einen primitiven String als Serialisierung akzeptieren.

Die Bezeichner in den beiden Identitätsprüfungen stehen ausschließlich für die
bei erfolgreicher Modulevaluation privat erfassten Referenzen und Identitäten.
Terminal zulässig ist exakt diese vollständige Kette:

```text
Response-Record → capturedObjectPrototype → null
Response-Array  → capturedArrayPrototype → capturedObjectPrototype → null
```

Eine allgemeinere oder dynamisch erweiterbare Prototypkette wird nicht
akzeptiert.

`data`, `warnings`, `meta` und `meta.processedBy` werden deshalb als frische
gewöhnliche Records beziehungsweise Arrays erzeugt. Es gibt keine Reparatur,
Normalisierung, Defaultbefüllung, Bereinigung vor der maßgeblichen
Originalprüfung, generischen Clone, Merge-Operation oder Übernahme fremder
Exceptiontexte.

Jede Abweichung der beiden Prototypketten-Invarianten wird vor Responsebesitz
erkannt und führt ausschließlich zum bestehenden statischen HTTP
`500 gatewayFailed`. Die erfasste Erfolgsserialisierung wird für diesen Request
nullmal aufgerufen und der kompromittierte Responsegraph nicht serialisiert.
Der bereits bei Modulevaluation als primitiver String materialisierte
Fehlerbody gibt weder fremde Werte, Bodyinhalte, Sentinels noch Exceptiontexte
aus und löst keine zweite Response aus.

Jede terminale Inkonsistenz, ein Throw der erfassten Serialisierung oder ein
Rückgabewert mit `typeof !== "string"` führt vor Responsebesitz statisch zu
HTTP `500 gatewayFailed`. Dieser Fehlerpfad verwendet ausschließlich das
bereits bei Modulevaluation als primitiver String materialisierte bestehende
Gateway-Fehlerprofil; der kompromittierte Responsegraph wird nicht erneut
serialisiert. Weder fremde Werte noch Sentinels gelangen in Body, Result oder
Consoleoutput.

Eine nach erfolgreicher Modulevaluation ersetzte globale `JSON.stringify`-,
Reflection-, Freeze- oder Frozen-Funktion beeinflusst diese terminale Grenze
nicht. Bereits vor Modulevaluation kompromittierte Primordials, veränderter
Modulcode, eine kompromittierte JavaScript-Engine, OOM und Prozessabbruch
bleiben außerhalb der Garantie. Same-Realm-Ausführung und Deep Freeze sind
weiterhin keine Sandbox.

`handledBy`, `processedBy` und `dataOrigin` bleiben reine
Vertragsklassifikationen. Sie sind kein Identitäts-, Herkunfts-, Datenschutz-,
Deployment- oder Provenienznachweis.

### HTTP- und Fehlerzuordnung

Die bestehenden frühen HTTP-, Wire-, Header-, Origin-, Framing-, UTF-8- und
Boundarypfade bleiben unverändert. Für den späteren Implementierungsslice gilt
die folgende vollständige Zuordnung:

| Pfad | Agentaufrufe | Ergebnis |
| --- | ---: | --- |
| frühe HTTP-/Wire-/Header-/Origin-/Framing-/UTF-8-Ablehnung | 0 | bestehendes statisches lokales HTTP-Profil |
| Boundary-Throw, lokaler Boundaryfehler oder malformed Boundaryresult | 0 | bestehendes statisches HTTP `500 gatewayFailed` |
| vollständig validierte frühe Gateway-Fehlerresponse der Boundary | 0 | HTTP `400`, ausschließlich die nackte Gateway-Fehlerresponse |
| akzeptierter Request und exakter gültiger Agentenerfolg | 1 | HTTP `200`, ausschließlich die defensive normale SyncResponse |
| Agent-Throw, Promise beziehungsweise asynchroner oder malformed Agentresult | 1 | statisches HTTP `500 gatewayFailed` |
| `invalidInvocation`, `syncRequestRejected` oder `agentFailed` | 1 | statisches HTTP `500 gatewayFailed` |
| ungültige, unkorrelierte, mutable oder ungeeignete SyncResponse | 1 | statisches HTTP `500 gatewayFailed` |
| Projektions-, terminaler Shape-/Prototype-/Prototypketten-/Freeze-/`toJSON`-, Revalidierungs- oder Vorabserialisierungsfehler | 1 | statisches HTTP `500 gatewayFailed`; der Fehler wird vor Responsebesitz festgestellt |

Eine Agentenablehnung erhält keine neue HTTP-`400`-Zuordnung. Die Boundary hat
den Request bereits akzeptiert; die interne Ursache wird nicht offengelegt.
ADR 0025 führt keine neuen Statusprofile `502`, `503` oder `504` ein.

Nach dem späteren erfolgreichen Implementierungsslice entfällt
`503 upstreamUnavailable` ausschließlich für den vollständig erfolgreichen
komponierten Pfad. In diesem reinen Dokumentationsslice bleibt der statische
`503`-Pfad unverändert aktiv.

### Responsebesitz und Serialisierung

Das lokale SyncGateway bleibt alleiniger Owner von:

- HTTP-Response und Statuscode;
- Responseheadern und CORS;
- Serialisierung;
- Socket und terminalem Cleanup.

Der SyncAgent erhält niemals HTTP-, Response- oder Socketzugriff. Die defensive
SyncResponse muss vollständig geprüft, frisch projiziert, tief eingefroren,
erneut geprüft, durch den terminalen erfassten Verifier einschließlich der
exakten Prototypkette bestätigt und mit der erfassten `JSON.stringify`-Funktion
erfolgreich zu einem primitiven JSON-String serialisiert sein, bevor das
Gateway den Responsebesitz übernimmt.

Nach übernommener Response darf ein Schreib- oder Socketfehler keine zweite
Antwort, keine zweite Statuszeile und keinen zweiten Response-Owner auslösen.
Dann bleibt ausschließlich der bestehende terminale Socket-Cleanup zulässig.

### Verbindliche spätere Serialisierungsregressionen

Der nächste Implementierungsslice muss mutationswirksam und ausdrücklich mit
noch zu implementierenden Tests belegen:

- eine nach Modulimport ersetzte globale `JSON.stringify`-Funktion beeinflusst
  die erfasste Serialisierung nicht;
- eine durch unvertrauenswürdige Reflection installierte eigene
  `Object.prototype.toJSON`-Property führt fail-closed zum statischen
  `500 gatewayFailed` vor Responsebesitz;
- dasselbe gilt für eine installierte eigene `Array.prototype.toJSON`-
  Property;
- ein unvertrauenswürdiger Reflection-/Proxy-Pfad fügt zwischen dem erfassten
  `Array.prototype` und dem erfassten `Object.prototype` ein Objekt mit
  `toJSON` und privatem Test-Sentinel ein; die direkten Response-Prototyp- und
  die Own-`toJSON`-Prüfungen beider erfasster Prototypen würden ohne die neue
  Kettenprüfung weiterhin bestehen;
- die neue Kettenprüfung löst in diesem Mutationsfall vor der erfassten
  Erfolgsserialisierung statisch `500 gatewayFailed` aus; diese Serialisierung
  wird nullmal aufgerufen, und Sentinel, fremder Body sowie fremder
  Exceptiontext erscheinen weder in Response, Result noch Consoleoutput; eine
  zweite Response entsteht nicht;
- eine Kontrollprobe bestätigt weiterhin exakt
  `Response-Array → capturedArrayPrototype`,
  `capturedArrayPrototype → capturedObjectPrototype` und
  `capturedObjectPrototype → null` sowie genau einen Aufruf der erfassten
  Erfolgsserialisierung;
- alle globalen Instrumentierungen laufen mit `concurrency: false` und werden
  im `finally` einschließlich der ursprünglichen Prototypkette, globalen
  Funktionen und Descriptoren vollständig wiederhergestellt.

Dieser Korrekturslice implementiert weder diese Regressionstests noch die
beschriebene Komposition.

### Lifecycle und Instanzgrenze

Die spätere Komposition verwendet genau eine SyncAgent-Instanz pro
HTTP-Server-Factory. Das ist keine Behauptung eines globalen Singletons über
mehrere Factoryinstanzen oder Prozesse.

Der SyncAgent besitzt keinen Lifecycle außerhalb des bestehenden
Server-Lifecycles und führt keine Persistenz, Hintergrundtasks, Timer, Retries,
Caches oder Queues ein. Ein requestbezogener Agentenfehler ist kein fataler
Serverfehler und ruft `onFatal` nicht auf. Die bestehenden irreversiblen
Server-Fatal-, Listener-, Socket- und Cleanupregeln bleiben unverändert.

## Phase-0-Nachweis / EU-Tor A

Dieser Registereintrag ist ausschließlich auf den durch ADR 0025 entschiedenen
Dokumentations- und späteren lokalen Kompositionsslice begrenzt:

| Bereich | Entscheidung für diesen Slice |
| --- | --- |
| Scope | `v0.3.0`, ausschließlich lokale Gateway-/SyncAgent-Komposition für den leeren synthetischen `syncTest`; Referenzstand `45dc7b9…`; noch keine Codekomposition |
| Zweck | technischer lokaler Contract-, Korrelations- und Handoff-Nachweis |
| Ausgeschlossene Zwecke | keine bestimmungsgemäße Verarbeitung oder Übertragung privater Inhalte, Inhaltsgenerierung, Empfehlung, Klassifikation, Prognose, Scoring, Profiling, Entscheidung, Toolausführung, Persistenz, Fachagentenwahl oder externe Verarbeitung |
| KI-System-Arbeitshypothese | kein Modell und keine modell-, lern- oder statistikbasierte Inferenz; kein Training, Lernen oder Adaptieren; ausschließlich fest programmierte Validierungs-, Projektions-, Korrelations- und Mappingregeln; bei demselben stabilen Request und demselben Clockwert deterministischer Output; vorläufige enge Nicht-KI-Arbeitshypothese für diesen konkreten Slice |
| Inventar | Modell, Anbieter, Modellversion, Workflow und Credential jeweils `keines` |
| Systemgrenze | bestehender lokaler Loopback-Gateway-Prozess; ausschließlich defensive Sechs-Felder-Projektion zum Agenten |
| Wesentliche technische Abhängigkeiten | direkte spätere lokale Laufzeitbasis: Node.js, SyncContract Foundation aus ADR 0016, SyncGateway Request Boundary aus ADR 0018, lokale Raw-Wire-/HTTP-Foundation aus ADR 0020 und isolierter SyncAgent-Kern aus ADR 0024 auf der lockfilegebundenen Repository-Dependency-Baseline am Referenzcommit `45dc7b9bb101b2dba445679a3237fb510ca6f33c`; der transportneutrale SyncService aus ADR 0017 bleibt die bestehende, noch nicht browserseitig komponierte Servicegrenze und ist keine direkte Runtime-Dependency dieser Gateway-/Agenten-Komposition; keine externe Runtime-, Modell-, Workflow- oder Providerdependency |
| Daten | bestimmungsgemäß exakt leeres Inhalts-Payload; kein Zugriff auf PromptVault, LearningHub, LichtwaldLog oder GoldenDawn-Vault; keine bestimmungsgemäße Verarbeitung oder Übertragung privater Inhalte; `source`, `requestId` und `timestamp` bleiben technische Metadaten, deren semantische Nicht-Privatheit der Contract nicht beweist |
| Transparenz | keine direkte KI-Interaktion und kein generativer Medieninhalt; für diesen Slice keine konkrete Artikel-50-Pflicht identifiziert |
| Artikel 5 / Anhang III | im eng festgelegten Zweck keine verbotene oder hochriskante Verwendung identifiziert |
| Menschliche Kontrolle | lokaler Prozess bewusst start- und stoppbar; keine autonome oder folgenreiche Aktion |
| Betriebs- und Freigabeverantwortung | Jan ist Projektowner und erteilt die ausdrückliche Freigabe für die spätere Implementierung sowie jeden bewussten lokalen Start und Betrieb; weder ein angenommener ADR noch ein Repository- oder Modulimport noch ein Codex-Lauf dieses Dokumentationsslices startet den Gateway-Prozess; der Prozess bleibt ausdrücklich start- und stoppbar; Nutzung durch andere, Hosting oder externer Betrieb sind nicht freigegeben; jede Erweiterung über diesen lokalen synthetischen Zweck löst die festgelegte Neubewertung aus |
| Fehler-/Nachweisgrenze | statische Redaction, keine Logs oder Telemetrie; kein Compliance-Siegel |
| Neubewertungstrigger | Browsertransport, menschliche Interaktion, Modell, Provider, Workflow, neue Aktion, nichtleeres oder privates Payload, Tool, Nebenwirkung, Logging, Persistenz, Telemetrie, Hosting, Nutzung durch andere oder Zweckänderung |

Die Datenzeile beschreibt ausschließlich die bestimmungsgemäße
Datenminimierungsgrenze. Formal gültige Metadaten können private Bedeutung
codieren; geschlossener Contract und leeres Inhalts-Payload beweisen weder
semantische Nicht-Privatheit noch Datenschutz.

Diese Arbeitshypothese ist keine Rechtsberatung. Sie klassifiziert weder
GoldenDawn OS insgesamt noch spätere Agenten oder Provider. Die Bezeichnung
`Agent` und Determinismus entscheiden die KI-System-Eigenschaft nicht allein.
Auch `dataOrigin: "synthetic"` ist kein gesetzlicher Herkunfts- oder
Transparenznachweis.

Vor dem Browsertransport und vor jedem Modell- oder Providerfluss erfolgt eine
neue Tor-A-Prüfung. Phase 1 bis Phase 3 bleiben offen. Der Registereintrag ist
kein Compliance-, Konformitäts-, Sicherheits- oder Rechtsnachweis.

## Nicht Bestandteil dieses Slices

ADR 0025 implementiert oder bereitet insbesondere nicht vor:

- Gateway-/SyncAgent-Codekomposition;
- Änderungen an Factorysignaturen oder am aktuellen `503`-Pfad;
- Browser-SyncTransport, UI- oder `src/main.js`-Komposition;
- einen Browser-End-to-End-Fluss;
- einen zweiten Dienst oder Listener sowie IPC, Worker, Queue oder einen
  Netzwerkhop;
- OpenAI, ein lokales Modell oder n8n;
- Webhook, Workflow, Credential oder Secret;
- einen Providerport, eine Adaptersignatur oder ein Adapterinterface;
- bestimmungsgemäße Verarbeitung oder Übertragung privater Inhalte sowie
  Zugriff auf PromptVault, LearningHub, LichtwaldLog oder GoldenDawn-Vault;
- eine neue Aktion oder ein nicht leeres Payload;
- Authentisierung, Autorisierung oder Calleridentität;
- Replay-, Idempotenz- oder Deduplizierungslogik;
- Rate-, Parallelitäts-, Queue-, Timeout- oder zusätzliche Ressourcenlimits;
- Persistenz, Logs, Monitoring oder Telemetrie;
- Toolausführung oder fachliche Nebenwirkungen;
- Paket-, Contract-, Schema- oder Evidence-Änderungen;
- eine neue Compliance- oder Sicherheitsbehauptung außerhalb des engen
  Phase-0-Registers.

Es werden keine Runtime-, Produkt-, Cloud-, Tenant-, Provider- oder
Credentialoperationen ausgeführt. Der n8n-Bundle-, Manifest-, Generator- und
Evidence-Bestand bleibt unverändert.

## Konsequenzen

Positive Auswirkungen:

- Der nächste Implementierungsslice besitzt eine eindeutige, lokal begrenzte
  Kompositionsstelle und keine versteckte Agenteninstanz.
- Raw-/HTTP-Material endet sicher vor der Agentengrenze; nur die defensive
  Boundary-Identität wird höchstens einmal übergeben.
- Ein scheinbar lokaler oder eingefrorener Agentenresult wird nicht
  voraussetzungslos vertraut.
- Die normale Response wird vor HTTP-Besitz vollständig korreliert,
  disjunkt projiziert, eingefroren, revalidiert und serialisiert.
- Frühe Gatewayablehnungen, Agentenfehler und normale SyncResponses behalten
  getrennte Semantik und statische Redaction.
- Der lokale HTTP-Response- und Socketbesitz bleibt an einer einzigen
  bestehenden Grenze.

Kosten und Einschränkungen:

- Die spätere Implementierung benötigt zusätzliche descriptorbasierte
  Verifikation, defensive Projektion und mutationswirksame Tests im
  HTTP-Serverpfad.
- Same-Realm-Komposition kann ausführbare Dependency- oder Proxyseiteneffekte
  nicht verhindern und ist keine Sandbox.
- „höchstens ein Aufruf pro akzeptiertem Pfad“ ist keine Exactly-once-,
  Parallelitäts-, Replay- oder Idempotenzgarantie.
- Der angenommene ADR allein schafft keinen operativen Erfolgspfad; bis zum
  nächsten Implementierungsslice bleibt HTTP `503` der tatsächliche Stand.

## Erwogene Alternativen

### SyncAgent direkt in der HTTP-Factory als versteckten Default erzeugen

Verworfen. Das würde die Composition- und Testgrenze verbergen, den
Prozesseinstieg als autoritativen Root umgehen und fehlende Dependencies nicht
vor dem Listener fail-closed sichtbar machen.

### Den Parsed-JSON-Wert oder Raw-Material an den Agenten übergeben

Verworfen. Nur die von der Boundary validierte defensive Sechs-Felder-
Projektion darf Zone C erreichen. Raw- und HTTP-Material bleibt ausschließlich
an der Gateway-Grenze.

### Den Agent-Result-Wrapper oder seine SyncResponse unmittelbar serialisieren

Verworfen. Auch lokaler Same-Realm-Output bleibt unvertrauenswürdig und darf
weder mit fremder Identität noch ohne erneute Korrelation und defensive
Projektion die HTTP-Grenze passieren.

### Agentenablehnungen als HTTP `400` oder neue Upstreamstatus abbilden

Verworfen. Der Request war an der Boundary bereits akzeptiert. Alle lokalen
Agenten-, Result- und Responseinkonsistenzen bleiben statisch redigierte
`500 gatewayFailed`-Pfade; neue `502`-, `503`- oder `504`-Profile sind nicht
erforderlich.

### SyncAgent als zweiten Dienst, Worker oder asynchronen Hop betreiben

Verworfen. Der vorhandene synchrone Kern benötigt für `syncTest` weder einen
zweiten Listener noch IPC, Queue oder Worker. Das Gateway benötigt weder
`await` noch `Promise.resolve` oder einen Promise-/Thenable-Assimilationspfad.

### Entscheidung und Codekomposition in demselben Slice umsetzen

Verworfen. ADR 0024 verlangt vor der ersten operativen Komposition ein neues
Entscheidungsgate. Der reine Dokumentationsslice hält Architekturreview und
spätere mutationswirksame Implementierung getrennt.

### Den engen Phase-0-Befund als Gesamtklassifikation verwenden

Verworfen. Der Befund gilt nur für den leeren, modellfreien und lokalen
`syncTest` dieses Slices, dessen Output bei demselben stabilen Request und
demselben Clockwert deterministisch ist. Er ist weder Rechtsberatung noch eine
Klassifikation des Gesamtprojekts oder späterer Modell-/Providerpfade.

## Bedingungen für eine Neubewertung

Diese Entscheidung wird überprüft, wenn die spätere Implementierung von der
festgelegten Kompositionsstelle, synchronen Einargumentübergabe, exakten
Responseprojektion, HTTP-Matrix, Response-Owner- oder Lifecyclegrenze
abweichen soll.

Eine neue Architektur-, Contract-, Sicherheits-, Datenschutz- und Tor-A-
Prüfung ist vor Browsertransport, menschlicher Interaktion, Modell, Provider,
Workflow, neuer Aktion, nicht leerem oder privatem Payload, Fachagentenrouting,
Tool, Nebenwirkung, Logging, Persistenz, Telemetrie, Hosting, Nutzung durch
andere oder einer Zweckänderung erforderlich. Dasselbe gilt vor einem zweiten
Prozess, Listener, Dienst, IPC-, Worker- oder Queuepfad.

Rate-, Parallelitäts-, Zeit- und Ressourcenbegrenzungen bleiben der nach dem
lokalen End-to-End-Pfad vorgesehene eigene Slice. Provider bleiben bis zu
gesonderten Entscheidungen gesperrt.

## Verwandte Dokumente

- [ADR 0016: Transportneutraler SyncContract-Kern](0016-transport-neutral-sync-contract-foundation.md)
- [ADR 0017: Transportneutrale SyncService Foundation](0017-transport-neutral-sync-service-foundation.md)
- [ADR 0018: Transportneutrale SyncGateway Request Boundary](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
- [ADR 0020: Lokale SyncGateway Raw-Wire- und HTTP-Foundation](0020-local-sync-gateway-raw-wire-http-foundation.md)
- [ADR 0021: Generated n8n Boundary Bundle Foundation](0021-generated-n8n-boundary-bundle-foundation.md)
- [ADR 0022: n8n Cloud Ingress & Runtime Evidence Gate](0022-n8n-cloud-ingress-runtime-evidence-gate.md)
- [ADR 0023: Lokaler SyncAgent vor optionalen externen Providern](0023-local-syncagent-before-optional-external-providers.md)
- [ADR 0024: Local Model-free SyncAgent Core Foundation](0024-local-model-free-syncagent-core-foundation.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
