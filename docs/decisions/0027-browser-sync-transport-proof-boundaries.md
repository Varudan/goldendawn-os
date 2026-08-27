# ADR 0027 – Beobachtbare Browser-SyncTransport-Nachweisgrenzen

## Status

Angenommen – 2026-08-27

## Kontext

Der Browser-SyncTransport-Vertrag wurde mit
[ADR 0026](0026-browser-sync-transport-contract.md) als reiner
Dokumentations- und Entscheidungsslice festgelegt. Der danach begonnene erste
Implementierungsversuch wurde vor jeder Dateiänderung hart gestoppt. Working
Tree und Index blieben unverändert; auch die beiden geplanten Zielpfade
`src/transports/browserSyncTransport.js` und
`tests/browserSyncTransport.test.js` wurden nicht angelegt. Es erfolgte kein
echter Browser-, Netzwerk- oder Gatewayzugriff.

Der Stopp beruhte nicht auf einer festgestellten Produktlücke, sondern auf zwei
widersprüchlichen beziehungsweise mit den erlaubten öffentlichen
JavaScript-Beobachtungen nicht erfüllbaren Nachweisanforderungen:

1. Die historische Erzeugungsrealm fremd gelieferter echter nativer Promises,
   `Uint8Array`-Views und `ArrayBuffer` kann nach einer vor Übergabe vollständig
   passend vorgenommenen Umprototypisierung nicht bewiesen werden.
2. Die private Requestgrenze von 65.536 UTF-8-Bytes ist unter dem aktuell
   geschlossenen SyncContract v1 über die öffentliche Transport-API nicht bis
   zu ihren realen Grenzwerten erreichbar.

Die bestehende Architektur benötigt für diese Korrektur keine zusätzliche API,
Dependency oder Produktionsseam. Der Implementierungsversuch bleibt bis zum
Merge dieses ADR pausiert.

## Formale ADR-Wirkung

ADR 0027 ersetzt ADR 0026.

Der historische Body von ADR 0026 bleibt ab `## Kontext` bytegleich. Diese
Entscheidung übernimmt normativ sämtliche Regeln aus ADR 0026, soweit sie nicht
in den beiden folgenden Punkten ausdrücklich ersetzt werden:

1. Für fremd gelieferte Promise-, `Uint8Array`- und `ArrayBuffer`-Kandidaten
   wird keine Erzeugungsrealm oder historische Constructor- beziehungsweise
   Subclassprovenienz mehr behauptet. Maßgeblich ist ausschließlich das zum
   Prüfzeitpunkt beobachtbare geschlossene native Brand-, Prototyp-,
   Descriptor- und Zustandsprofil.
2. Der private Requestcap bleibt 65.536 UTF-8-Bytes, aber ein öffentlich
   erreichbarer verhaltensseitiger 65.536/65.537-Grenztest wird für den
   geschlossenen SyncContract v1 nicht mehr behauptet. Seine Verdrahtung und
   Vergleichssemantik werden später mit dem in diesem ADR festgelegten
   temporären Source-Mutation-Harness belegt.

Wo die historischen Aussagen aus ADR 0026 zur Same-Realm- oder
Subclassprovenienz fremder Kandidaten oder zum öffentlichen
65.536/65.537-Requestgrenztest diesen beiden Korrekturen widersprechen, ist
ausschließlich ADR 0027 maßgeblich. Das ist keine allgemeine Neuinterpretation
oder Lockerung von ADR 0026.

Insbesondere bleiben unverändert verbindlich:

- Modulort und einziger Export;
- Factory-, API- und Arityvertrag;
- exakt vier Composition-Seams;
- die feste URL `http://127.0.0.1:8787/api/sync-test`;
- der einmalige descriptor-basierte Requestsnapshot;
- der frische disjunkte Requestgraph;
- die zweifache Validierung desselben Graphen;
- die einmalige Serialisierung und UTF-8-Messung;
- die private Requestgrenze von 65.536 Bytes;
- die exakte RequestInit- und Headerpolicy;
- höchstens ein Fetch, kein Retry und kein Fallback;
- die nativen Promise-, Constructor- und Species-Prüfungen;
- die 5.000-ms-Deadline und der First-Terminal-Owner;
- die Abort- und Cleanupgrenzen;
- die fail-fast Response- und Headerreihenfolge;
- die öffentlich erreichbare Responsegrenze von 16.384/16.385 Bytes;
- die Nullchunk-, Buffer-, EOF- und Kopierregeln;
- die strikte UTF-8-Decodierung, sichtbare BOM-Semantik und das einmalige
  JSON-Parsing;
- die statische Redaction;
- die unveränderte SyncService-Verantwortung;
- die weiterhin fehlende Browserkomposition;
- das separate PNA-/LNA-/Mixed-Content-Runtimegate;
- der Ausschluss von Providern, Modellen, Credentials und privaten
  Datenpfaden.

Auch alle nicht einzeln wiederholten, nicht ausdrücklich ersetzten
ADR-0026-Entscheidungen gelten unverändert fort.

## Entscheidung

### Beobachtbares natives Promiseprofil statt Realmprovenienz

Die ECMAScript-Verfahren für Promises prüfen native Promisemerkmale und stellen
die beobachtbare Constructor-/Species-Oberfläche bereit. Sie exponieren keine
historische Erzeugungsrealm-ID. Maßgebliche technische Referenz ist
[`Promise.prototype.then`](https://tc39.es/ecma262/2025/multipage/control-abstraction-objects.html#sec-promise.prototype.then).

Für fremd gelieferte Fetch-, Read- und zulässige Cleanup-Promise-Kandidaten
gilt verbindlich:

- Eine Erzeugungsrealm oder historische Constructor- beziehungsweise
  Subclassprovenienz wird nicht behauptet.
- Zulässig ist ausschließlich ein Kandidat, der zum Prüfzeitpunkt das echte
  native Promise-Brandprofil besitzt, exakt den erfassten lokalen
  `Promise.prototype` sowie die vollständig erfasste lokale Prototypkette
  erfüllt, eine vollständig leere Own-Key-Menge ohne eigene
  `constructor`-Property besitzt und die unveränderten erfassten Constructor-
  und Species-Descriptoren einschließlich Konstruktor- und
  Species-Getteridentität beobachtet.
- Der Kandidat wird ausschließlich über die bei Modulevaluation erfasste
  native `Promise.prototype.then`-Referenz mit richtigem Receiver verarbeitet.
  `Promise.resolve`, eine frei gelesene `.then`-Property und fremde Thenables
  bleiben ausgeschlossen.
- Ein gewöhnliches unverändertes Cross-Realm-Promise scheitert weiterhin an
  der direkten Prototypidentität.
- Ein echtes Cross-Realm-Promise kann bereits vor der Übergabe vollständig auf
  das lokale Promise-Profil umprototypisiert worden sein. Seine historische
  Herkunft ist danach mit den erlaubten öffentlichen Prüfungen nicht mehr
  unterscheidbar. Ein solcher Kandidat darf nicht unter der falschen
  Behauptung einer bewiesenen Erzeugungsrealm abgelehnt werden.
- Dasselbe gilt für eine echte native Promise-Subclass, wenn sie vor Übergabe
  vollständig passend umprototypisiert wurde und zum Prüfzeitpunkt kein
  beobachtbares Subclassmerkmal mehr trägt.
- Realm-Herkunft ist kein Authentisierungs-, Autorisierungs-, Identitäts-,
  Datenschutz- oder Vertrauensbeweis.
- Der Transport selbst verändert niemals den Prototyp eines fremden
  Kandidaten.

Das vom Transport über den erfassten lokalen Konstruktor selbst erzeugte äußere
Methoden-Promise bleibt dagegen transport-eigen und lokal erzeugt. ADR 0027
lockert auch fremde Promisewerte nicht pauschal auf „Cross-Realm erlaubt“.
Akzeptiert wird ausschließlich das exakt geschlossene und zum Prüfzeitpunkt
beobachtbare native Profil.

Unverändert abgelehnt werden:

- fremde Thenables;
- Proxies und Fakes ohne natives Promise-Brandprofil;
- zusätzliche Own Keys oder Symbole;
- eigene `constructor`-Accessors;
- unverändert sichtbare Promise-Subclassprototypen;
- mutierte `Promise.prototype.constructor`-Descriptoren;
- mutierte `Promise[Symbol.species]`-Descriptoren;
- fremde Species-Getter oder Konstruktoridentitäten;
- frei gelesene `.then`-Properties;
- `Promise.resolve`-Assimilation.

### Beobachtbares Uint8Array-/ArrayBuffer-Profil statt Realmprovenienz

Die nativen TypedArray- und ArrayBuffer-Intrinsics prüfen interne Brands und
Zustände, exponieren aber ebenfalls keine historische Erzeugungsrealm. Die
technischen Referenzen sind
[`%TypedArray%.prototype.buffer`](https://tc39.es/ecma262/2025/multipage/indexed-collections.html#sec-get-%typedarray%.prototype.buffer)
und
[`ArrayBuffer.prototype.byteLength`](https://tc39.es/ecma262/2025/multipage/structured-data.html#sec-get-arraybuffer.prototype.bytelength).

Für fremde Readerchunks gilt verbindlich:

- Eine Erzeugungsrealm oder historische TypedArray-/ArrayBuffer-
  Subclassprovenienz wird nicht behauptet.
- Zulässig ist ausschließlich ein Kandidat mit echtem nativen
  `Uint8Array`-Brandprofil, echtem nativen `ArrayBuffer`-Brandprofil und zum
  Prüfzeitpunkt exakt den erfassten lokalen Prototypidentitäten und -ketten.
- Sein Buffer muss fest, nicht geteilt, nicht detached und, sofern unterstützt
  und prüfbar, `resizable === false` sein. Die Chunk-ByteLength muss eine
  gültige positive sichere Ganzzahl sein; sämtliche bisherigen Restlängen- und
  Capprüfungen bleiben verbindlich.
- Eine unveränderte Cross-Realm-View oder ein unveränderter Cross-Realm-Buffer
  scheitert weiterhin an der Prototypidentität.
- Wird nur die View oder nur ihr Backing-Buffer passend umprototypisiert,
  bleibt der Kandidat unzulässig.
- Wurden eine echte fremde View und ihr echter fester fremder Backing-Buffer
  bereits vor Übergabe vollständig passend umprototypisiert, ist ihre
  historische Realm mit öffentlichen Prüfungen nicht mehr unterscheidbar.
- Der Transport verändert selbst keine fremden Prototypen.
- Akzeptierte Bytes werden weiterhin unmittelbar und ohne verbleibende
  Fremdidentität in den wirklich transport-eigenen lokalen Zielbuffer kopiert.
  Eine anschließende Mutation oder Wiederverwendung des Fremdchunks darf die
  lokale Kopie nicht verändern.
- Realm-Herkunft ist kein Authentisierungs-, Autorisierungs-, Identitäts- oder
  Vertrauensbeweis.

Vollständig negativ bleiben:

- Proxy und Fake;
- `SharedArrayBuffer`;
- Growable SharedArrayBuffer;
- resizable `ArrayBuffer`;
- detached Buffer;
- malformed Buffer;
- eine falsche oder nur teilweise passende Prototypoberfläche;
- Nullchunk;
- falsche Länge;
- Überschreitung der deklarierten Länge oder des Responsecaps.

Diese Korrektur ist keine allgemeine Zulassung beliebiger Cross-Realm-Werte.

### Private 65.536-Byte-Requestgrenze und öffentliche Erreichbarkeit

Die produktive Transportgrenze bleibt unverändert privat und nicht
injizierbar:

- höchstens 65.536 UTF-8-Bytes sind zulässig;
- Byte 65.537 wird vor Controller, Timer und Fetch abgelehnt;
- es gibt keinen Testexport, Cap-Parameter oder zusätzlichen Composition-Seam.

Unter dem aktuellen geschlossenen SyncContract v1 ist diese reale Capgrenze
über `sendSyncRequest` öffentlich nicht erreichbar. Version, Aktion und Quelle
sind feste ASCII-Werte, der Payload ist exakt leer, der kanonische Timestamp
umfasst exakt 24 ASCII-Zeichen, und `requestId` besitzt maximal 64 erlaubte
ASCII-Zeichen einschließlich des Präfixes `req_`. Der größte gültige,
kanonisch projizierte und in der festgelegten Feldreihenfolge serialisierte
v1-Request umfasst deshalb aktuell exakt 193 UTF-8-Bytes: 129 feste Bytes plus
die insgesamt höchstens 64 Zeichen der `requestId`.

Eine insgesamt 65 Zeichen lange `requestId` ist vertragswidrig. Sie scheitert
bei der Validierung vor Serialisierung, Encoding, Controller, Timer und Fetch.
Die erreichbaren 193 Bytes ersetzen den produktiven Cap von 65.536 Bytes
nicht. Dieser bleibt Defense-in-Depth und benötigt bei jeder künftigen
Contracterweiterung eine erneute Erreichbarkeits- und Grenzprüfung. Für v1 wird
kein öffentlicher verhaltensseitiger 65.536/65.537-Requesttest behauptet.

Davon getrennt bleiben unverändert:

- die echte Gateway-Raw-Wire-Grenze von 65.536/65.537 Bytes;
- die öffentlich erreichbare Response-Streaminggrenze von 16.384/16.385
  Bytes.

Diese drei Grenzen dürfen weder gleichgesetzt noch als wechselseitiger Beweis
verwendet werden.

### Verbindlicher späterer Cap-Testvertrag

Der spätere mutationswirksame Implementierungstest verwendet zwei getrennte
Nachweiswege.

Der öffentliche Kontrollpfad:

1. baut den maximal gültigen v1-Request mit insgesamt exakt 64 erlaubten
   ASCII-Zeichen in `requestId`, den festen übrigen Contractwerten, einem
   kanonischen Timestamp und exakt leerem Payload;
2. bestätigt am frisch projizierten JSON-Body exakt 193 UTF-8-Bytes;
3. lässt diesen Request bei ansonsten vollständig bestandenen Doubles bis zu
   genau einem Fetch gelangen;
4. bestätigt, dass eine insgesamt 65 Zeichen lange `requestId`
   vertragsseitig vor Stringify, Encode, Controller, Timer und Fetch scheitert.

Der temporäre Source-Mutation-Harness belegt die private Capverdrahtung kausal
ausschließlich an temporären Testkopien des späteren Transportmoduls:

- Mit privater Requestgrenze `193` bleibt derselbe maximal gültige
  193-Byte-Request zulässig.
- Mit privater Requestgrenze `192` scheitert derselbe Request statisch vor
  Controller, Timer und Fetch.
- Wird die Capprüfung entfernt, umgangen oder falsch verglichen, muss
  mindestens eine Gegenprobe rot werden.
- Jede temporäre Kopie wird vollständig bereinigt; der eingecheckte
  Produktionscode bleibt unverändert.

Dieser Mutationstest beweist ausschließlich aktive Capverdrahtung, die
korrekte inklusive beziehungsweise überschreitende Vergleichssemantik und die
richtige Position vor Controller, Timer und Fetch. Er beweist keinen real
öffentlich erreichbaren 65.536/65.537-Grenzfall.

Verboten bleiben Contractmutation, Serialisierung eines unvalidierten Callers,
Verschiebung der Validierung hinter die Capprüfung, Testexport, injizierbarer
Encoder, Cap-Parameter, eine zusätzliche Factory- oder Composition-Seam und
jede Produktionsänderung nur zugunsten des Tests.

### Verbindliche spätere Cross-Realm-Regressionen

Die spätere netzwerkfreie Suite präzisiert die Nachweisgrenzen wie folgt.

Positive Promise-Begrenzungsproben:

- lokales natives Promise mit geschlossenem Profil;
- echtes natives Cross-Realm-Promise, das fixtureseitig bereits vollständig
  auf das lokale Promise-Profil umprototypisiert wurde;
- entsprechend umprototypisierte native Promise-Subclass ohne verbleibendes
  beobachtbares Subclassmerkmal;
- kontrollierte Verarbeitung eines Fulfillments;
- statisch redigierte Verarbeitung einer Rejection.

Negative Promise- und Hookproben:

- unverändertes Cross-Realm-Promise;
- fremdes Thenable;
- Proxy oder Fake trotz lokal vorgetäuschtem Prototyp;
- eigene Constructor-Accessorproperty, Zusatzkey oder Symbol;
- nicht umprototypisierte Subclass;
- mutierte Constructor-/Species-Descriptoren;
- eine nach Modulevaluation mutierte globale `.then`-Oberfläche als
  Umleitungsprobe: Der ersetzte Wert darf weder frei gelesen noch aufgerufen
  werden; ausschließlich die erfasste native `then`-Referenz bleibt
  maßgeblich. Diese Probe führt keine zusätzliche Live-Descriptorprüfung der
  globalen `.then`-Property ein.

Positive Uint8Array-/ArrayBuffer-Begrenzungsproben:

- gewöhnlicher lokaler fester Buffer;
- fixtureseitig vollständig passend umprototypisierte echte Cross-Realm-View
  zusammen mit ihrem echten festen Backing-Buffer;
- sofortige korrekte Kopie;
- anschließende Quellmutation ohne Wirkung auf die transport-eigene Kopie.

Negative Uint8Array-/ArrayBuffer-Proben:

- unveränderte fremde View;
- nur die View passend umprototypisiert;
- nur der Buffer passend umprototypisiert;
- Proxy oder Fake;
- shared, growable, resizable oder detached Memory;
- Nullchunk, falsche Länge und Capüberschreitung.

Der Transport darf in keiner Probe selbst `Object.setPrototypeOf` auf
Eingabewerte anwenden. Die Tests verwenden ausschließlich `node:vm`, native
lokale Intrinsics und Doubles, ohne echten Browser oder Netzwerkrequest.
Globale Mutationen laufen seriell, werden im `finally` vollständig
wiederhergestellt und benötigen weder Skip noch Todo.

### Sicherheits- und Datenschutzfolgen

- Die Korrektur entfernt eine unbeweisbare Provenienzbehauptung, aber keine
  wirksame Brand-, Shape-, Promise-, Buffer-, Copy-, Deadline- oder
  Redactionprüfung.
- Realm ist keine Sicherheits-, Identitäts- oder Berechtigungsgrenze.
- Die sofortige Kopie trennt akzeptierte Fremdbytes von späteren Mutationen der
  Quelle.
- Same-Realm-Ausführung und Deep Freeze bleiben keine Sandbox.
- Bereits vor Modulevaluation kompromittierte Intrinsics,
  Enginekompromittierung, OOM und Prozessabbruch bleiben außerhalb der
  Garantie.
- Es entsteht weiterhin kein Browser-, Gateway-, Provider- oder privater
  Datenfluss.
- Dieser Slice besitzt keine KI-, Modell-, Workflow-, Credential-, Storage-,
  Logging- oder Telemetriewirkung.
- Die bisherige enge Phase-0-/Tor-A-Arbeitshypothese wird nicht zu einer
  Rechts- oder Complianceklassifikation erweitert.

### Aktivierungs- und Neubewertungsgates

Nach ADR 0027 darf als nächster Slice ausschließlich die isolierte und
netzwerkfreie BrowserSyncTransport-Implementierung erneut begonnen werden.

Weiterhin getrennt und gesperrt bleiben:

- realer Fetch;
- Browser- oder Gatewaystart;
- PNA-/LNA-/Mixed-Content-Runtimeevidenz;
- Browserkomposition;
- Browser-End-to-End-`syncTest`;
- globale Missbrauchs-, Parallelitäts-, Queue- und Prozessgrenzen;
- Provider, OpenAI, lokales Modell und n8n;
- Credentials, private Payloads, neue Aktionen, Tools oder Nebenwirkungen.

Nur ein späterer kontext- und versionsgebundener Runtime-`PASS` darf die
Browserkomposition öffnen.

## Nicht Bestandteil dieses Slices

Dieser Slice implementiert insbesondere nicht:

- `src/transports/browserSyncTransport.js`;
- `tests/browserSyncTransport.test.js` oder andere Tests;
- Browser-, Netzwerk-, Gateway-, Cloud-, n8n- oder Providerzugriffe;
- `src/main.js`, UI, CSS, Nutzertrigger oder sichtbare Statuscopy;
- SyncContract-, SyncService-, Gateway-, SyncAgent-, Bundle-, Manifest-,
  Generator-, Evidence-, Paket- oder Lockfileänderungen;
- neue API, Dependency, Factoryoption oder Composition-Seam;
- Credentials, private Daten, Storage, Logging oder Telemetrie;
- Commit, Push, Tag oder Release.

Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
`v0.2.2` bleiben unverändert. Die n8n-Gates bleiben `FAIL`/`UNPROVEN` und
geschlossen.

## Konsequenzen

Positive Auswirkungen:

- Die Implementierung erhält einen mit öffentlichen JavaScript-Mitteln
  tatsächlich prüfbaren Vertrag, ohne die wirksamen nativen Brand-,
  Descriptor-, Buffer- oder Kopiergrenzen zu lockern.
- Realm-Herkunft wird nicht mehr mit Identität, Vertrauen oder Sicherheit
  verwechselt.
- Der private Requestcap bleibt als Defense-in-Depth aktiv, während seine
  gegenwärtige öffentliche Erreichbarkeit und sein späterer kausaler
  Mutationstest korrekt getrennt werden.
- Gateway-Raw-Wire-, Browserrequest- und Response-Streaminggrenzen bleiben
  fachlich und nachweisseitig getrennt.

Kosten und verbleibende Einschränkungen:

- Die historische Erzeugungsrealm eines vollständig passend
  umprototypisierten echten nativen Werts bleibt unbeweisbar.
- Der spätere Source-Mutation-Harness weist die Capverdrahtung nach, aber nicht
  den realen öffentlichen 65.536/65.537-Grenzfall des geschlossenen v1-
  Vertrags.
- Die Korrektur ändert nichts an den bereits dokumentierten Browser-,
  Eventloop-, CORS-, PNA-/LNA-, Mixed-Content-, Prozessidentitäts- oder
  Verfügbarkeitsgrenzen.
- Ohne Implementierung, Runtime-`PASS` und spätere Komposition entsteht kein
  Browserfluss.

## Erwogene Alternativen

### Realmprovenienz weiterhin behaupten

Verworfen. Öffentliche Brand- und Prototypprüfungen exponieren nach vollständiger
Umprototypisierung keine historische Erzeugungsrealm und würden eine falsche
Garantie erzeugen.

### Realmprovenienz über `instanceof` oder Constructoridentität ableiten

Verworfen. Diese beobachtbaren Oberflächen können Realm- und
Prototypmanipulationen nicht als historische Provenienz attestieren und würden
dieselbe falsche Garantie nur anders formulieren.

### Beliebige Cross-Realm-Werte pauschal erlauben

Verworfen. Das würde native Brand-, exakte Prototyp-, Descriptor-, Buffer- und
Zustandsprüfungen lockern und die Angriffsoberfläche erweitern.

### Promisewerte über `Promise.resolve` assimilieren

Verworfen. Das würde fremde Thenables und frei beobachtbare Assimilationshooks
in den Kontrollfluss aufnehmen.

### Transportwerte selbst umprototypisieren

Verworfen. Eine Mutation fremder Eingaben wäre eine zusätzliche Wirkung,
würde die Beobachtungsgrenze verschieben und könnte angreifergesteuerte
Objektgraphen verändern.

### Cap oder Encoder injizierbar machen

Verworfen. Dadurch entstünden neue Produktionskonfiguration und
Angriffsoberfläche nur für einen Testnachweis.

### Testexport oder fünfte Composition-Seam ergänzen

Verworfen. Dies würde die geschlossene öffentliche API aufweiten und
Produktionscode an Testinternas koppeln.

### Contract künstlich auf 65.536 Bytes erweitern

Verworfen. Ein nicht benötigter großer Contract würde Datenfläche und Risiken
nur zugunsten eines Grenztests erhöhen.

### Unvalidierte Requests nur für den Grenztest serialisieren

Verworfen. Das würde die verbindliche Validierung vor Serialisierung umgehen
und einen zweiten, unsicheren Produktionspfad schaffen.

### Privaten Requestcap entfernen

Verworfen. Der Cap bleibt eine wirksame Defense-in-Depth für Contractdrift und
künftige ausdrücklich entschiedene Erweiterungen.

### ADR 0026 nachträglich inhaltlich umschreiben

Verworfen. Angenommene ADRs bleiben historisch unverändert; eine geänderte
Entscheidung erhält nach der Repositorykonvention einen neuen ADR, der den
alten formal ersetzt.

## Bedingungen für eine Neubewertung

Eine neue Entscheidung ist erforderlich, wenn:

- Realm als Identitäts- oder Vertrauenssignal verwendet werden soll;
- ein anderer Promise- oder Buffervertrag nötig wird;
- die öffentliche API oder Composition erweitert werden soll;
- der Contract die aktuell erreichbaren 193 Bytes erweitert;
- der private Requestcap geändert oder entfernt werden soll;
- Endpoint, Fetchpolicy, Deadline, Responsecap, CORS oder Fehlersemantik
  geändert werden sollen.

Zusätzlich gelten sämtliche nicht ersetzten Neubewertungstrigger aus ADR 0026
fort.

## Nächster getrennt freizugebender Slice

Als Nächstes folgt ausschließlich die isolierte Implementierung von
`src/transports/browserSyncTransport.js` und die netzwerkfreie,
mutationswirksame Unit-Suite unter
`tests/browserSyncTransport.test.js` nach ADR 0027. Der Slice führt keinen
echten Fetch aus, startet weder Browser noch Gateway, komponiert nichts in
`src/main.js` und verwendet keine Provider oder privaten Daten. Vor seinem
Merge wird Tor A anhand des tatsächlichen Codes, der Browser-APIs,
Dependencies und Datenflüsse erneut geprüft.

Danach folgt weiterhin zuerst das getrennte reale, kontext- und
versionsgebundene PNA-/LNA-/Mixed-Content-Runtimegate. Browserkomposition und
lokaler Browser-End-to-End-`syncTest` bleiben bis zu dessen `PASS` ein weiterer
getrennter Slice. Globale Betriebsgrenzen und Provider folgen erst danach.

## Verwandte Dokumente

- [ADR 0017: Transportneutrale SyncService Foundation](0017-transport-neutral-sync-service-foundation.md)
- [ADR 0020: Lokale SyncGateway Raw-Wire- und HTTP-Foundation](0020-local-sync-gateway-raw-wire-http-foundation.md)
- [ADR 0023: Lokaler SyncAgent vor optionalen externen Providern](0023-local-syncagent-before-optional-external-providers.md)
- [ADR 0025: Local SyncGateway–SyncAgent Composition](0025-local-syncgateway-syncagent-composition.md)
- [ADR 0026: Browser SyncTransport Contract](0026-browser-sync-transport-contract.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`README.md`](../../README.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
