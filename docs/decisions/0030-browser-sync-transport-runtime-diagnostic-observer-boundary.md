# ADR 0030 – BrowserSyncTransport Runtime Diagnostic Observer Boundary

## Status

Ersetzt durch [ADR 0031](0031-browser-sync-transport-diagnostic-envelope-and-observation-completion-boundary.md) – 2026-08-30

Das dokumentierte ADR-0029-Runtimegate bleibt `FAIL`. Der Ursachenstatus bleibt
ausnahmslos `CAUSE_NOT_PROVEN`. Die Annahme dieses ADR ist weder
Ursachennachweis noch Runtime-`PASS`, Produktfreigabe, Implementierung oder
Laufautorisierung.

## Kontext

Der abgeschlossene, an `chrome-stable-win-t0-01` gebundene Chrome-Lauf bleibt
unverändert dokumentiert. In seinem einzigen gestarteten Vektor wurden ein
gewöhnlicher `OPTIONS`-Request mit Status `204`, ein vollständig beantworteter
`POST`-Request mit Status `200` und die erwarteten JavaScript-sichtbaren
Responsewerte beobachtet. Anschließend wies das öffentliche
BrowserSyncTransport-Promise mit dem statisch redigierten Transportprofil
zurück.

Dieser Ebenenwiderspruch setzte `normalSyntheticTransport` und `overallGate`
auf `FAIL`. Korrelation, PNA/LNA und die stopregelkonform nicht ausgeführten
Negativvektoren blieben `UNPROVEN`; Cleanup ist `PASS`. Die anschließende
ursachenorientierte Offline-Diagnose endete korrekt mit `URSACHE NICHT BELEGT`.
Weder dieser ADR noch ein späterer Diagnoselauf darf den historischen Befund
rückwirkend korrigieren oder neu bewerten.

[ADR 0028](0028-browser-sync-transport-validator-integrity-boundary.md)
definiert die implementierte BrowserSyncTransport-Vertragskette einschließlich
Promise-, Reader-, Buffer-, Response-, Header-, Fetch-, Deadline-, Fehler- und
Cleanupsemantik. [ADR 0029](0029-browser-runtime-evidence-gate.md) definiert das
davon getrennte reale Runtimegate. Ein weiterer vollständiger ADR-0029-Lauf
wäre derzeit weder ein enges Diagnoseinstrument noch autorisiert: Er würde die
beiden Negativvektoren und die gesamte Gatematrix erneut öffnen, obwohl
zunächst nur die äußerlich beobachtete positive Laufzeitabweichung eingegrenzt
werden soll.

Eine spätere Diagnose benötigt deshalb eine eigene, enger begrenzte
Beobachtungsgrenze. Sie darf weder Produktquellen instrumentieren noch durch
zusätzliche Requests, Debuggersteuerung oder freie Rohdatensammlung einen
zweiten Produktpfad schaffen. Zugleich ist ein externer Browsercontroller nie
absolut neutral: Schon Attachment, Domainaktivierung, eine Main-World-
Auswertung und die Beobachtung eines Promise-Settlements können die Laufzeit
beeinflussen.

## Formale ADR-Wirkung

> ADR 0030 ergänzt ADR 0028 und ADR 0029 und ersetzt keinen ADR. ADR 0020 bleibt die ausdrücklich erneut bewertete, aber unveränderte Produktions-Gateway-Baseline.

ADR 0020 sowie ADR 0026 bis ADR 0029 bleiben vollständig bytegleich. Der neue
Diagnosepfad ist kein vierter ADR-0029-Vektor, kein zusätzliches ADR-0029-Gate
und keine Erweiterung des `BrowserRuntimeEvidenceRecord`. Der bestehende
Evidence-Record bleibt unveränderlich.

ADR 0030 entscheidet nur die Grenze einer später zu implementierenden,
netzwerkfrei zu prüfenden Diagnosefoundation und eines danach nochmals
gesondert zu autorisierenden sichtbaren Einmallaufs. Es autorisiert weder die
Foundationimplementierung noch einen Browser-, Gateway-, Port-, Request-,
Permission- oder Diagnoselauf.

## Entscheidung

### Neue Diagnosebindung

Die Formel

```text
T_diag = historisches T₀ + Δ_observer
```

ist unzulässig. Messzeit, Run-ID, Repositorycommit und die gelöschte konkrete
Wegwerfprofilinstanz des historischen Laufs sind nicht reproduzierbar. Für
jeden später gesondert autorisierten Diagnoserequest gilt stattdessen:

```text
T_replay ≡R T₀
T_diag = T_replay + Δ_observer
```

`T_replay` ist ein vollständig neues, vor dem einzigen Transportstimulus
gebundenes Basistupel. Es ist kein tatsächlich ausgeführter observerfreier
Kontrolllauf. `T_diag` erlaubt deshalb keine Aussage darüber, wie derselbe
Browserprozess ohne Observer gelaufen wäre.

Neue Diagnose-Run-ID, Messzeit, Zeitzone, aktueller Repositorycommit,
`replayContextId` und neue Wegwerfprofilinstanz werden als neue Identitäten von
`T_replay` separat gebunden. Sie sind weder mit ihren historischen Werten
gleichzusetzen noch Bestandteil von `Δ_observer`.

### Geschlossene Replayrelation `≡R`

`≡R` vergleicht ausschließlich eine geschlossene Menge kausal relevanter
Felder. Zulässige Vergleichsgrundlagen sind:

- sanitierte Werte und Klassifikationen, die im unveränderlichen historischen
  Evidence-Record tatsächlich persistiert sind;
- Bytewerte und SHA-256-Hashes, die reproduzierbar aus dem im historischen
  Record gebundenen Git-Tree abgeleitet werden können.

Verworfene historische Rohwerte, persönliche Profilpfade, wirksame
Kommandozeilen oder flüchtige Browserkennungen werden nicht rekonstruiert und
nicht als historisch bekannt behauptet. Jeder Vergleich besitzt genau
`observed | not-observed | ambiguous` und genau
`match | mismatch | unproven`. Fehlende historische Vergleichsgrundlage oder
mehrdeutige Beobachtung ergibt `unproven`, niemals implizite Gleichheit.

Die Relation enthält exakt folgende Vergleichsgruppen:

1. Produktartefakte:
   - `src/transports/browserSyncTransport.js`;
   - `src/contracts/syncContract.js`;
   - das geschlossene Gatewayset aus
     `server/startLocalSyncGateway.js`,
     `server/localSyncGatewayRuntimeConfig.js`,
     `server/localSyncGatewayHttpServer.js`,
     `src/gateways/syncGatewayRequestBoundary.js` und
     `src/agents/syncAgent.js`;
2. Browserprodukt, Channel, Vollversion, Engine und Enginebuild;
3. Betriebssystemfamilie, Edition, Architektur, Version, Build und Patch;
4. Node-Version und lokale Ausführungsklasse;
5. Profil-Lifecycle sowie sanitierte Klassen für Erweiterungen,
   Startparameter, Featureflags und Enterprise-Richtlinien;
6. sanitierte Proxy-, VPN-, Service-Worker-, Permission-, Preflightcache- und
   Sitecacheklasse;
7. Top-Level-URL, serialisierte Origin, Top-Level-Kontextklasse und
   Secure-Context-Wert;
8. Factory-, Kompositions-, Request-, Requestgleichheits- und feste
   RequestInit-Profile sowie initiale URL, Scheme, Host, Port und Pfad;
9. Listenerhost und -port, Gateway-Origin, Endpoint, Runtimekonfiguration,
   Responder- und erwartetes Responseprofil.

Jeder Literalpfad aus Gruppe 1 wird separat mit SHA-256 verglichen; ein
mehrdeutiger Sammelhash `gatewayHash` ist unzulässig. Für nur klassifiziert
persistierte historische Felder wird ausschließlich die historische
Klassifikation verglichen. Ein neuer Rohwert kann flüchtig zur Bestimmung der
neuen Klassifikation verwendet werden, wird aber nicht gespeichert.

Die Basisklasse der Startparameter wird ohne den exakt als `Δ_observer`
gebundenen Pipe-Parameter verglichen. Jeder andere neue Parameter, Flag oder
Policywert ist eine kausal relevante Abweichung. Das erwartete Gateway-
Responseprofil darf nur aus den geschlossen persistierten historischen
`OPTIONS 204`-, `POST 200`- und sichtbaren Responseklassifikationen abgeleitet
werden; freie Rohwerte werden auch dafür nicht rekonstruiert.

`≡R` ist nur vollständig erfüllt, wenn alle Pflichtvergleiche beobachtet und
`match` sind und keine unerklärte kausal relevante Abweichung besteht. Ein
`mismatch`, ein `unproven` oder eine weitere relevante Abweichung verhindert
jede historische Reproduktions- oder Nichtreproduktionsaussage; der Befund ist
dann `inconclusive` und `causeStatus` bleibt `CAUSE_NOT_PROVEN`.

### Erlaubtes `Δ_observer`

`Δ_observer` darf ausschließlich den folgenden externen Diagnoseobserver
hinzufügen:

- einen exklusiven lokalen Browsercontroller über
  `--remote-debugging-pipe`; ein Debug-TCP-Port ist in diesem Profil nicht
  zulässig;
- genau ein GoldenDawn-Top-Level-Target und genau eine daran gebundene Session;
- die unten geschlossene minimale `Target`-, `Runtime`- und `Network`-
  Operations-Allowlist;
- genau eine Main-World-Auswertung;
- genau einen Aufruf von `createBrowserSyncTransport()` ohne Argument;
- genau einen gültigen synthetischen v1-`syncTest` mit leerem Payload;
- ausschließlich die Beobachtung des öffentlichen Promise-Settlements und
  sanitierter zielgebundener Netzwerkmetadaten;
- die sofortige Projektion zulässiger Beobachtungen auf geschlossene primitive
  Werte im Speicher.

Der Controller setzt mit der einen Main-World-Auswertung und dem einen
Transportaufruf aktiv den einzigen Stimulus. „Passiv“ bezeichnet nur die
danach geltende Nichtinstrumentierung: keine Produkt- oder Quellmutation, kein
zusätzlicher Produktrequest und ausschließlich externe Beobachtung. Pipe-
Startparameter, Controllerattachment, Domainaktivierung, Settlementbeobachtung
und die eine Auswertung gehören vollständig zu `Δ_observer`.

Absolute Nichtbeeinflussung ist nicht beweisbar. Ein bestandener
Observernachweis bedeutet ausschließlich, dass keine vertraglich sichtbare
Interferenz festgestellt wurde.

### Exakte Protokoll-Allowlist

Der spätere Observer darf ausschließlich folgende CDP-Kommandos senden:

| Kommando | Höchstzahl | Geschlossene Verwendung |
| --- | ---: | --- |
| `Target.getTargets` | 1 | genau das vorab gebundene GoldenDawn-Top-Level-Target flüchtig auswählen |
| `Target.attachToTarget` | 1 | genau eine flache Session an dieses Target binden |
| `Network.enable` | 1 | ohne Cache-, Cookie-, Header- oder sonstige Zustandsmutation aktivieren |
| `Runtime.evaluate` | 1 | die eine vorab gehashte Main-World-Auswertung ausführen |
| `Network.disable` | 1 | ausschließlich nach geschlossenem Beobachtungsabschluss bereinigen |
| `Target.detachFromTarget` | 1 | ausschließlich die eine Session bereinigen |

Die beiden Cleanup-Kommandos dürfen bei bereits geschlossener Session nullmal
erfolgen; jede andere Abweichung von den Höchstzahlen ist unzulässig.
`Runtime.evaluate` verwendet `awaitPromise: true`, `returnByValue: true`,
`generatePreview: false`, kein `objectGroup`, keine Command-Line-API, keinen
User-Gesture-Modus und keinen zweiten Auswertungskontext. Target-, Session-,
Frame-, Loader-, Request- und RemoteObject-IDs dienen höchstens flüchtig der
Zuordnung und werden sofort verworfen.

Aus dem Network-Domainstrom dürfen ausschließlich
`Network.requestWillBeSent`, `Network.responseReceived`,
`Network.loadingFinished` und `Network.loadingFailed` für den exakt gebundenen
Produktendpoint ausgewertet werden. Aus ihnen werden sofort nur
Methodenklasse, Endpointgleichheit, erwartete Statusklasse, terminale
Eventklasse und ebenenlokale Reihenfolge projiziert. Nicht allowlistete Events
und sämtliche nicht benötigten Felder werden ohne Persistenz verworfen.

Nicht erlaubt und jeweils auf null Aufrufe beziehungsweise null Wirkungen
gebunden sind:

- Änderungen oder instrumentierte Kopien des Transportquellcodes;
- Composition-Seams;
- Wrapper, Proxies oder Mutationen von Fetch, Timern, Promise, Response,
  Headers, Streams, Readern, Buffern oder Intrinsics;
- Fetch-Interception sowie `Fetch`-Domainaktivierung;
- `Debugger`, Breakpoints, Logpoints, Pause, Step, Profiler oder Tracing;
- Cache-, Cookie-, Header-, Permission- oder sonstige Laufzeitzustandsmutation;
- `Network.getResponseBody`;
- freie Objekt-, Header-, Body-, Promise- oder Responseinspektion;
- zusätzliche native oder diagnostische Fetches;
- Observer-/Diagnoseausgabe an Konsole, Datei, Storage oder Telemetrie während
  des Laufs.

Chrome darf sein frisches Wegwerfprofil technisch beschreiben. Das Verbot der
Dateiausgabe bezieht sich auf Observer- und Diagnoseausgaben, nicht auf die
unvermeidbare interne Profilverwaltung des Browsers. Das Profil wird im
Cleanup vollständig entfernt.

### Geschlossene öffentliche Settlementbeobachtung

Die einzige Main-World-Auswertung ruft die unveränderte öffentliche Factory
und Methode auf und bildet das Promise-Settlement selbst sofort auf genau
einen geschlossenen By-Value-Primitivsatz ab. Bei Rejection darf der Grund nur
flüchtig gegen das exakte öffentliche statische Zwei-Felder-Profil
`BROWSER_SYNC_TRANSPORT_FAILED` und
`Der lokale Browser-SyncTransport ist fehlgeschlagen.` geprüft werden. Danach
bleibt ausschließlich die Klassifikation
`static-redacted-rejection | other-rejection`; der Grund selbst wird weder
zurückgegeben noch behalten.

Bei Fulfillment wird nur `fulfilled` projiziert. Der Responsewert wird nicht
frei inspiziert. RemoteObject, Object-ID, Preview, ExceptionDetails,
Fehlergrund und Stack dürfen die Main World nicht verlassen. Eine zweite
Auswertung oder eine nachträgliche Objektinspektion ist unzulässig.

### Beobachtbare Diagnosegrenze

Der Observer darf ausschließlich folgende extern erfassbare Stufen
dokumentieren:

1. `observer-armed`
2. `transport-call-dispatched`
3. `preflight-request-observed`
4. `preflight-204-observed`
5. `post-request-observed`
6. `post-response-200-observed`
7. `post-loading-finished` oder `post-loading-failed`
8. `public-promise-settled`
9. `cleanup-started`
10. `cleanup-completed`

Die Nummern sind ausschließlich kanonische Vokabular- und Speicherreihenfolge,
keine behauptete globale Zeitordnung. `post-response-200-observed` bezeichnet
nur die sanitierte Statusbeobachtung in der Browsernetzwerkebene, nicht einen
Header-, Body- oder JavaScriptabschluss.

Je Stufe sind nur `stageId`, geschlossene Beobachtungsebene,
`observationState`, ebenenlokale Empfangsreihenfolge, `match | mismatch |
unproven`, feste Clock-Domäne und eine begrenzte, gerundete monotone relative
Dauer zulässig. JavaScript-Main-World-, Browsernetzwerk- und Controller-/
Cleanup-Zeiten bleiben getrennt. Sie werden ohne dokumentierte Kalibrierung
weder verrechnet noch zur globalen Reihenfolge zusammengesetzt.

`Network.loadingFinished` beweist weder JavaScript-Stream-EOF noch Reader-,
Chunk-, Decode-, Parse- oder Korrelationsverhalten. `Network.loadingFailed`
liefert nur die terminale Eventklasse; sein Fehlertext wird nicht gelesen oder
gespeichert.

Ein passiver Observer kann den privaten First-Terminal-Owner oder eine interne
Fehlerstufe nicht beobachten. Deshalb bleiben ausnahmslos:

```text
internalStage: unknown
internalOwner: unknown
```

Eine innerhalb derselben Main-World-Clock gerundete Settlementdauer von
4.500 bis einschließlich 5.500 ms darf höchstens als `deadline-compatible`
klassifiziert werden. Außerhalb dieses Fensters wird ebenfalls keine
Gegenursache behauptet. Timing allein beweist niemals den Owner.

Die zielgebundene Networkbeobachtung endet vor Cleanup mit dem ersten eindeutig
zugeordneten `loadingFinished` oder `loadingFailed`, andernfalls nach einem
vorab festen observerlokalen Capturefenster von 6.000 ms mit `UNPROVEN`. Erst
danach wird die Beobachtung eingefroren und Cleanup gestartet. Ein erst durch
Cleanup ausgelöstes `loadingFailed` darf nicht als Produktbeobachtung
klassifiziert werden.

Eine spätere Sourceinstrumentierung benötigt einen weiteren ADR und einen
eigenen Slice.

### Exaktes Requestbudget

Ein späterer Diagnoselauf besitzt exakt folgendes Budget:

| Kategorie | Erwartung |
| --- | ---: |
| Default-Transportaufruf | 1 |
| Retry | 0 |
| direkter Diagnose-Fetch | 0 |
| Negative-Origin-Vektor | 0 |
| Redirectvektor | 0 |
| Observerrequest zum Produktendpoint | 0 |
| zielgebundener `OPTIONS` | 1 |
| zielgebundener `POST` | 1 |
| andere Methode am Produktendpoint | 0 |

Der durch den einen Transportaufruf browserseitig ausgelöste `OPTIONS` und
`POST` ist kein Observerrequest. Lokale Frontend- und Modul-Laderesources sind
vom Produktendpointbudget getrennt, dürfen aber nicht als zusätzliche
Produktendpointrequests umklassifiziert werden.

Ein zweiter Transportaufruf, ein zweiter `POST`, ein direkter Diagnose-Fetch
oder ein Observerrequest zum Produktendpoint ist ein belegter
Diagnosevertragsbruch und ergibt `observerGate: FAIL`. Ein zusätzlicher
`OPTIONS`, eine andere Endpointmethode oder eine eindeutig andere
Requestsequenz ergibt eine abweichende Netzsignatur; eine daraus belegte
Obserververletzung ergibt `FAIL`, andernfalls keine Ursachenbehauptung.
Fehlende oder mehrdeutige Requests und nicht eindeutige Attribution ergeben
ohne belegten Verstoß ausschließlich `UNPROVEN`.

### Separater Diagnosevertrag

Der geschlossene
[`BrowserTransportDiagnosticRecord`](../data-contracts.md#browser-transport-diagnostic-record--adr-0030)
ist unabhängig vom ADR-0029-Evidence-Schema. Er trennt mindestens:

- Referenz und SHA-256 des unveränderlichen historischen Evidence-Records;
- die neuen Identitäten und Werte von `T_replay`;
- jeden geschlossenen `≡R`-Vergleich;
- Observerprofil und Observerintegrität;
- targetgebundene Requestcounts;
- öffentliches Transportsettlement;
- ausschließlich externe Beobachtungsstufen;
- begrenzte relative Zeiten je Clock-Domäne;
- Cleanup;
- das unveränderte ADR-0029-`overallGate` vor und nach der Diagnose.

Der Diagnosevertrag ist weder Recordvorlage noch ausgefüllter Record und
erweitert den `BrowserRuntimeEvidenceRecord` nicht.

### Status- und Finding-Ableitung

Es existieren genau diese getrennten Statusachsen:

```text
observerGate = PASS | FAIL | UNPROVEN
finding =
  static-rejection-reproduced-after-http200 |
  original-failure-not-reproduced |
  network-signature-diverged |
  observer-invalid |
  inconclusive
causeStatus = CAUSE_NOT_PROVEN
```

`observerGate` bewertet ausschließlich Vollständigkeit und Integrität der
Diagnosebeobachtung. Es ist kein Runtimegate. Die Ableitung ist geschlossen:

1. Observermutation, Sourcekopie oder -instrumentierung, nicht allowlistetes
   CDP-Kommando, Debuggeraktivität, Zusatzrequest, Rohdatenpersistenz,
   Observer-/Diagnoseausgabe während des Laufs oder Cleanupfehler ergibt
   `observerGate: FAIL` und `finding: observer-invalid`.
2. Eine fehlende oder mehrdeutige Pflichtbeobachtung, Integritätsbestätigung,
   Requestattribution, Replayvergleich oder Cleanupbestätigung ergibt ohne
   belegten Verstoß `observerGate: UNPROVEN` und `finding: inconclusive`.
3. `static-rejection-reproduced-after-http200` ist nur bei
   `observerGate: PASS`, vollständig erfülltem `T_replay ≡R T₀`, exakt
   beobachtetem `OPTIONS 204 → POST 200 → loadingFinished` und dem statischen
   öffentlichen Rejectprofil zulässig. Es reproduziert nur die äußere
   Abweichung; die interne Ursache bleibt unbekannt.
4. `original-failure-not-reproduced` ist nur unter denselben Voraussetzungen
   mit öffentlichem Fulfillment zulässig. Es beweist weder Messperturbation noch
   Transienz oder Fehlerfreiheit.
5. Eine eindeutig beobachtete, vom erwarteten Profil abweichende Netzsignatur
   ergibt nur bei `observerGate: PASS` und vollständig erfülltem
   `T_replay ≡R T₀` das Finding `network-signature-diverged`. Sie diagnostiziert
   den ursprünglichen Widerspruch nicht. Ohne vollständig erfülltes `≡R`
   bleibt das Finding `inconclusive`.
6. Jede übrige Konstellation ergibt `inconclusive`.

Eine Nähe zur 5.000-ms-Grenze stützt höchstens `deadline-compatible`.
Reproduktion ist niemals Kausalitätsnachweis. `causeStatus` bleibt in jeder
Kombination exakt `CAUSE_NOT_PROVEN`. Das ADR-0029-`overallGate` bleibt
unabhängig vom Diagnoseergebnis vor und nach dem Lauf exakt `FAIL`.

### Redaction und Cleanup

Nicht persistiert werden:

- Benutzer- oder Rechnername;
- persönliche Profilpfade, konkrete Profilinstanzkennungen oder Prozess-IDs;
- vollständiger User-Agent;
- Debugport oder rohe Kommandozeile/Flags;
- HAR oder rohe CDP-Ereignisse;
- CDP-Session-, Target-, Frame-, Loader-, Request-, Protokollrequest- oder
  RemoteObject-IDs;
- rohe monotone oder Wall-Clock-Zeitpunkte;
- frei kopierte Header;
- Request-ID oder Requesttimestamp;
- Request- oder Responsebody;
- Fehlergrund, Stack, ExceptionDetails oder Objektpreview;
- private Netzwerkdetails;
- GoldenDawn-, Vault- oder Credentialdaten.

Zulässig bleiben nur die vorab geschlossenen Klassifikationen, Zählklassen und
begrenzten gerundeten relativen Zeiten. Die neue Wegwerfprofilinstanz wird nur
durch ein nichtpersönliches flüchtiges Bindungslabel und die persistierbare
Klasse `fresh-disposable-new-instance-confirmed` gebunden; das Label wird vor
Recordmaterialisierung verworfen.

Cleanup bestätigt getrennt mindestens:

- eingefrorenen Beobachtungsabschluss vor Prozessstopp;
- `cleanup-started` und `cleanup-completed`;
- geschlossene Network-Domain, Targetsession und Pipe;
- geschlossene Controllerbeobachtung ohne verbleibende Produkt- oder
  Browserfähigkeit sowie beendeten Browser;
- beendete selbst gestartete Vite- und Gatewayprozesse;
- entfernte temporäre Profile, Harnessfragmente und Object Groups;
- verworfene In-Memory-Rohereignisse und flüchtige IDs;
- bereinigten Permission-, Site-, Cache- und Service-Worker-Zustand;
- wiederhergestellte Umgebung;
- freie verwendete Ports;
- wiederhergestellten Repository- und Indexzustand;
- unveränderten historischen Evidence-Hash;
- fehlende Observer-, Storage-, Log- und Telemetriereste.

Nach geschlossener Controllerbeobachtung besitzt der Controller nur noch die
bereits projizierten primitiven Werte. Der sanitierte persistierbare Diagnose-
Record darf erst nach abgeschlossenem Cleanup daraus materialisiert werden;
unmittelbar danach endet der Controllerprozess. Das Record-Cleanup bestätigt
die zuvor geschlossene Beobachtung, Session, Pipe und sämtliche
Produktruntimefähigkeiten, nicht zirkulär die erst nach der Materialisierung
mögliche eigene Prozessterminierung. Ein bestätigter Cleanupfehler ergibt
`FAIL`; fehlender oder mehrdeutiger Cleanupnachweis ergibt ohne belegte
Verletzung `UNPROVEN`.

## Aussagegrenzen

Auch ein gültiger Record mit `observerGate: PASS` beweist ausschließlich, dass
unter dem gebundenen `T_diag` keine vertraglich sichtbare Observerinterferenz
festgestellt wurde und die geschlossenen Beobachtungen vollständig waren.

Er beweist nicht:

- absolute Nichtbeeinflussung durch den Observer;
- Verhalten desselben Prozesses ohne Observer;
- eine interne Fehlerstufe oder den First-Terminal-Owner;
- JavaScript-Stream-EOF, Reader-, Chunk-, Decode-, Parse- oder
  Korrelationsverhalten aus `Network.loadingFinished`;
- Ursache, Transienz oder Messperturbation;
- Identität oder Vertrauenswürdigkeit des Gatewayprozesses;
- Browserkompatibilität außerhalb des gebundenen Kontexts;
- Runtime-`PASS`, Produktfreigabe, Browserkomposition oder Browser-End-to-End;
- Authentisierung, Autorisierung, Replay-, Idempotenz-, Datenschutz- oder
  globale Ressourcengarantien.

## Verbindliche Folgereihenfolge

Die weitere Reihenfolge lautet:

1. ADR 0030 dokumentieren und mergen;
2. die passive Diagnosefoundation in einem eigenen vollständig netzwerkfreien
   Implementierungsslice erstellen und testen;
3. erst danach Zielbrowser, `T_replay`, Observer, exakt einen Request,
   Benutzerinteraktion und Cleanup separat autorisieren;
4. den einmaligen sichtbaren Diagnoselauf ausführen und getrennt dokumentieren;
5. nur bei ausreichendem Befund einen neuen Produktentscheidungs-ADR erstellen;
6. Produktänderungen ausschließlich in einem eigenen Implementierungsslice
   vornehmen;
7. anschließend einen vollständig neuen ADR-0029-Runtime-Evidence-Lauf mit
   neuer Run-ID und vollständiger Gatematrix separat autorisieren;
8. Browserkomposition und Browser-End-to-End bleiben bis zu einem späteren
   ADR-0029-Gesamt-`PASS` geschlossen.

Kein Schritt impliziert den nächsten. Insbesondere autorisiert die spätere
netzwerkfreie Diagnosefoundation noch keinen Browserstart oder Request.

## Bedingungen für eine Neubewertung

Eine spätere Änderung an Promise-, Reader-, Buffer-, Response-, Header-,
Fetch-, Deadline-, Fehler- oder Cleanupsemantik muss die ADR-0028-Vertragskette
in einem neuen ADR ausdrücklich neu bewerten. Gateway-, CORS- oder
Endpointänderungen bewerten ADR 0020 neu. Änderungen am Runtimegate oder
`BrowserRuntimeEvidenceRecord` bewerten ADR 0029 neu.

Ein Debug-TCP-Profil, zusätzliche CDP-Kommandos oder -Domains, eine zweite
Main-World-Auswertung, Sourceinstrumentierung, weitere Requests, andere
Vektoren, freie Rohdaten oder interne Stage-/Ownerbeobachtung benötigen einen
neuen ADR und einen eigenen Slice.

## Strikte Grenze dieses Dokumentationsslices

In diesem Slice werden weder Recordvorlage noch ausgefüllter Record,
Controller, Harness, Fixture, Observer oder Diagnosefoundation erstellt. Es
erfolgen keine Produkt-, Server-, Contract-, Test-, Paket-, Bundle-, Manifest-
oder Generatoränderungen.

Ausdrücklich nicht ausgeführt werden Browser, Vite, Gateway, Listener, Port,
Request, Permission oder Diagnose. Cloud, n8n, Provider, Credentials, Vault
und private Daten bleiben unberührt. Browserkomposition und Browser-End-to-End-
`syncTest` bleiben geschlossen.

Die bestehende automatisierte Suite, der Produktions-Build und der
schreibfreie Bundlecheck dürfen nur als lokale Regression ausgeführt werden.
Sie sind weder Runtime- noch Diagnoseevidenz.

## Tor A

Phase 0/Tor A bleibt für diesen Dokumentationsentwurf eng bestätigt. Er führt
kein Modell, keine statistische Inferenz, keinen Provider, keine Credentials,
keine privaten Inhalts-Payloads und keinen Logging-, Storage- oder
Telemetriepfad ein. Er trifft keine Rechts- oder Complianceklassifikation.

Die Diagnosefoundation muss Tor A anhand ihrer tatsächlichen APIs,
Dependencies, Datenflüsse und Testseams erneut prüfen. Der spätere reale Lauf
benötigt zusätzlich seine eigene kontext-, versions- und
autorisierungsgebundene Prüfung.

## Konsequenzen

Positive Auswirkungen:

- Die historische Evidenz bleibt unverändert und wird nicht mit einem neuen
  Kontext vermischt.
- `T_replay ≡R T₀` macht bekannte Gleichheit, Abweichung und fehlende
  Vergleichsbasis getrennt sichtbar.
- Die Pipe-only- und CDP-Allowlist begrenzt die Observeroberfläche.
- Externe Stufen, lokale Clockordnungen und primitive Projektionen verhindern
  interne Owner- oder Rohdatenbehauptungen.
- Exaktes Requestbudget, Captureabschluss und Cleanup machen versteckte
  Zweitrequests und cleanupverursachte Terminalereignisse entscheidbar.
- Getrennte Statusachsen verhindern die Gleichsetzung von Observerintegrität,
  Reproduktion, Ursache und ADR-0029-Runtimegate.

Kosten und verbleibende Grenzen:

- Der externe Observer kann den Lauf beeinflussen; absolute Neutralität bleibt
  unbeweisbar.
- Nicht persistierte historische Rohwerte begrenzen die Replayrelation auf
  tatsächlich belegbare Werte und Klassifikationen.
- Die Diagnose kann nur äußere Signaturen reproduzieren oder unterscheiden;
  interne Stage und Owner bleiben unbekannt.
- Jeder spätere Implementierungs- und Laufabschnitt benötigt ein neues,
  enges Review und eine eigene Autorisierung.

## Erwogene Alternativen

### Historisches `T₀` wörtlich wiederverwenden

Verworfen. Run-ID, Messzeit, Commit und gelöschte Profilinstanz können nicht
wiederholt werden. Eine behauptete Gleichheit würde neue Identitäten und
unbekannte historische Rohwerte verdecken.

### Einen observerfreien Kontrolllauf voraussetzen

Verworfen. `T_replay` ist eine Bindungsgrundlage und kein zweiter Requestlauf.
Ein Kontrolllauf würde das Requestbudget verdoppeln und selbst einen neuen
Kontext erzeugen.

### Transportquelle instrumentieren oder Composition-Seams hinzufügen

Verworfen. Das würde die zu untersuchende ADR-0028-Vertragskette verändern und
benötigte eine eigene Produktentscheidung.

### Debugger, Tracing, Fetch-Interception oder Responsebody verwenden

Verworfen. Diese Mechanismen vergrößern Interferenz-, Daten- und
Ursachenüberbehauptungsrisiko und sind für die geschlossene äußere Diagnose
nicht erforderlich.

### Diagnose als vierten ADR-0029-Vektor speichern

Verworfen. Diagnoseintegrität und Runtimekompatibilität besitzen verschiedene
Ziele, Statusachsen und Aggregationsregeln. ADR 0029 bleibt unverändert.

### Reproduktion als Ursachennachweis behandeln

Verworfen. Dieselbe äußere Signatur kann mehrere interne Ursachen haben; ein
externer Observer sieht weder interne Stage noch Owner.

## Review

Der unabhängige Daybreak-Blue-Vorabreview verlangte insbesondere die
beweisbare Replayrelation, die ausdrückliche Nichtneutralitätsgrenze,
Pipe-only-Steuerung, eine exakte CDP-Allowlist, lokale Clockordnungen,
geschlossene Requestattribution sowie verschärfte Redaction-,
Beobachtungsabschluss- und Cleanupregeln. Diese Präzisierungen sind Bestandteil
der Entscheidung. Nach der letzten Dokumentationsänderung folgt ein
unabhängiger Daybreak-Blue-Abschlussreview.

## Verwandte Dokumente

- [ADR 0020 – Local SyncGateway Raw-Wire and HTTP Foundation](0020-local-sync-gateway-raw-wire-http-foundation.md)
- [ADR 0028 – BrowserSyncTransport Validator Integrity Boundary](0028-browser-sync-transport-validator-integrity-boundary.md)
- [ADR 0029 – Local Browser Runtime Evidence Gate](0029-browser-runtime-evidence-gate.md)
- [Datenverträge](../data-contracts.md#browser-transport-diagnostic-record--adr-0030)
- [Architektur](../architecture.md)
- [Security](../security.md)
- [Roadmap](../roadmap.md)
