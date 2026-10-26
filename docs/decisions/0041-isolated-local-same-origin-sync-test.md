# ADR 0041 – Isolierter lokaler Same-Origin-syncTest

## Status

Angenommen – 2026-10-26

Jan hat am 26.10.2026 (Europe/Berlin) ausdrücklich erklärt:
„Die v2(line536) ist hiermit ausdrücklich angenommen.“ Angenommen ist das
vollständige Paket **SO-syncTest-Korrekturentwurf-2026-10-26-v2**, einschließlich
Serving-/Assetvertrag, Transportprofil, Browserbetriebs- und Ressourcenvertrag,
Startsperre, Zeitregeln, Produktabnahme und begrenzter neuer Freigabeordnung.
Dieser ADR dokumentiert diese bereits erfolgte Entscheidung.

Der unabhängige Re-Review der gebundenen v2 lautet **PASS, COMPLETE,
annahmereif**; F1–F5 sind geschlossen. R1 ist ein nicht annahmehemmender
redaktioneller Hinweis. Die Quellenbindung und die ausschließlich redaktionelle
R1-Klarstellung stehen in [Abschnitt 10](#10-quellenbindung-und-reviewprovenienz).
Das PASS gilt ausschließlich für die dort gebundene v2, nicht für diesen ADR
oder die neuen vollständigen Repositoryfassungen. Es wird keine Rohbytegleichheit
behauptet; ein unabhängiger Dokumentreview dieser Fassungen steht aus.

Die Umsetzung fehlt. Umsetzung, Tests des künftigen Funktionsstands,
Fähigkeitsprüfungen, reale Produktprüfung und spätere Anwendungskomposition
benötigen gesonderte Aufträge. Die Annahme ist keine Umsetzungs-, Prüf- oder
Betriebsfreigabe. Der geliehene Browserdienst und die erforderlichen
Beobachtungsfähigkeiten sind für diesen Weg weder als vorhanden noch als
praktisch bestätigt nachgewiesen.

## Kontext

Der bisherige isolierte BrowserSyncTransport und die lokale
Gateway-/SyncAgent-Komposition sind implementiert. Der Transport verwendet
weiterhin das zehnfeldrige RequestInit mit dem bisherigen cors-Profil; ein
statischer Servingzweig und die isolierte Same-Origin-Prüfansicht fehlen.
Der Anwendungseinstieg komponiert private Fachmodule und ist für diese
synthetische Prüfansicht ausgeschlossen.

Die Entscheidung grenzt einen eigenen Produktnachweis vom alten Diagnosepfad
ab. Sie bestätigt weder dessen Ursache noch dessen Ressourcenfähigkeiten.
Die [begrenzte Ausnahme](#82-angenommene-begrenzte-ausnahme) adressiert ADR 0029,
die bisherige Entwicklungsreihenfolge und ADR 0036 ausschließlich für den hier
beschriebenen Produktumfang. Kein älterer ADR wird pauschal ersetzt; seine
Hauptteile, historischen Prüfstände und Rohbindungen bleiben unverändert.
ADR 0040 bleibt vorgeschlagen und nicht angenommen.

## Entscheidung

Die folgende Nummerierung erhält die Abschnittsbezüge der angenommenen v2.
Statusformulierungen sind auf Jans Annahme nachgeführt; die Vertragsregeln
bleiben bis auf die gekennzeichnete redaktionelle R1-Klarstellung unverändert.

### 1. Status und Entscheidungsgegenstand

Jan hat am 2026-10-26 folgende Richtung als Teil des vollständigen Pakets angenommen:
Windows lokal, providerfreier Same-Origin-syncTest, isolierte synthetische Prüfansicht
und vorab bereitgestellter synthetischer Browserdienst mit eigenem frischem Laufkontext.

| Ebene | Stand |
| --- | --- |
| Gewählte Richtung | Lokaler Same-Origin-Produktpfad unter Windows, isolierte Prüfansicht, geliehener synthetischer Browserdienst und genau ein frischer eigener Nichtdefault-Kontext je Lauf. |
| Angenommene, noch nicht umgesetzte Entscheidung | Serving im Gateway, Assetvertrag, Transportdelta, Ressourcenvertrag, Startsperre, Aufbau- und Abschlussfristen sowie begrenzte Freigabeausnahme. |
| Vorhandener Code | SyncContract, SyncService, isolierter BrowserSyncTransport und lokale Gateway-/SyncAgent-Komposition. |
| Benötigte Fähigkeiten | Geeignete Dienstbereitstellung, Kontextzuordnung und bestätigte Rückgabe, beobachtbarer normaler Gatewayabschluss und vollständige Ressourcenbilanz. Ihre Eignung für diesen Betriebsweg ist noch nicht belegt. |
| Spätere Ausführungsevidenz | Ergebnisse getrennt autorisierter Tests und Prüfungen sowie die tatsächlichen Produkt- und Abschlussbefunde des erlaubten Produktlaufs. |

Jans ausdrückliche Annahme umfasst gemeinsam Ziel, Serving-/Transportdelta, Garantien,
Browserbetrieb, Ressourcenabschluss, Produktabnahme und Freigabeordnung.

Die Architekturentscheidung ist angenommen; ihre Umsetzung und Ausführung sind damit
nicht erlaubt. Konkrete Implementierungs- und Umgebungsbindungen entstehen nach den
festgelegten Verfahren; Abschnitt 9 bestimmt ihre spätesten Zeitpunkte.

SAC bleibt aktiviert. ADR 0040 bleibt vorgeschlagen.

### 2. Ziel und Umfang

Der Meilenstein soll einen tatsächlich beobachteten, laptopgebundenen Kommunikationspfad
nachweisen:

```text
Isolierte Browser-Prüfansicht
  → SyncService
  → BrowserSyncTransport
  → lokales Gateway / Request Boundary
  → echter lokaler SyncAgent
  → validierte und korrelierte Antwort
  → SyncService / Prüfansicht

```

Die Prüfansicht lädt weder private Fachmodule noch deren Storage-Komposition. Der
bestehende Anwendungseinstieg ist dafür ungeeignet: [src/main.js](../../src/main.js)
greift auf window.localStorage zu und komponiert private Modulstacks.

Erhalten bleiben der SyncService als browserseitige Kommunikationsschicht, das Gateway
als HTTP-/Wiregrenze und der deterministische lokale SyncAgent. Der fachliche Umfang
bleibt ausschließlich der bestehende synthetische syncTest.

Ausgeschlossen sind:

- Provider, Modelle, n8n und externe Anwendungsrequests;
- private Fachmodulbestände, Vault- und Secretzugriffe;
- zusätzliche Aktionen, Tools, fachliche Nebenwirkungen und Persistenz;
- Anwendungskomposition und produktive Nutzung;
- Benutzer-Cancel-API oder Abbrechen-Schaltfläche;
- neue Helferarchitektur, Toolchain, Hostingvariante sowie Cloud-, Linux- oder Zertifikatsmigration;
- Ursachenklärung des alten Chrome-Laufs, authentisches Diagnose-A_obs, vollständige Prozessbaumgarantien und globale Restefreiheit.

Die Beobachtung betrifft den geprüften Anwendungspfad, nicht sämtliche
Hintergrundkommunikation des Browsers oder Betriebssystems. Eine gemessene Kosten-,
Zeit- oder Aufwandsersparnis wird nicht behauptet.

Ein späterer erfolgreicher Bericht dürfte aussagen:
Für die gebundenen Quellen, Konfigurationen und Windows-/Node-/Browserversionen hat der
geprüfte Same-Origin-syncTest seine festgelegten positiven und negativen Kriterien
erfüllt. Der eigene Laufkontext wurde bestätigt beendet; sämtliche weiteren benannten
Laufressourcen wurden nach ihrem jeweiligen Vertrag abgeschlossen. Der bereitgestellte
Browserdienst darf anschließend weiterlaufen.

Ein möglicher späterer Originwechsel bleibt ein separates Datenthema. Bestehende
originbezogene Browserbestände werden durch diesen Entwurf weder übernommen noch
migriert.

### 3. Serving- und Transportvertrag

#### 3.1 Serving, Origin, API und geschlossener Assetvertrag

##### 3.1.1 Topologie und feste Bindungen

Angenommen ist ein schmaler statischer Servingzweig im bestehenden, ausdrücklich
gestarteten Gateway-Prozess. Er verwendet einen eigenen Serving-/Gatewayprozess, einen
Listener und den vorhandenen lokalen Agentenhop. Statisches Serving ist im gelesenen
Bestand noch nicht implementiert.

| Gegenstand | Angenommene Bindung |
| --- | --- |
| Listener | Ausschließlich 127.0.0.1, für diesen Produktpfad Port 8787. |
| Dokument und lokale Assets | Gemeinsame Origin http://127.0.0.1:8787. |
| API | Exakt http://127.0.0.1:8787/api/sync-test. |
| Host | Bei zugelassenen API- und Assetrequests genau einmal vorhanden und exakt 127.0.0.1:8787. |
| API-Origin | Genau einmal vorhanden und exakt http://127.0.0.1:8787. |
| Asset-Origin | Darf fehlen; falls vorhanden, genau einmal und exakt dieselbe Origin. |
| Zielauswahl | Keine Calleroption, kein localhost-/IPv6-Alias, Portfallback oder alternatives Ziel. |
| Netzwerkweg | Direkter Browser-/Gatewaypfad ohne zusätzlichen Proxy oder Tunnel. |
| APIfehler | Kein HTML-Fallback und keine Auslieferung des Testdokuments als Ersatzantwort. |

Die vorhandene [Runtimekonfiguration](../../server/localSyncGatewayRuntimeConfig.js)
erlaubt mehrere Loopback-Originformen und bindet die erlaubte Origin nicht automatisch
an den Gateway-Port. Für diesen Produktpfad muss die feste Kombination ausdrücklich
geprüft werden.

##### 3.1.2 Verbindliche Auswahl der Assetmenge

Vor Umsetzung des Servingzweigs wird unter Jans Verantwortung eine endliche geschlossene
Assetliste festgelegt und statisch auf Isolation geprüft. Jeder Eintrag enthält:

- genau einen kanonischen URLpfad;
- genau eine ausdrücklich ausgewählte lokale Quelldatei beziehungsweise ein ausdrücklich ausgewähltes erzeugtes Asset;
- seine Rolle als Testdokument, JavaScript oder CSS;
- den festen Antwortmedientyp;
- die vorgesehene Abhängigkeit innerhalb der isolierten Prüfansicht.

Es wird genau ein HTML-Testdokument ausgewählt. Weitere Assets sind ausschließlich die
dafür notwendigen JavaScript- und CSS-Dateien. Zulässige Antworttypen sind:

- text/html; charset=utf-8;
- text/javascript; charset=utf-8;
- text/css; charset=utf-8.

Andere Assetarten gehören nicht zu diesem Minimalprofil.

Die Auswahl muss den gesamten benötigten Import- und Ressourcenbezug abdecken. Sie darf
weder src/main.js noch private Fachmodule oder deren Storage-Komposition unmittelbar
oder mittelbar einbeziehen. Externe Ressourcen, allgemeine Repositoryauslieferung,
private Dateien und Secrets sind ausgeschlossen.

Ein URLpfad bezeichnet genau einen Listeneintrag; ein Asset erhält keine zusätzlichen
Aliasrouten. Die APIroute und der gesamte Pfadbereich /api beziehungsweise /api/... sind
für Asseteinträge gesperrt.

Es gibt keine Globs, Laufzeitverzeichnisauflistung, automatische Ergänzung entdeckter
Dateien oder Ableitung eines Dateisystempfads aus einem Request-Target. Ein Request darf
nur einen bereits ausgewählten Eintrag adressieren.

Vor der Prüferlaubnis werden die tatsächlich zu verwendenden Assetbytes einschließlich
Bytezahl und SHA-256 gebunden. Die geplante Liste vor Umsetzung ist noch kein
Hashnachweis später erzeugter Dateien.

Für jedes Asset gilt ein eigener angenommener Höchstwert von 65.536 Bytes. Dieser
konservative Wert begrenzt die kleine Prüfansicht; er ist weder der APIresponsecap noch
ein aus dem Requestcap abgeleiteter Nachweis. Anzahl der Einträge und Gesamtbytezahl der
ausgewählten Fassung werden ebenfalls vor der Prüferlaubnis gebunden. Überschreitungen
werden nicht durch automatische Nachauswahl oder Capänderung repariert.

Vor Freigabe des Listeners müssen die ausgewählten Inhalte begrenzt eingelesen, auf ihre
gebundene Fassung geprüft und für den Lauf unveränderlich bereitgestellt sein. Fehlende,
abweichende, übergroße oder für ihren Texttyp ungültige Inhalte verhindern die
Bereitstellung dieser Servingfassung. Während des Laufs findet keine dateibasierte
Nachauflösung anhand einer URL statt.

Damit bleibt die Auswahlregel jetzt bestimmt, während konkrete Dokumentroute, Dateiliste
und spätere Hashes zu ihren jeweiligen Zeitpunkten gebunden werden können.

##### 3.1.3 Request-Target und Routing

Die gemeinsamen HTTPprüfungen aus Abschnitt 3.1.6 bleiben vorgeschaltet.

Der exakt übereinstimmende Request-Target /api/sync-test wird ausschließlich nach dem
APIvertrag behandelt. Alle anderen normalen Requests können nur den geschlossenen
Assetzweig erreichen.

Ein Assetpfad muss:

- mit genau einem / beginnen;
- aus nichtleeren, durch einfache / getrennten Segmenten bestehen;
- innerhalb der Segmente ausschließlich ASCII-Buchstaben, Ziffern, _, - und . verwenden;
- weder ein Segment . oder .. noch einen abschließenden / enthalten;
- exakt, einschließlich Groß-/Kleinschreibung, einem gebundenen Assetpfad entsprechen.

Queryzusätze, auch ein leeres ?, Fragmente im empfangenen Target, Prozentkodierung,
Backslashes, doppelte Slashes, absolute Request-Targets, Authority-Form und * werden im
normalen Assetzweig nicht zugelassen. Es erfolgen kein URL-Decoding, keine
Pfadnormalisierung, keine Indexdateisuche und keine Umleitung auf eine kanonische
Schreibweise.

Ein nicht passendes Target ergibt 404; es wird kein Assetinhalt ausgeliefert.
Insbesondere bleibt /api/sync-test?… ein Fehler und wird nicht zum Testdokument
umgeleitet. Vorher greifende Parser- und Sonderpfadablehnungen behalten Vorrang.

##### 3.1.4 Assetzulassung

Nach erfolgreicher Targetzuordnung gelten in dieser Reihenfolge:

1. Host: Genau ein aus der Raw-Header-Struktur ermittelter Wert, exakt 127.0.0.1:8787. Fehlender, doppelter, zusammengefasster oder abweichender Wert ergibt 400. Es gibt keine Alias- oder Whitespace-Normalisierung durch die Anwendung.
2. Methode: Ausschließlich GET und HEAD. Andere normale Methoden ergeben 405 mit festem Allow: GET, HEAD. Der Assetzweig besitzt keinen OPTIONS-Erfolgspfad.
3. Origin: Der Origin-Header darf fehlen. Ist er vorhanden, muss er genau einmal und exakt http://127.0.0.1:8787 lauten. Doppelte, abweichende oder null-Origin ergibt 403. Die Anwendung ergänzt und reflektiert keine Origin.
4. Framing: Content-Length darf fehlen oder genau einmal den primitiven Wert "0" besitzen. Andere Werte, Listen und Duplikate ergeben 400. Transfer-Encoding ist vollständig ausgeschlossen, auch chunked; die Kombination mit Content-Length wird ebenfalls abgelehnt.
5. Bodymetadaten: Content-Type und Content-Encoding müssen fehlen; vorhandene Werte ergeben 415. Trailer, Upgrade- und Preflightanforderungsheader sind unzulässig. Expect bleibt dem vorhandenen ablehnenden Sonderpfad zugeordnet.
6. Verbindungsheader: Connection darf fehlen oder genau einmal close beziehungsweise keep-alive enthalten, mit der bestehenden tokenbezogenen Groß-/Kleinschreibungsbehandlung. Andere Werte und Duplikate werden abgelehnt. Die Antwort beendet die Verbindung trotzdem.
7. Nicht unterstützte Zusatzfunktionen: Range, If-Range, If-Match, If-None-Match, If-Modified-Since und If-Unmodified-Since ergeben 400. Es werden weder Teilantworten noch bedingte Antworten angeboten.
8. Requestabschluss: Vor einer erfolgreichen Assetantwort muss der Request vollständig und ohne Body abgeschlossen sein. Tatsächlich beobachtete Bodybytes führen zur Ablehnung; sie werden nicht als Inhalt verarbeitet.

Auch die übrigen sicherheitsrelevanten Headerduplikate bleiben vor einer erfolgreichen
Antwort ausgeschlossen. Headernamen werden HTTP-gerecht ohne Beachtung ihrer
Groß-/Kleinschreibung zugeordnet; Werte werden nicht durch unkontrollierte
Zusammenführung passend gemacht.

Nicht zum Body des ersten Requests gehörende zusätzliche Wirebytes werden durch Parser,
Ein-Request-Admission und Verbindungsabschluss behandelt. Es wird keine darüber
hinausgehende universelle Erkennung sämtlicher Smugglingvarianten behauptet.
Widersprüchliches Framing wird nicht normalisierend akzeptiert. RFC 9112: Message Body
Length

Diese bewusst enge Zulassung vermeidet eine zweite allgemeine HTTPanwendung. Fehlende
Asset-Origin ist erlaubt, damit gewöhnliche Dokument- und Assetabrufe möglich bleiben;
die API-Originpflicht wird dadurch nicht verändert.

##### 3.1.5 Assetantworten und Fehler

Ein zugelassener GET erhält HTTP 200 und exakt die gebundenen Assetbytes. Ein
zugelassener HEAD erhält denselben Status und dieselben Repräsentationsheader wie der
entsprechende GET, aber keine Bodybytes.

Erforderliche Header sind:

- der zum Listeneintrag gehörende feste Content-Type;
- Content-Length als kanonische ASCII-Dezimalzahl der vollständigen GET-Repräsentation;
- Cache-Control: no-store;
- X-Content-Type-Options: nosniff;
- Connection: close.

Für HEAD ist Content-Length somit nicht die Zahl gesendeter Bodybytes, sondern die Länge
der entsprechenden GET-Repräsentation. Das gilt entsprechend für eine bekannte
HEAD-Fehlerantwort. RFC 9110: HEAD, Content-Length

Der Assetzweig setzt keine CORS-Freigabe, Cookies, Redirects, Content-Encoding,
Transfer-Encoding, ETags oder Last-Modified-Validatoren. Es gibt keine Kompression,
Inhaltsverhandlung, Templates, Laufzeittransformationen, Uploads, Downloads beliebiger
Dateien, Directory- oder SPA-Fallbacks. Zulässige sonstige Browsermetadaten ändern die
ausgewählte Repräsentation nicht.

Für Fehler werden die vorhandenen statischen lokalen HTTPprofile mit ihren gebundenen
Meldungen übernommen:

| Assetbefund | Antwort |
| --- | --- |
| Nicht zugelassenes Target | 404 routeNotFound |
| Ungültiger Host, Framing-, Body- oder sonstiger Zulassungsverstoß | 400 invalidHttpRequest |
| Unzulässige Origin | 403 originRejected |
| Nicht unterstützte normale Methode | 405 methodNotAllowed, Allow: GET, HEAD |
| Unzulässiger Content-Type oder Content-Encoding | 415 unsupportedMediaType |
| Interner Fehler vor Responseübernahme | 500 gatewayFailed |

Die statischen Fehlerrepräsentationen sind JSON, keine normale SyncResponse und kein
HTML. Sie besitzen korrekte Content-Length sowie die bestehenden Schutzheader. Bei HEAD
wird ihr Body nicht gesendet. Fremde URLs, Headerwerte, Pfade, IDs, Parserdetails oder
Exceptions werden nicht ausgegeben.

Gemeinsame 417-, 431-, CONNECT-, Upgrade-, Parser- und Timeoutpfade behalten ihre
begrenzten statischen Fehler- beziehungsweise Close-Regeln. Ist eine sichere
Fehlerantwort nicht mehr möglich oder der Response-Owner bereits übernommen, bleibt
ausschließlich kontrollierter Verbindungsabschluss; es entsteht keine zweite Antwort.

Assetrequests erreichen weder Decoder/Request Boundary des Syncpfads noch SyncAgent,
fachliche Clock oder Request-ID-Generator.

##### 3.1.6 Übernahme vorhandener HTTPregeln

| Wert beziehungsweise Regel | Geltungsbereich | Prüfzeitpunkt |
| --- | --- | --- |
| Listener ausschließlich 127.0.0.1; feste Produktkonfiguration Port 8787 | Gesamter Server | Vor Listenerfreigabe |
| HTTP/1.1; bestehender strikter Parser, kein insecureHTTPParser | API und Assets | Parser beziehungsweise Admission vor Routing |
| Höchstens ein Requestereignis je physischem Socket; request, checkContinue, checkExpectation unter derselben Admission | API und Assets | Vor Routing und Headerprojektion |
| maxHeaderSize: 8192; höchstens 32 Headerfelder mit 33. Sentinelfeld | API und Assets | Parser beziehungsweise Raw-Header-Prüfung vor Routing |
| Raw-Header-Auswertung ohne verdeckende Zusammenführung | API und Assets | Vor Routing erfassen; jeweilige Zulassungsprüfung im Zweig |
| Exakter Host | API und Assets | API an der bestehenden Prüfstelle; Assetzweig nach Targetzuordnung, vor Freigabe |
| Sicherheitsrelevante Duplikate und Connection-Policy | API und Assets | Im jeweiligen Zweig vor erfolgreicher Antwort |
| Origin genau einmal und exakt erlaubt | Nur API | Im APIzweig |
| Origin darf fehlen; vorhandene Origin genau einmal und exakt erlaubt | Nur Assets | Im Assetzweig |
| Requestbody höchstens 65.536 Bytes, tatsächliche Streamingzählung; bestehende Content-Type-/Encoding-/Framingregeln | Nur API-POST | Im APIzweig vor Decode/Boundary |
| Requestbody exakt leer; Content-Length fehlt oder "0"; keine Transfer-Encoding | Nur Assets | Im Assetzweig vor Erfolg |
| Gültiger OPTIONS-Preflight: 204, kein fachlicher Aufruf | Nur exakte APIroute | Bestehender APIzweig |
| Assetresponse höchstens 65.536 Bytes und exakt gebundener Inhalt | Nur Assets | Bei Bereitstellung und vor Responseübernahme |
| headersTimeoutMs: 5000, requestTimeoutMs: 10000, socketTimeoutMs: 10000, connectionsCheckingIntervalMs: 100 | Gesamter Server | Ab jeweiligem HTTP-/Socketzeitbezug, unabhängig vom Routing |
| keepAliveTimeoutMs: 1000, maxRequestsPerSocket: 1, kontrollierte Antwort mit Connection: close | Gesamter Server | Serverkonfiguration, Admission und Antwort |
| Genau ein Application-/Raw-Socket-Response-Owner; kein zweiter Write bei späterem Fehler | Gesamter Server | Vor dem ersten Responsewrite und bei Folgefehlern |
| CONNECT, Upgrade, Expect, Parserfehler und Headerüberlauf bleiben ablehnend | Gesamter Server | Bestehende Sonderpfade vor regulärer Zweigfreigabe |

Die bestehenden Fristen sind keine harte Scheduling- oder physische Beendigungsgarantie.
Requesttimeout und Socket-Inaktivitätsgrenze werden insbesondere nicht als neue absolute
Garantie für die gesamte Sendedauer ausgegeben. Geführte Verbindungen bleiben zusätzlich
dem Ressourcenabschlussvertrag unterworfen.

Die private Testtimeoutnaht mit Port 0 ersetzt nicht die festen Betriebswerte des realen
Produktpfads. Keine gemeinsame HTTPgrenze wird wegen des Assetzweigs gelockert.

#### 3.2 Erhaltene Request- und Gatewaygrenzen

Der fachliche Request behält exakt:

version, action, source, requestId, timestamp, payload.

Es gelten weiterhin version: "1.0", action: "syncTest", source: "goldendawn-os" und ein
exakt leeres Payload. ID-, Zeit-, Shape-, Descriptor- und Korrelationsregeln bleiben
unverändert.

Die Transportfolge bleibt:

```text
Einmaliger descriptorbasierter Snapshot
→ frischer interner Requestgraph
→ erste Contractvalidierung
→ Deep Freeze
→ zweite Contractvalidierung
→ terminale Shape-/Freeze-Prüfung
→ feste v1-Wire-Policy
→ einmalige Serialisierung und UTF-8-Messung
→ interner Controller, Timer und höchstens ein Fetch

```

ADR 0028 einschließlich seiner fortgeführten ADR-0026-/ADR-0027-Regeln bleibt
maßgeblich. Es entstehen weder ein dritter Contractvalidatoraufruf noch ein generischer
Zusatzvalidator, weiterer Export oder zusätzliche Composition-Seam.

Das Gateway behält im APIpfad:

- höchstens 65.536 tatsächlich empfangene Requestbytes;
- Ablehnung ab Byte 65.537 vor Decode und Boundary;
- keine Dekompression;
- striktes UTF-8 und kontrolliertes einmaliges JSON-Parsing an der zuständigen Grenze;
- ausschließlich die akzeptierte defensive Requestidentität zum SyncAgent;
- synchronen Agentenaufruf mit genau einem Argument, höchstens einmal je akzeptiertem Requestpfad;
- defensive, erneut validierte und tief eingefrorene normale Response;
- statisch redigierte Fehler ohne fremde Exceptiondetails.

Der private Browserrequestcap bleibt 65.536 Bytes. Ein gültiger kanonischer v1-Request
erreicht höchstens 193 Bytes. Deshalb belegt ein gültiger Browserrequest nicht die
öffentliche Erreichbarkeit der 65.536/65.537-Kante. Gatewayeingangsgrenze und
transportinterne Capverdrahtung behalten ihre getrennten Nachweise nach ADR 0027.

#### 3.3 Geschlossene Fetchargumente und normative Own-Key-Sequenz

Der bisherige zehnfeldrige RequestInit wird nach dieser Entscheidung auf genau elf
Felder erweitert; die Umsetzung fehlt.

Die folgende Tabellenfolge ist ausdrücklich die normative geordnete Own-Key-Sequenz:

| Position | Feld | Fester Wert beziehungsweise Bindung |
| --- | --- | --- |
| 1 | method | "POST" |
| 2 | mode | "same-origin" |
| 3 | credentials | "omit" |
| 4 | cache | "no-store" |
| 5 | redirect | "error" |
| 6 | referrerPolicy | "same-origin" |
| 7 | referrer | "" |
| 8 | keepalive | false |
| 9 | headers | Frischer eingefrorener Null-Prototyp-Record mit ausschließlich Content-Type: application/json; charset=utf-8. |
| 10 | body | Exakt der einmal erzeugte JSON-String. |
| 11 | signal | Einmal erfasste Signalidentität des frischen internen AbortControllers. |

referrer steht unmittelbar zwischen referrerPolicy und keepalive. Eine gleiche
Schlüsselmenge in anderer Reihenfolge erfüllt diesen Vertrag nicht.

RequestInit und Headerrecord bleiben frisch und eingefroren, besitzen Nullprototyp und
ausschließlich die geschlossenen eigenen aufzählbaren Dateneigenschaften. Reihenfolge,
Deskriptoren und feste Werte werden vor Fetch geprüft. Es gibt keine zusätzlichen
String- oder Symbolschlüssel. Daraus entsteht keine Freezegarantie für das native
Signalobjekt.

Content-Type bleibt der einzige vom Anwendungscode gesetzte Header. Origin, Host und
Content-Length bleiben browserverwaltet.

Die Kombination aus referrerPolicy: "same-origin" und referrer: "" soll den Referer
unterdrücken und die echte Same-Origin-Origin erhalten. Die bisherige
Spezifikationsbegründung bleibt erhalten; tatsächliches Verhalten wird im erlaubten
Browserlauf geprüft.

Es entstehen keine Callerheader, Credentials, Authorization, Secrets,
Caller-Abortsignale, Zielparameter, Retries, Backoffs oder Fallbacks.

#### 3.4 Responseprofil und Aufrufabschluss

Der Bestand verlangt type === "cors". Angenommen ist ausschließlich type === "basic",
ohne Mischprofil; die Umsetzung fehlt.

Die fail-fast Beobachtungsfolge bleibt:

1. status === 200;
2. redirected === false;
3. finale URL exakt http://127.0.0.1:8787/api/sync-test;
4. type === "basic";
5. bestandene Headerprüfung;
6. geeigneter Streambody.

Die Headerprüfung verlangt weiterhin in dieser Reihenfolge:

- Content-Type exakt application/json; charset=utf-8;
- vorhandene kanonische vorzeichenlose ASCII-Dezimallänge, 0 oder [1-9][0-9]*, höchstens 16.384;
- browserexponiertes Content-Encoding exakt null.

Erst danach darf der Body verarbeitet werden. Deklarierte Länge, tatsächliche begrenzte
Kopiermenge, sauberer EOF, striktes UTF-8 und einmaliges Parsing müssen zusammenpassen.
Übergröße, unvollständiger Stream oder abweichende Länge werden abgewiesen.

Bei basic gilt die frühere CORS-Filterungsbegründung für unsichtbares Content-Encoding
nicht mehr. Browserbeobachtung bleibt von einem vollständigen Wirebeweis getrennt.

Die normale SyncResponse muss vollständig validiert, defensiv projiziert und korrekt
korreliert sein. Produkterfolg verlangt neben einem erfolgreichen Service-Result
ausdrücklich syncResponse.success === true.

Die 5.000-ms-Transportdeadline, der erste terminale Zustand und die Fehler-/Abortregeln
bleiben erhalten. Die Prüfansicht verhindert weitere Aufrufe während eines laufenden
Produktaufrufs. Bewusste erneute Auslösung nach dessen Abschluss erzeugt einen neuen
Request, sofern noch kein t₀ oder eine Startsperre greift.

Methodenabschluss bestätigt keinen vollständigen Ressourcenabschluss. Abort ist kein
Rollback. Benutzer-Cancel bleibt ausgeschlossen.

### 4. Garantienmatrix

„Separat vertagt“ bedeutet nicht beansprucht, nicht erfüllt und nicht behoben.

| Anforderung | Einordnung | Garantie und spätere Prüfung | Aussagegrenze |
| --- | --- | --- | --- |
| Geschlossener synthetischer Fachvertrag | Erhalten | Sechs Requestfelder, feste v1-Werte, leeres Payload, Validierung, Projektion und Korrelation. | synthetic allein beweist weder Herkunft noch Nicht-Privatheit. |
| Serving, Host, Origin und Route | Gezielt geändert; F1 konkretisiert | Feste Origin/APIroute; geschlossene Assetmenge; exakte Target-/Hostprüfung; getrennte Originregeln. | Same-Origin ist keine Authentisierung. |
| Größen, Encoding, Parsing und Fehler | Erhalten; Assetprofil ergänzt | APIrequest 65.536 Bytes, Transportresponse 16.384 Bytes; Assetbody leer, Assetresponse höchstens 65.536 Bytes; getrennte Grenzprüfungen. | Kein vollständiger DoS-, Allokations- oder universeller Wirebeweis. |
| Response und Redirects | Erhalten; Profil geändert | Ausschließlich basic, feste finale URL, HTTP 200, normale korrelierte Response, keine Redirects. | Status oder Handlerfelder allein beweisen keinen Agentenaufruf. |
| Deadline, Abort und Wiederholung | Erhalten | 5.000 ms, erster terminaler Zustand, keine Retries, serielle bewusste Bedienung. | Keine harte Echtzeit, kein Rollback oder globales Exactly-once. |
| Lokaler Zugang | Erhalten | Ausschließlich Loopback; feste Hostbindung für beide Zweige; API-Originpflicht bleibt streng. | Kein Schutz vor beliebigen lokalen Programmen oder kompromittiertem Host. |
| Private Browserdaten | Erhalten | Geschlossener isolierter Import-/Datenfluss und frischer synthetischer Kontext. | Keine Migration, Sicherung oder systemweite Datenschutzgarantie. |
| Browserbetrieb | Durch C bestimmt | Bereitgestellter Dienst; neuer Nichtdefault-Kontext; bestätigtes Disposal, Rückprüfung und Targetzuordnung. | Kein frisches Profil oder Prozessbaumbeweis. |
| Aufbau ohne Bestätigung | F4 präzisiert | Endliche gebundene Warteenden, eindeutiger Übergang zu t₀, Bilanz möglicher Ressourcen. | Kein Gesamtzeitbudget ab Aufbau und keine physische Beendigungsgarantie. |
| Ressourcenabschluss und Startsperre | F2 präzisiert | Fristgerechter Normalabschluss benannter Ressourcen; FAIL/UNPROVEN sperrt weitere automatische Produktläufe. | Keine globale Restefreiheit oder adversariale Pfadwechselsicherheit. |
| Prüferlaubnis und Ergebnisabnahme | F3 präzisiert | Voraussetzungen vorher, Instanzen beim Erzeugen, Ergebnisse nach Ausführung. | Erlaubnis ist kein PASS; fehlende spätere Ergebnisse sind kein zirkuläres Erlaubnishindernis. |
| Alte Chrome-Ursachenklärung | Separat vertagt | Getrennte Produktbefunde. | Kein nachträglicher PASS oder Reparaturnachweis. |
| Vollständige Windows-Prozessbaumownership und Ownerverlust | Separat vertagt | Nur benannte eigene Ressourcen im beschlossenen Normalbetrieb. | Keine vollständige Job-, Handle-, Breakaway- oder Nachfahrengarantie. |
| Unabhängige Ausgabeversiegelung und Diagnoseabschluss | Separat vertagt | Minimierte laufgebundene Produktbelege. | Kein authentisches A_obs, keine vollständige Producer-/EOF-/Clockbarriere, kein diagnostischer Runtime-Record. |

### 5. Browserbetriebsvertrag

#### 5.1 Bereitgestellter Dienst

Der Produktlauf startet keine eigene Browserinstanz und erzeugt kein Browserprofil.

Vor der Prüferlaubnis müssen Betreiberverantwortung, bereitgestellte Dienstinstanz,
getrenntes synthetisches Profil, Browserfassung, Betriebsbedingungen und geeigneter
Kontrollweg gebunden sein. Dienststart, Pflege und späterer Dienstabschluss bleiben in
gesonderter Betriebsverantwortung.

Die für den vorgesehenen Kontrollweg notwendigen Fähigkeiten müssen ausreichend belegt
sein. Wo dies eine gesonderte Fähigkeitsprüfung erfordert, benötigt diese einen eigenen
ausdrücklichen Auftrag; dieser ADR führt sie nicht aus.

Pro Dienst ist zunächst höchstens ein Produktlauf gleichzeitig vorgesehen. Ein benannter
Automationslauf oder neuer Tab erfüllt die Kontextvoraussetzung nicht.

Ein frischer Kontext ersetzt kein frisches Profil. Profilweite Einstellungen und
übergreifende Zustände bleiben Betriebsannahmen. Eine während des Produktlaufs
gestartete Browserinstanz darf nicht nachträglich als geliehener Dienst gelten.

Vor Ressourcenversuchen werden die bereits verfügbaren Dienstvoraussetzungen und die
Startsperre geprüft. Ein dazu notwendiger eigener Verbindungs- oder
Registrierungsvorgang ist selbst ein erlaubnispflichtiger Aufbauschritt mit
Ressourcenbilanz und Warteende; er darf nicht unsichtbar vor den Lauf verlagert werden.

#### 5.2 Laufbindung und Nutzung

Je Lauf wird genau ein neuer isolierter Nichtdefault-Kontext verwendet. Das
Zuordnungsverfahren steht vorher fest. Tatsächliche Kennungen entstehen und werden
gebunden, sobald der erlaubte Aufbau sie liefert:

- Laufkennung;
- Dienstinstanz und Lebensdauer der Kontrollverbindung;
- tatsächlich neu erzeugte Kontextkennung;
- Dokumentgenerationen und Targets;
- eigene Beobachtungs- und Rückgabeobjekte.

Es gibt höchstens ein aktives Testdokument. Jede Neuladung ist eine neue Generation.
Default-Kontext, persönliche Kontexte und frühere Laufbestände sind ausgeschlossen.

Dienstneustart, Verbindungsverlust oder verlorene Zuordnung erlauben keine
Wiederverwendung alter Kennungen. Ein möglicherweise erzeugter, nicht mehr eindeutig
zugeordneter Kontext bleibt bilanziert.

Ungeklärte Rückgabe ist ein Anwendungsfall der allgemeinen Startsperre aus Abschnitt
6.4. Die Sperre ist nicht auf den Browserdienst begrenzt.

#### 5.3 Bestätigte Rückgabe

Vor Kontextbeendigung werden minimierte Produktbefunde außerhalb des Testdokuments
gesichert. Neue Produktauslösung ist ab t₀ gesperrt.

Innerhalb derselben gebundenen Dienstinstanz werden benötigt:

1. erfolgreiche Beendigung beziehungsweise Disposal des eigenen Kontextes;
2. passende Rückprüfung, dass dieser Kontext nicht mehr geführt wird;
3. Zuordnung des Endes seiner bekannten Dokumente und Targets.

Tab-Schließung, Detach, verschwundenes Fenster oder Verbindungsabbruch ersetzen diese
Befunde nicht. Notwendige Abschlussfunktionen dürfen nicht von beforeunload abhängen;
die aus C übernommene Chromium-Protokollgrenze bleibt bestehen.

Die Befunde gelten innerhalb des ausdrücklich vertrauenswürdigen Browserdienstes, nicht
als unabhängiger Betriebssystembeweis.

Bestätigtes Kontextende darf ausschließlich vollständig dokumentlokale Objekte
abschließen, wenn keine Referenzen, Worker oder sonstigen Lebensdauern hinausreichen. Es
bestätigt weder jedes Cleanup-Promise noch Garbage-Collection-Zeitpunkte oder sämtliche
browserinternen Betriebssystemressourcen. Eigene Verbindungen und außerhalb gehaltene
Objekte bleiben separat bilanziert.

### 6. Ressourcenplan, Aufbauübergang und Abschlussbudgets

#### 6.1 Bilanzierungsgrundsatz und Ressourcen

Vor der Prüferlaubnis stehen endliche Fallliste, Ressourcenklassen, Erzeugungswege,
Zuständigkeiten und Abschlusskriterien fest. Tatsächliche Instanzen werden während der
erlaubten Ausführung ergänzt.

R bezeichnet die Laufkennung, i eine Instanz oder Generation. Ein Eintrag entsteht
spätestens unmittelbar vor dem Erzeugungsversuch. Ein Versuch ohne erhaltene Identität
bleibt als möglicherweise erzeugte Ressource sichtbar.

Operation terminal, Dokument beendet, Kontext beendet, Verbindung geschlossen, Prozess
beendet, Datei entfernt und geliehene Nutzung zurückgegeben sind unterschiedliche
Befunde.

| ID | Ressource und Verantwortung | Erforderlicher Abschluss |
| --- | --- | --- |
| R/G-P | Eigener Serving-/Gatewayprozess; Jan und gebundene Laufbeobachtung. Prozessreferenz ab Start, Executable-/Entry-/Konfigurationsbindung; PID/Startzeit nur ergänzend. | Einmaliger kontrollierter Stop und terminaler Befund derselben Prozessidentität samt Exitstatus; Referenz bis Befundsicherung halten. |
| R/G-L | Eigener Listener, an Serverinstanz, Prozess, Adresse und Port gebunden. | Normaler server.close-Abschluss derselben gestarteten Instanz. stopped aus dem Sonderpfad genügt nicht. |
| R/C-i | Geführte lokale Asset-, Produkt- und Fixtureverbindungen; jeweiliger Erzeuger. Beide selbst gehaltenen Enden und Fallzuordnung erfassen. | Zugeordneter Closebefund; end, destroy() oder HTTP-Bodyende allein genügt nicht. Keine vollständige Browserpool-/TIME-WAIT-Abwesenheit. |
| R/F-i | Vorab benannte serielle Negativfixtures; Fixtureowner und Jan. | Aktivität und sämtliche eigenen Prozesse, Listener, Sockets und Timer nach ihren jeweiligen Kriterien beendet. |
| R/B-C | Genau ein eigener Nichtdefault-Kontext im geliehenen Dienst. | Disposal, Rückprüfung und Dokument-/Targetabschluss gemäß Abschnitt 5. |
| R/D-i | Höchstens ein aktives Dokument; jede Neuladung neue Generation. | Produktbefund vorher gesichert; Ende der gebundenen Generation bestätigt, gegebenenfalls über vollständigen Kontextabschluss. |
| R/Q-i | Serielle Produkt-/Wireoperationen; Fall-ID, Aufrufgeneration, Request-/Wirefall-ID und Verbindung. | Erwarteter terminaler Befund; Verbindung separat abschließen. Kontextverlust ersetzt kein Resultat. |
| R/O-i | Timer, Controller, Reader, Promises, Buffer, bereitgestellte Assetbytes und gehaltene Referenzen; jeweiliger Owner. | Normale Bereinigung oder ausdrücklich zulässiger vollständiger Ownerabschluss. Dokumentlokale und äußere Objekte getrennt. |
| R/H | Eigene Kontrollnutzung, Beobachtungen, Registrierungen, Kanäle, Reader, Handles und Timer. | Eigene Nutzung und Referenzen beendet. Gemeinsam bereitgestellte Dienstressourcen nicht pauschal schließen. |
| R/T | Gegebenenfalls eigene Hilfsdateien und Runordner, mit Parent-/Runpfad und Inventar; kein Browserprofil. | Nach bestätigtem Nutzerende begrenzte normale Entfernung und Abwesenheitsbefund oder ausdrückliche Restliste. |
| R/E | Bewusst aufzubewahrender minimierter Bericht; Jan. | Vollständige Lauf-, Quellen-, Konfigurations-, Versions-, Fall- und Abschlussbindung. |
| R/L | Geliehener Browserdienst samt Prozessen/Profil, Operatorsitzung, Laufzeiten, Quellen und Assets. | Eigene Nutzung/Registrierungen beendet, Kontext zurückgegeben. Dienst und Operatorsitzung dürfen weiterlaufen. |
| R/U | Persönliche Browser, Profile, fremde Dienste und Inhalte. | Keine Abschlussaktion oder Berührung zur Herstellung eines PASS. |

Für den Gatewayprozess bleibt einmaliges operatorgeführtes Ctrl+C in der eindeutig
zugeordneten geeigneten Konsole der angenommene Normalweg. Konsolenrückkehr allein
genügt nicht. child.kill(), zweites Stoppsignal und Konsolenschließung sind keine
vorgesehene Eskalation.

Ein freier Port beweist weder Prozess- noch Dateiabschluss. Readerfreigabe beweist nicht
notwendig das Ende seiner Quelle; ein selbst geschlossener Ausgabekanal beweist keinen
Producerabschluss.

Für Hilfsdateien gelten: keine erzwungene Löschung, Rechteänderung oder Auflösung
fremder Handles; keine Löschung bei unklarem Nutzer. Es wird keine adversariale
Pfadwechsel- oder sichere Datenträgerlöschgarantie beansprucht.

Bekannte Reste dürfen nicht aus der Bilanz verschwinden. Verlorene Zuordnung wird nicht
durch freie PID-/Prozessnamensuche mit anschließendem Kill ersetzt.

#### 6.2 Aufbauwarteschritte, Zeitbasis und t₀

Alle Zeitprüfungen verwenden eine einzige außerhalb des Testdokuments gehaltene monotone
Laufuhr. UTC und Browserzeitstempel dienen nur der Zuordnung.

Vor der Prüferlaubnis enthält der endliche Aufbauplan für jeden bestätigungspflichtigen
Schritt:

- Schrittkennung und Ressourcenklasse;
- einmaliges Startereignis;
- erforderliche vollständige Bestätigung und deren Zuordnungsprüfung;
- ein positives endliches Wartebudget W_s;
- verantwortlichen Owner und Beobachtungsweg;
- vorgesehenen normalen Abschluss bei fehlender Bestätigung.

Das betrifft insbesondere, soweit verwendet:

- Aufnahme eigener Kontrollverbindungen und Registrierungen;
- Erzeugung und Zuordnung des Nichtdefault-Kontextes;
- Erzeugung/Zuordnung von Targets und Dokumentgenerationen sowie deren erforderliche Ladebereitschaft;
- Start und Bindung von Gateway-/Fixtureprozessen und Listenern;
- Bereitstellung eigener Hilfsdateien, Assetinhalte und Beobachtungsressourcen.

Auch entsprechende Vorbereitungen zwischen zwei vorab geplanten Fällen erhalten diese
Bindung. Es gibt keinen unbenannten Warteschritt ohne endliches Warteende.

Unmittelbar vor dem erlaubten Versuch wird die Ressource bilanziert und auf derselben
Uhr der Beginn a_s erfasst. Das absolute Warteende lautet:

d_s = a_s + W_s.

Eine Bestätigung ist nur rechtzeitig, wenn ihre vollständige Prüfung streng vor d_s
abgeschlossen ist. Eine Antwort allein ohne eindeutige Identitäts- und
Vollständigkeitsprüfung genügt nicht.

Die gebundene Laufbeobachtung verantwortet die Zeitprüfungen; Jan bleibt
verantwortlicher Operator und kann früher ausdrücklich abbrechen. Das Verfahren ist vor
der Prüferlaubnis festzulegen und auf seine erforderlichen Fähigkeiten zu prüfen.

t₀ ist der früheste der folgenden Zeitpunkte:

- beobachteter Abschluss des letzten vorgesehenen Produktfalls;
- zeitlich erfasster ausdrücklicher Abbruch durch Jan;
- Beobachtung einer anderen sperrenden Sollabweichung oder Unsicherheit;
- das absolute Warteende d_s eines bis dahin nicht vollständig bestätigten Aufbauschritts.

Bei ausbleibender Bestätigung entsteht die sperrende Unsicherheit somit mit Erreichen
von d_s, nicht erst nach beliebig späterer Operatorentscheidung. Wird der Ablauf wegen
blockierter Ausführung erst später erkannt, bleibt der bereits bestimmte Bezug t₀ = d_s
maßgeblich; die Abschlussfristen beginnen nicht neu beim verspäteten Timercallback.

Ab t₀ werden weitere Produktauslösung, Wiederholungen und Ersatzinstanzen gesperrt und
der vorgesehene Normalabschluss begonnen. Verspätete Bestätigungen können die Restlage
klären, aber weder t₀ noch das ursprüngliche Urteil zurücksetzen.

Ausbleibende Antworten, neue Timer, Neuverbindungen oder Wiederholungen verlängern d_s
nicht. Ein abgelaufener Schritt wird nicht unter neuer Kennung erneut eröffnet. Ein
bestätigter vorausgehender Schritt ändert die bereits gebundenen Wartebudgets anderer
Schritte nicht.

Ist bereits die erforderliche Zeitbeobachtung nicht verfügbar, darf kein
Erzeugungsversuch beginnen. Geht ihre Verlässlichkeit während der Ausführung verloren,
werden weitere Auslösungen gesperrt; fehlende Zeitgewissheit darf keinen positiven
Fristnachweis erzeugen. Bereits gebundene Grenzen werden nicht neu angesetzt.

Ein erwarteter Fehler oder Timeout eines bestandenen Negativfalls ist keine unerwartete
Sollabweichung. Regulär ausstehende Bestätigungen vor ihrem Warteende sind ebenfalls
noch kein Ressourcen-UNPROVEN. Davon getrennt bleibt eine tatsächlich verlorene
Zuordnung oder abgelaufene Bestätigungsfrist.

Fehlt eine Dienstvoraussetzung vor jedem Erzeugungsversuch, bleibt die Produktprüfung
NOT_RUN. Nach einem bereits erfolgten Versuch wird eine möglicherweise offene Ressource
zusätzlich bilanziert, insbesondere als UNPROVEN bei fehlender Gewissheit. Auch dann
kann der Produktteil NOT_RUN sein; er verdeckt den Ressourcenbefund nicht.

Diese Regel setzt kein 90-Sekunden-Gesamtbudget ab Aufbau. Die konkreten W_s werden vor
Prüferlaubnis gebunden; die nachfolgenden Abschlussgrenzen beginnen ausschließlich bei
t₀.

#### 6.3 Unverlängerbare Abschlussgrenzen

Die Zahlen sind angenommene Beobachtungsbudgets; ihre praktische Eignung bleibt
ungeprüft.

| Grenze | Vollständig erforderlicher Befund |
| --- | --- |
| t₀ + 10 s | Weitere Auslösung seit t₀ gesperrt; laufende Operation nach bestehendem Vertrag terminal beobachtet; minimierte Produktbefunde außerhalb des Dokuments gesichert. |
| t₀ + 30 s | Eigener Kontext und zugeordnete Dokumente/Targets bestätigt beendet; ausschließlich dokumentlokale Ressourcen abgeschlossen. |
| t₀ + 50 s | Gateway, Fixtures, Listener, geführte Verbindungen, eigene Gateway-/Fixtureprozesse und fixturelokale Ressourcen abgeschlossen. |
| t₀ + 85 s | Eigene Beobachtungsobjekte, Kontrollnutzung, Registrierungen und gegebenenfalls Hilfsdateien abgeschlossen. |
| t₀ + 90 s | Vollständige Ressourcenbilanz geprüft und minimierter Bericht abgeschlossen. |

Browserprozessphase bis +70 s und Entfernung eines laufseigenen Browserprofils entfallen
weiterhin. Daraus entsteht kein zusätzliches Zeitfenster.

Die vollständige positive Prüfung muss streng vor der jeweiligen Grenze erfolgen. Bei
jetzt >= Deadline ist ein positiver fristgerechter Abschluss nicht mehr möglich:

- sicher verbliebene Pflichtressource: FAIL;
- fehlender, mehrdeutiger oder erst verspäteter Abschlussbefund: UNPROVEN;
- kein Verschieben durch Wiederholung, Timerneustart oder früheren Abschluss anderer Phasen;
- noch mögliche normale Abschlussaktionen dürfen fortgesetzt werden;
- abhängige Löschungen bleiben bei unklaren Nutzern gesperrt.

Die Grenzen beschränken die Zulässigkeit eines PASS. Sie garantieren weder Scheduling
noch physische Beendigung bei blockiertem Host. Spätere Befunde und Cleanup werden als
Nachtrag geführt und verbessern den früheren Lauf nicht rückwirkend.

#### 6.4 Allgemeine Startsperre

Ressourcen-FAIL oder Ressourcen-UNPROVEN sperrt weitere automatische Produktläufe.

Die Sperre gilt laufübergreifend für den hier beschriebenen GoldenDawn-Produktprüfpfad
in der von Jan verantworteten Windows-Prüfumgebung. Sie umfasst auch einen Wechsel der
Browserdienstzuordnung und ist nicht auf denjenigen Dienst beschränkt, bei dem der
Fehler auftrat. Sie behauptet keine Betriebssystemsperre für andere Anwendungen.

Vor jedem automatischen Produktstart muss feststehen, dass keine solche ungeklärte
Sperre besteht. Neue Laufkennung, neuer Kontext, Dienstwechsel, neuer Launcheraufruf,
späterer Cleanup oder ein freier Port bewirken keinen automatischen Reset.

Die Aufhebung erfordert eine gesonderte, von Jan verantwortete Klärung:

1. Alle sperrenden Ressourcenpositionen und ihre tatsächliche Restlage sind nachvollziehbar geklärt; bloß vermutete Nichterzeugung reicht nicht.
2. Notwendiger gesonderter Cleanup ist erfolgt und bestätigt oder die Ressource ist nachweislich nicht entstanden.
3. Der für einen erneuten Lauf maßgebliche Fehler beziehungsweise Beobachtungsmangel ist behandelt; geänderte Bindungen werden vor einer neuen Prüferlaubnis passend geprüft.
4. Jan bestätigt die Aufhebung ausdrücklich mit Bezug auf die geklärten Positionen.

Die alte Diagnoseursache muss dafür nicht pauschal geklärt werden. Das frühere
Laufurteil bleibt unverändert.

Noch mögliche, bereits vorgesehene normale Abschlussaktionen dürfen trotz Sperre
fortgesetzt werden. Sie eröffnen keinen neuen Produktlauf. Auch ein manueller Neustart
wird durch diesen ADR nicht zusätzlich autorisiert.

### 7. Eigene Produktabnahme

#### 7.1 Drei getrennte Nachweisebenen

| Ebene | Gegenstand |
| --- | --- |
| Netzwerkfreie Tests | Fachverträge, Projektion, Korrelation, exakte Fetchsequenz und Werte, Assetzulassungslogik, Fehlerabbildung, Deadlines, späte Settlements, Startsperre, Aufbauwarteenden, Gleichheitsfälle und unverlängerbare Grenzen. |
| Kontrollierte lokale HTTP-/Wireprüfungen | Raw-Header, Host, getrennte Originregeln, Targetvarianten, Framing, Bodygrenzen, GET/HEAD-Antworten, Längen, Fehlerprofile und Verbindungsregeln. Nicht netzwerkfrei; eigener ausdrücklich erlaubter Umfang. |
| Realer Browserlauf | Dokumentorigin, Assetladen, Fetch-/Responseprofil, Bedienung, echter lokaler Agentenpfad, Kontextbindung und Ressourcenabschluss. |

Keine Ebene ersetzt eine andere. Nicht frei setzbare Browserheader werden in
kontrollierten Wirefällen geprüft und nicht als angebliche Browsermanipulation
ausgegeben.

#### 7.2 Positive Pflichtkriterien

1. Nur die gebundenen Assets werden unter ihren exakten Pfaden ausgeliefert. GET liefert die gebundenen Bytes; HEAD liefert keine Bodybytes und die korrekte GET-Länge.
2. Das Testdokument verwendet feste Origin und APIroute. Beobachtet werden basic, exakte finale URL, exakte Origin und fehlender Referer.
3. Ein gültiger kontrollierter Request erreicht Gateway, Boundary und den echten SyncAgent. Eine minimierte requestgebundene Beobachtung bestätigt den tatsächlichen Aufruf.
4. Normale korrelierte Response, erfolgreiches Service-Result und syncResponse.success === true bestätigen gemeinsam den Produktfall.
5. Komposition und Beobachtung bestätigen keine Provideraufrufe oder vom geprüften Anwendungspfad ausgelösten externen Requests; keine privaten Fachmodule oder Bestände.
6. Mehrfachbedienung während eines Aufrufs erzeugt keinen zweiten Aufruf. Bewusste erneute Auslösung nach Abschluss erzeugt einen neuen Request, soweit der Laufplan dies noch erlaubt.
7. Aufbau- und Instanzbestätigungen sind korrekt zugeordnet; sämtliche Pflichtressourcen besitzen fristgerechte Abschlussbefunde.

#### 7.3 Negative Pflichtkriterien

1. Unbekannte Assetpfade, Query-/Kodierungs-/Aliasvarianten, falscher Host, unzulässige Methoden, Assetbody, Transfer-Encoding und nicht unterstützte Servingfunktionen liefern kein Asset und lösen keinen Fachaufruf aus.
2. Fehlende Asset-Origin bleibt zulässig; doppelte, falsche und null-Asset-Origin werden abgewiesen. Bei der API werden zusätzlich fehlende Origins abgewiesen. Die unterschiedlichen Regeln werden ausdrücklich gegeneinander geprüft.
3. Falsche APIroute, Query oder Host führen zu keiner fachlichen Verarbeitung. Ein bereits eingegangener POST ist möglich; „null POST“ wird nicht als altes Preflight-Orakel übernommen.
4. Ungültige Fachverträge, übergroße APIbodies, Encoding-/Framingfehler, ungültiges UTF-8 und malformed JSON scheitern an der zuständigen Grenze.
5. Falsche Korrelation, zusätzliche Responsefelder, frühe Gatewayfehler unter HTTP 200, falsche Typen/URLs, fehlende oder unzulässige Längen, Übergröße und unvollständige Streams werden abgewiesen. Non-200 ist kein fachlicher Erfolg.
6. Redirects werden nicht verfolgt; Zielgegenproben benötigen keine realen externen Dienste.
7. Fetch-, Gateway-, Agentenfehler, Timeout und späte Antworten erzeugen weder zweiten Abschluss noch Retry. Interne Aborts gelten nicht als Rollback.
8. Ausbleibende Aufbaubestätigung erreicht ihr bestimmtes Warteende, setzt t₀ und sperrt weitere Auslösung. Eine verspätete Bestätigung setzt keine Frist zurück.
9. Jeder Ressourcen-FAIL oder Ressourcen-UNPROVEN sperrt weitere automatische Produktläufe, auch bei bestätigter Kontextrückgabe.
10. Eine abweichende Own-Key-Reihenfolge wird trotz korrekter Schlüsselmenge und Werte abgewiesen.

Verlust des Testkontexts vor Sicherung des Produktresultats ergibt keinen bestätigten
Produkterfolg.

#### 7.4 Ergebnisregel

Produktbefund und Ressourcenbefund bleiben getrennt. Für einen begonnenen Lauf gilt:

1. bestätigte Sollabweichung: FAIL;
2. sonst fehlender Pflichtbefund: UNPROVEN;
3. nur vollständige Fallmatrix und sämtliche fristgerechten Pflichtabschlüsse: PASS.

FAIL hat Vorrang; offene Positionen bleiben trotzdem sichtbar. Erwartete Ablehnung oder
erwarteter Timeout können einen Negativfall bestehen lassen, wenn seine vollständigen
Kriterien erfüllt sind. Der nächste vorab erlaubte Fall setzt erforderlichen Restore
voraus und ist kein Retry des abgeschlossenen Falls.

Ein weiterlaufender geliehener Browserdienst ist bei bestätigter eigener Kontextrückgabe
zulässig. Ein sicher offener eigener Socket, Fixtureprozess oder außerhalb gehaltener
Reader verhindert dagegen den Gesamt-PASS und aktiviert die allgemeine Startsperre.

NOT_RUN beschreibt fehlende Produktausführung, nicht automatisch fehlende Ressourcen.
Späte positive Befunde erzeugen keinen rückwirkenden PASS.

Der minimierte Bericht enthält Quellen-/Konfigurationsbindung, Versionen, Fallkennungen,
notwendige Status-/Typ-/Längenwerte, Korrelations-/Aufrufbefunde und vollständige
Ressourcenbilanz einschließlich Startsperre und Nachträgen. HAR, Profilarchive und
umfangreiche Rohpayloadlogs werden nicht verlangt. Bewusste Berichtsaufbewahrung ist
keine Freigabe des diagnostischen Writers.

### 8. Status und getrennte Freigabezeitpunkte

#### 8.1 Fortbestehender Status

| Bereich | Stand |
| --- | --- |
| Historisches Runtimegate | overallGate: FAIL |
| Historische Ursache | causeStatus: CAUSE_NOT_PROVEN |
| Diagnosefoundation/-adapter | Authentisches A_obs fehlt; NOT_EVIDENCE; runtimeRecord:null. |
| ADR 0040 | Vorgeschlagen, nicht angenommen. |
| Neuer Produktumfang | Angenommen – 2026-10-26; nicht implementiert oder ausgeführt. |
| Bisherige produktive Freigaben | Diagnose-, Browser-, E2E-, Writer- und Persistenzfreigaben bleiben geschlossen. |

Neue Produktresultate erhalten eigene Fassungs- und Laufkennungen. Historische Fälle
werden nicht überschrieben.

#### 8.2 Angenommene begrenzte Ausnahme

Jans ausdrückliche Annahme dieses vollständigen Pakets beschließt ausschließlich für den
isolierten lokalen providerfreien Same-Origin-syncTest unter Windows folgende Ausnahme:
Die isolierte synthetische Produktkomposition und ihre gesondert erlaubte Prüfung dürfen
ohne vorherigen PASS des alten Chrome-Runtimegates und ohne abgeschlossene alte
Ursachenklärung erfolgen. Die vorgelagerten Diagnoseanforderungen an vollständige
Windows-Prozessbaumownership, adversarial abgesicherte Pfadbereinigung, authentisches
A_obs und unabhängige Ausgabeversiegelung werden ausschließlich für diesen Produktumfang
durch den angenommenen engeren Browserbetriebs-, Ressourcen- und Abnahmevertrag ersetzt.

Adressiert werden ausdrücklich:

- [ADR 0029, Slice-Reihenfolge](0029-browser-runtime-evidence-gate.md#verbindliche-slice-reihenfolge);
- [AGENTS.md, Entwicklungsreihenfolge](../../AGENTS.md#verbindliche-entwicklungsreihenfolge);
- [ADR 0036, Prozess- und Pfadressourcengrenzen](0036-browser-sync-transport-runtime-diagnostic-adapter-boundary.md#8-launcher-readiness-und-ressourcenowner).

Eine neue Ergebnisbezeichnung allein reicht nicht. Die alten Diagnoseanforderungen
bleiben unverändert offen; sie werden nicht erfüllt erklärt oder aus ihren Verträgen
entfernt.

Private Fachmodule, Anwendungskomposition und produktive Nutzung gehören nicht zur
Ausnahme.

#### 8.3 A – Erlaubnis der isolierten realen Produktprüfung

Vor dieser Prüferlaubnis müssen vorliegen:

- die erforderliche ausdrückliche Annahme;
- gesondert beauftragte Umsetzung und geprüfter Umsetzungsstand;
- tatsächliche Quellen-/Assetbytes und Hashes, Versionen und Konfiguration;
- endlicher Fall-, Aufbau- und Ressourcenplan;
- konkrete Zuordnungs- und Beobachtungsverfahren;
- ausreichend belegte notwendige Fähigkeiten;
- monotone Uhr, bestimmte Aufbauwartebudgets und vorab gebundene Abschlussbudgets;
- bereitgestellter synthetischer Browserdienst und geklärte Zuständigkeiten;
- keine ungeklärte allgemeine Startsperre.

Noch nicht existierende Kontext-, Target-, Dokument- oder Prozesskennungen werden nicht
verlangt. Ebenso wenig werden bereits die Produktresultate des noch nicht erlaubten
Laufs verlangt.

Sind wesentliche Kontroll-, Isolations-, Rückgabe- oder Abschlussfähigkeiten ungeprüft,
bleiben sie ungeprüft. Erforderliche gesonderte Fähigkeitsprüfungen werden mit eigenem
Umfang und eigenen Ressourcen ausdrücklich autorisiert. Sie werden weder als schon
erfolgt dargestellt noch durch einen unautorisierten Produktversuch ersetzt.

Netzwerkfreie Tests, lokale Wireprüfungen und solche Fähigkeitsprüfungen behalten ihre
getrennten Ausführungsaufträge. Die spätere Produktprüfung wird danach ausdrücklich
erlaubt.

#### 8.4 B – Instanzbindung während der erlaubten Ausführung

Der erlaubte Aufbau erfasst tatsächliche Kennungen und gehaltene Referenzen beim
Erzeugungsversuch beziehungsweise bei seiner bestätigten Rückgabe.

Die Zuordnungsregeln stehen vorher fest; die Instanzwerte entstehen erst jetzt. Fehlende
oder mehrdeutige Zuordnung wird nach Abschnitt 6 bilanziert und fristgerecht in den
Abschluss überführt.

Die Prüferlaubnis ist keine Bestätigung, dass ein bestimmter Kontext tatsächlich frisch
oder eine Ressource tatsächlich abgeschlossen ist.

#### 8.5 C – Ergebnisabnahme nach der Ausführung

Tatsächliche Kontextfrische, Isolation und Rückgabe, Same-Origin-/Responsebeobachtungen,
echter Agentenpfad, Produktfälle und Ressourcenabschlüsse sind Ergebnisse der
autorisierten Prüfung.

Sie entscheiden über Fallabnahme und Gesamturteil. Ihr vorheriges Fehlen verhindert
nicht zirkulär die Erlaubnis des ersten dafür vorgesehenen Laufs.

Ungeeignete Budgetwerte oder fehlgeschlagene Fähigkeiten ergeben entsprechende
Laufbefunde und gegebenenfalls Startsperre. Änderungen gelten nur für später neu
gebundene und erlaubte Läufe; keine rückwirkende Fristverlängerung.

#### 8.6 Spätere Anwendungskomposition

Erst nach der isolierten Ergebnisabnahme folgt gegebenenfalls eine eigene Entscheidung
über Anwendungskomposition. Ein isolierter Produkt-PASS ist nur ein Eingangsbefund.
Umsetzung, Browser-/E2E-Abnahme und produktive Nutzung der Anwendung bleiben separat.

### 9. Angenommene Entscheidungen, verbleibende Bindungen und Nachweise

#### 9.1 Angenommene normative Entscheidungen

| Gegenstand | Stand dieser Fassung | Annahme und verbleibende Prüfung |
| --- | --- | --- |
| Serving im bestehenden Gateway und feste Topologie | Angenommen; Umsetzung fehlt. | Angenommen – 2026-10-26. |
| Assetauswahl, Zulassung, Antwort, Fehler und gemeinsame HTTPgrenzen | In 3.1 festgelegt; konkrete Dateiliste bleibt regelgebundene Auswahl. | Angenommen – 2026-10-26. |
| Same-Origin-Transportprofil und elfgliedrige Own-Key-Sequenz | In 3.3/3.4 festgelegt; Sequenz ist keine offene normative Frage mehr. | Angenommen – 2026-10-26. |
| Browserbetriebs- und enger Ressourcenvertrag | In 5/6 festgelegt. | Angenommen – 2026-10-26. |
| Allgemeine Startsperre und Aufhebung | In 6.4 festgelegt. | Angenommen – 2026-10-26. |
| Endliches Aufbauwarten und Übergang zu t₀ | In 6.2 festgelegt. | Angenommen – 2026-10-26. |
| Absolute Abschlussgrenzen und Statuspriorität | In 6.3/7.4 festgelegt; praktische Eignung der Zahlen ungeprüft. | Angenommen – 2026-10-26; praktische Eignung später prüfen. |
| Trennung Prüferlaubnis, Instanzbindung, Ergebnisabnahme und begrenzte Ausnahme | In 8 festgelegt. | Angenommen – 2026-10-26. |

Diese Themen sind mit Jans Annahme entschieden und werden nicht auf eine spätere Messung
abgeschoben. Der unabhängige Re-Review der gebundenen v2 ist abgeschlossen. Sein Urteil
wird nicht auf die neuen Repositoryfassungen übertragen; deren unabhängiger
Dokumentreview steht aus.

#### 9.2 Implementierungs- und Umgebungsbindungen

| Punkt | Regelgebundene Konkretisierung | Spätester Zeitpunkt |
| --- | --- | --- |
| Dokumentroute und geplante Assetliste | Endliche eindeutige Zuordnung nach 3.1, einschließlich statischer Isolationsprüfung. | Vor Umsetzung des Servingzweigs. |
| Tatsächliche Asset-/Quellenbytes | Bytezahlen, Hashes, Importbezüge und vollständige Prüffassung. | Nach Erstellung, vor Prüferlaubnis; erneuter Abgleich bei Bereitstellung. |
| Fetchsequenz | Technische Umsetzung und passende Reihenfolge-/Descriptor-/Wertregressionen. | Vor Review des Umsetzungsstands und Prüferlaubnis. |
| Browseranbieter, Betreiber und konkrete Kontrollanbindung | Erfüllung des bereits bestimmten Fähigkeitsvertrags; keine automatisch neue Architekturentscheidung allein wegen des Namens. | Vor Umsetzung der Anbindung; Dienstvoraussetzungen vor Prüferlaubnis und erneut vor Versuchen prüfen. |
| Gateway-/Listener-/Prozessbeobachtung | Konkreter Weg einschließlich Sonderpfad, gehaltener Identität und geeigneter Windows-/Terminalkonfiguration. | Vor seiner Umsetzung festlegen; erforderliche Fähigkeiten vor Prüferlaubnis ausreichend belegen. |
| Agentenaufrufbeobachtung | Requestgebundener Nachweisweg, der tatsächlichen Aufruf von Responsebehauptung unterscheidet. Keine stillschweigende API-/Datenausweitung. | Vor Umsetzung des Beobachtungswegs; geprüft vor Prüferlaubnis. |
| Objekt-/Ownerzuordnung | Dokumentlokale und äußere Objekte einschließlich bereitgestellter Assetinhalte und Kontrollobjekte. | Am Umsetzungsstand vor Prüferlaubnis vollständig prüfen. |
| Fälle, Fixtures, Dateien und Bericht | Pflichtabdeckung, Ressourcenklassen, Aufbewahrung und Entfernung. | Vor Prüferlaubnis; konkrete Instanzen später ergänzen. |
| Uhr und Aufbauwerte W_s | Geeignete monotone Zeitquelle, Startereignisse, Bestätigungen, Verantwortliche und endliche Werte. | Vor Prüferlaubnis. |
| Windows-/Node-/Browserversionen und Konfiguration | Konkrete unterstützte Umgebung und Betriebsbedingungen. | Vor Prüferlaubnis; Drift verhindert unveränderte Nutzung der Bindung. |
| Startsperrenführung | Verlässlicher Startcheck und nachvollziehbare gesonderte Aufhebung ohne stillen Reset. | Vor Prüferlaubnis; vor jedem automatischen Produktstart anwenden. |
| Review und Tests der Umsetzung | Passende autorisierte Tests und Review der tatsächlichen Fassung. | Vor realer Produktprüfung. |
| Tatsächliche Kontext-/Target-/Dokument-/Prozesskennungen | Nach vorher festgelegtem Verfahren erfassen. | Beim erlaubten Versuch beziehungsweise bei dessen bestätigtem Ergebnis; nie Voraussetzung ihrer eigenen Erzeugung. |

Würde eine Konkretisierung den formulierten Vertrag überschreiten, wäre dafür eine neue
ausdrückliche Entscheidung nötig. Die regelkonforme Auswahl eines Anbieters, einer
Anbindung oder konkreter Dateien ist dagegen nicht pauschal eine noch fehlende
Architekturentscheidung.

#### 9.3 Ausführungsevidenz

| Nachweis | Entstehungszeitpunkt und Bedeutung |
| --- | --- |
| Erforderliche Fähigkeiten des gewählten Kontroll-/Abschlusswegs | Soweit nicht bereits ausreichend belegt: eigene ausdrücklich erlaubte Fähigkeitsprüfung vor Produktprüferlaubnis. |
| Tatsächliche Kontextfrische, Isolation und Rückgabe | Im erlaubten Produktlauf; Voraussetzung seiner Ergebnisabnahme. |
| Tatsächliche Assetantworten, Origin, fehlender Referer, basic und finale URL | In den autorisierten Wire-/Browserprüfungen. |
| Echter Gateway-/Boundary-/SyncAgent-Pfad | Im erlaubten Produktlauf mit vorher bestimmtem Beobachtungsweg. |
| Positive und negative Pflichtkriterien | In den jeweils autorisierten Nachweisebenen; vollständig vor Gesamt-PASS. |
| Tatsächlicher Gateway-, Listener-, Verbindungs- und Fixtureabschluss | Für jeden betroffenen Lauf innerhalb seiner unverlängerbaren Fristen. |
| Praktische Eignung von Warte- und Abschlussbudgets | Durch ausdrücklich erlaubte Ausführung. Ungeeignete Werte werden nur für spätere Läufe neu bewertet. |

Die bisher fehlenden Produktresultate verhindern die Ergebnisabnahme, nicht allein
deswegen die Prüferlaubnis. Fehlende notwendige Fähigkeiten oder unvollständige
Vorbindungen können hingegen die Prüferlaubnis verhindern. Diese beiden Fälle werden
nicht gleichgesetzt.

### 10. Quellenbindung und Reviewprovenienz

#### 10.1 Angenommene Fassung und Re-Review

| Gegenstand | Bytes | SHA-256 |
| --- | --- | --- |
| Originalcontainer der v2 | 117419 | `5873679aa6085880edad3990359c25933eb9327a507fe7b83390c6c487563381` |
| Ausschließlich angenommener v2-Bereich | 67647 | `3e9c7fb7cbe555517cdd7db0e66dc14c9f7056e3ab5494a469315abf1ed5e4c2` |
| Unabhängiger Re-Reviewbericht | 13479 | `e0715d449267ce22326fe0b03ee9633aeaa1d5919c59bb21ed5e9eccd9937554` |

Der angenommene Bereich beginnt mit dem Titel in Containerzeile 536 und endet
in Zeile 1264/Dateiende: nullbasierter Bytebereich **[49772, 117419)**.
Versionskennung: **SO-syncTest-Korrekturentwurf-2026-10-26-v2**; Fassungs- und
Annahmedatum: **2026-10-26, Europe/Berlin**. Container, Teilbereich und Bericht
wurden für diese Übernahme anhand der ursprünglichen Bytes ohne Normalisierung
geprüft. Das vorgelagerte alte Dokument ist ausschließlich Vergleichsmaterial,
keine zweite aktuelle Normfassung. Die Originalquellen bleiben unverändert;
vollständige Chatcontainer und persönliche Ablagepfade werden nicht übernommen.

Der Re-Review urteilt technisch PASS, zur Vollständigkeit COMPLETE und zur
Annahmereife annahmereif. F1 (Assetvertrag), F2 (allgemeine Startsperre),
F3 (Freigabezeitpunkte), F4 (Aufbauübergang zu t₀) und F5 (Own-Key-Sequenz)
sind auf Dokumentebene geschlossen. Der Bericht bestätigt keine praktische
Budgeteignung oder vorhandene Browserdienstfähigkeit. Seine Aussage über
Unabhängigkeit bleibt die des übermittelten Berichts; diese Übernahme ist
kein unabhängiger Review und überträgt dessen PASS nicht auf neue Bytes.

#### 10.2 Redaktionelle R1-Klarstellung

In Abschnitt 3.1.4 lautet der Eingangssatz zur Asset-Origin jetzt:
„Der Origin-Header darf fehlen.“ Er ersetzt „Kein Origin-Header ist zulässig.“
aus Containerzeile 664. Gemäß R1 präzisiert dies ausschließlich das bereits
festgelegte Soll: Abwesenheit ist für Assets erlaubt; bei Vorhandensein gilt
genau einmal die feste Origin. Die API-Originpflicht bleibt unverändert.
Es entsteht weder eine neue Zulassungsregel noch eine neue Architekturentscheidung.

#### 10.3 Historische Herkunft und Selbstprüfberichte

Die folgenden Bindungen und Aussagen stammen aus der v2 und ihrem Re-Review;
sie sind Herkunft, keine heute erneut ausgeführten Prüfungen dieser Vorfassungen.

| Historischer Eingang | Bytes | SHA-256 |
| --- | --- | --- |
| Zu korrigierende Ausgangsvorlage | 48701 | `034a5251b14a9a74ed68817f9246afaa09da245582cea242d477b4059db3c76c` |
| Vorheriger unabhängiger Review | 18222 | `1d6a8ef671e950acc78eb30495d2c4e991a9497cb1dd2024287f900882575b6f` |
| Quelle A: Ziel, Garantien und Produktabnahme | 20978 | `9ba2ed00c5513a57e0091feac3e507dbff65c8c9bad6759d6d5f4603f56f7dfe` |
| Quelle B: Ressourcenabschluss, absolute Budgets und Freigaberegel | 28207 | `ec1fc8449dd88e855ab8e083c21a930a46a4eef47ea3e7982f9b81bf9318c878` |

Quelle C ist die in der Auftragsquelle eingebettete Vorgabe zum Chatdelta
„65318“, ohne eigene Dateibindung, Rohbytehash oder Dateistatus. A/B wurden
laut v2 bei der Korrektur nicht erneut als Dateien benötigt oder gehasht;
auch diese Übernahme behauptet keine solche erneute Prüfung.

| Herkunft | Erhaltene Wirkung |
| --- | --- |
| A | Ziel, Isolation, Fachverträge und Serving-/Transportvertrag; Assetvertrag durch F1 vervollständigt. |
| B | Ressourcenbilanz, Normalabschlüsse, t₀ und absolute Grenzen; Aufbauübergang durch F4 bestimmt. |
| A/B | Allgemeine automatische Startsperre durch F2 ausdrücklich wiederhergestellt. |
| C | Geliehener Dienst, eigener Kontext und bestätigte Rückgabe bleiben maßgeblich. Eigene Browserinstanz, eigenes Profil und die Browserprozessphase +70 s aus B entfallen; eigene Hilfsdateien bleiben gegebenenfalls bilanziert. |
| Historische Diagnosezustände | Unverändert; keine Evidenzübertragung. |

Der frühere Review bleibt mit FAIL / COMPLETE / nicht annahmereif, einem P1,
drei P2 und einem P3 an seine damalige Fassung gebunden. Die v2 dokumentiert
für ihre Korrekturbearbeitung einen lesenden Abgleich von 13 Projektdateien,
unveränderten HEAD `b05b729432474fea7092320ac4180d078aa8a767`, Branch main
und 172 unveränderte Indexeinträge. Der überlieferte 26-Dateien-Abgleich hat
den Manifest-SHA-256
`65203631e9dd95e7f9e98116c461a0129da7aeaf0175429df53e5ee8e5042978`.
Der Re-Review berichtet ebenfalls einen unveränderten 26-Dateien-Abgleich mit
diesem Manifest. Diese historischen Abgleiche, ihre Bestandsbefunde und die
dort ausgebliebenen Tests, Builds und Runtimeproben sind keine heutigen
Ausführungsergebnisse. Frühere Test-/Adapterbefunde zu Cleanup-Promises,
Test-Preload und child.kill() sind ebenfalls kein neuer Laufnachweis.

Die Übernahme erzeugt keinen Adapter-, CI-, Test-, Runtime- oder unabhängigen
Dokumentreview-PASS. Neue Dokumentbytes können bestehende Quellenbindungen
verändern; alte Artefakte und Aggregationsergebnisse werden nicht neu gehasht
oder auf den jetzigen Stand übertragen.

### 11. Schriftliche Gegenabläufe zu F1–F5

Diese Abläufe sind ausschließlich dokumentarische Gegenprüfungen; sie wurden nicht
ausgeführt.

| Befund | Gegenablauf | Regelzuordnung dieser Fassung |
| --- | --- | --- |
| F1 | GET auf einen gelisteten Pfad mit falschem Host. | Assetzweig verwirft mit 400; keine Assetbytes und kein Fachaufruf. |
| F1 | Derselbe Pfad mit ?v=1, Prozentkodierung oder zusätzlichem Slash. | Kein exakter kanonischer Listeneintrag: 404, keine Normalisierung und kein Fallback. |
| F1 | GET ohne Origin, danach API-POST ohne Origin. | Asset-GET darf bei sonst gültigem Profil bestehen; API-POST scheitert weiterhin an der Originpflicht. |
| F1 | HEAD auf ein zulässiges Asset mit GET-Länge N. | Status und Repräsentationsheader entsprechen GET; Content-Length N, null Bodybytes. TE oder positiver Requestbody wäre unzulässig. |
| F2 | Kontext zurückgegeben, Fixtureprozess bleibt an seiner Abschlussgrenze sicher aktiv. | Ressourcen-FAIL, Gesamt-FAIL und laufübergreifende automatische Startsperre. Kontextwechsel oder freier Port hebt sie nicht auf. |
| F2 | Erwarteter Transporttimeout eines Negativfalls; alle Ressourcen schließen rechtzeitig. | Negativfall kann bestehen. Der erwartete Timeout allein aktiviert keine Ressourcenstartsperre. |
| F3 | Umsetzung, Fähigkeiten und Laufplan sind geprüft; die Kontextkennung existiert noch nicht. | Prüferlaubnis kann auf dem festgelegten Bindungsverfahren beruhen. Kennung entsteht beim erlaubten Erzeugen; tatsächliche Frische und Rückgabe werden danach abgenommen. |
| F4 | Kontexterzeugung beginnt bei a_s; bis d_s = a_s + W_s fehlt die vollständige Bestätigung. | t₀ = d_s, Ressourcen-UNPROVEN, weitere Auslösung gesperrt, Normalabschluss beginnt. Produktteil gegebenenfalls NOT_RUN. |
| F4 | Antwort beziehungsweise Timerverarbeitung erfolgt erst nach d_s. | Keine Verlängerung. Die Abschlussgrenzen beziehen sich weiter auf d_s; späte Identität kann nur die Restlage klären. |
| F5 | Elf korrekte Felder, aber referrer steht am Ende. | Sequenzverstoß; Ablehnung vor Fetch. Zulässig ist ausschließlich Position 7 zwischen referrerPolicy und keepalive. |

## Konsequenzen

### 12. Verbleibende Bindungen und nächster Schritt

Jans Annahme und der Re-Review der gebundenen v2 sind abgeschlossen. Für die
neuen Repositoryfassungen folgt ein gesonderter unabhängiger Dokumentreview.
Die Selbstprüfung der Übernahme ist kein unabhängiges PASS.

Es verbleiben die regelgebundenen Auswahlen und Nachweise aus Abschnitt 9:
konkrete Assetliste, Implementierung, Kontrollanbindung, Betreiber- und
Umgebungsbindung, Beobachtungswege, Uhr und Aufbauwartewerte, geprüfte
Quellenfassungen sowie gegebenenfalls gesondert erlaubte Fähigkeitsprüfungen.
Instanzkennungen und Produktbefunde entstehen erst in der jeweiligen erlaubten
Ausführung. Umsetzung und jede der getrennten Prüfebenen bleiben gesondert
zu beauftragen; Anwendungskomposition ist erst ein möglicher späterer
Entscheidungsslice nach der isolierten Ergebnisabnahme.

SAC bleibt aktiviert. ADR 0040 bleibt vorgeschlagen; `overallGate: FAIL`,
`causeStatus: CAUSE_NOT_PROVEN`, fehlendes authentisches `A_obs`,
`NOT_EVIDENCE`, `runtimeRecord:null` und die bisherigen geschlossenen
produktiven Freigaben bleiben unverändert. Eine Kosten-, Zeit- oder
Aufwandsersparnis sowie vollständige Windows-Ressourcen- oder
Datenschutzgarantien werden nicht behauptet.

## Erwogene Alternativen

Die angenommene Abgrenzung erhält den alten Diagnosepfad mit seinen offenen
Anforderungen. Der neue isolierte Produktnachweis verwendet den engeren
Browserbetriebs- und Ressourcenvertrag. Die Herkunft C ersetzt innerhalb
dieses Produktumfangs den in B betrachteten eigenen Browserstart samt Profil
und Browserprozessphase; der bereitgestellte Dienst bleibt in gesonderter
Betriebsverantwortung. Der private Anwendungseinstieg, Provider und eine
andere Hosting- oder Helferarchitektur sind kein Bestandteil dieser Entscheidung.

## Bedingungen für eine Neubewertung

Konkretisierungen außerhalb des festgelegten Vertrags benötigen eine neue
ausdrückliche Entscheidung. Ungeeignete Budgets oder fehlgeschlagene Fähigkeiten
werden nur für später neu gebundene und erlaubte Läufe bewertet; vergangene
Fristen und Urteile werden nicht verbessert. Ressourcen-FAIL oder
Ressourcen-UNPROVEN verlangt die gesonderte Klärung und ausdrückliche Aufhebung
der Startsperre nach Abschnitt 6.4. Ein späterer Originwechsel, private Daten,
Anwendungskomposition und produktive Nutzung bleiben getrennte Themen.
