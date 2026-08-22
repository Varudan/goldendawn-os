# ADR 0024: Local Model-free SyncAgent Core Foundation

## Status

Angenommen – 2026-08-22

## Kontext

[ADR 0023](0023-local-syncagent-before-optional-external-providers.md)
entscheidet den lokalen `SyncAgent` als verbindliche Policy-, Validierungs-,
Routing- und Responsegrenze des Agentensystems vor jedem optionalen externen
oder lokalen Provider. Der erste Implementierungsschritt muss ausschließlich
den bestehenden leeren `syncTest` vollständig lokal, modellfrei und ohne
fachliche Nebenwirkungen beantworten.

Die transportneutrale
[SyncContract Foundation](0016-transport-neutral-sync-contract-foundation.md)
definiert dafür bereits den geschlossenen Sechs-Felder-Request und die normale
korrelierte Zehn-Felder-SyncResponse. Die
[SyncGateway Request Boundary](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
erzeugt aus einem gültigen materialisierten Raw Body eine defensive
Requestprojektion. Das nach
[ADR 0020](0020-local-sync-gateway-raw-wire-http-foundation.md) separat
startbare lokale HTTP-Gateway ist jedoch weiterhin nicht mit einem
`SyncAgent` komponiert und beantwortet jeden lokal akzeptierten Request
statisch mit HTTP `503`.

Auch eine aus Zone B kommende Projektion bleibt an der Agentengrenze eine neu
zu prüfende Eingabe. Same-Realm-Reflection, Proxies, veränderliche Records und
manipulierte Laufzeit-Intrinsics können zwischen mehreren Beobachtungen
abweichende Sichten erzeugen, werfen oder Seiteneffekte auslösen. Der
Agentenkern benötigt deshalb eine eigene defensive Projektion, wiederholte
Contractvalidierung und eine klar getrennte lokale Fehlersemantik. Er ist
dennoch keine Sandbox und kann bereits ausgelöste Same-Realm-Seiteneffekte
nicht rückgängig machen.

ADR 0024 ergänzt ADR 0023 um diesen ersten Implementierungsslice. Es ersetzt
keinen früheren ADR und autorisiert weder die Gateway-/Agenten-Komposition noch
einen Browsertransport oder Provideradapter.

## Entscheidung

`src/agents/syncAgent.js` exportiert ausschließlich:

```js
createSyncAgent({
  getCurrentTimestamp = defaultUtcClock,
} = {})
```

Die Factory liefert eine eingefrorene gewöhnliche API mit exakt der eigenen
Methode `processSyncRequest`. Der Modulimport startet nichts. Die Factory ruft
die aufgelöste Clockfunktion nicht auf und startet selbst kein I/O, keinen
Timer, Listener oder Providerpfad. Ihre Parameterdestrukturierung löst jedoch
die vertrauenswürdige Composition-Property `getCurrentTimestamp` auf. Ein
Accessor oder Proxy im übergebenen Composition-Container kann deshalb während
der Factory-Erzeugung ausgeführt werden oder werfen; dieser Vorgang liegt
außerhalb des Methoden-Resultvertrags. Erst ein Aufruf von
`processSyncRequest` mit exakt einem Argument ruft die aufgelöste Clockfunktion
genau einmal auf.

Unmittelbar nach den Imports erfasst das Modul bei erfolgreicher Evaluation
private Referenzen auf `Object.freeze`, `Object.isFrozen`,
`Object.getPrototypeOf`, `Object.getOwnPropertyDescriptor`, `Object.hasOwn` und
`Reflect.ownKeys` sowie die gewöhnliche `Object.prototype`-Identität. Diese
Referenzen gelten in diesem Foundation-Slice als vertrauenswürdige Primordials.
Die Reflection-Referenzen verwendet ausschließlich der terminale Verifier für
Factory-API, Errorrecords sowie Failure- und Success-Results; die Freeze-
Referenz friert diese Records ein und die Frozen-Referenz prüft sämtliche
tatsächlichen Freeze-Zustände. Der terminale Verifier verwendet keine live
aufgelösten `Object.*`-/`Reflect.*`-Methoden, Array-Prototypmethoden oder
Iteratoren.

### Synchroner Aufruf- und Resultvertrag

`processSyncRequest(syncRequest)` arbeitet vollständig synchron, besitzt exakt
einen formalen Parameter und erwartet exakt ein Argument. Fehlende oder
zusätzliche Argumente werden vor Clockzugriff, Requestvalidierung und jeder
Argumentinspektion als `invalidInvocation` abgelehnt. Argumentwerte werden in
diesem Pfad weder gelesen noch konvertiert; Getter, Proxy-Traps und
Konvertierungsmethoden werden nicht gezielt ausgelöst.

Jeder beherrschte Aufruf liefert ein tief eingefrorenes gewöhnliches Objekt mit
exakt vier eigenen aufzählbaren Dateneigenschaften:

```js
{
  ok,
  status,
  syncResponse,
  error
}
```

Der erfolgreiche Pfad verwendet ausschließlich:

```js
{
  ok: true,
  status: "syncResponseCreated",
  syncResponse: "<gültige korrelierte tief eingefrorene SyncResponse>",
  error: null
}
```

Lokale Fehler setzen `ok: false` und `syncResponse: null`. Sie enthalten einen
frischen, eingefrorenen Error mit exakt `code` und `message`:

| Status | Code | Exakte Meldung |
| --- | --- | --- |
| `invalidInvocation` | `invalidSyncAgentInvocation` | `Der lokale SyncAgent erwartet genau einen SyncRequest.` |
| `syncRequestRejected` | `syncAgentRequestRejected` | `Die Sync-Anfrage wurde vom lokalen SyncAgent abgelehnt.` |
| `agentFailed` | `syncAgentFailed` | `Die Sync-Anfrage konnte vom lokalen SyncAgent nicht sicher verarbeitet werden.` |

Lokale Agentenfehler sind keine SyncResponses. Sie besitzen keine
Contractfehlerprofile, Ursachen, Details, Stacks, Validatorfehlerlisten oder
fremden Exceptionmeldungen. Insbesondere werden reguläre Ablehnungen und
interne Inkonsistenzen nicht in normale `VALIDATION_ERROR`-,
`SERVICE_UNAVAILABLE`- oder `INTERNAL_ERROR`-SyncResponses umgeschrieben.

Results und Errorrecords sind pro Aufruf frisch. Auch mehrere gleichartige
Aufrufe teilen keine ausgabeseitigen veränderlichen Objekt- oder
Arrayidentitäten.

Vor der Ausgabe bestätigt der eingefrorene Success-Result descriptor-basiert
einen gewöhnlichen Objektprototyp, exakt die vier eigenen aufzählbaren
Dateneigenschaften `ok`, `status`, `syncResponse` und `error`, keine Zusatz-,
Symbol- oder Accessorfelder, `ok: true`, den Status
`"syncResponseCreated"`, die exakte Identität der final validierten und
eingefrorenen Response, `error: null` und den mit der erfassten Frozen-Referenz
bestätigten Freeze-Zustand. Eine korrumpierte oder unvollständige
Erfolgsrückgabe verlässt die Agentengrenze nicht.

Jeder lokale Errorrecord bestätigt entsprechend den gewöhnlichen
Objektprototyp, exakt die eigenen aufzählbaren Dateneigenschaften `code` und
`message`, ausschließlich die statischen Werte des ausgewählten Fehlerprofils,
keine Zusatz-, Symbol-, Accessor-, Stack-, Cause- oder Rohfehlerfelder und den
bestätigten Freeze-Zustand. Der zugehörige Failure-Result bestätigt den
gewöhnlichen Prototyp, exakt `ok`, `status`, `syncResponse` und `error`,
`ok: false`, den exakten Status des Profils, `syncResponse: null`, die Identität
des zuvor geprüften frischen Errorrecords und seinen eigenen Freeze-Zustand.
Eine nach erfolgreichem Import ersetzte globale terminale Reflection-,
`Object.freeze`- oder `Object.isFrozen`-Funktion kann deshalb keine mutable oder
korrumpierte terminale API, keinen Errorrecord und keinen Result erzeugen. Auch
die falsche Arity liefert weiterhin das exakte tief eingefrorene
`invalidInvocation`, ohne Input- oder Clockinspektion.

### Clock und Referenzzeit

Bei exakt einem Argument wird `getCurrentTimestamp` genau einmal aufgerufen.
Der Rückgabewert muss ein primitiver String sein. Boxed Strings, Objekte,
Promises, Thenables, Functions, Symbole und andere Werte werden weder
konvertiert noch asynchron aufgelöst. Eine nicht funktionale oder werfende
Dependency und jeder nicht primitive Stringwert führen statisch redigiert zu
`agentFailed`.

Der einmal erfasste Wert wird unverändert als Referenzzeit sämtlicher
Requestvalidierungen und als `timestamp` der erzeugten SyncResponse verwendet.
Die Clock wird nicht erneut zur Dauerberechnung oder für einen späteren
Buildschritt ausgewertet.

Der unveränderte Eingangsrequest wird zuerst mit
`validateSyncRequest(syncRequest, capturedTimestamp)` geprüft. Liefert der
Validator wegen eines nicht inspizierbaren Rootwerts eine reguläre Ablehnung,
ohne die Referenzzeit geprüft zu haben, wird der erfasste primitive Clockwert
vor der Fehlerklassifikation zusätzlich mit derselben kanonischen UTC-Semantik
des bestehenden Contracts geprüft. Eine nichtkanonische
Referenzzeit oder ein beobachteter `invalidReferenceTimestamp` besitzt deshalb
immer `agentFailed`-Vorrang, auch wenn gleichzeitig reguläre Requestfehler
vorliegen.

Der Standard-Clockpfad verwendet ausschließlich einen aktuellen kanonischen
UTC-Zeitstempel aus `new Date().toISOString()`. Es gibt keinen Timestamp-
Fallback, keine Normalisierung und keine Reparatur eines ungeeigneten Werts.
Die injizierte Clock bleibt vertrauenswürdige ausführbare
Composition-Dependency; die syntaktische Zeitprüfung ist weder Herkunfts- noch
Replaynachweis.

### Fail-closed Requestverarbeitung

Die verbindliche Reihenfolge lautet:

```text
exakte Argumentanzahl prüfen
→ Clock exakt einmal als primitiven String erfassen
→ unveränderten Eingangsrequest mit der erfassten Referenzzeit validieren
→ Referenzzeitintegrität und Validatorresultat defensiv prüfen
→ defensive Sechs-Felder-Projektion erzeugen
→ Projektion mit derselben Referenzzeit validieren
→ Projektion tief einfrieren und Freeze-Ergebnis prüfen
→ gefrorene Projektion mit derselben Referenzzeit erneut validieren
→ feste lokale Aktions-Allowlist anwenden
→ normale korrelierte Erfolgsresponse erzeugen
→ Response gegen den gefrorenen Request validieren
→ Response tief einfrieren und Freeze-Ergebnis prüfen
→ gefrorene Response gegen denselben Request final erneut validieren
```

Validatorresultate werden nicht über unkontrollierte Accessorzugriffe als
vertrauenswürdig übernommen. Resultrecord, Fehlerarray und relevante
Fehlerrecords werden descriptor-basiert auf erwartete eigene aufzählbare
Dateneigenschaften, geeignete Prototypen, exakte Arraypositionen und eine
konsistente Kombination aus `ok` und Fehleranzahl geprüft. Unerwartete
Zusatz- oder Symbolfelder, Accessors, Reflection-Traps und inkonsistente
Validatorresultate führen zu `agentFailed`.

Besteht der stabile unveränderte Eingangsrequest den Contract nicht und liegt
kein Clock- oder interner Verarbeitungsfehler vor, endet der Aufruf mit
`syncRequestRejected`. Eine gewöhnliche Contractablehnung behauptet keine
Verarbeitung und erzeugt keine Teilresponse.

Erst nach erfolgreicher ursprünglicher Validierung entsteht descriptor-basiert
ein neuer gewöhnlicher Record mit exakt `version`, `action`, `source`,
`requestId`, `timestamp` und `payload`. Die fünf skalaren Werte werden aus
eigenen aufzählbaren Datendeskriptoren übernommen; `payload` ist immer ein
frisches exakt leeres gewöhnliches Objekt. Die Eingabe und ihr Payload werden
weder verändert noch eingefroren, normalisiert, persistiert oder direkt
zurückgegeben.

Es gibt keinen Spread, kein `Object.assign`, keinen Stringify-/Parse-
Roundtrip, keinen generischen Deep Clone, kein Merge und keine Bereinigung vor
der maßgeblichen ursprünglichen Validierung. Eigene Accessors, zusätzliche
String- oder Symbolfelder und ungeeignete Prototypen werden nicht als Werte
übernommen.

Die Projektion wird vor dem Freeze vollständig validiert. Die internen Request-
Prüfungen lösen ihre Reflection weiterhin live auf. Danach werden zuerst der
frische Payload und anschließend der Requestroot eingefroren; auch
`Object.freeze` bleibt für diese internen Freezes live aufgelöst. Der
tatsächliche Freeze-Zustand beider Records wird aber mit der beim Import
erfassten vertrauenswürdigen `Object.isFrozen`-Referenz geprüft, bevor der
identische finale Snapshot mit derselben Referenzzeit erneut validiert wird.
Scheitert nach einer ursprünglich erfolgreichen Validierung die Projektion,
eine Folgevalidierung oder ein interner Reflection-/Freeze-Pfad durch Throw,
No-op, Mutation oder eine andere beobachtete Inkonsistenz, endet der Aufruf
statisch redigiert mit `agentFailed`, nicht mit `syncRequestRejected`.

### Feste lokale Policy und ausschließlich `syncTest`

Die private Aktions-Allowlist des ersten Agentenkerns enthält ausschließlich
`syncTest`. Es gibt keinen generischen `execute`, `handle`, Tool-, Prompt-,
Workflow-, Modell-, Provider-, Endpoint-, Umgebungs- oder frei wählbaren
Routingpfad. Auch eine künftig contractseitig ergänzte Aktion wäre nicht
automatisch durch diesen Agentenslice autorisiert.

Die autorisierenden Agentenwerte sind private feste Policywerte:

```js
const SYNC_TEST_ACTION = 'syncTest'
const SYNC_AGENT_HANDLER = 'SyncAgent'
const SYNTHETIC_DATA_ORIGIN = 'synthetic'
```

Auch die private Allowlist bleibt fest `Object.freeze(['syncTest'])`. Aktion,
Handler und Datenherkunft werden nicht positionsabhängig aus Contractarrays
abgeleitet. Eine spätere Erweiterung oder Umordnung der Contractlisten
autorisiert den Agenten daher weder für eine neue Aktion noch für einen anderen
Handler oder eine andere Datenherkunft. Die Contractvalidator bleiben die
kanonische Kompatibilitätsprüfung.

Der stabile gefrorene Snapshot ist die einzige Grundlage für Policy,
Korrelation und Response-Build. Browser- oder Requestwerte wählen weder einen
Fachagenten noch einen Provider. Der aktuelle `syncTest` ruft weder
`DataAgent` noch `TestAgent`, `ModelProvider`, `WorkflowProvider`, OpenAI, ein
lokales Modell, n8n oder einen sonstigen Adapter auf.

### Lokale normale Erfolgsresponse

Für den erlaubten `syncTest` erzeugt der Agentenkern pro Aufruf eine neue
gewöhnliche Response mit exakt:

```js
{
  version: "1.0",
  success: true,
  requestId: "<requestId des defensiven Request-Snapshots>",
  action: "syncTest",
  handledBy: "SyncAgent",
  timestamp: "<einmal erfasster Clockwert>",
  data: {
    status: "ok",
    dataOrigin: "synthetic"
  },
  error: null,
  warnings: [],
  meta: {
    durationMs: 0,
    processedBy: ["SyncAgent"]
  }
}
```

`dataOrigin: "synthetic"` bleibt ausschließlich eine
Contractklassifikation. Der Wert beweist weder Datenherkunft noch Datenschutz,
Nichtweitergabe oder eine bestimmte Laufzeitumgebung.

`durationMs: 0` ist ein statischer, nicht gemessener Foundation-Wert. Er ist
keine Aussage über reale Ausführungszeit, Performance, Telemetrie oder eine
monotone Clock. Dieser Slice liest weder `Date.now` noch eine zweite Clock und
führt keine Zeitmessung ein.

Die neue Response wird zuerst mit
`validateSyncResponse(syncResponse, frozenSyncRequest)` vollständig validiert
und dadurch mit Version, Aktion und `requestId` des defensiven Requests
korreliert. Die internen Responseprüfungen lösen ihre Reflection weiterhin live
auf. Danach werden `data`, `warnings`, `meta.processedBy`, `meta` und der
Response-Root über das ebenfalls live aufgelöste `Object.freeze` tief
eingefroren und mit der beim Import erfassten `Object.isFrozen`-Referenz auf
ihren tatsächlichen Freeze-Zustand geprüft. Der identische gefrorene Snapshot
muss anschließend dieselbe Responsevalidierung erneut bestehen. Erst dann wird
er in einem über die erfasste Freeze-Referenz eingefrorenen und ausschließlich
mit der erfassten terminalen Reflection descriptor-geprüften erfolgreichen
Agent-Result ausgegeben.

Response, Datenrecord, Arrays, Meta und Result sind für jeden Aufruf frisch und
teilen keine veränderlichen Identitäten mit dem Eingangsrequest oder anderen
Aufrufen. Jeder Builder-, Korrelations-, Validator-, Reflection-, Projektions-,
Freeze- oder Revalidierungsfehler wird statisch zu `agentFailed` redigiert; keine
unvollständige Response verlässt die Agentengrenze.

### Importinaktivität und Same-Realm-Grenze

Der Agentenkern besitzt außer der optional injizierten Clock keine
Composition-Dependency. Der Modulimport startet keine Verarbeitung. Bei der
Factory-Erzeugung löst die Parameterdestrukturierung die vertrauenswürdige
Composition-Property `getCurrentTimestamp` auf; ein Accessor oder Proxy kann
dabei ausgeführt werden oder werfen, und dieser Vorgang liegt außerhalb des
Methoden-Resultvertrags. Die Factory ruft die aufgelöste Clockfunktion nicht
auf und startet selbst weder Netzwerk, Dateisystem, Storage, private Module,
Umgebungsvariablen, Secrets, Console, Timer noch einen Providerpfad. Erst ein
Aufruf von `processSyncRequest` mit exakt einem Argument ruft die aufgelöste
Clockfunktion genau einmal auf.

Die Clock und manipulierte Same-Realm-Intrinsics bleiben ausführbarer,
vertrauenswürdiger Composition-Code. Reflection auf Proxies kann Traps
ausführen; die ECMAScript-Normalisierung eines von einem Proxy-Trap gelieferten
Property-Descriptors kann selbst Descriptor-Getter beobachten. Innerhalb von
`processSyncRequest` fängt der Agentenkern die von den beschriebenen
beherrschten Dependency-, Reflection-, Projektions-, Freeze- und
Validierungspfaden beobachteten Exceptions redigiert ab. Die Factory-Property-
Auflösung bleibt ausdrücklich außerhalb des Methoden-Resultvertrags. Bereits
ausgelöste Same-Realm-Seiteneffekte kann der Kern nicht verhindern oder
rückgängig machen.

Eine portable universelle Proxy- oder ABA-Erkennung wird nicht behauptet.
Insbesondere kann eine endliche Folge von Reflection-Schritten nicht jede
semantisch weiterhin gültige wechselnde Proxy-Sicht beweisen. Beobachtete
Widersprüche zwischen ursprünglicher Validierung, Projektion, Freeze und
Revalidierung führen fail-closed zu `agentFailed`. Für stabile gewöhnliche
Werte arbeitet der Kern ohne Inputmutation und erzeugt ausschließlich neue
eingefrorene Snapshots.

Nicht garantiert werden bereits vor der Modulevaluation kompromittierte
Primordials, veränderter Modulcode oder lexikalische Bindungen, eine
kompromittierte JavaScript-Engine, OOM oder Prozessabbruch sowie beliebig
koordinierte Manipulation sämtlicher Reflection-Intrinsics. Same-Realm-
Ausführung und Deep Freeze sind keine Sandbox und keine technische
Same-Realm-Isolation.

### Keine Komposition und unveränderter HTTP-`503`-Pfad

Dieser Slice exportiert nur den logisch getrennten Agentenkern. Er wird weder
in `src/main.js` noch in den lokalen HTTP-Server oder die bestehende
SyncGateway Request Boundary komponiert. Es entsteht kein zweiter Listener,
kein IPC-Hop und kein zusätzlicher Dienst.

Es existieren keine funktionale SyncAgent-UI, keine AgentHub- oder
AutomationHub-Integration und keine SyncAgent-Komposition in `src/main.js`.
Die dort vorhandene reine Projektstatus-Copy ist keine funktionale Integration
und macht den Kern weder über den Browser noch über das Gateway erreichbar.

Bis zu einem gesonderten kontrollierten Kompositionsslice endet jeder vom
lokalen HTTP-Gateway akzeptierte Request weiterhin mit dessen statischem HTTP-
Status `503`. Das Gateway ruft den neuen Agentenkern noch nicht auf und liefert
keine normale Erfolgsresponse aus. Ebenso existieren noch kein konkreter
browserseitiger `SyncTransport` und kein lokaler End-to-End-`syncTest`.

## Konsequenzen

- Der erste implementierte Agentenkern ist vollständig lokal, modellfrei,
  providerfrei und auf den leeren synthetischen `syncTest` begrenzt.
- Zone C besitzt nun eine eigene defense-in-depth Request-, Policy-,
  Korrelations- und Responsegrenze, bleibt aber logisch und operativ von Zone B
  getrennt.
- Reguläre Requestablehnungen, interne Agentenfehler und gültige normale
  SyncResponses behalten unterschiedliche Semantik.
- Die mehrfache Validierung und defensive Projektion machen beobachtete
  Laufzeitinkonsistenzen fail-closed, beseitigen aber keine allgemeinen
  Same-Realm-, Proxy- oder Ressourcenrisiken.
- Für denselben stabilen Request und denselben injizierten Clockwert ist der
  Handler deterministisch und besitzt keine fachlichen Nebenwirkungen.
- PromptVault, LearningHub, LichtwaldLog und GoldenDawn-Vault werden weder
  gelesen noch exportiert. Es entstehen keine Persistenz, Logs, Telemetrie,
  Tools oder externen Requests.
- Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
  `v0.2.2` bleiben unverändert; `v0.3.0` bleibt unveröffentlicht und in Arbeit.
- Das lokale Gateway bleibt bis zur späteren Komposition beim statischen
  akzeptierten `503`-Pfad. Dieser ADR behauptet keinen fertigen lokalen
  End-to-End-Sync.

## Nicht Bestandteil dieses Slices

ADR 0024 implementiert oder autorisiert insbesondere nicht:

- die Komposition von SyncGateway und `SyncAgent`;
- Änderungen am lokalen HTTP-Server, seiner Boundary oder dem statischen
  `503`-Verhalten;
- einen konkreten browserseitigen `SyncTransport` oder End-to-End-Pfad;
- einen zweiten Listener, IPC, Remotezugriff oder Deployment;
- Missbrauchs-, Parallelitäts-, Rate-, Zeit-, Speicher- oder weitere
  Ressourcenbegrenzungen;
- Authentisierung, Autorisierung, Calleridentität, Signaturen, Replay-,
  Idempotenz- oder Deduplizierungsschutz;
- `ModelProvider`-, `WorkflowProvider`- oder andere Portsignaturen;
- OpenAI-, lokales-Modell-, n8n-, Airtable- oder sonstige Adapter;
- Cloudzugriff, Tenantmessung, Workflow, Credential, Secret oder externe
  Kommunikation;
- private Daten, weitere Aktionen, nicht leere Payloads, Fachagentenrouting,
  Tools, autonome Aktionen oder fachliche Nebenwirkungen;
- Storage, Logging, Monitoring, Telemetrie oder eine funktionale SyncAgent-UI;
- AgentHub-/AutomationHub-Integration oder eine SyncAgent-Komposition in
  `src/main.js`; die bestehende reine Projektstatus-Copy ist keine funktionale
  Integration.

Die in ADR 0023 festgelegte weitere Reihenfolge bleibt unverändert: Erst folgt
die getrennte kontrollierte Gateway-/SyncAgent-Komposition, danach der
browserseitige Transport und der lokale End-to-End-Pfad, anschließend lokale
Missbrauchs-, Parallelitäts-, Zeit- und Ressourcenbegrenzung. Provider werden
erst danach in eigenen Entscheidungen betrachtet.

## Erwogene Alternativen

### Den Agentenkern sofort mit dem lokalen Gateway komponieren

Verworfen. Kern und Komposition müssen getrennt testbar bleiben. Der nächste
Slice entscheidet Responsebesitz, Übergabe und Lifecycle an der bestehenden
HTTP-Grenze; ADR 0024 verändert den sicheren statischen `503`-Pfad nicht.

### `syncTest` bereits über ein Modell oder einen Workflowprovider ausführen

Verworfen. Der leere synthetische Test benötigt weder Modell noch Workflow.
Ein Provider würde ohne fachliche Notwendigkeit Credentials, Datenschutz,
Kosten, Timeouts, Outputgrenzen und externe Fehlersemantik einführen.

### Einen generischen Execute-, Action- oder Providerpfad ergänzen

Verworfen. Frei wählbare Aktionen, Modelle, Workflows, Endpoints, Tools oder
Agenten würden die feste lokale Policygrenze umgehen. Der erste Kern erlaubt
ausschließlich `syncTest`.

### Der Gateway-Projektion ohne erneute Prüfung vertrauen

Verworfen. Zone C bleibt eine eigene autoritative Grenze. Defense-in-depth-
Validierung, eigene Projektion, Korrelation und finaler Freeze dürfen nicht von
der korrekten vorgelagerten Komposition abhängen.

### Zuerst bereinigen oder nur die Projektion validieren

Verworfen. Eine Projektion vor der ursprünglichen Validierung könnte
Zusatzfelder, Accessors oder ungeeignete Strukturen entfernen und einen
ursprünglich ungültigen Request nachträglich akzeptierbar machen.

### Den Eingangsrequest einfrieren oder direkt als Korrelationsrequest nutzen

Verworfen. Das würde fremde Identität verändern oder nachträgliche Mutation und
Proxyverhalten in die Agentenantwortgrenze übernehmen. Nur der neue defensive
Snapshot wird eingefroren und zur Korrelation verwendet.

### Requestablehnungen als normale Contract-Fehlerresponses ausgeben

Verworfen. Eine Ablehnung vor erfolgreicher Agentenverarbeitung ist keine
normale SyncAgent-Response. Sie erhält deshalb ausschließlich das getrennte
lokale Resultprofil `syncRequestRejected`.

### Die Dauer mit einer zweiten Clock oder Date.now messen

Verworfen. Der erste deterministische Foundation-Slice benötigt keine
Telemetrie. `durationMs: 0` bleibt ausdrücklich statisch und nicht gemessen.

### Den Agenten asynchron oder mit vorsorglichen Providerdependencies bauen

Verworfen. Der aktuelle Handler besitzt keine asynchrone Arbeit und keinen
Provider. Vorzeitige Ports oder Dependencies würden spätere
capability-spezifische Entscheidungen vorwegnehmen.

### Vollständige Proxy-, ABA- oder Same-Realm-Isolation behaupten

Verworfen. JavaScript stellt dafür innerhalb desselben Realms keine portable
allgemeine Garantie bereit. Die Foundation erkennt beobachtete
Inkonsistenzen, redigiert Fehler und begrenzt ihre Aussage auf neue defensive
Snapshots.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, bevor der Agentenkern mit dem lokalen Gateway
komponiert, über einen Browsertransport erreichbar oder außerhalb der
bestehenden Gateway-Laufzeit in einen eigenen Prozess oder Dienst verschoben
wird. Eine weitere Aktion, ein nicht leerer Payload, private Daten,
Fachagentenrouting, Tools oder Nebenwirkungen benötigen vorher neue Contract-,
Identitäts-, Berechtigungs-, Replay-, Idempotenz- und
Datenschutzentscheidungen.

Ebenso ist eine neue Entscheidung erforderlich, bevor ein `ModelProvider` oder
`WorkflowProvider`, OpenAI, ein lokales Modell, n8n oder ein anderer Adapter
eingeführt, `durationMs` tatsächlich gemessen, ein normales Fehlerprofil im
Agentenkern erzeugt oder Logging, Telemetrie, Persistenz, Rate Limits,
Parallelitäts-, Zeit- oder Ressourcenbegrenzungen ergänzt werden.

## Verwandte Dokumente

- [ADR 0016: Transportneutraler SyncContract-Kern](0016-transport-neutral-sync-contract-foundation.md)
- [ADR 0017: Transportneutrale SyncService Foundation](0017-transport-neutral-sync-service-foundation.md)
- [ADR 0018: Transportneutrale SyncGateway Request Boundary](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
- [ADR 0020: Lokale SyncGateway Raw-Wire- und HTTP-Foundation](0020-local-sync-gateway-raw-wire-http-foundation.md)
- [ADR 0023: Lokaler SyncAgent vor optionalen externen Providern](0023-local-syncagent-before-optional-external-providers.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
