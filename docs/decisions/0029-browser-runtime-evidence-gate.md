# ADR 0029 – Local Browser Runtime Evidence Gate

## Status

Angenommen – 2026-08-30

Der tatsächliche Runtimegate-Status bleibt `UNPROVEN`. Die Annahme dieses ADR
ist kein Runtime-`PASS`.

## Kontext

Der BrowserSyncTransport ist nach [ADR 0028](0028-browser-sync-transport-validator-integrity-boundary.md)
isoliert implementiert. Seine feste v1-Wire-Policy und die vollständige
mutationswirksame, netzwerkfreie Testmatrix besitzen ihr nachgewiesenes
Implementierungs-`PASS`. Der Transport bleibt dennoch vom SyncService und von
`src/main.js` unkomponiert. Ein realer Browser-End-to-End-`syncTest` existiert
nicht.

[ADR 0020](0020-local-sync-gateway-raw-wire-http-foundation.md) bindet den
separat startbaren lokalen HTTP-Prozess an `127.0.0.1`, legt Pfad, Origin- und
CORS-Policy sowie die kontrollierten Responseheader fest. Die durch ADR 0025
ergänzte lokale Gateway-/SyncAgent-Komposition kann einen exakt gültigen
synthetischen `syncTest` lokal mit HTTP `200` beantworten. Diese serverseitigen
Verträge beweisen jedoch nicht, dass ein konkreter Browser in einem konkreten
Auslieferungskontext den unveränderten Pfad tatsächlich zulässt und so
beobachtet, wie Transport und Gateway ihn voraussetzen.

ADR 0026 verlangte deshalb bereits vor Browserkomposition und Browser-End-to-
End-Fluss einen getrennten realen Nachweis für CORS und Preflight, Private
Network Access beziehungsweise Local Network Access, lokale
Netzwerkberechtigungen, Secure Context und Mixed Content, exakte
Loopbackerreichbarkeit, Redirectverhalten sowie sichtbare und blockierte
Responseheader. ADR 0027 übernahm diese Anforderung unverändert; ADR 0028 ließ
sie fortgelten und ordnete sie ausdrücklich nach dem netzwerkfreien
Implementierungsnachweis ein.

Die aktuelle öffentliche Quellenlage verlangt dabei eine strikte Trennung:

- Der [WHATWG Fetch Standard](https://fetch.spec.whatwg.org/) definiert den
  gewöhnlichen CORS-Preflight, seinen Cache, gefilterte CORS-Responses und
  `redirect: "error"`. Ein Cross-Origin-`POST` mit
  `Content-Type: application/json` ist unabhängig von PNA oder LNA nicht
  CORS-safelisted.
- Die historische Chrome-Ankündigung zu
  [PNA-Preflights](https://developer.chrome.com/blog/pna-on-hold) dokumentiert,
  dass deren geplante Durchsetzung pausiert wurde. PNA-spezifische Header sind
  deshalb keine universelle aktuelle Browservoraussetzung.
- Der aktuelle [WICG-Entwurf zu Local Network Access](https://wicg.github.io/local-network-access/)
  und die [Chrome-Dokumentation zu LNA](https://developer.chrome.com/blog/local-network-access)
  beschreiben statt des PNA-Endpoint-Opt-ins ein berechtigungsbasiertes Modell.
  Die [Chrome-142-Release-Notes](https://developer.chrome.com/release-notes/142)
  binden dessen Einführung an diese konkrete Version; die
  [Chrome-145-Release-Notes](https://developer.chrome.com/release-notes/145)
  unterscheiden bereits `local-network` und `loopback-network`.
- Die [Microsoft-Edge-Dokumentation](https://learn.microsoft.com/en-us/deployedge/ms-edge-local-network-access)
  beschreibt wiederum eigene Versions-, Umfangs- und Berechtigungsgrenzen.
  Eine Chromium-Verwandtschaft ersetzt keine produkt- und versionsgebundene
  Messung.
- [Secure Contexts](https://www.w3.org/TR/secure-contexts/) behandelt
  `127.0.0.0/8` als potenziell vertrauenswürdig. Nach
  [Mixed Content](https://www.w3.org/TR/mixed-content/) ist ein Ziel deshalb
  nicht allein wegen `http://127.0.0.1` pauschal Mixed Content. Der tatsächliche
  Dokument-, Ancestor- und Browserkontext bleibt dennoch zu messen.

Herstellertexte, Spezifikationen und die bestehende Unit-Suite sind keine
Evidenz für die später gemessene Runtime. Browserprodukt, Vollversion, Channel,
Betriebssystem, Profil, Richtlinien, Berechtigungen und tatsächlicher
Top-Level-Kontext können das Ergebnis verändern. Ohne einen realen, zuvor
freigegebenen Lauf bleibt jedes Browserziel `UNPROVEN`.

## Entscheidung

> ADR 0029 ergänzt ADR 0020 und ADR 0028 und operationalisiert das durch die fortgeltenden ADR-0026-/ADR-0027-Regeln verlangte Browser-Runtimegate. ADR 0029 ersetzt keinen bestehenden ADR.

ADR 0020 sowie ADR 0026 bis ADR 0028 bleiben vollständig unverändert. ADR 0029
ändert weder Transport- noch Gatewayvertrag und autorisiert noch keinen realen
Messlauf. Es entscheidet ausschließlich, welche Bindungen, Beobachtungen,
Status-, Stop-, Redaction- und Cleanupregeln ein später gesondert
freizugebender Runtime-Evidence-Slice erfüllen muss.

### Verbindliche Slice-Reihenfolge

Die Reihenfolge bleibt:

1. isolierter BrowserSyncTransport und feste v1-Wire-Policy: implementiert und
   netzwerkfrei nachgewiesen;
2. ADR 0029: angenommen, tatsächlicher Runtimegate-Status `UNPROVEN`;
3. gesondert autorisierter realer Runtime-Evidence-Slice;
4. nur nach dessen gebundenem `PASS` ein neuer Browserkompositions-
   Entscheidungsslice;
5. erst danach ein getrennter Browser-End-to-End-`syncTest`;
6. globale Betriebsgrenzen und optionale Provider weiterhin in späteren
   eigenen Slices.

Ein angenommenes ADR, eine grüne Testsuite, ein erfolgreicher Build oder die
Existenz von Transport und Gateway überspringt keinen dieser Schritte.

### Verbindliches Basistupel `T₀`

Jeder spätere Messlauf bindet vor dem ersten Request ein vollständiges,
unveränderliches Basistupel `T₀`. Es enthält mindestens:

- Repositorycommit und bestätigten sauberen Repositoryzustand;
- Messzeitpunkt und Zeitzone;
- Betriebssystem, Edition, Architektur, Build und Patchstand;
- Node-Version;
- Browserprodukt, Channel, vollständige Version und, soweit separat
  verfügbar, Enginebuild;
- sichtbaren, nicht headless ausgeführten Browser;
- frisches wegwerfbares Profil und Privatmodus;
- Erweiterungszustand;
- relevante Startparameter und Featureflags;
- wirksame Enterprise-Richtlinien;
- sanitisierten Proxy- und VPN-Zustand;
- Service-Worker-, Permission- und Preflight-Cache-Ausgangszustand;
- exakte Top-Level-URL und serialisierte Origin;
- Ausführungskontext, ausschließlich der echte GoldenDawn-Top-Level-Window-
  Kontext;
- den tatsächlichen `window.isSecureContext`-Wert;
- Gatewaylistener `127.0.0.1:8787`;
- `GOLDENDAWN_SYNC_GATEWAY_PORT='8787'`;
- `GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN` exakt gleich der gemessenen
  Frontend-Origin;
- Endpoint exakt
  `http://127.0.0.1:8787/api/sync-test`.

Der Evidence-Record persistiert sicherheits- und datenschutzsensiblere
Konfigurationen nur in den geschlossenen sanitisierten Klassifikationen aus
`docs/data-contracts.md`. Der spätere Lauf bindet ihre tatsächlich wirksamen
Werte dennoch vor dem ersten Request flüchtig und vergleicht sie nach jedem
Vektor exakt. Rohwerte, Listen und Pfade werden nach allen Pflichtvergleichen
verworfen;
ein bloßes Gleichbleiben der gröberen Recordklassifikation genügt nicht als
Bestätigung eines unveränderten Bindungsfelds.

`file:`, `about:blank`, DevTools als eigener Origin, ein verborgenes Iframe,
ein Worker oder ein anderer Ersatzkontext darf nicht als GoldenDawn-Top-Level-
Kontext ausgegeben werden. Ändert sich ein Feld von `T₀`, werden der
Gesamtkontext und alle davon abgeleiteten Vektoren wieder `UNPROVEN`.

### Kontrollierte Negativtupel `Tᵥ = T₀ + Δᵥ`

Alle positiven Runtimebeobachtungen verwenden exakt `T₀`. Jeder verpflichtende
Negativvektor verwendet dagegen ein vorab festgelegtes abgeleitetes Tupel
`Tᵥ = T₀ + Δᵥ`.

`Δᵥ` ist geschlossen allowlistet und enthält ausschließlich die für diesen
Negativvektor notwendige Abweichung. Jede weitere oder unbeabsichtigte
Abweichung ergibt `UNPROVEN`; eine beobachtete Grenzverletzung ergibt `FAIL`.
Nach jedem Negativvektor müssen Restore auf `T₀` und vektorlokaler Cleanup
separat bestätigt werden.

Die tatsächlich beobachteten Änderungen werden unabhängig von der Allowlist
über die geschlossene Bindungsfeldmenge erfasst. Eine zusätzliche Änderung
wird dadurch dokumentierbar, aber niemals nachträglich Bestandteil von
`Δᵥ` oder `PASS`.

Für ADR 0029 existieren genau zwei Negativdeltas:

1. `T_origin = T₀ + Δ_origin`
   - einzig zulässiges Delta:
     `GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN` stimmt absichtlich nicht mit der
     unveränderten tatsächlichen Frontend-Origin überein;
   - Browser, Version, Profilzustand, Top-Level-Origin, Endpoint, Listener,
     Port, Pfad, Transport und übrige Gatewaysemantik bleiben identisch zu
     `T₀`;
   - erwartet werden Browserblock, kein lesbarer Responsebody und null am
     Gateway beobachtete `POST`-Requests; ein abgelehntes `OPTIONS` darf davon
     getrennt beobachtbar sein;
   - anschließend wird die Allowed-Origin exakt auf den Wert aus `T₀`
     zurückgestellt.
2. `T_redirect = T₀ + Δ_redirect`
   - Browserkontext, Request, initiale URL, Host, Port und Pfad bleiben
     identisch zu `T₀`;
   - einzig zulässiges Delta ist das vorab gebundene Responderprofil am festen
     initialen Endpoint: statt des echten Gateways antwortet eine ausdrücklich
     als Fixture klassifizierte lokale Wegwerf-Redirectfixture;
   - die Fixture, ihre Redirectantwort und der lokale Sentinel bilden genau ein
     geschlossenes vektorlokales Responderprofil; alle übrigen Gateway- und
     CORS-Semantiken bleiben gegenüber `T₀` unverändert;
   - die Fixture beantwortet genau einen erfolgreichen gewöhnlichen
     CORS-Preflight am initialen Pfad wie `T₀`, empfängt danach genau einen
     `POST` am initialen Pfad und bestätigt, dass sie darauf genau eine
     `307 Temporary Redirect`-Response mit leerem Body und
     `Location: http://127.0.0.1:8787/__goldendawn-adr-0029-redirect-sentinel`
     vollständig gesendet hat;
   - `redirect: "error"` muss geschlossen scheitern; der zusätzlich exakt
     gebundene lokale Sentinelpfad erhält null Requests;
   - die Fixture ist niemals ein positiver Gatewaynachweis;
   - anschließend werden Fixture und Sentinel vollständig entfernt und der
     Zustand aus `T₀` wiederhergestellt.

Ein `PASS` eines Negativvektors bestätigt ausschließlich die erwartete
Abwehrwirkung unter seinem allowlisteten Delta. Es ist kein positives
Kompatibilitäts- oder Gateway-`PASS` für `T_origin` oder `T_redirect`.

### Getrennte Beobachtungsebenen

Der spätere Nachweis hält strikt getrennt:

1. JavaScript-sichtbare Browserwerte;
2. Browser- und DevTools-Netzwerkbeobachtungen;
3. Gateway- und Prozessbeobachtungen;
4. sichtbare Benutzer- und Permissionereignisse.

Eine Ebene darf nicht als Beweis für eine andere ausgegeben werden.
Browser-Netzwerktools sind insbesondere kein Roh-Wire-Beweis. Ein im
JavaScript-Headersobjekt fehlender Header beweist weder seine Abwesenheit auf
dem Wire noch fehlende Browserdekomprimierung. Ein Gatewayrequest beweist
wiederum nicht, dass JavaScript die Response lesen konnte.

### Status und Aggregation

Jedes Pflichtgate und jedes vorab benannte Browserziel besitzt exakt einen
Status:

- `PASS`;
- `FAIL`;
- `UNPROVEN`.

Es gibt keinen vierten Gate-Status `N/A`.

Das Gesamtgate bleibt an `T₀` gebunden:

- Mindestens ein Pflicht-`FAIL` ergibt Gesamt-`FAIL`.
- Gesamt-`PASS` ist nur zulässig, wenn alle positiven Pflichtgates exakt unter
  `T₀` bestehen, beide verpflichtenden Negativvektoren ausschließlich unter
  ihrem allowlisteten `Tᵥ` bestehen, jedes Delta vollständig auf `T₀`
  zurückgestellt und der abschließende Cleanup bestätigt wurde.
- Jede andere Konstellation ergibt `UNPROVEN`.
- `FAIL` und `UNPROVEN` halten Browserkomposition und Browser-End-to-End-Fluss
  gleichermaßen geschlossen.

Eine beobachtete Ausnahme darf klassifiziert werden, beispielsweise als
`context-exempt`. Sie stützt höchstens die Kompatibilität des exakt gemessenen
Tupels. Sie beweist weder einen LNA-Permissionpfad noch die Eignung eines
späteren öffentlichen HTTPS-Origins.

### Pflichtgate 1: Context Binding

`PASS` verlangt sämtliche Felder von `T₀` vollständig, widerspruchsfrei und
vor dem ersten Request erfasst. Sicherheitsdeaktivierende Browserflags,
Zertifikatsbypässe, Headerinjektion, automatische Permissionfreigaben oder
deaktivierte Web-Security ergeben `FAIL`.

Fehlt eine Bindung, ist ihr Wert mehrdeutig oder lässt sich eine relevante
Policy-, Flag-, Extension-, Proxy-, VPN-, Cache- oder Permissionwirkung nicht
sanitisiert zuordnen, lautet das Gate `UNPROVEN`.

### Pflichtgate 2: Secure Context und Mixed Content

Unter `T₀` werden getrennt beobachtet:

- `window.isSecureContext`;
- die tatsächliche Behandlung des HTTP-Loopbackziels;
- Browserconsole- und Securityklassifikation;
- Blockierung, Hochstufung oder Freigabe;
- Unterstützung und etwaige Notwendigkeit von `targetAddressSpace`.

Für `PASS` muss der tatsächliche GoldenDawn-Kontext sicher sein und der
unveränderte Pfad ohne Sicherheitsbypass funktionieren. Wird
`targetAddressSpace` oder eine andere RequestInit-Änderung benötigt, ergibt das
Gate `FAIL`; eine solche Änderung benötigt einen neuen Entscheidungsslice.

### Pflichtgate 3: Exakte Loopback-Erreichbarkeit

Zulässig ist ausschließlich:

```text
http://127.0.0.1:8787/api/sync-test
```

`localhost`, IPv6, DNS, Proxy, ein anderer Port oder Pfad, HTTPS-Fallback,
Remotehost, Cloud, Redirect oder alternative URL sind unzulässig. Für den
positiven Pfad müssen initiale und finale URL exakt dem Endpoint entsprechen.
Ein erfolgreicher Request beweist weder Identität noch Vertrauenswürdigkeit des
lokalen Prozesses.

### Pflichtgate 4: Gewöhnlicher CORS-Preflight

Mit frischem Profil oder anderweitig belegbar leerem Preflightcache muss vor
dem JSON-`POST` ein gewöhnlicher `OPTIONS`-Preflight beobachtet werden. PNA-
spezifische Header werden nicht als Teil dieser gewöhnlichen CORS-Beobachtung
gewertet. Gewöhnliche CORS- und PNA-Metadaten können am selben physischen
`OPTIONS` auftreten; daraus wird kein zweiter Preflight abgeleitet.

Mindestens zu erfassen sind:

- Anzahl und Reihenfolge von `OPTIONS` und `POST`;
- exakte `Origin`;
- `Access-Control-Request-Method: POST`;
- angeforderter Header `content-type`;
- Preflightstatus;
- `Access-Control-Allow-Origin`;
- `Access-Control-Allow-Methods`;
- `Access-Control-Allow-Headers`;
- `Vary`;
- fehlende Credentialfreigabe.

Der aktuelle erwartete Gatewaypfad beantwortet einen vollständig gültigen
Preflight mit `204`. Erst danach darf genau ein `POST` beobachtet werden. Diese
Beobachtung ist keine allgemeine Exactly-once-Wiregarantie.

### Pflichtgate 5: PNA, LNA und lokale Netzwerkberechtigung

Getrennt vom gewöhnlichen CORS-Preflight werden erfasst:

- Quell- und Zieladressraumklassifikation;
- `Access-Control-Request-Private-Network`, falls vorhanden;
- Auswertung von `Access-Control-Allow-Private-Network`, falls vorhanden;
- beobachtetes LNA-Modell und verwendeter Berechtigungsname;
- Permissionzustand vor dem Lauf;
- sichtbarer Berechtigungsdialog und nötige Benutzeraktivierung;
- Ablehnung, `context-exempt`, fehlende Implementierung oder ungeklärter
  Zustand;
- Persistenz und Reset nur, soweit dafür später eine eigene Freigabe besteht.

Historische PNA-Header werden ausschließlich beobachtet und niemals als
universelle Voraussetzung verlangt. Die Klassifikation wirkt auf das Gate:

- Benötigt der unveränderte Pfad einen neuen Request- oder Responseheader, eine
  neue Browserpermission, eine Policyänderung, einen Sicherheitsbypass oder
  eine Produktanpassung, lautet das Gate `FAIL`.
- Eine Browserablehnung des unveränderten positiven Pfads lautet `FAIL`.
- Eine vollständig belegte `context-exempt`-Beobachtung kann ausschließlich
  die Kompatibilität von `T₀` stützen und niemals einen LNA-Schutzpfad
  behaupten.
- Fehlende Implementierung, unbekannte Ursache oder nicht trennbare
  Permission-, Policy- und Cachewirkung bleibt `UNPROVEN`.

Kein Prompt wird still gewährt und kein Workaround im Messslice vorgenommen.
Ein späterer öffentlicher Origin bleibt unabhängig von einer lokalen Ausnahme
`UNPROVEN`.

### Pflichtgate 6: Normaler synthetischer Transportpfad

Der positive Vektor verwendet ausschließlich:

- den echten isolierten `createBrowserSyncTransport()`-Defaultpfad;
- einen gültigen synthetischen Version-1-`syncTest`;
- exakt leeres `payload`;
- keine privaten Daten;
- keine SyncService-, UI- oder `src/main.js`-Komposition.

Erwartet werden HTTP `200`, `response.ok === true`,
`response.redirected === false`, eine finale URL exakt gleich dem Endpoint,
`response.type === "cors"` und gültige Korrelation zum verwendeten Request.
Request-ID, Requesttimestamp und Body dürfen nicht dauerhaft in die Evidenz
übernommen werden.

### Pflichtgate 7: Responseheader-Filterung

JavaScript-sichtbare Werte und serverseitig beobachtete Header werden getrennt
dokumentiert. Browserseitig erwartet sind:

- `Content-Type: application/json; charset=utf-8`;
- kanonisches `Content-Length` von höchstens `16.384`;
- `Cache-Control: no-store`;
- `Content-Encoding === null`.

Zusätzlich wird nur allowlist-basiert festgehalten, ob serverseitig vorhandene
Header im JavaScript-Headersobjekt sichtbar oder gefiltert waren. Dazu gehören
`X-Content-Type-Options`, `Vary` und `Access-Control-Allow-Origin`.
`Content-Encoding === null` beweist ausschließlich die Browseroberfläche,
nicht die Abwesenheit auf dem Wire oder fehlende Dekomprimierung.

### Pflichtgate 8: Negative Origin-Kontrolle

Dieser Vektor läuft ausschließlich unter `T_origin`. Mit unverändertem
Gatewaycode und absichtlich nicht passender Allowed-Origin muss der Browser den
eigentlichen `POST` verhindern. Erwartet werden:

- Browserblock;
- kein lesbarer Responsebody;
- null am Gateway beobachtete `POST`-Requests;
- kein Fallback;
- exakter Restore der Allowed-Origin aus `T₀`.

Ein `OPTIONS`-Request kann die Ablehnung auslösen und wird separat gezählt. Die
negative Kontrolle öffnet allein kein Gate.

### Pflichtgate 9: Redirect-Kontrolle

Dieser Vektor läuft ausschließlich unter `T_redirect` und erst nach einer
ausdrücklichen späteren Freigabe seiner Wegwerffixture. Am festen initialen
Endpoint muss er zeigen:

- die Fixture beantwortet genau einen gültigen gewöhnlichen CORS-Preflight
  mit `204` und empfängt danach genau einen `POST` am initialen Endpoint;
- der vorab gebundene leere `307`-Redirect zum exakten lokalen Sentinelpfad
  wurde nachweislich vollständig gesendet;
- `redirect: "error"` bleibt wirksam;
- der Transport scheitert geschlossen;
- der exakt gebundene lokale Sentinelpfad erhält null Requests;
- aus einer Fetch-Rejection wird keine finale URL erfunden;
- Fixture und Sentinel werden entfernt und `T₀` wiederhergestellt.

Die Fixture ist kein positiver Gatewaynachweis. In diesem
Dokumentationsslice wird sie weder angelegt noch ausgeführt.

### Pflichtgate 10: Cleanup und Redaction

Für ein Gesamt-`PASS` müssen bestätigt sein:

- Browser, Devserver, Gateway und Fixtures beendet;
- temporäres Profil und Harness entfernt;
- Permission- und Sitezustand bereinigt;
- temporäre Netzwerkaufzeichnungen entfernt;
- Umgebungsvariablen wiederhergestellt;
- verwendete Ports wieder frei;
- Repository unverändert beziehungsweise exakt im freigegebenen Zustand;
- keine Storage-, Service-Worker-, Log- oder Telemetriereste;
- jedes Negativdelta zuvor vollständig auf `T₀` zurückgestellt.

Fehlgeschlagener Cleanup ergibt `FAIL`; fehlender oder mehrdeutiger Nachweis
ergibt `UNPROVEN`.

### Geschlossener Evidence-Record

Der spätere Evidence-Record folgt dem exakt geschlossenen, allowlist-basierten
Schema in [`docs/data-contracts.md`](../data-contracts.md). Er bindet
insbesondere:

- `schemaVersion`, Messlauf-ID, `baseContextId`, Messzeit und Zeitzone;
- das sanitierte vollständige `T₀`;
- pro Vektor die Referenz auf `T₀`, Erwartungsprofil, Beobachtung und Gate;
- die geschlossene Liste tatsächlich geänderter Deltafelder;
- erwartete und beobachtete Deltawerte;
- die Bestätigung, dass keine weiteren Bindungsfelder abwichen;
- `restoreConfirmed` und vektorlokales `cleanupConfirmed`;
- Gesamtgate, abschließenden Cleanup und die festen Aussagegrenzen.

Nicht gespeichert werden:

- Benutzer- oder Rechnername;
- persönliche Profilpfade;
- vollständiger User-Agent;
- Cookies, Tokens oder Credentials;
- komplette HAR-Dateien;
- frei kopierte Rohheader;
- Request-ID oder Requesttimestamp;
- Request- oder Responsebody;
- private Netzwerkdetails;
- PromptVault-, LearningHub-, LichtwaldLog- oder Vaultinhalte.

In diesem Slice werden weder JSON-Vorlage noch ausgefüllte Evidenzdatei,
Runtimeharness oder Fixture erstellt.

### Browserziele

Jeder Browser besitzt ein eigenes gebundenes Gate. Der spätere Messauftrag
benennt seine erforderlichen Zielbrowser vor dem ersten Lauf. Ein `PASS` gilt
nicht für ein anderes Produkt, eine andere Vollversion, einen anderen Channel,
eine andere Engine, ein anderes Betriebssystem oder einen anderen Kontext.

Nicht ausgeführte Browserziele bleiben `UNPROVEN`. Ein browserübergreifendes
Gesamt-`PASS` ist erst zulässig, wenn die vorher festgelegte Zielmatrix
vollständig bestanden wurde. ADR 0029 legt selbst keine Zielbrowser fest und
behauptet keine allgemeine Browserunterstützung.

### Stop- und Neubewertungsregeln

Der spätere Lauf endet sofort geschlossen, wenn:

- ein zusätzlicher PNA-/LNA-Request- oder Responseheader erforderlich ist;
- eine neue Browser- oder Betriebssystemberechtigung erforderlich wird;
- CORS-, Preflight-, Origin- oder Responseheaderpolicy geändert werden müsste;
- Secure Context oder Mixed Content den Pfad blockiert;
- Endpoint, Scheme, Host, Port, Pfad oder Redirectpolicy geändert werden
  müsste;
- `Content-Length`, Response-Typ, finale URL oder Headerfilterung dem Vertrag
  widersprechen;
- eine Pflichtbindung fehlt;
- Beobachtungsebenen widersprüchlich oder nicht trennbar sind;
- ein nicht allowlistetes Delta auftritt;
- externe Kommunikation, private Daten, Credentials, Provider oder Cloud
  benötigt würden;
- Restore oder Cleanup nicht vollständig gelingt.

Dann gilt:

1. Ergebnis `FAIL` bei beobachteter Grenzverletzung, sonst `UNPROVEN`;
2. sofortiger Cleanup;
3. keine Reparatur, kein stilles Gewähren und kein Fallback im Messslice;
4. ein neuer ADR- und Implementierungsslice bewertet ADR 0020 und die aktuelle
   ADR-0028-Vertragskette ausdrücklich neu.

### Aussagegrenzen eines späteren `PASS`

Ein gebundenes Runtime-`PASS` beweist ausschließlich die beobachtete
Browserkompatibilität der vorab festgelegten Zielmatrix unter ihrem jeweiligen
`T₀` und den ausdrücklich allowlisteten Negativdeltas.

Es beweist nicht:

- andere Browser, Versionen, Channels, Engines oder Betriebssysteme;
- Identität oder Vertrauenswürdigkeit des lokalen Prozesses;
- Authentisierung oder Autorisierung;
- Metadatenfreiheit;
- Wire-Oktette oder Kompressionsfreiheit;
- Datenschutz oder Schutz privater Daten;
- Exactly-once-Zustellung;
- Replay- oder Idempotenzschutz;
- globale Missbrauchs- oder Ressourcenbegrenzung;
- Browserkomposition;
- Browser-End-to-End-Funktionalität.

Ein `PASS` öffnet ausschließlich den nächsten getrennten
Browserkompositions-Entscheidungsslice. Es implementiert ihn nicht.

### Strikte Grenze dieses Dokumentationsslices

In diesem Slice erfolgen ausdrücklich nicht:

- Browserstart oder Browsersteuerung;
- Vite-, Preview- oder Gatewaystart;
- realer Request oder Portzugriff;
- CORS-, PNA-, LNA- oder Permissionmessung;
- Änderung von Browserberechtigungen, Flags oder Richtlinien;
- Runtimeharness, Fixture oder Evidenztemplate;
- Produkt- oder Testcodeänderung;
- Änderung an Endpoint, RequestInit, CORS-Headern oder Gatewaykonfiguration;
- Browser-, SyncService-, UI- oder `src/main.js`-Komposition;
- Browser-End-to-End-`syncTest`;
- Zugriff auf private Daten, Vault, Credentials, Provider, Cloud oder n8n.

Die vorhandene automatisierte Testsuite darf ausschließlich als
Regressionstest ausgeführt werden. Sie ist keine reale Browserevidenz.

## Konsequenzen

Positive Auswirkungen:

- Das zuvor abstrakte Runtimegate erhält eine reproduzierbare, produkt-,
  versions-, OS- und kontextgebundene Beweisgrenze.
- Gewöhnliches CORS, historisches PNA und aktuelles LNA werden nicht
  vermischt.
- `T₀` und die zwei allowlisteten Negativdeltas erlauben positive und negative
  Vektoren ohne falsche Behauptung eines vollständig identischen Kontexts.
- Getrennte Beobachtungsebenen verhindern, dass DevTools, JavaScript oder
  Gatewaybeobachtung als Roh-Wire- oder Gegenebenenbeweis ausgegeben werden.
- Der geschlossene Evidence-Record begrenzt dauerhafte Metadaten und schließt
  private Inhalte, Requestidentitäten und rohe Netzwerkaufzeichnungen aus.
- Ein `PASS` kann ausschließlich den nächsten Entscheidungsslice öffnen.

Kosten und verbleibende Grenzen:

- Jeder Browser, jede Vollversion, jeder Channel, jedes Betriebssystem und jede
  Kontextänderung benötigt ein neues gebundenes Gate.
- Frische Profile, kontrollierte Negativvektoren, Restore und vollständiger
  Cleanup erhöhen den Messaufwand.
- Ein kompatibler lokaler Kontext sagt nichts über einen späteren öffentlichen
  HTTPS-Origin aus.
- Die Messung beweist weder Prozessidentität, Authentisierung, Datenschutz,
  Wire-Oktette noch Betriebsgrenzen.
- Bis zum realen autorisierten Lauf bleibt der Status `UNPROVEN` und die
  Browserkomposition geschlossen.

## Erwogene Alternativen

### Herstellerdokumentation oder Spezifikation als Runtime-`PASS` behandeln

Verworfen. Quellen beschreiben Produkte, Versionen oder Sollverhalten, nicht
die tatsächlich gemessene GoldenDawn-Runtime mit ihrem Profil, ihren Policies
und ihrem Kontext.

### PNA-spezifischen Preflight universell verlangen

Verworfen. Die PNA-Durchsetzung wurde pausiert und das aktuelle LNA-Modell ist
permissionbasiert. Gewöhnlicher CORS-Preflight und historische PNA-Header sind
getrennt zu beobachten.

### `http://127.0.0.1` pauschal als Mixed Content ablehnen

Verworfen. Loopback ist nach Secure Contexts potenziell vertrauenswürdig. Die
tatsächliche Behandlung bleibt dennoch kontext- und browsergebunden zu messen.

### Alle Vektoren als vollständig identisches Tupel modellieren

Verworfen. Origin-Negativkontrolle und Redirectfixture benötigen jeweils genau
eine kontrollierte Abweichung. Das bestätigte `T₀`-/`Tᵥ`-Modell macht diese
Deltas vollständig sichtbar, geschlossen und wiederherstellbar.

### Negativvektoren ohne Restore im selben Profil fortsetzen

Verworfen. Ein verbleibender Origin-, Permission-, Cache- oder Fixturezustand
würde spätere Beobachtungen unauflösbar kontaminieren.

### Komplettes HAR, Rohheader oder Bodies dauerhaft speichern

Verworfen. Diese Artefakte vergrößern die Metadaten- und Datenschutzfläche und
sind für den geschlossenen Gatevertrag nicht erforderlich.

### Runtimegate, Browserkomposition und Browser-E2E gemeinsam ausführen

Verworfen. Die drei Slices besitzen unterschiedliche Vertrauens-, Fehler-,
Review- und Aussagegrenzen. Ein Runtime-`PASS` soll nur eine spätere
Kompositionsentscheidung ermöglichen.

## Bedingungen für eine Neubewertung

ADR 0029 muss durch einen neuen ADR neu bewertet werden, wenn:

- Endpoint, Scheme, Host, Port, Pfad oder Redirectpolicy geändert werden;
- RequestInit, Header, CORS-, Preflight-, PNA-/LNA- oder Permissionpolicy
  angepasst werden soll;
- ein weiterer Negativvektor oder ein weiteres Deltafeld zugelassen werden
  soll;
- die `T₀`-Bindung, Statusaggregation oder Cleanupsemantik geändert wird;
- der Evidence-Record neue Felder, frei kopierte Rohwerte oder private Daten
  erhalten soll;
- ein anderer Browserkontext, beispielsweise Iframe oder Worker, zum
  Produktpfad werden soll;
- Browserkomposition oder Browser-End-to-End-Fluss begonnen wird;
- Authentisierung, Autorisierung, Prozessidentität, Replay, Idempotenz,
  globale Ressourcenlimits oder private Payloads eingeführt werden;
- ein Provider-, Cloud-, Credential-, Storage-, Logging- oder Telemetriepfad
  benötigt wird.

Der spätere Runtime-Evidence-Slice benötigt zusätzlich eine ausdrückliche
Freigabe seiner Zielbrowser, seines Harness, seiner Fixtures, der einzelnen
realen Requests, der Benutzerinteraktion und des Cleanupplans. Bis dahin
bleibt jedes Browserziel und das Gesamtgate `UNPROVEN`.
