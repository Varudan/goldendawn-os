# Changelog

Dieses Changelog dokumentiert nachvollziehbare GoldenDawn-OS-Meilensteine.
Die Versionsnummern strukturieren den Projektfortschritt, sind aber keine
Zusicherung einer strikt semantischen Versionierung. Ein Eintrag allein
behauptet weder einen veröffentlichten Git-Tag noch ein veröffentlichtes
Release.

## Unveröffentlicht – v0.3.0 in Arbeit

### Generated n8n Boundary Bundle Foundation / ADR 0021

- ADR 0021 als angenommene Implementierungsentscheidung ergänzt. Die
  unveränderten Module `src/contracts/syncContract.js` und
  `src/gateways/syncGatewayRequestBoundary.js` bleiben die einzigen fachlich
  kanonischen Quellen. Der Entry ist eine kleine explizit gepflegte,
  manifestierte nichtfachliche Glue- und Quelldatei, der Generator gepflegtes
  Repository-Tooling. Ausschließlich Bundle und Manifest sind reproduzierbar
  generierte Derivate und keine manuell gepflegte zweite fachliche
  Implementierung.
- Den kleinen expliziten Entry
  `scripts/n8n/syncGatewayBoundaryBundleEntry.js` sowie den deterministischen
  Generator `scripts/n8n/generateSyncGatewayBoundaryBundle.js` ergänzt. Die
  bereits im Lockfile gebundene Vite-`8.1.4`-/Rolldown-Toolchain wird ohne neue
  Dependency oder Lockfile-Erweiterung verwendet.
- `npm run bundle:n8n:generate` als expliziten Erzeugen-/Aktualisieren-Modus und
  `npm run bundle:n8n:check` als schreibfreien Driftcheck ergänzt. Der
  Checkmodus vergleicht die erwarteten Bytes ausschließlich im Speicher und
  endet bei abweichendem Artefakt, Manifest oder kanonischer Quelle mit einem
  Fehlercode.
- Das eingecheckte, menschenprüfbare
  `artifacts/n8n/syncGatewayRequestBoundary.bundle.js` als eigenständiges,
  seiteneffektfreies Artefakt aus statischem Header und direkt bindbarem
  Expression-IIFE ohne Top-Level-`var` oder Globalmutation ergänzt.
  `"use strict";` ist der erste IIFE-Body-Prolog und kein Top-Level-Statement;
  nach dem Ausdruck folgt kein separates Semikolon-Statement. Die vollständigen
  Artefaktbytes sind unverändert hinter `const boundaryBundle =` bindbar. Ihre
  Auswertung liefert exakt die eingefrorene API
  `{ createSyncGatewayRequestBoundary }`; die Factory behält die bestehende
  Clock- und Gateway-ID-Injektion und liefert exakt die eingefrorene API
  `{ processSyncRawBody }`. Beim Laden wird kein Request verarbeitet und kein
  globaler Namespace mutiert.
- Die Vite-/Rolldown-Ausgabe mit `strict: true` und
  `attachDebugInfo: "none"` erzeugt, sodass keine potenziell pfadabhängigen
  `//#region …`-/`//#endregion`-Direktiven ausgegeben werden. Der Generator
  akzeptiert nur den exakten Modulgraphen und die vollständige erwartete
  Wrapperform, entfernt fail-closed ausschließlich den bekannten deklarativen
  Wrapper und bearbeitet fachlichen Code nicht textuell. Abweichende Quellen,
  Modulgraphen oder Ausgabeformen werden nicht heuristisch umgeschrieben.
- Contract, Boundary und Entry jeweils exakt einmal über sichere FileHandles
  gelesen. SHA-256 und Vite-Virtualmodule verwenden denselben danach
  unveränderlichen In-Memory-Snapshot; ein ABA-Wechsel der Live-Datei kann
  nicht unbemerkt andere Bundler- als Manifestbytes erzeugen.
- Den kanonischen Repository-Root, Zielordner und beide festen Outputpfade vor
  jedem Generate-Write auf Containment, von Node erkannte symbolische Links und
  Junctions sowie `realpath`-Abweichungen geprüft. Der Generator legt
  unvorhersagbar benannte Tempdateien exklusiv im verifizierten Zielordner an,
  prüft Identität und Bytes, ersetzt Artefakt vor Manifest und bereinigt ihm
  weiterhin identitätsgleich zuordenbare Tempdateien. Ein kontrolliert
  unterbrochenes Mischpaar wird vom Checkmodus abgelehnt. Die individuellen
  Replaces bilden keine atomare Paartransaktion und garantieren weder
  Power-Loss- noch Single-Writer-Sicherheit. Die portable Node-API attestiert
  nicht jeden Windows-Reparse-Tag; Schutz vor einem bösartigen gleichzeitigen
  Reparse-Austausch wird nicht behauptet.
- Das Bundle benötigt zur Laufzeit weder ESM- noch CommonJS-Imports und enthält
  kein `import`, `export`, `require()`, `eval()` oder `new Function()`. Es
  besitzt keine Netzwerk-, Dateisystem-, Prozess-, Environment-, Credential-
  oder Secretzugriffe, erzeugt keine Logs oder Telemetrie und erfindet keine
  Webhook-, `$json`-, `$input`-, `items`- oder andere n8n-Inputstruktur.
- Das deterministische Manifest
  `artifacts/n8n/syncGatewayRequestBoundary.bundle.manifest.json` ergänzt. Es
  enthält eine feste Schema-Version, den relativen Artefaktpfad und SHA-256
  über dessen exakte Bytes sowie die feste geordnete Folge aus Contract,
  Boundary und Entry mit ihren SHA-256-Hashes. Zeit, absolute oder temporäre
  Pfade, Hostname, Locale und zufällige Buildwerte sind ausgeschlossen.
- Reproduzierbarkeit auf byteidentische Artefakt- und Manifestbytes bei
  wiederholter Generierung und unterschiedlichen absoluten Arbeitsverzeichnissen
  begrenzt. Beide Dateien verwenden UTF-8 ohne BOM, ausschließlich LF, einen
  finalen Zeilenumbruch und keine Source Map.
- `tests/n8nSyncGatewayBoundaryBundle.test.js` für Generator-,
  Reproduzierbarkeits-, Integritäts-, Snapshot-/ABA-, Outputpfad-, Paritäts-
  und Mutationseigenschaften ergänzt. Die kanonische lokale Boundary bleibt
  das Referenzorakel; verglichen werden auch eigene Felder, Reihenfolge,
  Prototypen, Freeze-Zustand, Identitäten, Entkopplung, Redaction,
  Console-Stille und Dependency-Aufrufgrenzen.
- Temporäre Mutationen erkennen Bundle-Byteänderungen, Quelldrift ohne
  Regeneration, semantische Abweichungen sowie entfernte API-/Freeze-Garantien.
  Ein künstlicher privater Marker wird weder in kontrollierten Resultaten noch
  in Consoleausgaben offengelegt. Kanonische Dateien werden dafür nicht
  verändert.
- Den offiziellen n8n-Plattformstand auf den `2026-08-17` datiert: n8n Cloud
  erhält keine beliebigen externen npm-Imports durch die getrennte
  Self-Hosted-Modul-Allowlist; die Webhook-Option `Raw Body` belegt weiterhin
  weder ursprüngliche byteidentische Wire-Oktette noch eine Prüfung vor
  Provider-Allokation. Das versions- und tenantgebundene Laufzeitgate aus ADR
  0019 bleibt unverändert.
- Kein n8n-Workflow, Webhook, Credential, Secret, Authentisierungsheader,
  Cloudaufruf, Browser- oder Cloudtransport, operativer `SyncAgent`, normaler
  SyncResponse-Upstream, Retry, Rate Limit, Persistenz, Logging, Telemetrie, UI
  oder `src/main.js`-Komposition ergänzt. Das Local-SyncGateway-HTTP-Verhalten
  bleibt unverändert; es existiert weiterhin kein externer Datenfluss.
- Die abschließende Syntax-, gezielte Bundle-, kombinierte Sync-, vollständige
  serielle, Build-, Checkmodus- und Dateihygiene-Verifikation wurde mit den
  tatsächlich ausgeführten Ergebnissen beziffert. Die gezielte Bundle-Suite
  bestand mit 61/61 Tests; Bundle zusammen mit der SyncGateway Request Boundary
  bestand mit 115/115 Tests. SyncContract, SyncService, Boundary, Local
  SyncGateway und Bundle bestanden kombiniert mit 253/253 Tests; die
  vollständige serielle Gesamtsuite bestand mit 1186/1186 Tests. Alle Läufe
  hatten 0 Fehlschläge, 0 Skips und 0 Todos. Der Produktions-Build war
  erfolgreich und transformierte weiterhin exakt 46 Browsermodule; der
  Bundle-Check meldete keinen Drift. Das aktuelle Artefakt besitzt SHA-256
  `15b84126852a597d429304d66d723a356b18537ba3910db9dd9443b3b787114f`;
  die exakten Manifestdateibytes besitzen SHA-256
  `87c4fa153d2af2753aaaf4d74fd515b3edae5268b9935d63faef24d10bcf593f`.
  Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
  `v0.2.2` bleiben unverändert.

### Local SyncGateway Raw-Wire and HTTP Foundation / ADR 0020

- ADR 0020 als angenommene Implementierungsentscheidung ergänzt. Die lokale
  Foundation läuft als separater, importseitig inaktiver Node-Prozess unter
  `server/`, startet ausschließlich explizit über `npm run gateway:local` und
  verändert weder `src/main.js` noch den Browser-Buildgraphen.
- `readLocalSyncGatewayRuntimeConfig` als fail-closed Konfigurationsgrenze für
  die ausschließlich serverseitigen Variablen
  `GOLDENDAWN_SYNC_GATEWAY_PORT` und
  `GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN` umgesetzt. Die Produktionslaufzeit
  akzeptiert nur einen kanonischen Port von 1 bis 65.535 und genau eine
  kanonische HTTP(S)-Origin auf `localhost`, `127.0.0.1` oder `[::1]`; Werte
  werden in Fehlern nicht gespiegelt. `VITE_*` ist kein Konfigurationspfad.
- `createLocalSyncGatewayHttpServer` als eingefrorene Lifecycle-API mit exakt
  `start` und `stop` ergänzt. Der Listener bindet unveränderlich an
  `127.0.0.1`; Port `0` ist ausschließlich für isolierte Factorytests erlaubt.
  Import, Doppeltstart, Startfehler, Stop vor Start und Doppelstop besitzen
  kontrollierte statische Results. Startfehler verwenden einen gemeinsamen
  irreversiblen Cleanup-Pfad, verwerfen `boundPort`, schließen den Listener
  best effort und zerstören offene Sockets. Ein synchroner Close-Throw erhält
  genau einen Retry; ein weiterhin werfender Listener wird dereferenziert und
  der Prozesseinstieg versucht zusätzlich `stop`. Offene Sockets werden auch
  beim Stop beendet. Der Listening-Handler kapselt außerdem den vollständigen
  Zugriff auf `server.address()` einschließlich des jeweils einmaligen Lesens
  von `address` und `port`. Ein werfender Getter führt zum normalen statischen
  `startFailed`-Cleanup und löst keinen Fatal-Callback aus. Dasselbe gilt für
  gemeldete Ports außerhalb `1` bis `65535` sowie bei einem Produktionsport
  für jede Abweichung vom angeforderten Wert; nur Factory-Port `0` akzeptiert
  einen abweichenden tatsächlich gebundenen Port im gültigen Bereich.
- Den Lifecycle nach einem Serverfehler bei bereits erfolgreichem Start
  vollständig fail-closed gehärtet: `boundPort` wird sofort verworfen, der
  Zustand bleibt irreversibel `failed`, der Listener wird best effort
  geschlossen und vorhandene Sockets werden zerstört. Weitere Request-,
  Decoder- und Boundary-Verarbeitung wird gesperrt; Exceptiontexte bleiben
  redigiert. Die Factoryoption `onFatal = () => {}` signalisiert diesen Zustand
  payloadlos und höchstens einmal; Throws und zurückgegebene Rejections werden
  konsumiert, die öffentliche API bleibt exakt `{ start, stop }`.
- Der Prozesseinstieg entfernt bei einem Fatal-Signal seine Signalhandler,
  versucht die Bereinigung idempotent, setzt `process.exitCode = 1` und gibt
  genau einmal die statische redigierte Meldung
  `Das lokale SyncGateway wurde nach einem internen Serverfehler beendet.` aus.
  Mehrfache Signale sowie werfende oder fehlschlagende Cleanup-Pfade erzeugen
  keine zweite Meldung oder unbehandelte Exception.
- Die lokale HTTP-Allowlist auf das exakte Request-Target `/api/sync-test`,
  einen zum gebundenen Port passenden `Host`, `POST` und einen streng
  kontrollierten `OPTIONS`-Preflight begrenzt. Bei Port `80` sind ausschließlich
  `127.0.0.1` und `127.0.0.1:80` gültige Autoritäten; bei allen anderen Ports
  bleibt exakt `127.0.0.1:<port>` erforderlich. `CONNECT`, Upgrades und
  Erwartungen umgehen die Policy nicht. Sicherheitsrelevante Header werden
  aus `rawHeaders` geprüft; Duplikate und widersprüchliche Framing-Signale
  werden fail-closed abgelehnt.
- `requireHostHeader: false` in den Node-Serveroptionen ausdrücklich gesetzt.
  Dies deaktiviert nur Nodes vorgezogene HTTP/1.1-Hostantwort und lockert die
  Hostpflicht nicht. Im ansonsten regulären Requestpfad, sofern keine frühere
  fail-closed Target- oder Sonderpfadablehnung greift, durchlaufen fehlende,
  doppelte oder falsche Hostwerte Admission und Response-Owner und enden im
  eigenen statischen `invalidHttpRequest`-Envelope mit kontrolliertem
  `Content-Length`. Die Option öffnet keinen akzeptierenden Pfad.
- Ausschließlich HTTP/1.1 unterstützt. Ein als HTTP/1.0 geparster Request endet
  statisch als `invalidHttpRequest`, bevor Raw-Header-Projektion, Decoder oder
  Boundary ausgeführt werden.
- Für Requests genau eine konfigurierte Origin erlaubt. CORS-Antworten spiegeln
  ausschließlich den konfigurierten Wert, erlauben keine Credentials und
  behandeln Loopback sowie CORS ausdrücklich nicht als Authentisierung oder
  Autorisierung. Ein Preflight erlaubt nur `POST` und `Content-Type`.
- POST-Bodies auf `application/json` mit optional genau
  `charset=utf-8`, fehlendes oder `identity` Content-Encoding und ein
  widerspruchsfreies HTTP-Framing begrenzt. Kompression, zusätzliche
  Media-Type-Parameter, Trailer und mehrdeutige relevante Header werden
  abgelehnt. `Content-Length` bleibt nur ein frühes Signal.
- Die kanonische Contractkonstante von 65.536 Bytes in die Wire-Schicht
  importiert. Tatsächlich gelieferte Chunkbytes werden gezählt, höchstens
  65.536 Bytes als Anwendungsbody gehalten und ab Byte 65.537 weder
  zusammengefügt noch decodiert oder an die Boundary übergeben. Diese
  Anwendungsgrenze behauptet keinen Schutz vor bereits durch Node, Betriebssystem
  oder Netzwerkstack allozierten Bytes und keinen vollständigen DoS-Schutz.
- Einen vollständig empfangenen zulässigen Body genau einmal mit einem
  kontrollierten `TextDecoder('utf-8', { fatal: true, ignoreBOM: true })`
  decodiert. Decoderfähigkeiten werden fail-closed geprüft; ungültige oder
  unvollständige UTF-8-Folgen werden abgelehnt. Es gibt kein `setEncoding`,
  keine Chunkdecodierung, Normalisierung, Reparatur oder Trim-Operation. Eine
  gültige UTF-8-BOM bleibt als U+FEFF im String und folgt der bestehenden
  nativen Parsersemantik.
- Nach erfolgreichem Empfang ausschließlich den unveränderten primitiven String
  exakt einmal an die vorhandene kanonische `processSyncRawBody`-Boundary
  übergeben. Die HTTP-Schicht besitzt keinen zweiten JSON-Parser. Sie spiegelt
  weder den Request noch die defensive Requestprojektion und sendet sie nicht
  weiter.
- Kontrollierte Boundary-Ablehnungen ausschließlich als die bereits validierte
  frühe Gateway-Fehlerresponse mit HTTP `400` serialisiert. Lokale HTTP- und
  Gatewayfehler verwenden stattdessen eine getrennte statische Drei-Felder-
  Envelope. Ein akzeptierter Request endet bewusst mit statischem HTTP `503`
  `upstreamUnavailable`; es gibt keine normale SyncResponse und keine
  behauptete Verarbeitung durch einen `SyncAgent`.
- Die implementierte lokale Statusmenge auf `204`, `400`, `403`, `404`, `405`,
  `413`, `415`, `417`, `431`, `500` und `503` begrenzt. Kontrollierte
  Antworten verwenden `no-store`, `nosniff`, statisches JSON mit UTF-8 wo
  zutreffend und eine enge Connection-Close-Strategie; Serverdetails sowie
  fremde Eingaben oder Exceptiontexte werden nicht ausgegeben.
- Pro physischem Socket genau einen Response-Owner vor dem ersten Application-
  oder Raw-Socket-Write eingeführt. Nach einer Übernahme schreibt
  `clientError` keine zweite Response oder Statuszeile; Parserfehler vor jeder
  Anwendungsübernahme erhalten weiterhin genau eine kontrollierte statische
  Raw-Response. Raw-Pfade senden ihre statische redigierte Antwort best effort
  und zerstören den Socket danach zuverlässig; bei bereits beanspruchtem Owner
  schreiben sie nichts und zerstören ihn unmittelbar. Asynchrone
  Raw-Schreibfehler werden redigiert abgefangen und führen nur zum Destroy. Das
  begrenzt auch halb offene Clients, die nach Response oder FIN weiter Bytes
  senden.
- Konservative Node-Ressourcengrenzen für Headerbytes und Headerfelder sowie
  absolute 5.000-ms-Header- und 10.000-ms-Requestfristen, endliche Socket- und
  Keep-Alive-Zeiten und höchstens eine Anfrage pro Socket umgesetzt. Das feste
  produktive `connectionsCheckingInterval` von 100 ms begrenzt die
  konfigurierte Erkennungstoleranz bei responsivem Eventloop auf einen
  Prüftakt. Die nur mit Port `0` und exakt `useTestTimeoutPolicy: true`
  erreichbare private Testpolicy verwendet fest 250/500/500/25 ms und ist
  weder Runtime- noch Environmentkonfiguration. Eventloop-, Betriebssystem-
  und Netzwerkplanung bleiben Laufzeitgrenzen. Das ist eine begrenzte lokale
  Ressourcenhärtung, kein Rate Limit, Identitätsnachweis oder vollständiger
  Schutz gegen lokale Denial-of-Service-Angriffe.
- Eine factory-lokale, vom Response-Owner getrennte Request-Admission als
  ersten gemeinsamen Anwendungsschritt für `request`, `checkContinue` und
  `checkExpectation` ergänzt. Nur der erste Request pro physischem Socket wird
  zugelassen. Jedes weitere Ereignis beansprucht den terminalen
  Response-Owner, pausiert und zerstört den Socket ohne zweite Response, bevor
  HTTP-Version, Headerprojektion, Decoder oder Boundary ausgewertet werden.
  Mutationsgerichtete Regressionen erzwingen für den ersten gültigen
  HTTP/1.1-Request exakt einen Decoderfactory-, Decode- und Boundary-Aufruf mit
  dessen Raw Body sowie für jedes zweite reguläre oder Expect-Ereignis exakt
  null `rawHeaders`-Zugriffe und einen terminalen Response-/Socketzustand.
- Einen expliziten synchronen `dropRequest`-Handler für
  `maxRequestsPerSocket: 1` als zusätzliche Defense-in-Depth ergänzt. Er
  beansprucht den terminalen Response-Owner und zerstört den physischen Socket
  bei einem von Node verworfenen pipelinierten Folgerequest, ohne eine
  zusätzliche Node- oder Gateway-Response zu erzeugen.
- Parser- und Socket-Timeouts fail-closed beendet. Je nach Node-Parserzustand
  kann dabei nur ein Verbindungsabschluss oder eine laufzeiteigene minimale
  Timeoutantwort möglich sein; dafür wird kein stets auslieferbarer lokaler
  JSON-Envelope behauptet.
- Kein Browser-SyncTransport, kein automatischer Start mit `npm run dev`, kein
  Cloud- oder n8n-Transport, Webhook, Secret, Credential, operativer
  `SyncAgent`, erfolgreicher SyncResponse-Pfad, externer Datenfluss, Storage,
  Requestlogging, Telemetrie, Rate Limit, Replay-/Idempotenzschicht oder UI
  ergänzt. PromptVault, LearningHub und LichtwaldLog bleiben unberührt und
  lokal.
- Die Host-Zentralisierung mit einem hostlosen HTTP/1.1-`OPTIONS` plus gültigem
  POST in einem Pipeline-Write mutationswirksam geprüft: bei deaktiviertem
  `maxRequestsPerSocket` exakt zwei Anwendungsereignisse, kein `dropRequest`,
  null Decoder-/Boundary-Aufrufe, höchstens eine eigene statische Response und
  keine Marker-Leaks. Gemeldete Ports `0`, `-1`, `65536` sowie ein abweichender
  gültiger Produktionsport führen redigiert zu `startFailed`, vollständigem
  Cleanup und keinem `onFatal`. Globale Instrumentierungen laufen mit
  `concurrency: false` und vollständigem `finally`-Restore.
- Die gehärtete gezielte Local-SyncGateway-Suite am `2026-08-16` mit 50/50
  Tests und die kombinierte Suite mit Boundary, SyncContract und SyncService
  mit 192/192 Tests bestanden. Die vollständige serielle Suite bestand mit
  1125/1125 Tests. Alle Läufe hatten 0 Fehlschläge, 0 Skips und 0 Todos und
  verwendeten ausschließlich synthetische Werte sowie Loopback-Kommunikation.
  Der
  Produktions-Build war erfolgreich und transformierte weiterhin exakt 46
  Browsermodule. Paketversion `0.2.2`, Tag `v0.2.2` und Release `v0.2.2`
  bleiben unverändert.

### ADR 0019 – Local SyncGateway before n8n Cloud Decision

- ADR 0019 als angenommene, ausschließlich dokumentationsbasierte Entscheidung
  ergänzt. Der Stand dieses damaligen Dokumentationsslices lautete
  `v0.3.0 – in Arbeit – Local SyncGateway before n8n Cloud Decision`.
- Die spätere Zieltopologie als
  `GoldenDawn-Browser → SyncService → lokaler SyncTransport → lokales
  SyncGateway auf GD-WS01 → authentisierter n8n-Cloud-Webhook → SyncAgent →
  validierte normale SyncResponse` entschieden. Alle neuen Transport-, Gateway-,
  Cloud- und Agentenkomponenten bleiben geplant und nicht implementiert.
- Das lokale SyncGateway als schmale, Loopback-only Transport- und
  Sicherheitsgrenze festgelegt. Es ist kein vierter Agent, keine Fachlogik,
  kein allgemeines Backend, kein Storage, kein Ersatz für den `SyncAgent` und
  keine UI-Komponente. ADR 0002, ADR 0005 und ADR 0016 bis ADR 0018 bleiben
  unverändert gültig.
- Browsercaller als nicht authentisiert und unvertrauenswürdig eingeordnet.
  `POST`, fester serverseitiger Pfad, kontrolliertes JSON/UTF-8, Ablehnung
  komprimierter Bodies und nicht unterstützter Content-Encodings sowie exakte
  Origin-Allowlist entschieden. `OPTIONS` darf nur einen CORS-Preflight
  bedienen; CORS und Loopback beweisen keine Identität.
- Die geplante lokale Raw-Wire-Reihenfolge entschieden: `Content-Length` nur als
  frühes Signal, tatsächliche Streaming-Bytezählung bis 65.536, Abbruch bei Byte
  65.537 vor vollständiger Materialisierung, exakt eine strikte UTF-8-
  Decodierung mit Erhalt einer gültigen BOM als U+FEFF und ohne Entfernung oder
  Reparatur, danach exakt ein Aufruf der vorhandenen kanonischen Request
  Boundary und ausschließliche Weiterverwendung ihrer defensiven Projektion.
- Für den ersten leeren, nebenwirkungsfreien synthetischen Cloudfluss n8n Header
  Authentication mit dediziertem hochentropischem gemeinsamen Bearer-Secret
  und HTTPS entschieden. Das Secret darf ausschließlich im n8n-Credential-
  Store und vertrauenswürdiger serverseitiger Gateway-Laufzeitkonfiguration
  liegen und wird nur für den `syncTest`-Webhook verwendet. Sein Besitznachweis
  ist keine starke Geräte-, Prozess- oder Benutzeridentität und kein n8n-RBAC-
  Principal. Header Authentication ist keine Bodysignatur; TLS ist kein Replay-
  oder Idempotenzschutz. HMAC-, JWT-Body-Binding und Replay-Nachweis bleiben vor
  privaten oder schreibenden Aktionen neu zu entscheiden.
- `src/contracts/syncContract.js` und
  `src/gateways/syncGatewayRequestBoundary.js` als kanonische Cloudquellen
  bestätigt. Weil n8n Cloud nach dem datierten offiziellen Plattformbefund vom
  2026-08-15 keine beliebigen externen npm-Module im Code Node importiert, darf
  ein späterer Workflow nur ein reproduzierbar generiertes, selbstständiges und
  automatisiert auf Integrität, Parität und Mutationen geprüftes Artefakt
  verwenden; eine manuell gepflegte Contractkopie ist ausgeschlossen.
- Die n8n-Option `Raw Body` nicht als Nachweis byteidentischer ursprünglicher
  Wire-Oktette oder einer GoldenDawn-spezifischen 65.536-Byte-Prüfung vor
  Provider-Allokation behandelt. Aktivierung erst nach versions- und
  tenantgebundenem Laufzeitnachweis tatsächlicher Binärdaten vor Decodierung;
  andernfalls ist ADR 0019 neu zu bewerten. Die geplante n8n-Prüfung bleibt eine
  nachgelagerte Defense-in-Depth-Schicht; das lokale Gateway die geplante exakte
  vorgelagerte Wire-Grenze.
- Responseebenen getrennt: Der SyncService akzeptiert weiterhin nur normale,
  vollständig korrelierte SyncResponses. HTTP-, Authentisierungs-, Timeout-,
  frühe `gateway_`-, lokale Gateway- und ungeeignete Cloudresponses werden
  später als statisch redigierte lokale Transportfehler behandelt und niemals
  zu normalen SyncAgent-Responses umgeschrieben.
- Keine Produktions-, Test-, Paket-, Lock-, Workflow-, Vault- oder
  `src/`-Datei geändert. Kein Server, Transport, Webhook, n8n-Workflow, Bundle,
  Credential, operativer Agent, externer Datenfluss, Storage, Logging,
  Monitoring oder UI wurde implementiert. Paketversion `0.2.2`, Tag `v0.2.2`
  und neuestes Release `v0.2.2` bleiben unverändert.
- Den Dokumentationsslice am `2026-08-15` mit der vollständigen seriellen Suite
  tatsächlich geprüft: 1075/1075 Tests bestanden, 0 Fehlschläge, 0 Skips und
  0 Todos. Der Produktions-Build war erfolgreich und transformierte exakt 46
  Module.

### SyncGateway Request Boundary Foundation

- `createSyncGatewayRequestBoundary({ generateGatewayRequestId,
  getCurrentTimestamp })` als synchrone transportneutrale Grenze für einen
  bereits vollständig materialisierten Raw-Body-Wert ergänzt. Die eingefrorene
  gewöhnliche API exportiert exakt `processSyncRawBody`; die Methode akzeptiert
  exakt einen Wert und ist kein HTTP-Handler.
- Jeden Aufruf synchron auf einen tief eingefrorenen exakten Fünf-Felder-Result
  aus `ok`, `status`, `syncRequest`, `gatewayErrorResponse` und `error`
  begrenzt. Beherrschte Eingabeablehnungen liefern eine vollständig gültige
  frühe Gateway-Fehlerresponse; ungültige Invocation sowie interne oder
  Dependency-Fehler bleiben getrennte statisch redigierte lokale Results.
- Die fail-closed Reihenfolge
  `Raw-Body-Größe prüfen → exakt einmal ohne Reviver parsen → unveränderten
  Parsed-Wert validieren → defensive Sechs-Felder-Projektion mit frischem
  leerem Payload erzeugen → erneut validieren → tief einfrieren → final erneut
  validieren` umgesetzt. Zusatzfelder werden nicht vor der maßgeblichen
  Contractvalidierung entfernt; Parsed-Original und Ausgabe teilen keine
  mutablen Recordidentitäten.
- Statische Ablehnungszuordnung festgelegt: Übergröße zu
  `PAYLOAD_TOO_LARGE`, andere reguläre Raw-Body-Fehler zu
  `VALIDATION_ERROR`, native Parser-Throws zu `INVALID_JSON`, ein alleiniger
  `unsupportedVersion`- oder `unknownAction`-Fehler zum jeweils spezifischen
  Profil und sonstige oder gemischte Requestfehler zu `VALIDATION_ERROR`.
  `invalidReferenceTimestamp` sowie Builder-, Projektions-, Freeze- und
  Validatorinkonsistenzen bleiben lokale `boundaryFailed`-Pfade.
- Frühe Gateway-Responses pro Aufruf aus frischen Records und Arrays gebaut,
  vor und nach Deep Freeze vollständig validiert und mit neuer kontrollierter
  `gateway_`-ID, `action: null`, `handledBy: null`,
  `meta.processedBy: []` sowie statischem, nicht gemessenem
  `durationMs: 0` ausgegeben. Eingehende `req_`-IDs werden nie gespiegelt und
  eine Verarbeitung durch den `SyncAgent` wird nicht behauptet.
- Clock für jeden akzeptierten Request oder ausgegebenen Gateway-Fehler exakt
  einmal erfasst. Gateway-ID-Generator ausschließlich für eine tatsächlich
  benötigte Ablehnung ausgewertet; der Default verwendet nur
  `gateway_ + crypto.randomUUID()` ohne schwächeren Fallback.
- Native ECMAScript-Last-Key-Wins-Semantik für doppelte JSON-Membernamen und die
  Single-Parser-Grenze dokumentiert. Es gibt keinen Reviver, zweiten Parser,
  Duplicate-Key-Scanner, Stringify-/Parse-Roundtrip, Trim-, BOM-,
  Unicode-Normalisierungs- oder Reparaturpfad.
- Klargestellt, dass die Grenze nur die berechnete UTF-8-Länge eines bereits
  allozierten Strings prüft. Sie ist keine tatsächliche Raw-Wire-
  Bytebegrenzung, kein Schutz vor vorheriger Body-Allokation und keine HTTP-,
  Webhook- oder DoS-Durchsetzung. Für die spätere HTTP-/Transportgrenze die
  mechanismusgerechte Reihenfolge aus frühen Methoden-, Content-Type-,
  Origin-/CORS-, Rate-Limit- und gegebenenfalls Header-Auth-Kontrollen, harter
  Raw-Byte-Begrenzung während des Empfangs, einer nur nach gesonderter
  Entscheidung erforderlichen Signaturprüfung vor Decodierung und Parsing,
  einmaliger kontrollierter Decodierung, alleiniger Boundary-Verarbeitung,
  kontextgebundener Autorisierung und erst anschließendem Routing dokumentiert.
  ADR 0019 entscheidet für den ersten synthetischen Flow Header Authentication
  ohne Bodysignatur. CORS ersetzt keine Authentisierung oder Autorisierung;
  Rate Limits können mehrschichtig sein.
- Die Boundary-Suite gezielt gegen verschobene Post-Freeze-Validierungen,
  NFC-Normalisierung vor der Originalgrößenprüfung, Console-Ausgaben im
  Erfolgspfad, wiederholte Dependency-Aufrufe nach Throws und geteilte
  Identitäten desselben Gateway-Fehlerprofils gehärtet. Globale
  Instrumentierungen laufen nicht konkurrierend und werden garantiert im
  `finally` restauriert.
- ADR 0018 ergänzt, ohne ADR 0016 oder ADR 0017 umzudeuten. Kein konkreter
  Transport, HTTP-Handler, Endpoint, Webhook, n8n, operativer `SyncAgent`,
  keine Authentisierung, Autorisierung, Signaturprüfung, Secrets, CORS oder
  Rate Limits, keine Persistenz, Logs, Telemetrie, Hub-UI oder
  `src/main.js`-Komposition wurden eingeführt.

### SyncContract Foundation

- Transportneutralen Vertragskern für Contract-Version `1.0`, die einzige
  Aktion `syncTest`, den kanonischen Handler `SyncAgent` und ausschließlich
  als `synthetic` klassifizierte Erfolgsdaten ergänzt.
- Strikte Validatoren für den exakt sechs Felder umfassenden Request, normal
  korrelierte Responses, getrennte frühe Gateway-Fehler und bereits als String
  vorliegende Raw Bodies bereitgestellt. Determinismus und Seiteneffektfreiheit
  werden nur für stabile gewöhnliche Records, Arrays und Strings zugesichert,
  deren Beobachtung selbst keine Seiteneffekte auslöst.
- Pflicht-`requestId`, kanonische UTC-Zeitstempel mit expliziter Referenzzeit,
  statische redigierte Fehlerprofile, exakte Response-Korrelation und
  kontrollierte Ablehnung nicht unterstützter beobachteter Strukturen
  festgelegt.
- Dokumentiert, dass der Validator selbst keine Properties schreibt und Werte
  gewöhnlicher eigener Accessors nicht ausliest, Reflection auf Proxies jedoch
  Traps und Descriptor-Getter ausführen kann. Same-Realm-Proxy-Traps führen
  beliebigen JavaScript-Code aus und können Eingaben, externen Zustand oder
  globale Laufzeitobjekte verändern, blockieren oder spätere Operationen zum
  Werfen bringen. Reflection-Catches können solche Wirkungen weder verhindern
  noch rückgängig machen; eine vollständige portable Proxy-Erkennung existiert
  nicht. Erfolg bestätigt nur die während des Aufrufs beobachtete Struktur.
- Das Raw-Body-Limit exakt auf 65.536 UTF-8-Bytes begrenzt. Der reine Helper
  serialisiert keine Objekte und ist ohne konkrete Wire-/Webhook-
  Transportgrenze keine tatsächliche Webhook-Durchsetzung.
- Für eine spätere Wire-Grenze allgemein festgehalten, rohe Bodybytes während
  des Empfangs hart zu begrenzen und eine künftig gesondert entschiedene
  Bodysignatur gegebenenfalls über exakt diese Bytes vor der kontrollierten
  Decodierung zu prüfen. ADR 0019 konkretisiert den ersten synthetischen Flow
  ohne HMAC-, JWT-Body-Binding- oder Replay-Nachweis: Der resultierende String
  wird ausschließlich von der Boundary einmal geparst und projiziert und erst
  nach serverseitiger Policy geroutet. Natives `JSON.parse` ohne
  benutzerdefinierten Reviver erzeugt aus JSON selbst keine Proxies, Accessors,
  Symbole oder Trap-Funktionen.
- `source: "goldendawn-os"` als reine syntaktische Klassifikation festgehalten,
  nicht als Nachweis für Authentisierung, Herkunft, Identität oder Berechtigung.
  Vertrauenswürdige Herkunft, Routing und Autorisierung folgen später aus
  serverseitigem Kontext und niemals allein aus `source`.

### SyncService Foundation

- `createSyncService({ syncTransport, generateRequestId, getCurrentTimestamp })`
  als asynchrone transportneutrale Service-Foundation mit einer eingefrorenen
  API aus exakt `runSyncTest` ergänzt. Der Aufruf akzeptiert keine Argumente
  und bietet keinen generischen Aktions-, Payload-, Endpoint- oder Moduspfad.
- Bei einem argumentlosen Aufruf zuerst
  `syncTransport.sendSyncRequest` in einem einmaligen sicheren
  Auflösungsversuch aufgelöst. Bei fehlender, nicht funktionaler oder werfend
  aufgelöster Methode werden Generator und Clock nicht ausgewertet.
- Erst nach erfolgreicher Methodenauflösung einen frischen exakt sechs Felder
  umfassenden `syncTest`-Request mit exakt leerem `payload` aus den bestehenden
  Contract-Konstanten aufgebaut. `requestId` und `timestamp` stammen aus den
  dabei jeweils exakt einmal ausgewerteten kontrollierten
  Composition-Dependencies; der Standard-ID-Generator verwendet ausschließlich
  `req_ + crypto.randomUUID()` ohne schwächeren Fallback.
- Transportrequest und interne Korrelationsgrundlage als getrennte, tief
  eingefrorene Snapshots erzeugt. Nur die zuvor aufgelöste Portmethode
  `syncTransport.sendSyncRequest(syncRequest)` wird nach vollständiger
  Requestvalidierung pro Aufruf höchstens einmal mit dem vorgesehenen Receiver
  aufgerufen.
- Transportantworten als unvertrauenswürdige Eingaben behandelt, über feste
  Felder defensiv projiziert und ausschließlich als vollständig validierte,
  normal korrelierte SyncResponses akzeptiert. Frühe Gateway-Fehler gehören
  weiterhin nicht zum lokalen Transportprofil.
- Den exakten lokalen Fünf-Felder-Service-Result von der SyncResponse getrennt.
  Eine gültige normale Contract-Fehlerresponse bleibt außen `ok: true`; ihr
  fachlicher Zustand wird weiterhin ausschließlich durch
  `syncResponse.success` ausgedrückt. Lokale Fehler verwenden nur statische
  redigierte Status-, Code- und Meldungsprofile.
- Einen klar gekennzeichneten deterministischen In-Memory-Transport
  ausschließlich als Test-Double vorgesehen. In `src/` wird kein Mock-, HTTP-,
  Fetch-, Webhook- oder n8n-Transport ausgeliefert.
- Dokumentiert, dass injizierte Functions und Function-Proxies
  vertrauenswürdiger ausführbarer Anwendungscode sind. Promise-/Thenable-
  Auflösung und Proxy-Reflection können fremden Code und Seiteneffekte
  auslösen; beobachtbare Throws und Rejections werden redigiert, bereits
  ausgelöste Wirkungen können aber nicht rückgängig gemacht werden.

### Qualität

- Die gezielte Boundary-Suite mit dem exakt geforderten
  `node --test tests/syncGatewayRequestBoundary.test.js` mit 54/54 Tests
  geprüft; 0 Fehlschläge, 0 Skips und 0 Todos.
- Boundary und SyncContract gemeinsam mit 99/99 Tests sowie Boundary,
  SyncContract und SyncService gemeinsam mit 142/142 Tests geprüft. Die
  vollständige Suite besteht mit 1075/1075 Tests; alle Läufe besitzen 0
  Fehlschläge, 0 Skips und 0 Todos.
- Produktions-Build erfolgreich abgeschlossen; exakt 46 Module transformiert.

### Architektur- und Sicherheitsgrenzen

- Den späteren browserinitiierten Fluss durch ADR 0019 um den geplanten lokalen
  SyncTransport und das geplante lokale SyncGateway auf GD-WS01 vor dem
  authentisierten n8n-Cloud-Webhook konkretisiert; ein Vite-Browserfrontend
  terminiert keinen eingehenden öffentlichen Webhook.
- Die spätere Darstellung des `SyncAgent` dem AgentHub und Verbindungen,
  Webhooks, Workflows sowie den einzigen `syncTest`-Auslöser dem AutomationHub
  zugeordnet. Im aktuellen Slice wird keine Hub-UI umgesetzt.
- Keine Netzwerkkommunikation, keinen HTTP-Handler, konkreten externen
  Transport, Endpoint oder Webhook, keinen operativen `SyncAgent`, keine
  n8n-Verbindung, Header-, Methoden-, Statuscode-, Content-Type-, Charset- oder
  Encoding-Verarbeitung, Authentisierung, Autorisierung, Signaturprüfung,
  Secrets, CORS- oder Rate-Limit-Durchsetzung, keinen privaten externen
  Datenfluss und keinen produktiven Datenfluss eingeführt. SyncService und
  Boundary sind weder in `src/main.js` noch in einer UI komponiert.
- ADR 0016 für den transportneutralen Kern und die künftige Transport- und
  Hub-Grenze bleibt unveränderte Vertragsgrundlage. ADR 0017 dokumentiert die
  transportneutrale SyncService Foundation; ADR 0018 die materialisierte
  Request Boundary und ihre spätere Wire-Grenze. Paketversion `0.2.2`, Tag
  `v0.2.2` und neuestes veröffentlichtes Release `v0.2.2` bleiben unverändert.

## v0.2.2 – 2026-08-02

### LichtwaldLog Local MVP

- Lokalen Schema-1-Pfad für Anzeigen, Erstellen, vollständiges Bearbeiten,
  dauerhaftes Löschen und explizite Fokusverwaltung umgesetzt.
- `featuredEntryId` als einzige autoritative Fokusquelle beibehalten und den
  `Besonderen Lichtwaldmoment` ausschließlich als View-/CSS-Projektion ergänzt;
  es gibt keinen zweiten Zustand, keine neue API und keine zusätzliche
  Persistenz.
- Privaten Full-Snapshot unter `goldendawn.lichtwaldLog.content.v1` mit einem
  Limit von 500.000 UTF-16-Codeeinheiten, Read-Preflight, vollständiger
  Validierung, defensiven Kopien und statischer Fehlerredaktion abgesichert.

### Suche und getrennte synthetische Demo

- Flüchtige Textsuche sowie exakte Kalenderdatum- und Tagfilter mit
  AND-Semantik umgesetzt; die Eintragsreihenfolge bleibt unverändert und die
  Filterung vollständig schreibfrei.
- Fünf vollständig erfundene Demo-Einträge über einen vollständig getrennten
  In-Memory-Stack ohne `StorageAdapter`, Browser-Key, privaten Service oder
  Fallback bereitgestellt.
- Demo-Zustand innerhalb des Dokuments erhalten und nach Reload auf den
  kanonischen Seed zurückgesetzt; Demoaktionen lassen den privaten Storage und
  die vollständige Storage-Key-Liste bytegleich.

### Bedienung, Qualität und lokale Grenzen

- Safe DOM, Entry-ID-Isolation, Dirty Guards, Tastaturbedienung, sichtbaren
  `3px`-Fokusrahmen, Reduced Motion und responsive Darstellung geprüft.
- Reale Browserprüfung bei `1440 × 1000` und `390 × 844` erfolgreich
  abgeschlossen.
- LichtwaldLog mit 374/374 Tests und die Gesamtsuite mit 933/933 Tests geprüft;
  0 Skips und 0 Todos. Der Produktions-Build transformiert exakt 46 Module.
- Keine externe Kommunikation, Webhooks, Agentenlogik oder Airtable-Anbindung
  eingeführt. `localStorage` bleibt unverschlüsselt und ist keine
  Cloud-Sicherung.
- Der Umfang von `v0.2.2` ist vollständig abgeschlossen und geprüft. Der
  annotierte Tag `v0.2.2` und das zugehörige GitHub Release wurden am
  `2026-08-02` veröffentlicht; `v0.2.2` ist das neueste veröffentlichte Release.

## v0.2.1 – 2026-07-25

### LearningHub Local MVP

- LearningHub Schema 2 mit mehreren nutzerkonfigurierten LearningModules,
  LearningChapters und textbasierten LearningNodes umgesetzt.
- Lokale Inhalts-, Fortschritts- und LearningArtifact-Pfade mit getrennten
  Verträgen, Services, Storages und UI-Projektionen bereitgestellt.
- Aktuelle Notizen und Zusammenfassungen pro LearningNode lokal bedienbar
  gemacht, ohne sie mit Inhalt oder append-only Fortschritt zu vermischen.
- Veränderbare LearningTestBank und getrennte append-only Versuchshistorie
  ergänzt; abgeschlossene Attempts bleiben in persistierter Reihenfolge
  erhalten.
- Reine deterministische Single-Choice-Engine sowie sichtbar als `Lokaler
  Mock-Test` gekennzeichnete Fragenverwaltung, Durchführung, Auswertung,
  kontrollierter Abbruch und Historie umgesetzt.

### Demo-Initialisierung und Datenschutz

- Genau ein kanonisches synthetisches Demo-Modul mit drei Kapiteln, vier
  LearningNodes, acht LearningArtifacts und sieben Fragen bereitgestellt.
- Einmalige koordinierte Initialisierung vorgeschaltet, die nur bei gemeinsam
  fehlenden Inhalts-, Artifact-, Testbank- und Marker-Keys schreibt.
- Vorhandene Nutzerdaten, bewusst leere oder beschädigte Fachwerte und spätere
  Bearbeitungen vor Ergänzung oder Überschreiben geschützt; Teilfehler werden
  nur für weiterhin bytegleiche Seed-Werte kontrolliert zurückgerollt.
- Die einzelnen Storage- und Service-Loads behalten ihre schreibfreien leeren
  Zustände bei fehlenden Keys; Progress und Attempt-Historie werden nicht
  vorbefüllt.

### Bedienung und Accessibility

- Anzeige- und Bearbeitungswechsel der LearningNodes klarer getrennt und die
  stabile Auswahl bei Abbruch, Validierungsfehlern und erfolgreichem Speichern
  erhalten.
- Ungespeicherte Änderungen in den betroffenen Bearbeitungs- und Testflüssen
  vor unbeabsichtigtem Bereichswechsel oder Verwerfen geschützt.
- Mobile Kapitelüberschriften durch die begrenzte Flex-Basis korrigiert sowie
  Umbruch, Touchziele, native Beschriftungen, Fokusführung und zugängliche
  Status-, Bestätigungs- und Fehlerzustände verbessert.

### Qualität und lokale Grenzen

- Die finale Release-Verifikation umfasst 552/552 bestandene automatisierte
  Tests; sowohl die vollständige Suite mit erzwungener Einzeldatei-Ausführung
  als auch der Produktions-Build wurden erfolgreich abgeschlossen.
- Inhalt, Fortschritt, Notizen, Zusammenfassungen, Fragen und Attempts bleiben
  im aktuellen Browserprofil; `localStorage` ist unverschlüsselt und weder
  Synchronisierung noch Cloud-Sicherung.
- Der lokale Mock-Test verwendet keine KI, Agentenlogik oder externe
  Kommunikation. Repository-Daten bleiben synthetisch und von privaten
  Browserdaten getrennt.
- Der Umfang von `v0.2.1` ist vollständig abgeschlossen. Der annotierte Tag
  `v0.2.1` und das zugehörige GitHub Release wurden am `2026-07-25`
  veröffentlicht; GoldenDawn OS ist seitdem als öffentlich sichtbares
  Portfolio-Repository ohne Open-Source-Lizenz verfügbar.

## v0.2.0 – 2026-07-15

### Command Center und Design

- Responsive Command-Center-Shell mit Sidebar-Navigation, Modulübersicht,
  Projektstatus und klar gekennzeichneten aktuellen sowie geplanten Bereichen
  umgesetzt.
- Responsives Wald-/Gold-Design mit zentralen Farb-, Abstands-, Radius- und
  Schatten-Tokens sowie sichtbaren Fokuszuständen bereitgestellt.
- Desktop- und mobile Darstellung, semantische Beschriftungen sowie bewusste
  Lade-, Leer-, Erfolgs-, Bestätigungs- und Fehlerzustände ausgearbeitet.

### PromptVault Local MVP

- Lokales Anzeigen, Erstellen, Bearbeiten und dauerhaftes Löschen von Prompts
  einschließlich zugänglicher Inline-Bestätigung umgesetzt.
- Lokale Volltextsuche, Kategorie-Filter und kombinierte Filterung ergänzt;
  Such- und Filterzustände bleiben bewusst flüchtig.
- Persistente Favoriten ergänzt, ohne dadurch neue Inhaltsversionen zu
  erzeugen.
- Robuste lokale Speicherung unter `goldendawn.promptVault.v1` mit einem
  Schema-2-Envelope und kontrollierter Behandlung beschädigter, ungültiger oder
  nicht unterstützter Daten umgesetzt.
- Die fachlich unveränderliche Versionshistorie als append-only modelliert:
  Inhaltsänderungen ergänzen neue Snapshots und überschreiben keine frühere
  Fassung.
- Historische Fassungen können nach Bestätigung als neue `restored`-Version
  wiederhergestellt werden; bestehende Historie bleibt erhalten.
- UI, Controller, `PromptService`, `PromptStorage` und gemeinsamer
  `StorageAdapter` klar getrennt. Direkte `localStorage`-Zugriffe aus der
  Oberfläche wurden vermieden.

### Qualität und lokale Grenzen

- 162 automatisierte Tests für Suche, Storage-Adapter, Prompt-Speicherung,
  Service, Controller und View etabliert.
- PromptVault bleibt auf das aktuelle Browserprofil und den aktuellen Origin
  begrenzt. Die lokale Speicherung ist weder Synchronisierung noch
  geräteübergreifende Speicherung oder automatische Cloud-Sicherung.
- Import und Export, Webhooks, Airtable, Backend, Authentifizierung sowie echte
  SyncAgent-, DataAgent- oder TestAgent-Logik sind nicht Bestandteil dieses
  Meilensteins.
- Repository und öffentliche Beispiele verwenden ausschließlich synthetische
  Demo-Daten und enthalten keine privaten Kurs-, Reflexions- oder
  Gesundheitsdaten.

## v0.1.0 – 2026-07-11

### Foundation

- Vite mit Vanilla JavaScript, HTML und CSS als kleine, nachvollziehbare
  Frontend-Grundlage eingerichtet.
- Verbindliche Projekt- und Agentenregeln in `AGENTS.md` festgehalten.
- README, Architektur, Roadmap, Sicherheitsgrundlage sowie Daten- und
  Sync-Verträge als gemeinsame Projektreferenz aufgebaut.
- Fünf Architecture Decision Records zu Vite/Vanilla JavaScript, SyncAgent,
  DataAgent, privater und öffentlicher Datentrennung sowie dem
  Drei-Agenten-Scope dokumentiert.
- Zielarchitektur, Agentenrollen, Storage- und Sync-Grenzen, Sicherheitsregeln
  und schrittweise Entwicklungsreihenfolge definiert.
- UTF-8 ohne BOM, LF-Zeilenenden und abschließende Zeilenumbrüche als
  Repository-Standard festgelegt.
