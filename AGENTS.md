# GoldenDawn OS – Projektanweisungen

## Geltungsbereich

Diese Datei gilt für das gesamte Repository. Eine tiefer liegende `AGENTS.md`
darf für ihren Verzeichnisbereich ergänzende oder speziellere Regeln definieren.

## Projektziel

GoldenDawn OS ist die Jan & Arisa Lichtwaldzentrale: ein persönliches Dashboard
für Lernen, Projekte, Prompt Engineering, Automatisierung, Reflexion und
Fortschritt sowie ein professionelles Portfolio-Projekt für ein späteres
Multi-Agenten-System.

Das System wird schrittweise von einem lokalen, stabilen MVP zu einer modularen
AI-Operations-Zentrale erweitert. Persönliche Nutzbarkeit, nachvollziehbare
Architekturentscheidungen, Sicherheit und Portfolio-Tauglichkeit sind
gleichwertige Ziele.

## Aktuelle Projektphase

Aktueller Stand: `v0.3.0 – in Arbeit – ADR 0024 Local Model-free SyncAgent Core Foundation`

Die abgeschlossene Basis `v0.2.0` umfasst:

- die umgesetzte responsive Command-Center-Shell;
- die umgesetzte PromptVault-Modulstruktur und den gemeinsamen
  Storage-Adapter für robuste lokale Speicherung;
- PromptVault als lokal nutzbares MVP-Modul mit Anzeigen, Erstellen,
  Bearbeiten, dauerhaftem Löschen, lokaler Textsuche, Kategorie-Filtern,
  persistenten Favoriten, unveränderlicher Versionierung und
  Wiederherstellung als neue Version.

`v0.2.0` ist abgeschlossen, mit den relevanten automatisierten Tests sowie dem
Produktions-Build geprüft und als Tag `v0.2.0` mit dem zugehörigen GitHub
Release veröffentlicht. Git-Aktionen für zukünftige Releases bleiben
vollständig manuell bei Jan. Der Meilenstein
`v0.2.1 – LearningHub Local MVP` ist vollständig abgeschlossen, mit 552/552
automatisierten Tests und einem erfolgreichen Produktions-Build geprüft und am
`2026-07-25` als annotierter Tag `v0.2.1` mit zugehörigem GitHub Release
veröffentlicht. Schema 2, lokale
Inhaltsservices und Persistenz sowie `LearningHubController` und die lokale
Inhaltsoberfläche für Module, Kapitel und LearningNodes sind umgesetzt. Der
getrennte Fortschrittsvertrag, seine Persistenz und Projektion sowie die
bedienbare Oberfläche für Kapitelabschluss und Modulfortschritt sind ebenfalls
umgesetzt. Der getrennte LearningArtifact-Vertrag, seine private lokale
Persistenz und sein referenzprüfender Service sind über den vorhandenen
`LearningHubController` und die `LearningHubView` als lokale Notizen und
Zusammenfassungen bedienbar. Die getrennte lokale LearningTest-Foundation aus
Testbank, append-only Attempts, reiner deterministischer Engine und
referenzprüfendem Service ist ebenfalls umgesetzt und über den vorhandenen
Controller und die View als sichtbarer `Lokaler Mock-Test` mit
Fragenverwaltung, Testdurchführung, Ergebnis und Versuchshistorie bedienbar.
Der Mock-Test verwendet weder KI noch externe Kommunikation. GoldenDawn OS ist
seit dem `2026-07-25` als öffentlich sichtbares Portfolio-Repository ohne
Open-Source-Lizenz verfügbar. `v0.2.2 – LichtwaldLog Local MVP` wurde am
`2026-07-26` begonnen und ist vollständig abgeschlossen sowie geprüft.
Implementiert sind die LichtwaldLog-Contract-Foundation
mit Schema-1-Vertrag, reinem Validator, synthetischen Contract-Tests und ADR
0013, die private Storage-Foundation mit begrenzter
Full-Snapshot-Persistenz und ADR 0014, die Service- und Controller-Foundation,
die isolierte View- und CSS-Foundation sowie die beiden getrennten
Anwendungskompositionen in `src/main.js`. Ausschließlich der private Stack
verwendet den gemeinsamen `StorageAdapter`; die in ADR 0015 festgelegte
synthetische Demo arbeitet über einen eigenen In-Memory-Stack ohne Adapter.
LichtwaldLog ist über die
Navigation mit dem sichtbaren Status `Lokales MVP` erreichbar. Anzeigen,
Erstellen, vollständiges Bearbeiten, dauerhaftes Löschen sowie explizites
Setzen und Entfernen des Fokus sind vollständig über GoldenDawn OS bedienbar.
Der durch `featuredEntryId` autoritativ fokussierte Eintrag wird in Übersicht
und Detail rein durch View und CSS als `Besonderer Lichtwaldmoment`
präsentiert. Dafür werden weder ein zweiter Zustand noch eine zusätzliche API
oder Persistenz eingeführt; die Dashboard-Shell und andere Module bleiben
unverändert.
Die reine lokale Textsuche über Kalenderdatum, Titel, Text und Tags sowie der
exakte Kalenderdatum- und Tagfilter sind ebenfalls implementiert. Alle drei
Kriterien werden ausschließlich aus der flüchtigen Controller-Projektion
abgeleitet, logisch mit AND kombiniert und nicht persistiert.
Die reale Browserprüfung war in einem frischen isolierten temporären
Chrome-Profil auf Desktop mit `1440 × 1000` sowie bei exakt `390 × 844`
erfolgreich. Geprüft wurden der vollständige lokale Navigations-, CRUD-, Fokus-,
Dirty-Guard-, Delete-, Reload-, Such- und Filterfluss einschließlich literalem
Matching, AND-Verknüpfung, Leerzustand und Reset. Tastatur- und Caretfokus,
Live-Regionen, mindestens `44px` hohe Controls, der sichtbare
`3px`-Fokusrahmen und fehlender horizontaler Seitenoverflow wurden bestätigt;
es gab 0 Console-Warnungen oder -Fehler, 0 Runtime-Exceptions, 0 externe
Requests und keine Storage-Schreiboperation durch Suche oder Filter.
Die getrennte synthetische In-Memory-Demo ist als eigener vollständig
bedienbarer Runtime-Stack umgesetzt. Demo-Änderungen bleiben bei Navigation im
selben Dokument erhalten und werden bei Reload oder neuer Komposition auf den
kanonischen Seed zurückgesetzt; der private Browserbestand bleibt davon
unberührt. Die synthetische Herkunft und der Reset bei Reload bleiben auch bei
der Präsentation des besonderen Moments sichtbar. Damit ist `v0.2.2`
vollständig abgeschlossen und geprüft: 374/374 LichtwaldLog-Tests und 933/933
Tests der Gesamtsuite bestehen bei 0 Skips und 0 Todos; der Produktions-Build
transformiert exakt 46 Module. Die Paketversion ist `0.2.2`; `private: true`
bleibt ausschließlich eine Paketmetadatenentscheidung und macht das öffentlich
sichtbare Repository nicht privat. Der annotierte Tag `v0.2.2` und das
zugehörige GitHub Release wurden am `2026-08-02` veröffentlicht; `v0.2.2` ist
das neueste veröffentlichte Release. `v0.3.0 – Local SyncAgent and Transport Foundation`
hat mit der transportneutralen `SyncContract Foundation` begonnen; dieser erste
Slice ist implementiert und bleibt die verbindliche Vertragsgrundlage. Die
darauf aufbauende `SyncService Foundation` ist ebenfalls implementiert. Der
asynchrone Service
erstellt einen kontrollierten `syncTest`-Request, validiert ihn und übergibt ihn
ausschließlich an den injizierten Port `syncTransport.sendSyncRequest`. Nur eine
vollständig validierte, normal korrelierte SyncResponse wird defensiv
projiziert und ausgegeben. Die synchrone transportneutrale
**SyncGateway Request Boundary Foundation** ist ebenfalls implementiert. Sie
begrenzt ausschließlich einen bereits
materialisierten Raw-Body-Wert, parst einen bestandenen String exakt einmal
ohne Reviver, validiert zuerst den unveränderten Parsed-Wert und gibt nur eine
erneut validierte, tief eingefrorene defensive Sechs-Felder-Projektion oder
eine vollständig gültige frühe Gateway-Fehlerresponse aus. Erfolgreiche
Vertragsresponses sind weiterhin auf `dataOrigin: "synthetic"` begrenzt.
Dieser Wert ist nur eine Vertragsklassifikation und kein Herkunfts- oder
Datenschutzbeweis. `v0.2.2` bleibt vollständig lokal. Die Boundary selbst
besitzt weiterhin keinen HTTP-Handler und ist nicht in `src/main.js` komponiert.
Aktuell ist
`v0.3.0 – in Arbeit – ADR 0024 Local Model-free SyncAgent Core Foundation`.
ADR 0023 ersetzt ADR 0002 und ADR 0019 und übernimmt deren weiterhin
gültigen Kern: Der `SyncService` bleibt die einzige Kommunikationsschicht des
Browsers, der lokale `SyncAgent` der einzige Einstieg und Router des
Agentensystems, UI und Browser wählen weder Fachagent noch Provider direkt und
Version 1 bleibt auf `SyncAgent`, `DataAgent` und `TestAgent` begrenzt. Das
lokale SyncGateway ist kein vierter Agent. ADR 0020 bleibt angenommen und
implementiert den separat und ausschließlich explizit startbaren Node-HTTP-
Prozess auf `127.0.0.1`. ADR 0021 bleibt ebenfalls angenommen und ergänzt aus
einem unveränderlichen Snapshot der fachlich kanonischen Contract- und
Boundary-Quellen sowie des gepflegten nichtfachlichen Entry ein deterministisch
erzeugtes, direkt bindbares Expression-IIFE mit der exakt eingefrorenen API
`{ createSyncGatewayRequestBoundary }`, ein SHA-256-Integritätsmanifest sowie
Generator-, Check-, Snapshot-/ABA-, Outputpfad-, Paritäts- und Mutationstests.

ADR 0024 ergänzt ADR 0023 und implementiert den vollständig lokalen,
synchronen, modell- und providerfreien `syncTest`-SyncAgent-Kern in
`src/agents/syncAgent.js`. Der Kern ist importinaktiv, besitzt keine Provider-
oder Transportdependency und ist weder mit dem lokalen SyncGateway noch mit
dem Browserpfad komponiert. Seine gezielte Suite besteht mit 103/103 Tests, die
vier kombinierten Sync-Suites mit 245/245 Tests und die vollständige serielle
Suite mit 1315/1315 Tests, jeweils ohne Fehlschlag, Skip oder Todo. Der
Produktions-Build transformiert weiterhin exakt 46 Module und der schreibfreie
n8n-Bundle-Driftcheck besteht.

ADR 0022 ergänzt nun die lokale, importseitig und standardmäßig
netzwerkinaktive n8n Cloud Ingress & Runtime Evidence Gate Foundation. Es wurde
kein Cloudrequest ausgeführt oder Tenant verändert; der tenantgebundene
Messstatus bleibt `UNPROVEN`. Der gepinnte öffentliche Stable-Stand
`n8n@2.35.4` am Commit
`d2ce3c084c228622c2ffe7c245d25870430e18a9` zeigt `gzip`-/`deflate`-
Dekomprimierung vor `req.rawBody` sowie den erfolgreichen Standard-Header-Auth-
Wert im Webhook-Runtime-Output. Diese beiden commitgebundenen Teilgates und das
aktuelle Aktivierungsgate sind `FAIL`; sie sind keine Tenantbehauptung.
`FAIL` und `UNPROVEN` halten die Aktivierung geschlossen.

Das Boundary-Artefakt bleibt ein korrektes, aber derzeit nicht komponiertes und
nicht aktiviertes n8n-Derivat; das Evidence-Tool komponiert es ausdrücklich
nicht. Lokaler Browser-SyncTransport und kontrollierte Gateway-/SyncAgent-
Komposition sind weiterhin nicht implementiert. Der isolierte Kern kann eine
normale Erfolgsresponse erzeugen, sie ist über den HTTP- oder Browserpfad aber
nicht erreichbar. OpenAI-, lokaler Modell- und n8n-Adapter sind weder
autorisiert noch implementiert. Lokal akzeptierte Requests enden bis zur
tatsächlichen Gateway-/SyncAgent-Komposition weiterhin mit dem statischen
HTTP-Status `503`.

Nicht Bestandteil des veröffentlichten `v0.2.0` waren:

- der LearningHub Local MVP aus `v0.2.1`;
- der LichtwaldLog Local MVP aus `v0.2.2`;
- Import oder Export von PromptVault-Daten;
- Synchronisierung, geräteübergreifende Speicherung oder automatische
  Cloud-Sicherung;
- Airtable-Integrationen;
- Webhooks oder die Anbindung des SyncAgent;
- echte LLM- oder Agentenlogik;
- Authentifizierung und Benutzerverwaltung;
- ein eigenes Backend;
- produktives Deployment;
- echte private oder gesundheitsbezogene Daten im Portfolio-Modus.

## Verbindliche Entwicklungsreihenfolge

Halte diese Reihenfolge der Hauptmeilensteine ein:

1. `v0.2.0`: lokales Command Center und PromptVault;
2. `v0.2.1`: LearningHub Local MVP;
3. `v0.2.2`: LichtwaldLog Local MVP;
4. `v0.3.0 – Local SyncAgent and Transport Foundation`;
5. `v0.4.0`: DataAgent und Airtable;
6. `v0.5.0`: TestAgent und Lerntests;
7. `v0.6.0`: Integration der zuvor eingeführten lokalen und externen Bausteine;
8. `v1.0.0`: abgesicherte, dokumentierte Portfolio-Version.

Die gesamte Reihe `v0.2.x` bleibt bewusst lokal. `v0.3.0` bereitet die
Kommunikation zunächst transportneutral und danach vollständig lokal vor;
optionale externe Provider folgen erst nach dem lokalen End-to-End-Pfad und
eigenen Entscheidungen. Zusätzliche Unterversionen dürfen zwischen den
Hauptmeilensteinen liegen, dürfen deren Reihenfolge und Architekturgrenzen aber
nicht verändern.

Innerhalb dieses Pfads gilt verbindlich folgende Implementierungsreihenfolge:

1. ADR 0023 entscheidet „lokaler SyncAgent, optionale Provider“;
2. ein vollständig lokaler, modellfreier und importinaktiver SyncAgent-Kern
   implementiert ausschließlich `syncTest`;
3. lokales SyncGateway und lokaler SyncAgent werden getrennt und kontrolliert
   komponiert;
4. ein konkreter browserseitiger SyncTransport und der lokale End-to-End-
   `syncTest` folgen;
5. lokale Missbrauchs-, Parallelitäts-, Zeit- und Ressourcenbegrenzung wird
   ergänzt;
6. erst danach werden Provider gesondert entschieden;
7. OpenAI-, lokaler Modell- und n8n-Adapter folgen jeweils als getrennte
   Slices;
8. private Daten, weitere Aktionen, Tools und Nebenwirkungen folgen nur nach
   neuen Contract-, Identitäts-, Berechtigungs-, Replay-, Idempotenz- und
   Datenschutzentscheidungen.

Die Schritte 1 und 2 sind mit ADR 0023 beziehungsweise ADR 0024 abgeschlossen.
Der nächste Slice ist ausschließlich Schritt 3, die kontrollierte lokale
Gateway-/SyncAgent-Komposition; Browsertransport und Provider bleiben dabei
außerhalb.

Implementiere keine spätere Phase vorzeitig, sofern die Aufgabe dies nicht
ausdrücklich verlangt und die dafür notwendige Architekturentscheidung nicht
dokumentiert wurde.

## Aktueller Scope für v0.3.0

Die implementierte `SyncContract Foundation` bleibt der reine
transportneutrale Contract-Kern für Version `1.0`, die Aktion `syncTest` und den
kanonischen Handler `SyncAgent`. Der Request besitzt exakt die sechs Felder
`version`, `action`, `source`, `requestId`, `timestamp` und `payload`;
`requestId` ist verpflichtend, beginnt mit `req_`, und `payload` ist exakt `{}`.
Erfolgreiche Responses sind auf `dataOrigin: "synthetic"` begrenzt; das ist nur
eine Vertragsklassifikation und kein Herkunfts- oder Datenschutzbeweis.
Unbekannte Felder, Versionen, Aktionen und Quellen werden fail-closed
abgelehnt.

Die implementierte `SyncService Foundation` stellt
`createSyncService({ syncTransport, generateRequestId, getCurrentTimestamp })`
mit einer eingefrorenen API, die exakt `runSyncTest` bereitstellt. Die Methode
ist immer Promise-basiert, akzeptiert keine Argumente und besitzt keinen
generischen Aktions- oder Payloadpfad. Sie löst zuerst
`syncTransport.sendSyncRequest` genau einmal sicher auf; bei fehlender, nicht
funktionaler oder werfend aufgelöster Methode werden Generator und Clock nicht
ausgewertet. Erst danach erzeugt sie `requestId` und `timestamp` über
kontrollierte Composition-Dependencies, verwendet standardmäßig
`req_ + crypto.randomUUID()` ohne schwächeren Fallback und baut einen frischen
Request mit exakt sechs Feldern und einem exakt leeren `payload`. Generator und
Clock werden dabei jeweils exakt einmal ausgewertet. Erst nach vollständiger
Requestvalidierung wird die Portmethode höchstens einmal aufgerufen. Transport-
und interner Korrelationsrequest sind getrennte, tief eingefrorene Snapshots.

Der einzige Port dieses Slices ist
`syncTransport.sendSyncRequest(syncRequest)`. Sein Rückgabewert bleibt
unvertrauenswürdige Eingabe. Der Service erzeugt daraus eine allowlist-basierte
gewöhnliche Datenprojektion und akzeptiert ausschließlich eine mit dem
unveränderten internen Request vollständig validierte normale SyncResponse.
Frühe Gateway-Fehler werden nicht akzeptiert. Eine gültige normale
Contract-Fehlerresponse bleibt eine SyncResponse: Der äußere Service-Result ist
auch dann `ok: true`; der fachliche Erfolg bleibt ausschließlich
`syncResponse.success`. Lokale Servicefehler verwenden den getrennten exakten
Fünf-Felder-Resultvertrag und statische redigierte Fehler. Sie behaupten keine
Verarbeitung durch den `SyncAgent`.

Der implementierte Slice `SyncGateway Request Boundary Foundation` stellt
`createSyncGatewayRequestBoundary({ generateGatewayRequestId,
getCurrentTimestamp })` mit einer eingefrorenen gewöhnlichen API, die exakt die
synchrone Methode `processSyncRawBody` bereitstellt. Die Methode akzeptiert
exakt ein Argument. Fehlende oder zusätzliche Argumente werden ohne
Argumentinspektion, Größenprüfung, Parsing, Clock- oder Generatorzugriff als
statischer lokaler `invalidInvocation`-Result abgelehnt. Jeder Boundary-Result
besitzt exakt `ok`, `status`, `syncRequest`, `gatewayErrorResponse` und
`error`; lokale Boundary-Fehler sind keine SyncContract-Responses.

Bei exakt einem Argument wird der unveränderte Wert zuerst mit
`validateSyncRawBodySize` geprüft. Nur ein bestandener String wird exakt einmal
mit nativem `JSON.parse(rawBody)` ohne Reviver geparst. Der unveränderte
Parsed-Wert muss den bestehenden geschlossenen SyncContract vollständig
bestehen, bevor descriptor-basiert eine neue Sechs-Felder-Projektion mit
frischem exakt leerem Payload entsteht. Projektion und finaler tief
eingefrorener Snapshot werden mit derselben höchstens einmal erfassten
Referenzzeit erneut validiert. Es gibt weder Trimmen, Reparatur oder
Normalisierung noch einen Stringify-/Parse-Roundtrip, Merge oder eine
Bereinigung zusätzlicher Felder vor der maßgeblichen Validierung. Native
doppelte JSON-Membernamen folgen der Last-Key-Wins-Semantik von `JSON.parse`;
Duplikatfreiheit oder kanonisches JSON werden nicht behauptet.

Beherrschte Eingabeablehnungen erzeugen pro Aufruf eine vollständig validierte,
defensive und tief eingefrorene frühe Gateway-Fehlerresponse mit einer neuen
kontrollierten `gateway_`-ID, `action: null`, `handledBy: null`,
`processedBy: []` und statischem `durationMs: 0`. Die Zuordnung lautet:
`rawBodyTooLarge` zu `PAYLOAD_TOO_LARGE`, anderer regulärer Raw-Body-Fehler zu
`VALIDATION_ERROR`, Parser-Throw zu `INVALID_JSON`, alleiniger
`unsupportedVersion`- beziehungsweise `unknownAction`-Fehler zu
`UNSUPPORTED_VERSION` beziehungsweise `UNKNOWN_ACTION` und jedes sonstige oder
gemischte Requestfehlerbild zu `VALIDATION_ERROR`. Ein
`invalidReferenceTimestamp` sowie unerwartete Clock-, Generator-, Builder-,
Projektions-, Freeze- oder Validatorfehler führen statisch redigiert zu
`boundaryFailed` und nie zu einer Gateway-Response. `FORBIDDEN`,
`SERVICE_UNAVAILABLE` und `INTERNAL_ERROR` werden an dieser Grenze nicht
erzeugt.

Clock und Generator sind vertrauenswürdige Same-Realm-Composition-
Dependencies. Für einen akzeptierten Request oder eine ausgegebene
Gateway-Fehlerresponse wird die Clock exakt einmal ausgewertet. Der Generator
wird nur für eine tatsächlich benötigte Ablehnung exakt einmal verwendet; sein
Defaultpfad ist ausschließlich `gateway_ + crypto.randomUUID()` ohne
schwächeren Fallback. Beobachtbare Exceptions werden redigiert, bereits
ausgelöste Seiteneffekte können aber nicht verhindert oder rückgängig gemacht
werden. Deep Freeze ist keine Sandbox.

Der implementierte isolierte **Local Model-free SyncAgent Core** stellt
`createSyncAgent({ getCurrentTimestamp = defaultUtcClock } = {})` bereit. Die
Factory liefert eine frische gewöhnliche und eingefrorene API mit exakt
`{ processSyncRequest }`. Die synchrone Methode besitzt genau einen formalen
Parameter, akzeptiert exakt ein Argument und liefert bei jedem beherrschten
Aufruf einen frischen, tief eingefrorenen Vier-Felder-Result
`{ ok, status, syncResponse, error }`.
Lokale Fehler verwenden ausschließlich die statischen Profile
`invalidInvocation`, `syncRequestRejected` und `agentFailed`; sie sind keine
SyncContract-Responses und enthalten weder Request-ID noch Validator-,
Dependency- oder Exceptiondetails.

Unmittelbar nach den Imports erfasst das Modul bei erfolgreicher Evaluation
private Referenzen auf `Object.freeze`, `Object.isFrozen`,
`Object.getPrototypeOf`, `Object.getOwnPropertyDescriptor`, `Object.hasOwn` und
`Reflect.ownKeys` sowie die gewöhnliche `Object.prototype`-Identität. Die
erfassten Reflection-Referenzen verwendet ausschließlich der terminale
Verifier für Factory-API, Errorrecords sowie Failure- und Success-Results; die
Freeze-Referenz friert diese Records ein und die Frozen-Referenz prüft sämtliche
tatsächlichen Frozen-Zustände. Der terminale Verifier verwendet weder live
aufgelöste `Object.*`-/`Reflect.*`-Methoden noch Array-Prototypmethoden oder
Iteratoren. Er bestätigt descriptor-basiert gewöhnlichen Prototyp, exakte Own
Keys, ausschließlich aufzählbare Dateneigenschaften, feste Werte,
erforderliche Identitäten und den tatsächlichen Freeze-Zustand. Eine nach dem
Import ersetzte globale terminale Reflection-, Freeze- oder Frozen-Funktion
kann deshalb keine mutable oder korrumpierte terminale API, keinen solchen
Errorrecord und keinen solchen Result erzeugen.

Bei genau einem Argument wird die Clock exakt einmal als primitiver String
erfasst. Eine ungültige Referenzzeit hat `agentFailed`-Vorrang. Der unveränderte
Callerwert wird zuerst validiert. Erst danach entsteht descriptor-basiert ein
gewöhnlicher Sechs-Felder-Request mit frischem exakt leerem Payload; er wird
validiert, tief eingefroren und final erneut mit derselben Referenzzeit
validiert. Die private Allowlist enthält ausschließlich `syncTest`. Die daraus
neu erzeugte Erfolgsresponse verwendet `handledBy: "SyncAgent"`,
`dataOrigin: "synthetic"`, leere `warnings`, statisches ungemessenes
`durationMs: 0` und `processedBy: ["SyncAgent"]`; sie wird gegen den stabilen
internen Request validiert, tief eingefroren und final erneut validiert. Der
Kern übernimmt keine Caller-Record- oder Arrayidentität und verändert oder
friert den Callergraphen nicht.

Die internen Request- und Response-Prüfungen lösen ihre Reflection weiterhin
live auf; auch ihre Freezes lösen `Object.freeze` live auf. Ihren tatsächlichen
Freeze-Zustand prüft ausschließlich die beim Import erfasste
`Object.isFrozen`-Referenz. Jeder beobachtete interne Reflection- oder Freeze-
Throw, Freeze-No-op, jede Mutation oder andere Inkonsistenz führt statisch
redigiert zu `agentFailed`.

Der Modulimport startet keine Verarbeitung. Die Factory ruft die aufgelöste
Clockfunktion nicht auf und startet selbst weder I/O, Timer, Netzwerk,
Listener, IPC noch einen Providerpfad. Ihre Parameterdestrukturierung löst
jedoch die vertrauenswürdige Composition-Property `getCurrentTimestamp` auf;
ein Accessor oder Proxy im übergebenen Container kann deshalb während der
Factory-Erzeugung ausgeführt werden oder werfen. Das liegt außerhalb des
Methoden-Resultvertrags. Erst `processSyncRequest` mit exakt einem Argument
ruft die aufgelöste Clockfunktion genau einmal auf. Der Kern liest PromptVault,
LearningHub, LichtwaldLog und GoldenDawn-Vault nicht, protokolliert nichts und
besitzt keine Provider-, Modell-, Workflow-, Persistenz- oder Toolwirkung.

Nicht garantiert werden bereits vor der Modulevaluation kompromittierte
Primordials, veränderter Modulcode oder lexikalische Bindungen, eine
kompromittierte JavaScript-Engine, OOM oder Prozessabbruch sowie beliebig
koordinierte Manipulation sämtlicher Reflection-Intrinsics. Same-Realm-
Ausführung und Deep Freeze sind keine Sandbox; beobachtete Proxy-, Projektions-,
Freeze- oder Revalidierungsinkonsistenzen stoppen statisch redigiert
fail-closed.

`validateSyncRawBodySize` begrenzt weiterhin nur die berechnete UTF-8-Länge
eines bereits allozierten JavaScript-Strings. ADR 0020 ergänzt davor die
separate lokale Raw-Wire- und HTTP-Foundation. Ihr importseitig inaktiver
Node-Prozess startet nur mit `npm run gateway:local`, liest ausschließlich
`GOLDENDAWN_SYNC_GATEWAY_PORT` und
`GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN`, bindet unveränderlich an
`127.0.0.1` und bedient nur `/api/sync-test`. Port `0` bleibt auf die direkt
injizierte Testfactory begrenzt; `npm run dev` startet keinen Listener.

Das lokale Gateway behandelt den Browsercaller als nicht authentisiert und
unvertrauenswürdig. Es unterstützt ausschließlich HTTP/1.1. HTTP/1.0 wird mit
dem statischen `invalidHttpRequest`-Profil abgelehnt, bevor Raw-Header
projiziert, ein Decoder erzeugt oder die Boundary aufgerufen wird. Danach prüft
es das exakte Request-Target, den zum gebundenen Port passenden `Host`, `POST`
beziehungsweise einen engen `OPTIONS`-Preflight, die exakte Origin-Allowlist,
relevante Raw-Header-Duplikate, Content-Type, Content-Encoding und Framing
fail-closed. `CONNECT`, Upgrades und Erwartungen umgehen die Policy nicht. CORS
spiegelt nur die konfigurierte erlaubte Origin und erlaubt keine Credentials.
Loopback und CORS ersetzen weder Identität noch Authentisierung oder
Autorisierung; Rate Limits bleiben geplant.

Bei gebundenem Port `80` sind ausschließlich die Host-Autoritäten
`127.0.0.1` und explizit `127.0.0.1:80` zulässig. Für jeden anderen Port gilt
ausschließlich die exakte Form `127.0.0.1:<port>`.
Die Node-Option `requireHostHeader: false` zentralisiert die Hostprüfung, ohne
diese Pflicht oder Allowlist zu lockern: Nodes vorgezogene automatische
HTTP/1.1-Hostantwort ist deaktiviert. Im ansonsten regulären Requestpfad,
sofern keine frühere fail-closed Target- oder Sonderpfadablehnung greift,
durchlaufen regulär parsebare fehlende, doppelte oder falsche Hostwerte zuerst
Admission und anschließend unter dem eigenen Response-Owner die
Raw-Header-Policy. Sie enden im statischen `invalidHttpRequest`-Envelope mit
kontrolliertem `Content-Length`. Die Option öffnet keinen akzeptierenden Pfad;
Decoder und Boundary bleiben unberührt.
Eine mutationswirksame Pipeline-Regressionsprüfung deaktiviert dafür Nodes
Requestlimit, beobachtet bei hostlosem HTTP/1.1-`OPTIONS` plus gültigem POST
exakt zwei Anwendungsereignisse und kein `dropRequest` und lässt trotzdem weder
Decoder noch Boundary zu. Die eigene Response besitzt höchstens eine
Statuszeile und enthält keine privaten Marker.

`Content-Length` ist nur ein frühes Signal. Die HTTP-Schicht importiert die
kanonische 65.536-Byte-Konstante, zählt tatsächlich gelieferte Bytes und hält
höchstens 65.536 Bytes im Anwendungsbuffer. Ab Byte 65.537 folgen weder
Zusammenfügung noch Decode oder Boundary-Aufruf. Ein vollständig empfangener
zulässiger Body wird genau einmal mit
`TextDecoder('utf-8', { fatal: true, ignoreBOM: true })` decodiert. Ungültiges
oder unvollständiges UTF-8 wird fail-closed abgelehnt. Eine gültige BOM bleibt
als U+FEFF erhalten, wird weder entfernt noch repariert und folgt damit der
bestehenden Parsersemantik. Es gibt kein `setEncoding`, keine Chunkdecodierung,
Normalisierung, Trim- oder Reparaturstufe und keinen zweiten JSON-Parser.
Ausschließlich der resultierende primitive String gelangt exakt einmal an die
bestehende Boundary.

Eine kontrollierte Boundary-Ablehnung wird mit HTTP `400` ausschließlich als
deren validierte frühe Gateway-Fehlerresponse serialisiert. Lokale HTTP- oder
Boundaryfehler verwenden eine getrennte statische Envelope. Ein akzeptierter
Request endet mit einem statischen lokalen HTTP `503` für den noch nicht
implementierten Upstream; die Requestprojektion wird weder gespiegelt noch
weitergesendet und keine normale SyncResponse oder SyncAgent-Verarbeitung wird
behauptet. Pro physischem Socket darf genau ein Anwendungs- oder Raw-Socket-Pfad
den Responsebesitz übernehmen. Nach dieser Übernahme schreibt `clientError`
keine zweite Response. Jeder Raw-Socket-Pfad versucht seine statische Antwort
best effort zu senden, fängt asynchrone Schreibfehler redigiert ab und zerstört
den Socket anschließend zuverlässig; eine
Kollision mit bereits beanspruchtem Responsebesitz schreibt nichts mehr und
zerstört den Socket unmittelbar. Das gilt auch gegenüber halb offenen Clients,
die nach der serverseitigen Antwort weiter Bytes senden.

Eine factory-lokale Request-Admission pro physischem Socket ist vom
Response-Owner getrennt. `request`, `checkContinue` und `checkExpectation`
durchlaufen dieses Gate als ersten Anwendungsschritt. Nur der erste Request
wird zugelassen; jedes Folgeereignis beansprucht den terminalen Response-Owner,
pausiert und zerstört den Socket ohne zweite Response, bevor HTTP-Version,
Headerprojektion, Decoder oder Boundary ausgewertet werden.
Diese Reihenfolge ist mutationswirksam belegt: Der erste gültige HTTP/1.1-Raw-
Body erreicht Decoderfactory, Decode und Boundary jeweils exakt einmal. Ein
zweites reguläres oder Expect-Ereignis liest `rawHeaders` kein einziges Mal und
endet mit terminaler Response beziehungsweise terminalem Socket. Globale
Instrumentierungen laufen mit `concurrency: false` und werden im `finally`
vollständig restauriert.

Die feste Produktionspolicy verwendet `5.000` ms Headerzeit, `10.000` ms
Requestzeit, `10.000` ms Socket-Inaktivität und einen festen
`connectionsCheckingIntervalMs` von `100`. Bei responsivem Eventloop werden
Header- und Requestfrist daher spätestens im nächsten, höchstens `100` ms
späteren Prüftakt erkannt; Eventloop- oder Betriebssystem-Scheduling kann den
tatsächlichen Verbindungsabschluss zusätzlich verzögern. Die enge
Factory-Testinjektion `useTestTimeoutPolicy: true` ist nur zusammen mit
`port: 0` zulässig und verwendet unveränderlich `250`/`500`/`500`/`25` ms für
Header, Request, Socket und Prüftakt. Sie ist über keine Runtime- oder
Umgebungsvariable erreichbar; jeder Produktionspfad behält die festen Werte.
Das separate Admission-Gate setzt das Ein-Request-Limit primär durch.
`maxRequestsPerSocket: 1` und der explizite synchrone `dropRequest`-Handler
bleiben Defense-in-Depth: Ein von Node verworfener pipelinierter Folgerequest
beansprucht den terminalen Response-Owner, zerstört den physischen Socket und
erzeugt weder eine zusätzliche Node- noch Gateway-Response.

Ein Serverfehler nach erfolgreichem Start verwirft `boundPort` sofort, setzt
den Lifecycle fail-closed auf fehlgeschlagen, schließt den Listener defensiv
und zerstört alle verfolgten Sockets. Operative Guards verhindern danach jede
weitere Request-, Decoder- oder Boundary-Verarbeitung; Fehlerdetails und
interne Exceptions werden weder gespiegelt noch geloggt. Die Factoryoption
`onFatal = () => {}` ist ein payloadloser, höchstens einmal aufgerufener
Kompositionskanal; synchrone Throws und zurückgegebene Rejections werden
vollständig konsumiert, während die eingefrorene öffentliche API exakt
`{ start, stop }` bleibt. Der Prozesseinstieg entfernt nach diesem Signal seine
Signalhandler, setzt `process.exitCode = 1`, versucht die Bereinigung
idempotent und gibt genau einmal ausschließlich
`Das lokale SyncGateway wurde nach einem internen Serverfehler beendet.` aus.
Auch Startfehler verwenden denselben irreversiblen Cleanup-Pfad mit verworfenem
Port, best-effort geschlossenem Listener und zerstörten Sockets. Nach einem
synchronen Close-Throw folgt genau ein Retry; bleibt er werfend, wird der
Listener dereferenziert und der Prozesseinstieg versucht zusätzlich `stop`.
Der Listening-Handler schließt den vollständigen Zugriff auf `server.address()`
einschließlich des jeweils einmaligen Lesens von `address` und `port` in diesen
Pfad ein. Ein werfender Getter führt redigiert zu `startFailed`, lässt
`start()` nicht offen und ruft `onFatal` nicht auf.
Ein erfolgreicher Start akzeptiert nur einen gemeldeten Safe-Integer-Port von
`1` bis `65535`. Für einen angeforderten Produktionsport ist exakte
Übereinstimmung erforderlich; Factory-Port `0` akzeptiert jeden tatsächlich
gebundenen Port in diesem Bereich. Gemeldete Werte `0`, `-1`, `65536` oder ein
abweichender gültiger Produktionsport führen ebenfalls vollständig zum
statischen Startfehler-Cleanup ohne `onFatal`.
Endliche Grenzen
und Anwendungsbuffer sind dennoch kein Schutz vor bereits durch Node,
Betriebssystem oder Netzwerkstack allozierten Bytes und kein vollständiger
DoS-Schutz.

ADR 0023 schließt den durch ADR 0019 vorgesehenen direkten Cloudpfad des lokalen
Gateways als Zieltopologie. Hinter dem lokalen `SyncAgent` werden ausschließlich
zwei konzeptionelle Klassen späterer capability-spezifischer Ports vorgesehen:
`ModelProvider` und `WorkflowProvider`. Dieser Entscheidungsslice definiert
weder JavaScript-Signaturen, Methoden, Schemas noch Dateien dafür. Ein
gemeinsamer generischer Port wie `execute`, frei wählbare Endpoints oder
Requestpfade für beliebige Modelle, Prompts, Workflows, Tools oder Agenten sind
nicht vorgesehen. Provider, Modell, Workflow, Endpoint und Umgebung werden nur
durch vertrauenswürdige lokale Composition festgelegt, niemals durch Browser-
oder Requestwerte oder durch Modelloutput.

Die GoldenDawn-seitige Kopie späteren Credentialmaterials liegt ausschließlich
in der vertrauenswürdigen Laufzeitkonfiguration oder Secretverwaltung des
konkreten serverseitigen Adapters auf GD-WS01. Sie gelangt niemals in
SyncRequest, SyncResponse, Agentenresultat, Browser- oder `VITE_*`-
Konfiguration, Storage, URL, Repository, GoldenDawn-Vault, Workflow-Export,
Testfixture, Screenshot oder Anwendungslog. Falls eine später gesondert
entschiedene Authentisierung providerseitiges Prüf- oder Credentialmaterial
benötigt, liegt dieses ausschließlich im Credential-/Secret-Store des
Providers. Die lokale Adapterkopie und das providerseitige Prüfmaterial sind
getrennte Vertrauens- und Betriebsgrenzen. Eine Providerablage beweist weder
Redaction noch Retention oder Nichtweitergabe. Same-Realm-Komposition ist keine
Sandbox und wird nicht als technische Secret-Isolation überbehauptet.

Ein späterer OpenAI-Adapter benötigt vor Aktivierung mindestens einen eigenen
Adapter- und Datenschutzslice, eine dedizierte GoldenDawn-seitige
Credentialkopie in seiner vertrauenswürdigen Laufzeitkonfiguration oder
Secretverwaltung auf GD-WS01, feste Modell- und Endpoint-Allowlists, explizite
Datenminimierung,
endliche Timeouts sowie Request-, Response- und Kostenlimits. Redirects und
automatische Retries bleiben im ersten Slice aus; jeder Output wird lokal
vollständig validiert. Tools oder autonome Aktionen sind im ersten Modellslice
ausgeschlossen, und externe Verarbeitung sowie Retention werden bewusst
entschieden. Ein lokaler Modelladapter benötigt mindestens eine kontrollierte
Modellquelle mit Integritätsbindung, keine automatischen Downloads oder
Telemetrie, Ressourcen-, Zeit- und Antwortgrenzen und dieselbe lokale
Outputvalidierung wie ein Cloudmodell. Keiner dieser Adapter ist durch ADR 0023
autorisiert.

Auch ein n8n-Adapter bleibt gesperrt. Als späterer `WorkflowProvider` dürfte er
nur einen vom lokalen `SyncAgent` neu erzeugten und minimierten Request
erhalten; ursprüngliche Browserbytes, Browserheader, URL, Query und
Originalserialisierung erreichen n8n niemals. `Raw Body` ist damit kein
erforderlicher Beweis für ursprüngliche Browserbytes und darf nicht als solcher
dargestellt werden. Der bekannte Header-Authentication-/Execution-Data-Befund
aus ADR 0022 bleibt ein Blocker, entscheidet aber keine Authentisierungslösung.
Header Authentication, Bearer-Secret, konkreter Headername, JWT, HMAC,
asymmetrisches Verfahren, Credentialformat und Rotationsmechanismus bleiben
offen. Ein langlebiges wiederverwendbares Header-Secret darf ohne neue positive
Authentisierungs- und Execution-Data-Entscheidung nicht aktiviert werden.

ADR 0023 autorisiert weder Cloudzugriff noch Tenantmessung. Vor jeglicher
Vorbereitung oder Ausführung einer neuen n8n-Tenantmessung müssen ein neuer
n8n-Adapter-ADR angenommen und eine neue adapterbezogene Evidenz-Schemaversion
festgelegt sein. Erst danach benötigen die Anlage eines temporären Workflows,
ein Wegwerfcredential, jeder einzelne synthetische Test-URL-One-shot sowie der
vorab definierte Cleanup und die Entfernung der Cloudartefakte jeweils eine
eigene ausdrückliche Freigabe. Jede Supportanfrage ist unabhängig davon separat
freizugeben; sie darf eine spätere Entscheidung vorbereiten, autorisiert aber
weder Workflow, Credential, Tenantvorbereitung oder -ausführung,
Adapteraktivierung noch Productionlauf. Ohne angenommenen neuen ADR und
festgelegte neue Schemaversion gibt es keinen Workflow, kein Credential und
keinen Test-URL-Verkehr. Ein Production-URL-Runner oder -Messpfad existiert
nicht. Evidence-Schema 1 bleibt unverändert mit
`stableOssCompatibility: FAIL`, `productionUrlMeasurementStatus: UNPROVEN`,
`activationDecision: FAIL` und ohne `overallGate`. Test- oder Production-
Webhook, Credential, Workflow und Tenantmessung bleiben außerhalb dieses
Slices. Header Authentication wäre keine Bodysignatur, TLS kein Replay- oder
Idempotenzschutz. Falls eine spätere private oder schreibende Aktion eine
Bodysignatur benötigt, wird sie über die exakten relevanten Raw Bytes und
Header vor Decodierung und Parsing entschieden.

Der abgeschlossene Generated-n8n-Boundary-Bundle-Slice umfasst ausschließlich
den deterministischen lokalen Generator
`scripts/n8n/generateSyncGatewayBoundaryBundle.js`, den kleinen Entry
`scripts/n8n/syncGatewayBoundaryBundleEntry.js`, das eingecheckte
menschenprüfbare Artefakt
`artifacts/n8n/syncGatewayRequestBoundary.bundle.js`, sein deterministisches
SHA-256-Manifest und die zugehörigen Generator-, Reproduzierbarkeits-,
Integritäts-, Snapshot-/ABA-, Outputpfad-, Paritäts- und Mutationstests. Die
einzigen fachlich kanonischen Quellen bleiben `src/contracts/syncContract.js` und
`src/gateways/syncGatewayRequestBoundary.js`. Der Entry ist eine kleine
explizit gepflegte, manifestierte nichtfachliche Glue- und Quelldatei; der
Generator ist gepflegtes Repository-Tooling. Ausschließlich Bundle und
Manifest sind reproduzierbar generierte Derivate. `npm run
bundle:n8n:generate` aktualisiert beide Dateien, während `npm run
bundle:n8n:check` ausschließlich im Speicher vergleicht und bei Drift ohne
Projektschreiboperation fehlschlägt.

Die lockfile-gebundene Vite-/Rolldown-Ausgabe verwendet `strict: true` und
`attachDebugInfo: "none"`, sodass keine potenziell pfadabhängigen
`//#region …`-/`//#endregion`-Direktiven erzeugt werden. Der Generator prüft
den exakten Modulgraphen sowie die vollständige erwartete Wrapperform und
entfernt fail-closed nur den bekannten deklarativen Wrapper. Fachlicher Code
wird nicht textuell nachbearbeitet. Contract, Boundary und Entry werden jeweils
exakt einmal über sichere FileHandles gelesen. SHA-256 und Vite-Virtualmodule
stammen aus demselben danach unveränderlichen In-Memory-Snapshot; der Build
liest die Live-Quellen nicht erneut. Ein ABA-Wechsel kann deshalb nicht
unbemerkt andere Build- als Manifestbytes verbinden.

Nach seinem statischen Header sind die Artefaktbytes selbst ein direkt
bindbares Expression-IIFE ohne Top-Level-`var` oder Globalmutation.
`"use strict";` ist der erste Prolog im IIFE-Body und kein Top-Level-Statement;
nach dem Ausdruck folgt kein separates Semikolon-Statement. Das Artefakt kann
unverändert unmittelbar hinter `const boundaryBundle =` eingesetzt werden. Es
benötigt zur Laufzeit weder ESM- noch CommonJS-Imports, führt beim Laden keinen
Request aus und liefert exakt die eingefrorene API
`{ createSyncGatewayRequestBoundary }`. Die erzeugte Factory behält die
bestehende Clock- und Gateway-ID-Injektion und liefert exakt die eingefrorene
API `{ processSyncRawBody }`. Der Slice erfindet keine n8n-Inputstruktur und
implementiert keinen Browser-SyncTransport, Cloud- oder n8n-Transport,
öffentlichen Webhook, operativen `SyncAgent`, n8n-Workflow, Secret, Credential,
Header-Authentisierung, Autorisierung, Signaturprüfung, Rate Limit, Retry,
Replay-, Idempotenz- oder Deduplizierungsschicht, Persistenz, Requestlogs,
Telemetrie, AgentHub- oder AutomationHub-UI und keine `src/main.js`-
Komposition. PromptVault, LearningHub und LichtwaldLog bleiben lokal und werden
weder gelesen noch exportiert. Da kein Browser- oder Cloudtransport komponiert
ist und angenommene Requests lokal weiterhin mit `503` enden, existiert kein
externer Datenfluss. Paketversion `0.2.2`, Tag `v0.2.2` und neuestes
veröffentlichtes Release `v0.2.2` bleiben unverändert.

Die implementierte lokale **n8n Cloud Ingress & Runtime Evidence Gate
Foundation** aus ADR 0022 besteht ausschließlich aus
`scripts/n8n/n8nCloudIngressProbe.js`,
`scripts/n8n/n8nCloudIngressProbeObserver.js`,
`tests/n8nCloudIngressProbe.test.js` und
`docs/evidence/n8n-cloud-ingress-runtime-evidence.template.json`. Sie trennt
dokumentierte Plattformgarantien, Beobachtungen in einem exakt gepinnten
offiziellen OSS-Quellstand, Messungen im konkreten Tenant und workflowseitig
nicht beobachtbare Provider-/Ingress-Eigenschaften. Diese Evidenzklassen dürfen
einander nicht ersetzen. Vektor- und variable Messgates besitzen exakt `PASS`,
`FAIL` oder `UNPROVEN`; `FAIL` hat Aggregationsvorrang. Selbst ein vollständiger
Test-URL-Tenantmessstatus `PASS` öffnet keinen Planungsschritt. ADR 0022
ergänzte und blockierte ADR 0019, ersetzte ihn aber nicht. ADR 0023 nimmt die
geforderte Neubewertung nun formal vor und ersetzt ADR 0019, ohne einen
Evidence-Befund zu löschen oder in `PASS` umzudeuten.

Öffentlicher Referenzpunkt ist das offizielle Stable-Release
[`n8n@2.35.4`](https://github.com/n8n-io/n8n/releases/tag/n8n%402.35.4) am
Commit `d2ce3c084c228622c2ffe7c245d25870430e18a9`. Dessen
[Body-Reader](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/middlewares/body-parser.ts)
setzt für `Content-Encoding: gzip` Gunzip und für `deflate` Inflate vor
`req.rawBody`; das zugehörige Wire-Byte-Gate ist `FAIL`. `br` fällt in dieser
Funktion zwar in den unveränderten Defaultpfad, ist dadurch aber weder als
Cloud- noch als Tenantgarantie bewiesen. Die
[Header Authentication](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/nodes-base/nodes/Webhook/utils.ts)
entfernt den erfolgreich verglichenen Wert nicht aus `req.headers`, und der
[Standard-Webhook-Output](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/nodes-base/nodes/Webhook/Webhook.node.ts)
reicht diese Header in Runtime-Execution-Daten weiter; auch dieses Teilgate ist
`FAIL`. Das resultierende aktuelle Aktivierungsgate ist `FAIL`. Da kein
Cloudrequest ausgeführt wurde, bleibt die konkrete Tenantmessung unabhängig
davon `UNPROVEN`.

Der commitgebundene
[`test-webhooks.ts`-Quellanker](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/webhooks/test-webhooks.ts)
dient ausschließlich der Inspektion des getrennten Test-Webhook-Lifecycles;
aus ihm werden keine nicht dokumentierten Symbol-, Zeilen- oder
Tenantgarantien abgeleitet.

Die feste Probe-Registry besitzt exakt 32 synthetische Vektoren. Sie
deckt gültiges und ungültiges JSON, ASCII, Mehrbyte- und Vierbyte-UTF-8, BOM,
NFC/NFD, CRLF/Whitespace, NUL, vier ungültige UTF-8-Sequenzen,
65.535-/65.536-/65.537-Byte-Grenzen einschließlich Mehrbytegrenzfall,
fehlendes beziehungsweise `identity`-/`gzip`-/`deflate`-/`br`-Encoding,
komprimierte Expansion über 65.536 Bytes, fehlende/falsche/korrekte/doppelt
gleiche Header Authentication sowie beide Reihenfolgen des widersprüchlichen
Doppelheaders und `Content-Length`-/Chunked-Framing ab. Der alte
`auth-duplicate-conflicting` entfällt; verbindlich sind
`auth-duplicate-conflicting-correct-first-wrong-last` und
`auth-duplicate-conflicting-wrong-first-correct-last`. Alle Auth-Bodies sind
identisch, absent/identity und `Content-Length`/Chunked teilen jeweils exakt
denselben Body, die Größenfixtures sind A-Präfix-kompatibel und die
`gzip`-/`deflate`-/`br`-Payloads besitzen denselben dekomprimierten Sentinel;
der Expansionsvektor bleibt getrennt. Es werden nur feste
synthetische Bytes verwendet;
PromptVault, LearningHub und LichtwaldLog werden nicht gelesen.

Der kanonische und vorgesehene Operator-Laufweg für einen One-shot ist
`npm run probe:n8n:cloud:test -- --vector <probeId>`; das Paket-Script bindet
intern exakt `node scripts/n8n/n8nCloudIngressProbe.js --run`. Import, bloße
Factory-Erzeugung, Produktions-Build, Dev-Server und `bundle:n8n:check` binden
keinen Real-HTTPS-Transport. Ein direkter CLI-Lauf verlangt unverändert
`--run` und exakt eine allowlist-validierte `--vector`-Option. Tests verwenden
ausschließlich Doubles und für den echten HTTP/1.1-Wirenachweis kontrolliertes
TCP-Loopback auf `127.0.0.1`, nie einen externen Endpoint.
Endpoint und Wegwerfsecret werden ausschließlich aus
`GOLDENDAWN_N8N_CLOUD_PROBE_ENDPOINT` und
`GOLDENDAWN_N8N_CLOUD_PROBE_SECRET` gelesen; das Secret ist kein CLI-Argument.
Der Runner akzeptiert nur HTTPS ohne URL-Userinfo, Query oder Fragment und
ausschließlich kanonische Test-URL-Pfade der Form
`/webhook-test/<segment>[/<segment>…]`. Jedes nicht leere Suffixsegment besteht
nur aus ASCII-Buchstaben, Ziffern, Bindestrich oder Unterstrich.
Prozentkodierungen, rohe oder kodierte Backslashes, Steuerzeichen, leere
Segmente sowie `.` und `..` werden vor der Transportauflösung abgelehnt. Der
Runner verwendet eine feste 5.000-ms-Deadline und höchstens 16 KiB
Responsebytes, folgt keinen Redirects und führt keine automatischen Retries
aus. Nach vollständiger Argument-, Konfigurations- und ID-Validierung sendet
ein Lauf genau einen Vektor in genau einem Request und stoppt. Vor jedem
weiteren Vektor muss der Operator den Test-Webhook manuell neu registrieren
beziehungsweise in Listening versetzen. Sweep, Autoregister und Production-
URL-Runner oder -Messpfad existieren nicht. Die Factory besitzt nur einen
explizit injizierten Transport; Real-HTTPS wird ausschließlich im CLI-Adapter
nach vollständiger Vorvalidierung gebunden.

Der importfreie Code-Node-Observer verwendet ausschließlich die offiziell
dokumentierte API
[`this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName)`](https://docs.n8n.io/build/code-in-n8n/cookbook/code-node/get-the-binary-data-buffer/)
und gibt ausschließlich `probeId`, `exactMatch`, `receivedByteLength`,
`strictUtf8Outcome`, `authorizationHeaderPresence` und
`contentEncodingOutcome` aus. Er ruft weder SyncContract, Request Boundary,
Boundary-Bundle noch `SyncAgent` auf und parst keinen fachlichen SyncRequest.
Observerresponse, Runnerresult und persistierbare Evidenz sind geschlossene
allowlist-basierte Verträge; unbekannte Felder, Accessors, Symbole, Typen oder
Semantik werden fail-closed abgelehnt und nie als Teil-PASS interpretiert.
Endpoint, Tenantdomain, URL-Pfad, Secret, Credential-ID,
Authorization-Wert/-Header, Bodies, Binärbytes, Hex und Base64 dürfen weder in
Console, Fehler, Export noch Evidenz gelangen.

`executionDataSettings` besitzt exakt `saveDataErrorExecution`,
`saveDataSuccessExecution`, `saveManualExecutions`, `executionDataPruning` und
`readTimeRedaction`. Aktivierte Read-time-Redaction ist notwendig, aber nicht
hinreichend; laut offizieller
[n8n-Dokumentation](https://docs.n8n.io/deploy/host-n8n/configure-n8n/security/redact-execution-data/)
verändert sie gespeicherte Daten nicht. Unsichere tatsächlich beobachtete
Save-/Redaction-Einstellungen ergeben `FAIL`, fehlende Angaben `UNPROVEN`. Die
eingecheckte Evidenzvorlage enthält keine behauptete Messung.

Ein `providerExecutionEvidenceStatus: PASS` verlangt zusätzlich nicht-nullische
Werte für `tenantAlias`, `observedAt`, `timezone`, `n8nBuild`,
`webhookNodeTypeVersion` und `secretFreeWorkflowSha256`; `plan` und `region`
dürfen `null` bleiben. Fehlt mindestens eine dieser sechs Pflichtbindungen,
bleibt der Providerstatus ohne bekannten Widerspruch `UNPROVEN`. Ein bekannter
unsicherer Setting-, Header-, Count- oder Attributionswert behält unabhängig
davon mit `FAIL` Vorrang.

Das persistierbare Schema 1 besitzt exakt `schemaVersion`, `endpointKind`,
`tenantAlias`, `observedAt`, `timezone`, `plan`, `region`, `n8nBuild`,
`webhookNodeTypeVersion`, `secretFreeWorkflowSha256`,
`executionDataSettings`, `vectors`, `testUrlTenantMeasurementStatus`,
`stableOssCompatibility`, `providerExecutionEvidenceStatus`,
`productionUrlMeasurementStatus`, `activationDecision`,
`redactedProviderReference` und `cleanupConfirmed`; `overallGate` existiert
nicht. `endpointKind: test`, `stableOssCompatibility: FAIL`,
`productionUrlMeasurementStatus: UNPROVEN` und `activationDecision: FAIL` sind
in Schema 1 unveränderlich. `activationDecision: PASS` wird immer abgelehnt;
eine Änderung der festen Werte benötigt einen neuen ADR und eine neue
Schemaversion. Ohne Lauf sind Test-URL-Tenant- und Providerstatus `UNPROVEN`,
und `cleanupConfirmed` ist `false`.

Jedes der 32 Vektorergebnisse besitzt exakt `probeId`,
`expectedByteLength`, `observedByteLength`, `expectedSha256`, `httpStatus`,
`observerCallCount`, `workflowExecutionCount`, `uniqueVectorAttribution`,
`exactMatch`, `strictUtf8Outcome`, `authorizationHeaderPresence`,
`contentEncodingOutcome` und `gate`. Counts und Beobachtungswerte sind nullable
und werden nie aus HTTP-Antworten erfunden. Sobald für einen `2xx`-Pfad eine
geschlossene erfolgreiche Observerresponse übernommen wurde, muss jeder
nicht-nullische Count exakt `1` sein; ein bekannter Wert `0` oder größer als
`1` ist `FAIL`. Bei normalen und komprimierten erfolgreichen Observerpfaden
darf `null` weiterhin „noch nicht separat gebunden“ bedeuten. Frühe eindeutig
gebundene Auth-Ablehnungen mit `400`, `401` oder `403` und Encoding-Ablehnungen
mit `400` oder `415` dürfen unverändert 0/0 verwenden; der Status allein bleibt
`UNPROVEN`. Korrektes Auth verlangt unverändert 1/1, eindeutige Zuordnung und
Headerpräsenz `absent`. Encoding verwendet nur `match`, `mismatch` oder
`unavailable`; ein exakter Body allein genügt nicht. Ein einzelnes Vektor-
`PASS` kann weder den Test-URL-Tenantgesamtstatus noch die feste
Aktivierungsentscheidung öffnen.

Nach Abschluss der lokalen Foundation gilt ein verbindlicher Stopp. ADR 0023
autorisiert keinen Cloudzugriff und keine Tenantmessung; die Foundation und ihr
Runner bleiben standardmäßig netzwerkinaktiv. Vor jeglicher Vorbereitung oder
Ausführung einer neuen Tenantmessung für einen späteren optionalen n8n-
`WorkflowProvider` müssen ein neuer n8n-Adapter-ADR angenommen und eine neue
adapterbezogene Evidenz-Schemaversion festgelegt sein. Erst danach benötigen
die Anlage des temporären Workflows, das Wegwerfcredential, jeder einzelne
synthetische externe Test-URL-One-shot sowie der vorab definierte Cleanup und
die Entfernung der Cloudartefakte jeweils eine eigene ausdrückliche Freigabe.
Vor jedem freigegebenen Vektor muss der Test-Webhook manuell neu registriert
beziehungsweise in Listening versetzt werden. Ohne angenommenen neuen ADR und
festgelegte neue Schemaversion gibt es keinen Workflow, kein Credential und
keinen Test-URL-Verkehr. Ein Production-URL-Runner oder -Messpfad existiert
nicht. Auch jede Supportanfrage ist unabhängig davon separat freizugeben; die
vorbereiteten Fragen einschließlich der informativen Frage nach Test-/
Production-URL-Unterschieden wurden nicht gesendet, dürfen nur eine spätere
Entscheidung vorbereiten und autorisieren weder Tenantvorbereitung oder
-ausführung, Adapteraktivierung noch Productionlauf.
Jedes `FAIL` oder `UNPROVEN` erzwingt sofortigen Stopp und Cleanup und hält jede
n8n-Aktivierung geschlossen. Auch ein Test-URL-Tenantmessstatus `PASS` lässt
`activationDecision: FAIL` in Schema 1 unverändert. Webhook-, Credential- und
n8n-Adapter-Komposition bleiben jeweils eigene später freizugebende Slices;
der lokale `SyncAgent` wird nicht in n8n komponiert.

Die gezielte n8n-Cloud-Evidence-Suite besteht mit 26/26 Tests. Bundle und
Boundary bestehen unverändert mit 115/115 Tests; die kombinierte Sync-Suite
einschließlich der Evidence-Foundation besteht mit 279/279 Tests und die
vollständige serielle Gesamtsuite mit 1212/1212 Tests. Alle vier Läufe besitzen
0 Fehlschläge, 0 Skips und 0 Todos. Beide neuen Skripte bestehen die
Syntaxprüfung, der Produktions-Build transformiert weiterhin exakt 46
Browsermodule und der schreibfreie Bundle-Check meldet keinen Drift.

Der Generate-Modus prüft den kanonischen Repository-Root, den Zielordner und
beide festen Outputpfade vor jedem Write auf Containment, von Node erkannte
symbolische Links und Junctions sowie `realpath`-Abweichungen. Er verwendet
unvorhersagbar benannte, exklusiv angelegte Tempdateien im verifizierten
Zielordner, prüft deren Identität und Bytes, ersetzt zuerst das Artefakt und
zuletzt das Manifest und bereinigt weiterhin identitätsgleich zuordenbare
Tempdateien. Ein kontrollierter Abbruch zwischen beiden Replaces hinterlässt
ein vom Checkmodus abgelehntes Mischpaar. Dies ist dennoch keine atomare
Paartransaktion, keine Power-Loss- oder Single-Writer-Garantie. Die portable
Node-API attestiert nicht jeden Windows-Reparse-Tag; Schutz gegen einen
bösartigen gleichzeitigen Reparse-Austausch wird nicht behauptet.

Die mutationsgerichtete Testhärtung belegt zusätzlich die reale Validierungs-
und Freeze-Reihenfolge für Requests und Gateway-Responses, die unveränderte
UTF-8-Größenprüfung vor jeder Normalisierung und Parserauflösung, einen
Console-stillen Erfolgspfad, exakt einen Dependency-Versuch nach einem Throw
sowie vollständig frische Fehlergraphen auch innerhalb desselben
`INVALID_JSON`-Profils. Globale Instrumentierungen laufen mit
`concurrency: false` und werden im `finally` restauriert.

Die gezielte Boundary-Suite besteht mit 54/54 Tests unter dem exakt geforderten
`node --test tests/syncGatewayRequestBoundary.test.js`. Boundary plus
SyncContract bestehen mit 99/99, Boundary plus SyncContract plus SyncService
mit 142/142 und die Gesamtsuite mit 1075/1075 Tests; alle vier Läufe besitzen 0
Fehlschläge, 0 Skips und 0 Todos. Der Produktions-Build ist erfolgreich und
transformiert exakt 46 Module.

Die gezielte Local-SyncGateway-Suite besteht mit 50/50 Tests unter
`node --test tests/localSyncGatewayHttpServer.test.js`. Zusammen mit
SyncGateway Request Boundary, SyncContract und SyncService bestehen 192/192
Tests; die vollständige serielle Gesamtsuite besteht mit 1125/1125 Tests. Alle
drei Läufe besitzen 0 Fehlschläge, 0 Skips und 0 Todos und verwenden für das
Gateway ausschließlich synthetische Werte und Loopback-Kommunikation. Der
Produktions-Build ist weiterhin erfolgreich und transformiert exakt 46
Browsermodule. Paketversion `0.2.2`, Tag `v0.2.2` und Release `v0.2.2` bleiben
unverändert.

Der zuvor abgeschlossene Generated-n8n-Boundary-Bundle-Slice wurde über
Syntaxprüfung, gezielte
Generator-/Integritäts-/Snapshot-/ABA-/Outputpfad-/Paritäts-/Mutationstests,
die bestehenden Sync-Suites, die vollständige serielle Suite,
Produktions-Build und den schreibfreien `bundle:n8n:check`-Modus geprüft. Die
gezielte Bundle-Suite besteht mit 61/61 Tests; Bundle zusammen mit der
SyncGateway Request Boundary besteht mit 115/115 Tests. SyncContract,
SyncService, Boundary, Local SyncGateway und Bundle bestehen kombiniert mit
253/253 Tests; die vollständige serielle Gesamtsuite besteht mit 1186/1186
Tests. Alle vier Läufe besitzen 0 Fehlschläge, 0 Skips und 0 Todos.
Der Produktions-Build ist erfolgreich und transformiert weiterhin exakt 46
Browsermodule; der Bundle-Check meldet keinen Drift.

Die verbindliche Zieltopologie ist browserinitiiert und setzt den lokalen
`SyncAgent` vor jeden optionalen Provider:

```text
GoldenDawn-Browser
  → SyncService
  → künftiger lokaler SyncTransport
  → lokales SyncGateway auf GD-WS01
  → lokaler SyncAgent
      ├→ zunächst: lokaler deterministischer syncTest-Handler
      ├→ später optional: capability-spezifischer ModelProvider
      │   ├→ OpenAI-Adapter
      │   └→ lokaler Modelladapter
      └→ später optional: capability-spezifischer WorkflowProvider
          └→ n8n-Adapter
  → validierte normale SyncResponse
```

Die Vertrauensgrenzen sind verbindlich in vier Zonen getrennt:

- **Zone A – Browser:** unvertrauenswürdig, ohne Secrets, erzeugt nur den
  geschlossenen `syncTest` und wählt weder Provider, Modell, Workflow, Endpoint
  noch Umgebung;
- **Zone B – lokales SyncGateway:** autoritative Raw-Wire-, HTTP-, UTF-8- und
  Boundary-Grenze ohne Agenten-, Modell- oder Fachlogik;
- **Zone C – lokaler SyncAgent:** autoritative lokale Policy-, Validierungs-,
  Routing- und Responsegrenze mit fester Aktions-Allowlist;
- **Zone D – optionale externe oder lokale Provider:** standardmäßig
  deaktiviert, nicht Bestandteil des aktuellen `syncTest` und nur über
  capability-spezifische Adapter erreichbar.

Das lokale SyncGateway ist dabei kein Agent, keine Fachlogik, kein allgemeines
Backend, kein Storage, kein Ersatz für den `SyncAgent` und keine UI-Komponente.
Es bleibt die autoritative Raw-Wire-, HTTP-, UTF-8- und Boundary-Grenze und darf
ausschließlich die validierte defensive Requestprojektion an den lokalen
`SyncAgent` weitergeben. Browser-Raw-Body, Browserheader, URL, Query und
ursprüngliche Serialisierung werden niemals an einen Provider weitergeleitet.

Der lokale `SyncAgent` wird die autoritative Policy-, Defense-in-depth-
Validierungs-, Routing- und Responsegrenze des Agentensystems. Er akzeptiert
ausschließlich einen bereits begrenzten und validierten Request, verwendet eine
feste Aktions-Allowlist und erzeugt sowie validiert die normale korrelierte
SyncResponse lokal. Der erste `syncTest`-Handler bleibt vollständig lokal,
deterministisch, synthetisch, nebenwirkungsfrei, modellfrei und providerfrei.
Er ruft keinen `ModelProvider`, `WorkflowProvider`, n8n-, OpenAI- oder sonstigen
externen Adapter auf und setzt keinen davon als Dependency voraus.

Der Browser bestimmt weder Fachagent, Provider, Modell, Workflow, Endpoint,
Umgebung noch Berechtigungen. Provideroutput bleibt unvertrauenswürdig;
Modelloutput darf niemals Berechtigungen, Routing, Providerwahl oder
Toolausführung bestimmen. Der erste Implementierungsslice darf den lokalen
`SyncAgent` nur als logisch getrennte, injizierte serverseitige Komponente im
bestehenden lokalen Prozess vorsehen. ADR 0023 autorisiert keinen zweiten
Listener, keine IPC-Grenze und keinen zusätzlichen lokalen Netzwerkdienst.

Das reproduzierbar generierte und automatisiert auf Integrität, Parität und
Mutationen geprüfte n8n-Boundary-Artefakt bleibt implementiert, aber nicht
komponiert oder aktiviert. Der aktuelle Stable-OSS-Status `FAIL`, die
Tenantmessung `UNPROVEN` und `activationDecision: FAIL` halten n8n geschlossen.
Der Browser terminiert keinen eingehenden öffentlichen Webhook. Der lokale
`SyncAgent` wird später im AgentHub dargestellt. Verbindungen, optionale
Provideradapter und der einzige `syncTest`-Auslöser werden später im
AutomationHub dargestellt. Diese Hub-Grenzen sind aktuell nur dokumentiert.

## Lokale Modulgrenzen für v0.2.x

### LearningHub Local MVP in v0.2.1

- Der LearningHub ist kein allgemeines Learning-Management-System. Seine
  verbindliche Struktur lautet `LearningHub → LearningModule → LearningChapter
  → LearningNode`.
- Schema 2 unterstützt mehrere nutzerkonfigurierte LearningModules direkt im
  `modules`-Array. Ein neuer Hub darf leer sein; persistierbare Module besitzen
  mindestens ein Kapitel. Kapitel dürfen noch keine LearningNodes enthalten.
- Alle Kapitel sind implizit trackbar. LearningNodes sind selbst erstellte
  Textkarten; Course, Unit, Elternverweise, Knotentypen und `isTrackable` sind
  nicht Teil des Vertrags.
- Kapitelabschluss und daraus abgeleiteter Modulfortschritt verwenden einen vom
  Inhaltsvertrag getrennten Fortschrittsvertrag und sind lokal bedienbar.
  Testkompetenz bleibt ein eigenes späteres Konzept. 100-%-Module bleiben
  erhalten und bedienbar sowie später testbar.
- Lokale Notizen und Zusammenfassungen gehören zum LearningHub-MVP, sind über
  den vorhandenen Controller und die View bedienbar und bleiben hinter den
  vorgesehenen Service- und Storage-Grenzen.
- Private Lerninhalte und synthetische Portfolio-Demos bleiben klar getrennt.
  Öffentliche Beispieldaten dürfen keine privaten Inhalte ableiten oder
  nachbilden.
- Der implementierte lokale LearningTest-Fluss lautet:

```text
LearningHubView
  → LearningHubController
      → LearningTestService
          ├→ LearningHubService                Referenzprüfung
          ├→ LearningTestBankStorage
          │    → StorageAdapter
          │    → localStorage
          ├→ LearningTestAttemptStorage
          │    → StorageAdapter
          │    → localStorage
          └→ LearningTestEngine                reine Deterministik
```

Die `LearningTestEngine` arbeitet rein und deterministisch mit den vollständig
validierten Fragen der getrennten LearningTestBank. Automatisierte Tests
verwenden ausschließlich unabhängig erfundene synthetische Inhalte; private
Produktionsfragen werden nicht als Demo-Daten bereitgestellt. Die Oberfläche
kennzeichnet diesen Zustand sichtbar als `Lokaler Mock-Test`; er verwendet
keine KI und darf nicht als KI-Test beschrieben werden. Laufende Sessions
bleiben nur im Arbeitsspeicher. `cancelModuleTest` entfernt ausschließlich eine
sicher abbrechbare Session mit `status: testCancelled` und `changed: true`; der
Abbruch erzeugt keinen Attempt und führt weder Storage-, ID-, Uhr- noch
Dependency-Zugriffe aus. Unbekannte Sessions liefern `notFound` /
`testSessionNotFound`, laufende oder bereits vorbereitete Abgaben `conflict` /
`learningTestSubmissionInProgress` beziehungsweise
`learningTestPendingSubmission`, jeweils mit `changed: false` und ohne
Sessionmutation. Einmal vergebene Session-IDs bleiben auch nach einem Abbruch
für die Lebensdauer der Serviceinstanz reserviert. Der spätere externe
Testfluss lautet:

```text
LearningTestService
  → SyncService
  → künftiger lokaler SyncTransport
  → lokales SyncGateway auf GD-WS01
  → lokaler SyncAgent
  → TestAgent
```

Diese spätere private und fachlich weitergehende Capability ist durch ADR 0023
nicht autorisiert. Ein capability-spezifischer Model- oder WorkflowProvider
wäre auch dafür nur nach einer eigenen späteren Entscheidung zulässig. Vor der
Freigabe sind Contract, Identität, Berechtigung, Body-Binding, Replay,
Idempotenz und Datenschutz neu zu entscheiden.

Freitextbewertung und die Anbindung des TestAgent gehören erst zu `v0.5.0`.

### LichtwaldLog Local MVP in v0.2.2

- Implementiert sind der Schema-1-Vertrag, der reine Validator, die
  synthetischen Contract-Tests und die in ADR 0013 dokumentierte
  Contract-Entscheidung.
- Die private Storage-Foundation ist gemäß ADR 0014 umgesetzt. Zusammen mit
  Service-, Controller- und isolierter View-Foundation lautet der
  ausschließlich lokale Datenfluss
  `LichtwaldLogView → LichtwaldLogController → LichtwaldLogService → LichtwaldLogStorage → StorageAdapter → localStorage`.
  Der Storage verwendet den festen Key
  `goldendawn.lichtwaldLog.content.v1`, speichert den direkten Schema-1-Root als
  gemeinsamen Full-Snapshot und akzeptiert ausschließlich
  `dataOrigin: private`.
- Die getrennte synthetische Demo-Runtime ist gemäß ADR 0015 umgesetzt. Ihr
  Datenfluss lautet
  `LichtwaldLogView → LichtwaldLogController → LichtwaldLogDemoService → LichtwaldLogDemoStorage → In-Memory-Full-Snapshot → kanonische Demo-Factory`.
  Die Factory liefert jeweils einen frischen defensiv entkoppelten
  `dataOrigin: synthetic`-Snapshot mit genau fünf vollständig erfundenen
  Einträgen. Demo-Storage und Demo-Service importieren weder privaten Storage
  noch privaten Service und verwenden weder `StorageAdapter`,
  `localStorage`, `sessionStorage`, Browser-Key, Netzwerk noch
  Fallback. Eine Storage-Instanz lebt genau für die aktuelle
  Anwendungskomposition.
- `createLichtwaldLogService({ lichtwaldLogStorage, generateLichtwaldLogEntryId })`
  erhält den ID-Generator optional und liefert eine eingefrorene API mit exakt
  `loadLog`, `createEntry`, `updateEntry`, `deleteEntry` und
  `setFeaturedEntry`. `setFeaturedEntry(null)` entfernt den Fokus; eine
  zusätzliche Clear- oder Toggle-Operation existiert nicht.
- `createLichtwaldLogController({ lichtwaldLogService, lichtwaldLogView,
  scheduleTask, expectedDataOrigin })` liefert eine eingefrorene API mit exakt
  `open` und `close`. Fehlendes oder `undefined`
  `expectedDataOrigin` bedeutet exakt `private`; als explizite Werte sind
  ausschließlich `private` und `synthetic` zulässig. Die Herkunft bleibt
  für den Lifecycle fest und projiziert ausschließlich `runtimeMode: private`
  beziehungsweise `runtimeMode: syntheticDemo`.
  Der View-Port wird ausschließlich über `render(viewModel, actions)` und
  `unmount()` injiziert. Die isolierte Factory
  `createLichtwaldLogView(rootElement)` implementiert ihn und liefert eine
  eingefrorene API mit exakt den eigenen Data-Properties `render` und
  `unmount`. Jeder Render erhält dieselbe eingefrorene Action-API mit exakt:

```text
onRetryLoad
onSelectEntry
onBackToOverview
onOpenCreateEntryForm
onOpenUpdateEntryForm
onUpdateFormField
onSubmitForm
onCancelForm
onRequestDeleteEntry
onCancelDeleteEntry
onConfirmDeleteEntry
onSetFeaturedEntry
onChangeSearchQuery
onChangeCalendarDateFilter
onChangeTagFilter
onResetFilters
```

- Das reine Modul `lichtwaldLogSearch.js` exportiert ausschließlich
  `ALL_LICHTWALD_LOG_TAGS`, `LICHTWALD_LOG_SEARCH_QUERY_MAX_LENGTH`,
  `getLichtwaldLogFilterTags` und `filterLichtwaldLogEntries`. Die Suche trimmt
  nur äußere Query-Whitespace für den Vergleich, normalisiert kanonisch mit
  NFC und vereinheitlicht Groß-/Kleinschreibung mit `toLowerCase()`. Sie sucht
  anschließend literal und zusammenhängend ausschließlich in `calendarDate`,
  `title`, `text` und `tags[]`; interne Whitespaces bleiben bedeutungsvoll.
- `''` bedeutet für Datum und Tag jeweils keine Einschränkung. Andere
  Kalenderdatum-Filter werden mit `isValidCalendarDate` ohne `Date`- oder
  Zeitzonenumwandlung geprüft und exakt verglichen. Der Tagfilter vergleicht
  vollständige Tags nach NFC- und Case-Normalisierung. Tagoptionen stammen aus
  allen autoritativen Einträgen, werden nach dieser Identität dedupliziert und
  bewahren die erste gespeicherte Schreibweise sowie Entry- und Tag-Reihenfolge.
  Suche, Datum und Tag werden mit AND kombiniert; Ergebnisse werden nie
  sortiert oder gewichtet.
- Jeder View-Render baut einen frischen DOM-Baum ausschließlich mit sicheren
  DOM- und Formcontrol-APIs. Titel, Texte, Tags und Formwerte bleiben
  ungeparster Plain Text. Entry-IDs werden ausschließlich als unveränderte
  Ziele in Closures und renderlokalen Maps gehalten und gelangen weder in
  DOM-/ARIA-IDs, Selektoren noch View-eigene Meldungen. Die verlustfreie
  Mehrfeld-Tag-UI verwendet kein Komma-Parsing und bewahrt Entry- und
  Tag-Reihenfolge sowie Schreibweise.
- Der über `featuredEntryId` autoritativ fokussierte Eintrag wird in Übersicht
  und Detail als `Besonderer Lichtwaldmoment` präsentiert. Die Hervorhebung ist
  ausschließlich eine View- und CSS-Projektion der bestehenden Fokusreferenz.
  Sie führt keinen zweiten Zustand, keine zusätzliche API oder Persistenz ein
  und verändert weder die getrennten Runtime-Stacks noch die Dashboard-Shell.
  Im synthetischen Modus bleiben Herkunft und Reload-Verhalten sichtbar.
- Die isolierte View stellt Lade-, Leer-, Busy-, Erfolgs-, Notice-,
  Validierungs- und Fehlerzustände zugänglich dar, löst sämtliche
  Controller-Fokusziele nach dem DOM-Austausch kontrolliert auf und verwendet
  explizite Fokusendzustände statt eines Toggles. Sie projiziert weder Inhalt,
  Delete noch Fokus optimistisch. `unmount()` entfernt private DOM-Inhalte und
  verwirft ausschließlich flüchtige Fokus- und Caret-Metadaten. Das gekapselte
  CSS enthält responsive und Reduced-Motion-Regeln und ist über `src/main.js`
  in den Buildgraph eingebunden.
- Der Controller hält zusätzlich ausschließlich flüchtig `searchQuery`,
  `calendarDateFilter`, `selectedTag`, `availableTags`, `visibleEntryIds`,
  `hasActiveFilters` und `filteredEmptyState`. `entries` bleibt die vollständige
  autoritative UI-Projektion. Die Übersicht verwendet `visibleEntryIds`,
  während Detail und Formulare weiterhin aus dem vollständigen Snapshot
  aufgelöst werden. Alle neuen Werte und Arrays werden defensiv entkoppelt und
  tief eingefroren; sie sind keine Schema-1-Felder und werden nicht gespeichert.
- Der Controller hält ausschließlich eine flüchtige, validierte und defensiv
  entkoppelte UI-Projektion. Er prüft jeden Service-Snapshot vollständig mit
  `validateLichtwaldLog` und akzeptiert nur die bei der Komposition
  festgelegte exakte Herkunft. Der rohe
  Schema-1-Root wird nicht an die View weitergegeben. Storage bleibt die
  einzige veränderliche Wahrheit; der Service bleibt die autoritative
  fachliche Mutationsgrenze.
- Pro akzeptierter Lade- oder Mutationsintention ruft der Controller exakt eine
  passende Serviceoperation auf. Such- und Filteraktionen rufen dagegen weder
  Service, Storage, Adapter, ID-Generator noch Scheduler auf. Nach einer
  Mutation erfolgt kein zusätzlicher Load,
  und Inhalte oder Fokus werden nicht optimistisch verändert. Auswahl,
  Formularänderungen, Abbruch sowie Anfordern und Abbrechen einer
  Löschbestätigung bleiben service- und schreibfrei. Update- und Fokus-No-ops
  entscheidet ausschließlich der Service.
- Ziel-IDs werden im Controller exakt und case-sensitive gegen den aktuellen
  vertrauenswürdigen Snapshot aufgelöst. Ein Auswahlziel aus der Übersicht muss
  zusätzlich zur aktuell sichtbaren Ergebnismenge gehören. Fokus wird explizit
  als Ziel-ID oder
  `null` gesetzt; es gibt keine Toggle-Aktion. Entry- und Tag-Reihenfolge
  bleiben in den defensiven View-Projektionen unverändert.
- Controllerfehler und Statusmeldungen stammen ausschließlich aus statischen
  Allowlists. Private Inhalte, IDs sowie fremde Service-, Dependency- oder
  Exception-Meldungen werden nicht übernommen. Gültige Texte bleiben
  ungeparster, nicht vertrauenswürdiger Plain Text. Die isolierte View gibt sie
  ausschließlich über `textContent`, `createTextNode`, Formcontrol-Werte und
  feste Attribute sicher aus.
- Der Storage bleibt die einzige veränderliche Wahrheit. Jede gültige
  Serviceoperation lädt den aktuellen privaten Snapshot neu und der Service
  hält keinen langlebigen Cache. Ungültige Form- oder Ziel-ID-Eingaben werden
  vor Storage- und Generatorzugriffen abgelehnt.
- Kalenderdatum, Titel, Text und Tags werden an den Rändern getrimmt; interne
  Whitespaces und Zeilenumbrüche bleiben erhalten. Kalenderdaten werden ohne
  `Date`- oder Zeitzonenumwandlung geprüft. Ziel-IDs werden nicht automatisch
  getrimmt, sondern müssen bereits gültig sein und werden exakt sowie
  case-sensitive aufgelöst.
- Erstellen hängt einen Eintrag ohne Datumssortierung an. Vollständiges
  Bearbeiten erhält ID, Arrayposition und Fokusreferenz. Löschen erhält die
  Reihenfolge der übrigen Einträge und setzt beim fokussierten Ziel
  `featuredEntryId` atomar im selben Kandidaten auf `null`. Die
  Standard-ID verwendet `lichtwald-entry-${crypto.randomUUID()}`; ungültige,
  kollidierende oder werfende Generatorresultate sind gemeinsam auf fünf
  Versuche begrenzt.
- Jede echte Mutation validiert den vollständigen privaten Kandidaten und ruft
  an der Servicegrenze höchstens einmal `saveLichtwaldLog` auf. Inhaltlich
  identische Updates, ein bereits gesetzter Fokus und das Entfernen eines
  bereits leeren Fokus sind erfolgreiche schreibfreie No-ops. Nach einem
  fehlgeschlagenen Save bleibt ausschließlich der vorherige vertrauenswürdige
  Snapshot autoritativ.
- Servicefehler verwenden ausschließlich allowlist-basierte Status-Code-Paare
  und statische redigierte Meldungen. Private Eingaben, IDs, Tags,
  Generatorwerte sowie fremde Storage-, Adapter- oder Exception-Meldungen
  gelangen weder in `error` noch in Logs oder Console-Ausgaben.
- Der LichtwaldLog-Snapshot ist auf 500.000 tatsächlich serialisierte
  UTF-16-Codeeinheiten gemäß `String.length` begrenzt; exakt 500.000 sind
  erlaubt. Ein fehlender Key liefert schreibfrei einen frischen privaten
  Leerzustand. Synthetische, beschädigte, inkompatible oder übergroße Bestände
  werden weder repariert noch automatisch überschrieben. Größenprüfung,
  Serialisierung und Read-Preflight bleiben im Storage beziehungsweise
  `StorageAdapter`; der Preflight ist keine Transaktion, kein
  Compare-and-Swap und keine Multi-Tab-Sperre.
- `src/main.js`-Anbindung über den gemeinsamen `StorageAdapter`, Navigation und
  der vollständig über die Anwendung bedienbare CRUD- und Fokusfluss sind
  implementiert und real im Browser auf Desktop sowie bei exakt `390 × 844`
  geprüft. Lokale Suche sowie exakte Kalenderdatum- und Tagfilter sind
  implementiert und greifen nur auf die flüchtige Controller-Projektion zu.
  Die APIs von privatem Service, privatem Storage und gemeinsamem Adapter
  bleiben unverändert. Direkt nach dem privaten Modul ist die dauerhaft als
  `Synthetische Demo` gekennzeichnete getrennte In-Memory-Demo navigierbar.
  Beide Stacks besitzen eigene Instanzen, sind niemals gleichzeitig montiert
  und wechseln nur nach erfolgreichem Dirty-Guard-`close()`. Der geplante
  Implementierungsumfang ist vollständig abgeschlossen und geprüft; der
  annotierte Tag `v0.2.2` und das zugehörige GitHub Release wurden am
  `2026-08-02` veröffentlicht.
- Das Ziel des LichtwaldLog Local MVP bleibt ein lokales Journal-Modul mit CRUD
  für Einträge aus Titel, reinem Kalenderdatum, Text und Tags sowie lokaler
  Suche und Filtern.
- Kalenderdaten werden als `YYYY-MM-DD` gespeichert.
- Bilder werden nicht als Base64 in localStorage gespeichert.
- Private Einträge und synthetische Demo-Einträge bleiben technisch getrennt
  und sichtbar unterscheidbar. Es gibt keine Konvertierung, kein gemeinsames
  Seeding und keinen Fallback zwischen beiden Stacks.
- Externe Kommunikation, Webhooks, Synchronisierung, Agentenanbindung,
  Airtable und Weekly Review gehören nicht zu `v0.2.2` und dürfen für diesen
  Meilenstein nicht als umgesetzt dargestellt werden.

## Technischer Rahmen

- Verwende Vite mit Vanilla JavaScript, HTML und CSS.
- Führe React oder ein anderes Frontend-Framework nicht ohne dokumentierte
  Entscheidung ein.
- Führe zunächst kein allgemeines Fachbackend ein. Das mit ADR 0020 als lokale
  HTTP-/Wire-Foundation implementierte und von ADR 0023 übernommene SyncGateway
  bleibt eine schmale Transport- und Sicherheitsgrenze ohne Fachlogik oder
  Storage. Der lokale `SyncAgent` wird davon logisch getrennt als injizierte
  serverseitige Komponente vorgesehen; ein zweiter Listener, IPC oder weiterer
  lokaler Netzwerkdienst ist nicht autorisiert.
- Füge keine neue Abhängigkeit hinzu und ändere `package.json` nicht, sofern die
  Aufgabe dies nicht ausdrücklich erfordert.
- Bevorzuge Browser- und Plattformfunktionen gegenüber zusätzlichen Paketen.
- Verwende ES-Module.
- Halte Funktionen klein, eindeutig benannt und möglichst frei von verstecktem
  globalem Zustand.
- Vermeide vorzeitige Abstraktionen und generische Framework-Schichten ohne
  aktuellen Anwendungsfall.

## Zielarchitektur

Die vorgesehenen lokalen und externen Pfade verzweigen ausdrücklich:

```text
UI-Komponente
  → Anwendungs- oder Modulservice
      ├→ lokaler Storage-Adapter → localStorage
      └→ SyncService
          → künftiger lokaler SyncTransport
          → lokales SyncGateway auf GD-WS01
          → lokaler SyncAgent
              ├→ zunächst lokaler deterministischer syncTest-Handler
              ├→ später optional capability-spezifischer ModelProvider
              │   ├→ OpenAI-Adapter
              │   └→ lokaler Modelladapter
              ├→ später optional capability-spezifischer WorkflowProvider
              │   └→ n8n-Adapter
              └→ später TestAgent oder DataAgent
                  → Airtable ausschließlich über den DataAgent
```

Dabei gelten folgende Grenzen:

- UI-Komponenten sind für Darstellung und Benutzerinteraktion zuständig.
- UI-Komponenten greifen nicht direkt auf `localStorage`, Airtable, n8n,
  OpenAI oder andere externe Dienste zu.
- Storage-Adapter kapseln die lokale Speicherung vollständig.
- Services koordinieren Validierung, Speicherung und Synchronisation.
- Der Sync-Service ist die einzige vorgesehene Kommunikationsschicht des
  Frontends zum Agentensystem.
- Das lokale SyncGateway setzt ausschließlich Raw-Wire-, HTTP-, UTF-8- und
  Boundary-Policy durch und gibt nur die defensive validierte Projektion an den
  lokalen SyncAgent weiter.
- Der lokale SyncAgent ist die verbindliche Policy-, Validierungs-, Routing-
  und Responsegrenze des Agentensystems.
- Der SyncAgent greift nicht selbst auf Airtable zu, sobald der DataAgent
  eingeführt wurde, sondern übergibt strukturierte Datenaufträge an ihn.
- Der aktuelle `syncTest` wird lokal, deterministisch, synthetisch und ohne
  ModelProvider oder WorkflowProvider beantwortet.
- Provideradapter liegen ausschließlich hinter dem lokalen SyncAgent. Sie
  erhalten nur eine explizite minimierte neue Projektion und antworten niemals
  direkt an Browser oder SyncService.
- Provider, Modell, Workflow, Endpoint und Umgebung stammen ausschließlich aus
  vertrauenswürdiger lokaler Composition, nie aus Browserwerten, Requestfeldern
  oder Modelloutput.
- Echte Agentenlogik lebt später in lokalen serverseitigen Komponenten, nicht
  in Frontend-Komponenten oder zwingend in n8n.

## Agenten-Scope für Version 1

Version 1 verwendet ausschließlich diese drei Agentenrollen:

- `SyncAgent`: lokale zentrale Policy-, Kommunikations-, Validierungs-,
  Routing- und Responsegrenze. Er ist der einzige vorgesehene Einstiegspunkt
  des Dashboards in das Agentensystem und entscheidet, welcher Agent oder
  später welche lokal komponierte Provider-Capability eine Anfrage verarbeitet.
- `TestAgent`: fachlich der Prüfer für das Lernen. Er erstellt strukturierte
  Lerntests, bewertet Antworten und liefert nachvollziehbare Ergebnisse und
  Wiederholungshinweise. Er speichert Ergebnisse nicht selbst in Airtable.
- `DataAgent`: fachlich der Bibliothekar und zentrale Datenverwalter. Er
  verarbeitet strukturierte Lese- und Schreibaufträge und kapselt sämtliche
  Airtable-Zugriffe des Agentensystems.

Für Version 1 werden keine weiteren Agentenrollen geplant oder implementiert.
Neue Rollen werden erst nach Auswertung dieser drei Agenten in einer späteren
Version beschlossen und dokumentiert.

Der vorgesehene Ablauf für ein Lerntestergebnis lautet:

```text
Dashboard
  → SyncService
  → künftiger lokaler SyncTransport
  → lokales SyncGateway auf GD-WS01
  → lokaler SyncAgent
  → TestAgent
  → SyncAgent
  → DataAgent
  → Airtable
```

Der `TestAgent` konzentriert sich auf Prüfungslogik, der `DataAgent` auf
Datenzugriffe und der `SyncAgent` auf Kommunikation und Routing. Diese
Verantwortlichkeiten dürfen nicht vermischt werden.

Agentennamen verwenden PascalCase und enden mit `Agent`. Maschinenlesbare Typen
und Aktionen verwenden stabile englische Bezeichner in `camelCase` oder
`snake_case`; innerhalb eines Vertrags darf nicht zwischen beiden Stilen
gewechselt werden.

## Daten- und Sync-Verträge

Externe Requests müssen einem dokumentierten Vertrag folgen. Ein vorgesehener
Basis-Request lautet:

```json
{
  "version": "1.0",
  "action": "syncTest",
  "source": "goldendawn-os",
  "requestId": "req_example_001",
  "timestamp": "2026-08-03T12:00:00.000Z",
  "payload": {}
}
```

Regeln:

- Ändere Vertragsfelder nicht stillschweigend.
- Dokumentiere Verträge und Änderungen in `docs/data-contracts.md`.
- Validiere Pflichtfelder an Systemgrenzen.
- Für den aktuellen `syncTest`-Vertrag sind alle sechs Felder verpflichtend;
  zusätzliche Felder und ein Client-Modus sind nicht erlaubt.
- Lehne unbekannte Aktionen im aktuellen `syncTest`-Vertrag fail-closed ab. Ein
  späterer Vertrag darf `unknown` nur nach ausdrücklicher Dokumentation als
  kontrollierten Wert einführen.
- Verwende ISO 8601 für Zeitstempel und UTC für systemübergreifende Ereignisse.
- Speichere reine Kalenderdaten als `YYYY-MM-DD` und formatiere sie erst für die
  Anzeige. Parse reine Datumswerte nicht unnötig mit `new Date(...)`, um
  Zeitzonenverschiebungen zu vermeiden.
- Verwende stabile IDs. Sichtbare Texte oder Array-Positionen sind keine
  dauerhaften IDs.

## Storage-Regeln

- Verwende für lokale MVP-Daten `localStorage` nur hinter einem Storage-Adapter.
- Jede Domäne erhält einen eindeutig benannten Storage-Key.
- Beschädigte oder unerwartete JSON-Daten dürfen die Anwendung nicht zum
  Absturz bringen.
- Verwende sichere Fallback-Werte und melde relevante Fehler nachvollziehbar.
- Vermische Daten verschiedener Module nicht in einem unstrukturierten
  Sammelobjekt.
- Speichere PromptVault-Suchbegriffe und -Filterzustände nicht. Persistente
  Favoriten, Inhaltsänderungen und Wiederherstellungen verwenden ausschließlich
  den bestehenden Datenfluss über `PromptService`, `PromptStorage` und
  `StorageAdapter` sowie den Storage-Key `goldendawn.promptVault.v1`.
- PromptVault verwendet für neue Schreibvorgänge den Envelope mit
  `schemaVersion: 2`. Das Versionsarray bleibt fachlich unveränderlich und wird
  nur um neue Versionen ergänzt; eine Wiederherstellung überschreibt keine
  frühere Fassung.
- Normalisiere gültige Schema-1-Daten nur im Arbeitsspeicher. Schreibe den
  Schema-2-Envelope erst bei einer erfolgreichen Mutation und rekonstruiere
  keine unbekannte frühere Historie.
- Plane Migrationen ein, bevor ein bestehendes Datenformat geändert wird.
- Behandle lokale Browserdaten nicht als Synchronisierung, geräteübergreifende
  Speicherung oder Cloud-Sicherung.
- Mock-Daten müssen klar als Mock- oder Demo-Daten erkennbar sein.

## Sicherheit und Datenschutz

- Das Repository enthält ausschließlich Quellcode, Dokumentation und klar
  gekennzeichnete synthetische Demo-Daten.
- Private Lern-, Prompt-, Reflexions-, Gesundheits- oder andere persönliche
  Nutzerdaten gehören nicht in das Repository. Lokale Nutzerinhalte bleiben im
  aktuellen Browserprofil und werden nicht synchronisiert.
- `localStorage` ist unverschlüsselt und weder Secret-Store noch
  Cloud-Sicherung oder geräteübergreifende Speicherung.
- Ein öffentlich sichtbares Repository enthält keine produktiven Webhooks,
  Credentials, privaten Airtable-IDs oder persönlichen Daten.
- Öffentliche Vite-Konfiguration darf nur nicht-sensitive Werte enthalten;
  jeder `VITE_*`-Wert ist im Browser-Build öffentlich.
- Speichere niemals API-Schlüssel, Tokens, Passwörter oder Credentials im
  Frontend, Repository oder in Beispieldaten.
- Behandle alle `VITE_*`-Variablen als öffentlich, da sie in den Frontend-Build
  gelangen können.
- Greife aus dem Frontend nicht direkt auf Airtable oder OpenAI zu.
- Committe keine produktiven Webhook-URLs, wenn sie als Zugang oder Schutzmerkmal
  dienen können.
- Validiere und begrenze Payloads im Frontend, am lokalen SyncGateway und
  defense-in-depth erneut im lokalen SyncAgent. Begrenze, projiziere, validiere
  und korreliere spätere Provideroutputs lokal, bevor sie weiterverwendet
  werden.
- Protokolliere keine Secrets oder unnötigen personenbezogenen Inhalte.
- Verwende für die spätere öffentliche Demo ausschließlich bereinigte,
  synthetische Seed-Daten.
- Private und öffentliche Daten benötigen getrennte Konfigurationen,
  Datenquellen und Deployments.
- Ergänze Sicherheitsentscheidungen in `docs/security.md`.

## UI- und Qualitätsprinzipien

- Gestalte ruhig, klar, responsiv und zugänglich.
- Verwende semantisches HTML und verständliche Beschriftungen.
- Tastaturbedienung und sichtbare Fokuszustände dürfen nicht verloren gehen.
- Lade-, Leer-, Erfolgs- und Fehlerzustände müssen bewusst gestaltet werden.
- Vermeide blockierende Browserdialoge, wenn ein zugänglicher UI-Zustand
  sinnvoller ist.
- Verwende UTF-8 und schreibe deutsche Umlaute nativ.
- Halte Design-Tokens und wiederkehrende Werte zentral, sobald echte
  Wiederverwendung entsteht.
- Behaupte in der Oberfläche oder Dokumentation keine Funktion als fertig, die
  nur geplant oder gemockt ist.

## Benennung und Struktur

- JavaScript-Variablen und Funktionen: `camelCase`.
- Konstanten mit globaler Bedeutung: `UPPER_SNAKE_CASE`.
- Agenten und fachliche Rollen: `PascalCase`.
- Modulordner: `kebab-case`.
- Service-Dateien: beispielsweise `syncService.js`.
- Storage-Dateien: beispielsweise `promptStorage.js` oder
  `storageAdapter.js`.
- Funktionen verwenden handlungsorientierte Namen wie `loadPrompts`,
  `savePrompt` oder `validateSyncRequest`.
- Vermeide nichtssagende Namen wie `data`, `item`, `handler` oder `utils`, wenn
  ein präziser fachlicher Name möglich ist.

## Dokumentation

- `README.md` beschreibt den öffentlich verständlichen Projektstand.
- README.md records project-foundation milestones and published releases only.
  Unreleased slices and internal development steps belong in CHANGELOG.md,
  docs/roadmap.md, and the relevant ADRs.
- `docs/architecture.md` beschreibt Komponenten, Datenfluss und Systemgrenzen.
- `docs/roadmap.md` enthält Phasen und überprüfbare Ergebnisse.
- `docs/security.md` dokumentiert Sicherheits- und Datenschutzregeln.
- `docs/data-contracts.md` enthält Request-, Response- und Datenformate.
- `docs/decisions/` enthält Architecture Decision Records für wesentliche
  Entscheidungen.
- Aktualisiere Dokumentation, wenn eine Änderung Architektur, Verträge,
  Sicherheit, Setup oder sichtbaren Projektstatus betrifft.
- Dokumentiere Entscheidungen und Gründe, nicht nur das Endergebnis.

## Arbeitsweise für Coding-Agenten

Vor einer Änderung:

1. Lies die relevanten Dateien und prüfe den aktuellen Projektstand.
2. Berücksichtige vorhandene Nutzeränderungen und fasse sie nicht ohne Grund an.
3. Bestimme die kleinste zusammenhängende Änderung, die die Aufgabe erfüllt.
4. Weise auf einen Konflikt mit diesen Regeln hin, bevor du davon abweichst.

Während einer Änderung:

1. Ändere nur Dateien, die für die Aufgabe notwendig sind.
2. Führe keine unaufgeforderten Großrefactorings durch.
3. Bewahre bestehendes Verhalten, sofern die Aufgabe keine Änderung verlangt.
4. Kapsle neue Datenzugriffe hinter Services oder Adaptern.
5. Ergänze robuste Fehler- und Leerzustände.

Nach einer Änderung:

1. Führe mindestens `npm run build` aus.
2. Führe vorhandene relevante Tests und statische Prüfungen aus.
3. Prüfe `git diff` und `git status` auf unbeabsichtigte Änderungen.
4. Berichte knapp über geänderte Dateien, Verhalten, Prüfungen und verbleibende
   Grenzen.
5. Schlage bei Bedarf einen Branch-Namen, eine Commit-Nachricht und die
   passenden Git-Befehle vor, führe sie aber nicht selbst aus.

## Git-Konventionen

- Git-Operationen mit Repository-Wirkung bleiben manuell bei Jan.
- Coding-Agenten führen niemals selbstständig `git commit`, `git push`,
  `gh pr create`, Merge-, Tag- oder Release-Befehle aus.
- Coding-Agenten dürfen lesende Befehle wie `git status`, `git diff` und
  `git log` zur Prüfung verwenden.
- Nach einer fertigen Änderung berichtet der Coding-Agent den geprüften Stand
  und schlägt passende manuelle Befehle vor.
- Arbeite für zusammenhängende Änderungen in einem eigenen Branch.
- Verwende kleine, thematisch klare Commits.
- Bevorzuge Conventional-Commit-Präfixe:
  `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
- Vermische Dokumentation, Refactoring und neue Funktionalität nicht unnötig in
  einem Commit.
- Nutze Pull Requests, um Zweck, Änderungen, Tests und Grenzen sichtbar zu
  machen.
- Committe keine generierten Secrets, lokalen Konfigurationen, Logs oder
  persönlichen Daten.

## Definition of Done

Eine Aufgabe ist erst abgeschlossen, wenn:

- die beschriebenen Anforderungen erfüllt sind;
- die Architekturgrenzen eingehalten wurden;
- keine Secrets oder privaten Echtdaten hinzugefügt wurden;
- Fehler-, Leer- und relevante Randzustände berücksichtigt wurden;
- UTF-8 und stabile Datenformate erhalten bleiben;
- der Produktions-Build erfolgreich ist;
- relevante Tests oder manuelle Prüfungen dokumentiert sind;
- betroffene Dokumentation aktualisiert wurde;
- keine unbeabsichtigten oder sachfremden Änderungen enthalten sind;
- der Abschlussbericht den tatsächlichen Stand ehrlich wiedergibt.

## Leitgedanke

GoldenDawn OS wächst durch kleine, stabile und nachvollziehbare Schritte. Jede
Änderung soll heute nützlich sein und gleichzeitig eine sichere Grundlage für
die nächste Entwicklungsstufe schaffen.
