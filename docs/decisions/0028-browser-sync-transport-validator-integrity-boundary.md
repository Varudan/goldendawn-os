# ADR 0028 – Browser SyncTransport Validator Integrity Boundary

## Status

Angenommen – 2026-08-29

## Kontext

Der Browser-SyncTransport-Vertrag wurde mit
[ADR 0026](0026-browser-sync-transport-contract.md) entschieden und mit
[ADR 0027](0027-browser-sync-transport-proof-boundaries.md) formal ersetzt.
ADR 0027 korrigiert zwei Nachweisgrenzen: Eine historische Erzeugungsrealm
fremder nativer Promise-, `Uint8Array`- und `ArrayBuffer`-Werte ist nach einer
vollständig passenden Umprototypisierung nicht öffentlich beweisbar, und die
private Browser-Requestgrenze von 65.536 Bytes ist unter dem geschlossenen
SyncContract v1 öffentlich nur bis zum maximalen kanonischen 193-Byte-Request
erreichbar. Der danach getrennt implementierte BrowserSyncTransport bleibt
isoliert, vom SyncService und von `src/main.js` unkomponiert und ausschließlich
mit kontrollierten netzwerkfreien Doubles geprüft.

Bei einer erneuten defensiven Prüfung wurde ein bestätigter, noch nicht
behobener Produktfehler an der Requestfreigabe festgestellt. Der Transport
ruft `validateSyncRequest` wie entschieden exakt zweimal auf demselben frisch
projizierten internen Requestgraphen auf. Beide Ausführungen verwenden jedoch
live manipulierbare Laufzeitfunktionen. Die bestehende terminale
Transportprüfung bestätigt anschließend exakte Shape, normale
Prototypidentitäten und -ketten, tatsächlichen Freeze sowie die Identität der
fünf primitiven Snapshotwerte und des frischen leeren Payloads. Sie bestätigt
die festen v1-Werte selbst aber nicht unabhängig von den beiden
Contractvalidatorausführungen.

Kontrollierte, netzwerkfreie Proben konnten deshalb durch Manipulation dieser
Laufzeitoberflächen vertragswidrige Versionen, Aktionen, Quellen und
Request-IDs bis zu Serialisierung, Controller, Timer und Fetch-Seam gelangen
lassen. Ein echter Browser, ein echter Netzwerkpfad oder ein Gateway wurden
dabei nicht verwendet. Es wurden keine privaten Daten oder produktiven Systeme
berührt.

Die bestehende grüne Suite mit 1604/1604 Tests beweist die Schließung dieser
Lücke nicht. ADR 0028 dokumentiert ausschließlich die Entscheidung für ihre
spätere Behebung. Der Fehler ist in diesem Slice nicht implementierungsseitig
behoben, und der Contractvalidator selbst wird weder geändert noch als
gehärtet dargestellt.

## Formale ADR-Wirkung

ADR 0028 ersetzt ADR 0027 formal. ADR 0028 übernimmt beide Korrekturen aus ADR
0027 vollständig. Sämtliche Regeln aus ADR 0026 und ADR 0027 gelten normativ
fort, soweit diese Entscheidung sie nicht ausdrücklich ändert.

ADR 0026 bleibt vollständig unverändert und behält seinen bestehenden Status
„Ersetzt durch ADR 0027“. In ADR 0027 wird ausschließlich die Statuszeile auf
„Ersetzt durch ADR 0028“ mit relativem Link und Datum `2026-08-29` geändert.
Der gesamte ADR-0027-Body ab `## Kontext` bleibt bytegleich. Historische
ADR-0026- und ADR-0027-Abschnitte in anderen Dokumenten werden nicht
rückwirkend umgeschrieben; eine neue aktuelle ADR-0028-Ebene stellt dort den
heutigen Entscheidungsstand dar.

Eine einzelne bisherige ADR-0026-/ADR-0027-Regel wird präzise ersetzt:

- Das Verbot eines dritten `validateSyncRequest`-Aufrufs bleibt bestehen.
- Ausschließlich das absolute Verbot jedes zusätzlichen transportlokalen
  Validierungspfads wird für genau eine terminale, private und feste
  v1-Wire-Policy ersetzt.
- Jeder weitere generische, importierte oder alternative Validatorpfad bleibt
  verboten.

Diese Änderung führt weder eine öffentliche API noch eine Dependency, einen
Testexport, eine Factoryoption oder eine weitere Composition-Seam ein.

## Bestätigter, noch nicht behobener Fehler

Die zweifache Contractvalidierung bleibt fachlich erforderlich. In der
aktuellen Implementierung kann ihre innere Entscheidung jedoch durch
Same-Realm-Manipulation live verwendeter Reflection-, Collection-, Regex-,
Iterator-, String-, Date-, Number-, Math- oder verwandter
Laufzeitoberflächen beeinflusst werden. Die zweite Validierung nach Deep Freeze
begrenzt zwar nachträgliche Graphmutation, ist aber kein von denselben
manipulierbaren Oberflächen unabhängiger v1-Wertnachweis.

Die vorhandene terminale Prüfung bindet den internen Graphen an den einmaligen
descriptorbasierten Snapshot und bestätigt dessen Struktur. Wenn ein
vertragswidriger primitiver Snapshotwert in den frischen Graphen projiziert
wurde und beide Contractvalidatorausführungen kompromittiert positiv melden,
bestätigt die terminale Identitätsprüfung lediglich, dass derselbe
vertragswidrige Wert unverändert geblieben ist. Sie bestätigt nicht
unabhängig, dass beispielsweise `version === "1.0"`,
`action === "syncTest"` oder `source === "goldendawn-os"` gilt.

Der Befund bedeutet ausdrücklich nicht:

- dass der Fehler bereits im Produktcode behoben ist;
- dass `src/contracts/syncContract.js` oder sein Validator gehärtet ist;
- dass ein realer Browser-, Netzwerk- oder Gatewaypfad existiert;
- dass private Daten, Credentials, Provider, Cloud-Tenants oder produktive
  Systeme betroffen waren;
- dass Same-Realm-Ausführung durch Deep Freeze oder die neue Policy zu einer
  Sandbox wird.

## Entscheidung

Die spätere Requestfreigabe muss verbindlich in dieser Reihenfolge erfolgen:

```text
descriptorbasierter Snapshot → frischer interner Graph → validateSyncRequest #1 → Deep Freeze → validateSyncRequest #2 → bestehende terminale Shape-/Freeze-Prüfung → neue feste v1-Wire-Policy → Stringify → UTF-8-Encoding → Controller → Timer → Fetch
```

Dabei gelten folgende Regeln:

1. Derselbe frische interne Requestgraph bleibt exakt zweimal Input von
   `validateSyncRequest`.
2. Ein dritter `validateSyncRequest`-Aufruf bleibt verboten.
3. Beide Contractvalidierungen und ihre bestehenden Resultprofile bleiben
   notwendig.
4. Beide Contractvalidierungen sind für die Wirefreigabe nicht mehr allein
   hinreichend.
5. Die bestehende terminale Shape-/Freeze-Prüfung bleibt unverändert
   erforderlich.
6. Unmittelbar vor `JSON.stringify` folgt genau eine private, nicht exportierte
   und feste v1-Wire-Policy-Prüfung.
7. Erst wenn auch diese Policy besteht, dürfen Stringify, UTF-8-Encoding,
   Controller, Timer und Fetch folgen.

### Feste v1-Wire-Policy

Die Policy liest Request- und Payloadproperties ausschließlich aus dem
internen tief eingefrorenen Graphen und nur über bei Modulevaluation erfasste
Intrinsics. Neben diesem Graphen darf sie für die Zeitkonsistenz ausschließlich
den bereits beim einmaligen Snapshot verwendeten primitiven Referenzzeitstring
als skalaren Wert verwenden. Sie liest weder Callerroot noch Callerpayload,
deren Keys, Deskriptoren, Prototypen oder Properties erneut.

Die Policy verwendet keine live aufgelösten oder importierten Regex-, Array-,
Set-, Map-, Iterator-, String-, Date-, Number-, Math-, Object-, Reflect- oder
Validator-Allowlist-Oberflächen. Eine transportprivate Regex-, Array-, Set-
oder Map-Allowlist ist ebenfalls nicht autorisiert. Maßgeblich sind
ausschließlich die bei Modulevaluation erfassten benötigten nativen
Intrinsics, ihre gebundenen Identitäten und direkte primitive Vergleiche.

Genau einmal werden ausschließlich diese Bedingungen bestätigt:

- `version === "1.0"`;
- `action === "syncTest"`;
- `source === "goldendawn-os"`;
- `requestId` ist ein primitiver String mit 5 bis einschließlich 64
  UTF-16-Codeeinheiten;
- die ersten vier Codeeinheiten sind exakt das Präfix `req_`;
- das erste Zeichen nach dem Präfix ist ausschließlich ein
  ASCII-Buchstabe oder eine ASCII-Dezimalziffer;
- jedes weitere Zeichen ist ausschließlich ein ASCII-Buchstabe, eine
  ASCII-Dezimalziffer, `_` oder `-`;
- `timestamp` ist ein primitiver String mit exakt 24 UTF-16-Codeeinheiten und
  dem kanonischen Format `YYYY-MM-DDTHH:mm:ss.sssZ`;
- an den Positionen 4, 7, 10, 13, 16, 19 und 23 stehen exakt `-`, `-`, `T`,
  `:`, `:`, `.` und `Z`;
- alle übrigen Timestamp-Positionen enthalten ausschließlich
  ASCII-Dezimalziffern;
- der Timestamp bezeichnet ein tatsächlich gültiges Datum mit gültigen
  Zeitbereichen und lässt sich über erfasste native Date-, Number-, Apply- und
  Construct-Intrinsics identisch in denselben kanonischen UTC-String
  zurückprojizieren;
- sein Abstand zur bereits verwendeten primitiven Referenzzeit beträgt
  höchstens 300.000 Millisekunden;
- der Root besitzt exakt sechs normale, aufzählbare, eingefrorene
  Own-Data-Properties `version`, `action`, `source`, `requestId`, `timestamp`
  und `payload`;
- Root und Payload besitzen exakt die normalen erfassten Prototypketten;
- weder Root noch Payload noch der maßgebliche normale Prototyp besitzen eine
  unzulässige eigene `toJSON`-Property;
- `payload` ist exakt leer, normal, eingefroren und ausschließlich die vom
  frischen internen Graphen erzeugte Payloadidentität.

Der Zeitvergleich ist ausschließlich ein interner Konsistenzcheck. Da der
Requesttimestamp und die derzeitige Referenz identisch sind, beweist die
Grenze weder unabhängige Frische noch Uhrvertrauenswürdigkeit, Replayabwehr,
Idempotenz oder Deduplizierung.

Jede Policyabweichung endet vor transportgesteuertem Stringify, Encoding,
Controller, Timer und Fetch mit demselben bestehenden statischen
BrowserSyncTransport-Methodenfehler. Weder ein fremder Wert noch ein
Validierungs-, Reflection-, Date-, Dependency- oder Exceptiondetail wird
zurückgegeben, geloggt oder emittiert.

Die Policy verhindert keine beliebigen eigenen Nebenwirkungen eines zuvor
ausgeführten kompromittierten Same-Realm-Validator-Hooks. Beobachtete
Inkonsistenzen können fail-closed stoppen; bereits ausgeführte fremde Wirkung
kann weder zurückgenommen noch allgemein verhindert werden. Same-Realm ist
keine Sandbox.

Eine spätere Contracterweiterung öffnet den BrowserSyncTransport nicht
automatisch. Jede neue Version, Aktion oder Quelle benötigt eine eigene
Entscheidung und einen eigenen Implementierungs- und Mutationsnachweis. Ohne
eine solche neue Entscheidung bleibt die feste v1-Wire-Policy geschlossen.

`src/contracts/syncContract.js`, seine Exports, das n8n-Bundle, dessen
Manifest und der Generator bleiben unverändert. ADR 0028 entscheidet keine
Contracthärtung und keine Bundleänderung.

## Fortgeltende Grenzen

Unverändert fort gelten insbesondere:

- die geschlossene Factory- und Methoden-API;
- sämtliche Arityregeln;
- exakt die vier Composition-Seams `fetchRequest`,
  `createAbortController`, `setDeadlineTimer` und `clearDeadlineTimer`;
- der feste Endpoint `http://127.0.0.1:8787/api/sync-test`;
- der einmalige descriptorbasierte Callersnapshot ohne Rereads;
- der daraus erzeugte frische disjunkte Requestgraph;
- genau zwei Contractvalidatoraufrufe;
- einmalige Serialisierung und UTF-8-Messung;
- der private Browserrequestcap von 65.536 Bytes;
- die ADR-0027-Nachweisgrenze mit dem öffentlichen 193-Byte-Kontrollfall und
  den temporären Cap-Kopien 193/192;
- höchstens ein Fetch;
- kein Retry, Discovery, Fallback oder transportgesteuertes
  Redirectmanagement;
- die beobachtbaren Promise- und Bufferprofile ohne Provenienzbehauptung;
- Deadline, First-Terminal-Owner, Abort und Cleanup;
- die fail-fast Response- und Headerreihenfolge;
- eine sichtbare kanonische primitive `Content-Length` von höchstens 16.384;
- Bodyzugriff erst nach sämtlichen bestandenen Headerprüfungen;
- die öffentliche Responsekante 16.384/16.385;
- begrenzte Streamcopy, sauberer EOF, striktes UTF-8 und einmaliges
  JSON-Parsing;
- die statische Redaction des vom Methoden-Promise zurückgegebenen Fehlers;
- die Korrelation und semantische Responseprojektion im SyncService;
- die weiterhin fehlende Komposition in `src/main.js`;
- der Ausschluss von Providern, Credentials und privaten Daten.

Die feste v1-Wire-Policy ändert keine Response-, Header-, Stream-, Deadline-,
Promise-, Buffer-, Fehler- oder Servicekorrelationsregel.

## Promise-/Host-Restgrenze

Für Fetch-, Read- und zulässige Cleanup-Promise-Kandidaten gelten weiterhin
die geschlossenen beobachtbaren Profile aus ADR 0027:

- Es gibt keine freie `.then`-Auflösung.
- `Promise.resolve` wird nicht verwendet.
- Die bei Modulevaluation erfasste native `Promise.prototype.then`-Methode
  wird erst nach vollständig bestandenem Promiseprofil auf den Kandidaten
  angewendet.
- Der Transport liest, loggt oder emittiert den fremden Rejectiongrund nicht.
- Der öffentliche Methodenfehler bleibt ausschließlich statisch redigiert.

Kann ein bereits abgelehntes Fetch-, Read- oder Cleanup-Promise wegen eines
ungültigen Profils nicht über die erfasste `then`-Methode beobachtet werden,
kann der Host später dennoch ein hostweites `unhandledrejection`-
beziehungsweise `unhandledRejection`-Ereignis mit dem ursprünglichen fremden
Grund auslösen. Weder Eintritt, Zeitpunkt, Häufigkeit noch Fortsetzung des
Prozesses sind hostübergreifend garantiert. Insbesondere wird nicht behauptet,
dass ein solches Ereignis beim Return des öffentlichen Methoden-Promises
bereits zwingend emittiert wurde.

Bei einem malformed Cleanup-Promise kann der öffentliche Methodenaufruf
erfolgreich enden, während der Hostkanal getrennt später auftritt. Produktive
Host- und Seamwerte müssen deshalb die festgelegten nativen Promiseprofile
erfüllen. Diese Wirkung bleibt eine dokumentierte Restgrenze und wird später
isoliert host- und versionsgebunden charakterisiert. Der Transport führt dafür
keinen fremden Rejectionhandler vor bestandener Profilprüfung ein.

## Unveränderte Content-Length-Entscheidung

ADR 0028 ändert keine Responseheader- oder Content-Length-Regel:

- Eine fehlende beziehungsweise `null` gelesene `Content-Length` scheitert
  während der Headerprüfung vor `content-encoding`, Bodyproperty, Reader und
  Chunkzugriff.
- `16.384` bleibt die inklusive öffentlich erreichbare Grenze.
- Eine deklarierte `Content-Length` von `16.385` scheitert während der
  Headerprüfung.
- Ein einzelner 16.385-Byte-Chunk bei deklarierter Länge 16.384 überschreitet
  notwendigerweise zugleich die deklarierte Restlänge und den absoluten Cap.
- Dieser Fall muss später den Abbruch vor Kopie, weiterer Allokation und einem
  weiteren Read zeigen.
- Er ist kein isolierter öffentlicher Nachweis allein des absoluten Caps.
- Aus diesen browserbeobachtbaren Regeln folgen keine Behauptungen über
  Wire-Oktette, Kompression, Browserdekompression oder bereits durch Browser,
  JavaScript-Engine, Betriebssystem oder Netzwerkstack erfolgte Allokationen.

## Verbindliche spätere Testmatrix

Der nächste Implementierungsslice ergänzt die bestehende netzwerkfreie
mutationswirksame Suite. ADR 0028 erzeugt in diesem Dokumentationsslice keinen
Testcode. Die spätere Matrix umfasst mindestens:

### Validator- und Allowlist-Manipulationen

- manipuliertes `Object.getOwnPropertyDescriptor` bei tatsächlicher Version
  `2.0`;
- `Array.prototype.push` als No-op;
- `Array.prototype.includes = () => true`;
- `RegExp.prototype.test = () => true`;
- `Map.prototype.has = () => false`;
- `Map.prototype.set` als No-op;
- einen leeren `Array.prototype[Symbol.iterator]`;
- persistente Vergiftung privater Regex-/Set-Objekte nach Wiederherstellung
  der sichtbaren Intrinsics;
- manipulierte Date-, `toISOString`-, Number-, Math- und Stringoberflächen.

### Feste v1-Werte und Zeit

- Request-ID `req_` ohne Folgezeichen;
- erstes Folgezeichen `_` oder `-`;
- Nicht-ASCII-Zeichen;
- unerlaubte ASCII-Interpunktion;
- die minimale gültige Request-ID;
- gültige Request-IDs mit insgesamt 64 Zeichen und die ungültige
  65-Zeichen-Grenze;
- einen gültigen Schalttag;
- einen ungültigen Kalendertag;
- Zeit- und Datumsbereichsfehler;
- exakte kanonische UTC-Rückprojektion;
- für jeden Fehler null transportgesteuerte Stringify-, Encode-, Controller-,
  Timer- und Fetch-Aufrufe;
- eine gültige Kontrolle mit exakt zwei Contractvalidatoraufrufen, genau einer
  festen v1-Wire-Policy-Prüfung und genau einem Fetch;
- keine dritte `validateSyncRequest`-Ausführung;
- einen kausalen Mutationstest, bei dem Neutralisieren oder Umgehen der Policy
  in einer temporären Quellkopie mindestens einen Validatorbypass wieder bis
  Fetch gelangen lässt.

### Intrinsics, Promise und Deadline

- post-import mutierte Promise-, Array-, `Uint8Array`-, TypedArray-,
  `ArrayBuffer`-, Object-, TextEncoder- und TextDecoder-Prototypketten;
- Abweichungen der Constructor-/Species-Descriptorflags;
- irreversibel veränderte Descriptorflags ausschließlich in einem
  wegwerfbaren Kindprozess;
- eine synchron ausgelöste Deadline, nach der der Timer-Seam wirft, mit null
  Fetch, Abort und Clear ohne zurückgegebenes Handle;
- isolierte Kindprozesscharakterisierung bereits abgelehnter malformed Fetch-,
  Read- und Cleanup-Promises;
- mindestens eine Promiseprobe, die bestätigt, dass die erfasste `then`-
  Methode nicht auf einen ungültig profilierten Kandidaten angewendet wird.

### UTF-8, Header und Stream

- eine ungültige UTF-8-Sequenz, deren Ersatzdecodierung parsebares JSON
  ergäbe, mit null JSON-Parse;
- eine positive echte Multibyte-UTF-8-Probe;
- getrennt nicht coercible Responsefelder und Headerwerte mit null
  Coercion-Hooks;
- `Content-Length: null` mit null Bodyproperty-, Reader- und Chunkzugriffen;
- den 16.385-Byte-Fall mit null Kopieraufrufen, genau einem
  Transportzielbuffer und keinem weiteren Read;
- stage-spezifische Erwartungen nach jeder fehlgeschlagenen
  Methodenauflösung.

Alle globalen Mutationen laufen seriell und werden im `finally` vollständig
wiederhergestellt. Irreversible oder nicht zuverlässig wiederherstellbare
Mutationen laufen ausschließlich in wegwerfbaren Kindprozessen. Temporäre
Quellkopien und Kindprozessartefakte werden vollständig bereinigt. Die Matrix
verwendet ausschließlich kontrollierte Doubles und führt weder echten Browser-
noch echten Netzwerk- oder Gatewayzugriff aus.

## Sicherheits- und Datenschutzfolgen

- Nach Implementierung und Mutationsnachweis soll die feste Policy eine vom
  live manipulierbaren Contractvalidator unabhängige terminale Freigabe
  ausschließlich für die aktuellen v1-Werte schaffen.
- Beide Contractvalidierungen bleiben als fachliche und strukturelle
  Defense-in-Depth erhalten.
- Die Policy begrenzt Wirefreigabe, nicht beliebige vorherige Same-Realm-
  Nebenwirkungen.
- Same-Realm und Deep Freeze bleiben keine Sandbox.
- Statische Methodenfehler-Redaction verhindert keine getrennten späteren
  Hostereignisse aus bereits abgelehnten ungültigen Promise-Kandidaten.
- Request-ID, Quelle und Timestamp bleiben Metadaten und beweisen weder
  Identität, Authentisierung, Berechtigung, Frische noch Datenschutz.
- Dieser Entscheidungsslice greift nicht auf PromptVault, LearningHub,
  LichtwaldLog oder GoldenDawn-Vault zu und verarbeitet keine privaten Daten.
- Es entsteht kein Browser-, Netzwerk-, Gateway-, Cloud-, n8n-, Provider-,
  Credential-, Storage-, Logging- oder Telemetriepfad.
- Die bestehende enge Phase-0-/Tor-A-Arbeitshypothese wird nicht zu einer
  Rechts-, Compliance- oder Gesamtprojektklassifikation erweitert.

## Aktivierungs- und Neubewertungsgates

ADR 0028 ist angenommen, aber noch nicht implementiert. Das bestehende reale
Browser-Runtimegate bleibt geschlossen. Vor seiner Ausführung muss zuerst der
getrennte Implementierungsslice der festen v1-Wire-Policy samt vollständiger
mutationswirksamer Matrix bestehen.

Die Reihenfolge bleibt verbindlich:

1. feste transportlokale v1-Wire-Policy und ADR-0028-Testmatrix
   implementieren;
2. den isolierten Slice netzwerkfrei vollständig mit `PASS` nachweisen;
3. danach das getrennte reale, an konkreten Kontext, Betriebssystem, Browser
   und Version gebundene CORS-/Preflight-, PNA-/LNA-, lokale
   Netzwerkberechtigungs- und Secure-Context-/Mixed-Content-Runtimegate
   ausführen;
4. erst nach dessen gebundenem `PASS` die Browserkomposition als weiteren
   getrennten Slice beginnen;
5. danach den lokalen Browser-End-to-End-`syncTest` getrennt nachweisen;
6. globale Betriebsgrenzen und Provider weiterhin erst in späteren eigenen
   Entscheidungen behandeln.

Ein ADR, eine grüne bestehende Suite oder die isolierte Transportexistenz
öffnet keines dieser nachgelagerten Gates automatisch.

## Nicht Bestandteil dieses Slices

Dieser Dokumentations- und Entscheidungsslice implementiert insbesondere
nicht:

- die feste v1-Wire-Policy in
  `src/transports/browserSyncTransport.js`;
- Änderungen an `tests/browserSyncTransport.test.js` oder anderen Tests;
- Contractvalidator-, Contractexport-, n8n-Bundle-, Manifest- oder
  Generatoränderungen;
- eine geänderte Content-Length-, Header-, Response-, Promise-, Stream- oder
  Deadlinepolicy;
- einen Browser-, Netzwerk-, Gateway-, Cloud-, n8n-, Provider- oder
  Credentialzugriff;
- `src/main.js`-, SyncService-, UI-, CSS- oder Browserkomposition;
- Browser-End-to-End-`syncTest`, private Payloads, weitere Aktionen, Tools,
  Persistenz, Logging oder Telemetrie;
- eine neue API, Dependency, Factoryoption oder Composition-Seam;
- Commit, Push, Tag oder Release.

Paketversion `0.2.2`, lokales Tag `v0.2.2` und neuestes veröffentlichtes
Release `v0.2.2` bleiben unverändert. Die n8n-Gates bleiben
`FAIL`/`UNPROVEN` und geschlossen.

## Konsequenzen

Positive Auswirkungen:

- Nach Implementierung und Mutationsnachweis soll die Wirefreigabe der aktuell
  einzigen Version, Aktion und Quelle nicht mehr ausschließlich von zwei
  gleichartig manipulierbaren Contractvalidatorausführungen abhängen.
- Die vorhandene descriptorbasierte Snapshot-, Freeze- und
  Contractvalidierungsreihenfolge bleibt erhalten.
- Der entschiedene künftige Pfad soll privat, fest und versionsgebunden bleiben
  und weder API noch Composition vergrößern.
- Ein kausaler Mutationstest muss beweisen, dass die Policy die konkret
  bestätigte Lücke tatsächlich schließt.
- Historische ADR-0026-/ADR-0027-Regeln und Nachweisgrenzen bleiben
  nachvollziehbar erhalten.

Kosten und verbleibende Einschränkungen:

- Die festen v1-Werte werden an der Transportgrenze bewusst zusätzlich
  geprüft; diese Duplizierung ist die Kostenfolge der unabhängigen
  Wirefreigabe.
- Eine Contracterweiterung benötigt immer eine neue Entscheidung und neue
  Transporttests.
- Bereits vor der Policy ausgeführte Same-Realm-Hooks können eigene
  Nebenwirkungen gehabt haben.
- Vor Modulevaluation kompromittierte Intrinsics oder Modulcode, eine
  kompromittierte Engine, OOM und Prozessabbruch bleiben außerhalb der
  Garantie.
- Ungültig profilierte, bereits abgelehnte Promises können einen getrennten
  hostabhängigen `unhandled*`-Kanal auslösen.
- Die bestehende Suite bleibt bis zur Implementierung und zum kausalen
  Mutationsnachweis kein Beweis der Lückenschließung.

## Erwogene Alternativen

### Ausschließlich auf die zwei Contractvalidierungen vertrauen

Verworfen. Beide Ausführungen können von denselben live manipulierbaren
Laufzeitoberflächen beeinflusst werden. Die zweite Ausführung nach Freeze
liefert keinen davon unabhängigen festen v1-Wertnachweis.

### Einen dritten `validateSyncRequest`-Aufruf ergänzen

Verworfen. Ein dritter Aufruf derselben Validatoroberfläche schafft keine
unabhängige Wirepolicy und verletzt den fortgeltenden Aufrufvertrag.

### Den Contractvalidator und das n8n-Bundle in diesem Slice härten

Verworfen. Das würde die gemeinsame Contractgrenze, Exports und generierten
Derivate ändern, während der bestätigte Fehler an der transportlokalen
Wirefreigabe eng mit einer festen v1-Policy geschlossen werden kann.
Contracthärtung bleibt eine eigene mögliche Entscheidung.

### Regex-, Set-, Map-, Array- oder Iterator-Allowlists verwenden

Verworfen. Live Oberflächen und persistent vergiftbare private Objekte würden
die neue unabhängige Grenze erneut von den konkret problematischen
Same-Realm-Hooks abhängig machen.

### Den serialisierten JSON-String nachträglich prüfen

Verworfen. Die feste Freigabe muss vor transportgesteuertem Stringify und
Encoding liegen. Eine Stringprüfung danach würde fremde Serialisierungswirkung
bereits zulassen und die autoritative interne Graphgrenze verschieben.

### Einen zweiten generischen Transportvalidator kopieren oder importieren

Verworfen. Ein alternativer generischer Validatorpfad vergrößert Drift- und
Angriffsfläche und öffnet künftige Contractwerte implizit. Die Entscheidung ist
bewusst fest auf v1 gebunden.

### Das reale Browser-Runtimegate zuerst ausführen

Verworfen. Ein Runtime-`PASS` darf keinen bekannten offenen Produktfehler der
vorherigen Wirefreigabe überspringen. Die v1-Wire-Policy muss zuerst
implementiert und netzwerkfrei nachgewiesen werden.

### Die bestehende terminale Shape-/Freeze-Prüfung als ausreichend behandeln

Verworfen. Sie bestätigt Stabilität und Snapshotidentität, aber keine
unabhängigen festen v1-Werte.

## Bedingungen für eine Neubewertung

Eine neue Entscheidung ist erforderlich, wenn:

- Version, Aktion, Quelle, Request-ID- oder Timestampformat geändert werden;
- ein nicht leeres Payload oder eine weitere Aktion erlaubt werden soll;
- der Transport einen generischen oder dynamischen Contractpfad erhalten soll;
- der Contractvalidator selbst gehärtet oder seine Exports geändert werden;
- Bundle, Manifest oder Generator angepasst werden sollen;
- eine andere Referenzzeit-, Frische-, Replay- oder Idempotenzsemantik benötigt
  wird;
- ein anderes Promise-/Hostprofil oder aktive Behandlung ungültig profilierter
  Rejections erforderlich wird;
- Content-Length-, Responsecap-, Stream-, Endpoint-, Fetch-, Redirect-,
  Deadline-, Fehler- oder CORS-Semantik geändert werden soll;
- Browserkomposition, private Daten, Provider, Credentials, Tools oder
  Nebenwirkungen eingeführt werden.

Zusätzlich gelten sämtliche nicht ersetzten Neubewertungstrigger aus ADR 0026
und ADR 0027 fort.

## Nächster getrennt freizugebender Slice

Als Nächstes folgt ausschließlich die Implementierung der privaten festen
v1-Wire-Policy in `src/transports/browserSyncTransport.js` samt der in diesem
ADR entschiedenen netzwerkfreien mutationswirksamen Erweiterung von
`tests/browserSyncTransport.test.js`. Der Slice ändert weder SyncContract noch
n8n-Bundle, Manifest oder Generator und führt keinen echten Browser-,
Netzwerk- oder Gatewayzugriff aus.

Erst nach einem vollständigen `PASS` dieses Implementierungsslices folgt das
getrennte reale, kontext- und versionsgebundene Browser-Runtimegate. Die
Browserkomposition und der lokale Browser-End-to-End-`syncTest` bleiben danach
weitere getrennte Slices. Globale Betriebsgrenzen und Provider folgen erst
später.

## Verwandte Dokumente

- [ADR 0017: Transportneutrale SyncService Foundation](0017-transport-neutral-sync-service-foundation.md)
- [ADR 0020: Lokale SyncGateway Raw-Wire- und HTTP-Foundation](0020-local-sync-gateway-raw-wire-http-foundation.md)
- [ADR 0023: Lokaler SyncAgent vor optionalen externen Providern](0023-local-syncagent-before-optional-external-providers.md)
- [ADR 0025: Local SyncGateway–SyncAgent Composition](0025-local-syncgateway-syncagent-composition.md)
- [ADR 0026: Browser SyncTransport Contract](0026-browser-sync-transport-contract.md)
- [ADR 0027: Beobachtbare Browser-SyncTransport-Nachweisgrenzen](0027-browser-sync-transport-proof-boundaries.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
