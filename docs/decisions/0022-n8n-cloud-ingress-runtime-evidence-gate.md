# ADR 0022: n8n Cloud Ingress & Runtime Evidence Gate

## Status

Angenommen – 2026-08-19

## Kontext

### Bereits lokal belegte Eigenschaften

GoldenDawn OS besitzt bereits mehrere lokal belegte, voneinander getrennte
Sicherheitsgrenzen:

- [ADR 0018](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
  begrenzt und validiert einen bereits als JavaScript-String materialisierten
  Sync-Raw-Body. Diese Grenze beginnt ausdrücklich erst nach Transport,
  Byteempfang und Decodierung.
- [ADR 0020](0020-local-sync-gateway-raw-wire-http-foundation.md) belegt für
  den ausschließlich explizit gestarteten Loopback-Prozess auf GD-WS01 die
  Raw-Wire-, Header-, Framing-, Bytezählungs- und strikte UTF-8-Grenze. Der
  lokale Prozess hält höchstens 65.536 Anwendungsbytes und ruft die bestehende
  Boundary nur nach genau einer erfolgreichen fatalen UTF-8-Decodierung auf.
- [ADR 0021](0021-generated-n8n-boundary-bundle-foundation.md) belegt lokal
  die reproduzierbare Erzeugung, Integrität und semantische Parität des
  importfreien n8n-Boundary-Bundles mit den kanonischen Contract- und
  Boundary-Quellen.

### Ausschließlich n8n Cloud betreffende Lücke

Diese Nachweise gelten für Repository, lokale Node-Laufzeit und Loopback-
Gateway. Sie beweisen keine Eigenschaft eines konkreten n8n-Cloud-Tenants.
Insbesondere ist noch nicht belegt, welche Bytes das n8n-Cloud-Ingress
akzeptiert, verändert, dekomprimiert oder verwirft und welche Daten die
Webhook- beziehungsweise Code-Node-Laufzeit tatsächlich beobachten kann.

Die offizielle
[Webhook-Node-Dokumentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
beschreibt die Option `Raw Body` als Übergabe in einem Rohformat. Sie
garantiert jedoch weder die Identität mit den ursprünglichen Wire-Oktetten
noch eine Beobachtung vor Content-Decoding, Textdecodierung, Normalisierung,
Provider-Allokation oder Edge-Buffering. Der Name der Option ist deshalb kein
ausreichender Aktivierungsnachweis.

Als reproduzierbarer öffentlicher OSS-Bezugspunkt dient das am
`2026-08-19` aktuelle Stable-Release
[`n8n@2.35.4`](https://github.com/n8n-io/n8n/releases/tag/n8n%402.35.4)
am Commit `d2ce3c084c228622c2ffe7c245d25870430e18a9`. In dessen
[Body-Reader](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/middlewares/body-parser.ts)
wird bei `Content-Encoding: gzip` ein Gunzip-Stream und bei
`Content-Encoding: deflate` ein Inflate-Stream vor der Materialisierung von
`req.rawBody` eingesetzt. Der `br`-Wert fällt in dieser Funktion dagegen in
den unveränderten Defaultpfad. Das ist eine commitgebundene Beobachtung des
öffentlichen OSS-Codes. Sie ist weder eine dokumentierte n8n-Cloud-Garantie
noch ein Nachweis dafür, welcher Build in einem bestimmten Cloud-Tenant läuft.

Der gleiche Stable-Stand zeigt weitere relevante Grenzen. Der
[Webhook-Requestpfad](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/webhooks/webhook-helpers.ts)
ruft für textuell erkannte Inhaltstypen die Body-Aufbereitung vor der
Webhook-Ausführung und damit vor der Node-seitigen Header Authentication auf.
`application/octet-stream` mit aktivem Raw Body vermeidet in diesem Code den
textuellen Vorparser; dies belegt jedoch weder das vorgelagerte Cloud-Ingress
noch dessen Allokationsreihenfolge. Die
[Header-Authentication](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/nodes-base/nodes/Webhook/utils.ts)
vergleicht den konfigurierten Headerwert, entfernt ihn anschließend aber nicht
aus `req.headers`. Der
[Standard-Webhook-Output](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/nodes-base/nodes/Webhook/Webhook.node.ts)
gibt `req.headers` weiter. Der erfolgreiche Header-Auth-Wert gelangt in diesem
öffentlichen Standardpfad deshalb in Runtime-Execution-Daten. Die offizielle
[Execution-Data-Redaction-Dokumentation](https://docs.n8n.io/deploy/host-n8n/configure-n8n/security/redact-execution-data/)
beschreibt Redaction als Enterprise-Funktion beim Lesen und stellt klar, dass
sie gespeicherte Daten nicht verändert; sie ist kein Beleg dafür, dass ein
Secret nie in Runtime- oder Datenbankdaten gelangt ist.

Als zusätzlicher commitgebundener Inspektionsanker für den getrennten
Test-Webhook-Lifecycle dient
[`test-webhooks.ts`](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/webhooks/test-webhooks.ts).
Die für diesen Slice daraus gebundene OSS-Beobachtung ist ausschließlich, eine
manuell lauschende temporäre Test-Webhook-Registrierung nach erfolgreicher
Ausführung nicht als wiederverwendbaren Batch-Endpunkt zu behandeln. Der
Verweis belegt nur den Inhalt dieses öffentlichen Quellstands. Aus ihm werden
weder nicht dokumentierte Symbol- oder Zeilengarantien noch eine
n8n-Cloud-Tenantzusage abgeleitet.

Ein Workflow-Probe beginnt erst dort, wo n8n dem Workflow Daten und Header
bereitstellt. Er kann daher weder vorherige Speicherallokationen noch
Provider-Edge-Buffering, verworfene vorgelagerte Bytes oder Inhalt und
Redaction von Providerlogs beweisen. Solche Eigenschaften benötigen eine
veröffentlichte Plattformgarantie oder eine tenant-, plan-, regions- und
versionsgebundene Providerantwort. Aus fehlender Beobachtbarkeit darf kein
positiver Schluss gezogen werden.

Der aktuelle Slice erstellt deshalb nur eine lokal verifizierbare,
standardmäßig netzwerkinaktive Evidence-Foundation. Er führt keinen
n8n-Cloud-Aufruf aus und verändert keinen Cloud-Tenant. Der konkrete
Tenant-Messstatus ist folglich `UNPROVEN`. Für den festgehaltenen öffentlichen
Stable-Quellstand sind das Compression-Gate für `gzip`/`deflate` und das
Secret-nicht-im-Webhook-Output-Gate dagegen bereits `FAIL`. Nach der unten
festgelegten Präzedenz ist das aktuelle Aktivierungsgate somit `FAIL`; es wäre
auch allein wegen des tenantgebundenen `UNPROVEN` geschlossen.

## Entscheidung

### Zweck und unveränderte Produktgrenze

Vor jeder späteren n8n-Cloud-Komposition wird ein separates
`n8n Cloud Ingress & Runtime Evidence Gate` eingeführt. Das Gate entscheidet
nicht über fachlichen Erfolg, sondern ausschließlich darüber, ob die für eine
spätere sichere Cloudkomposition benötigten Ingress-, Authentisierungs-,
Byteerhaltungs- und Laufzeiteigenschaften ausreichend belegt sind.

Die Evidence-Foundation ist kein produktiver Datenpfad. Ihre spätere,
gesondert freizugebende Messtopologie ist ein manueller One-shot-Pfad:

```text
Operator registriert den temporären Test-Webhook manuell neu und versetzt ihn in Listening
  -> explizites lokales One-shot-Probe-CLI mit genau einer allowlist-validierten probeId
  -> höchstens ein HTTPS-Requestversuch an die temporäre n8n-Test-URL unter /webhook-test/
  -> temporärer Webhook mit Header Authentication und Raw Body
  -> menschenprüfbarer Code-Node-Observer
  -> kleine allowlist-basierte Beobachtungsresponse
  -> lokaler Runner stoppt ohne zweiten Versuch
```

Der Probe-Pfad ist vom späteren Produktpfad
`Browser -> SyncService -> lokaler SyncTransport -> lokales SyncGateway ->
n8n Cloud -> SyncAgent` getrennt. Er bindet weder das generierte
Boundary-Bundle noch SyncContract, SyncGateway Request Boundary oder
SyncAgent ein und verwendet ausschließlich feste synthetische Bytes. Ein
bestandener Probe aktiviert noch keinen produktiven GoldenDawn-Workflow.
Das Tool registriert oder aktiviert keinen Webhook automatisch. GoldenDawn
behandelt die manuelle Test-Webhook-Registrierung in diesem Slice operatorisch
als nur für diesen One-shot-Versuch bestimmt und verlangt vor jedem weiteren
Vektor eine erneute menschlich bestätigte Listening-Registrierung. Dies ist
keine technische Zusicherung atomarer Exactly-once-Zustellung, Observer- oder
Workflowausführung. Es gibt weder einen Katalog-Sweep noch einen
Production-URL-Runner oder -Messpfad.

Das lokale SyncGateway bleibt bis zu einer eigenen späteren Aktivierungs-
und Transportentscheidung unverändert. Jeder dort akzeptierte SyncRequest
endet weiterhin mit dem statischen lokalen HTTP-Status `503`; es wird kein
Cloud-Upstream behauptet oder ausgeführt.

### Vier strikt getrennte Evidenzklassen

Jede Aussage wird genau der Evidenzklasse zugeordnet, aus der sie tatsächlich
stammt:

1. **Dokumentierte Plattformgarantie** – eine konkrete, datierte Aussage in
   offizieller n8n-Dokumentation. Sie gilt nur im dort beschriebenen Umfang
   und wird nicht um ungenannte Wire-, Provider- oder Laufzeiteigenschaften
   erweitert.
2. **Beobachtung im öffentlichen OSS-Code** – Verhalten eines exakt
   commitgebundenen offiziellen n8n-Quellstands. Es beschreibt diesen
   Quellstand, aber weder automatisch den Clouddeploy noch einen konkreten
   Tenant.
3. **Messung im konkreten Cloud-Tenant** – Ergebnis eines freigegebenen
   synthetischen Probes mit vollständiger Tenant-, Build-, Node-, Workflow-
   und Execution-Settings-Bindung. Es gilt ausschließlich für diese Bindung
   und den beobachteten Zeitpunkt.
4. **Nicht workflowseitig beobachtbare Provider-/Ingress-Eigenschaft** – zum
   Beispiel vorangegangene Allokation, Edge-Buffering oder Providerlogs. Ein
   Workflow kann diese Klasse nicht positiv attestieren; erforderlich ist
   eine passende offizielle Garantie oder eine gebundene Providerantwort.

Eine Evidenzklasse darf keine andere ersetzen. Insbesondere werden weder
Dokumentation noch OSS-Code als Tenantmessung ausgegeben, und eine
Tenantmessung wird nicht zur Aussage über unsichtbare Providerzustände
hochgestuft. Mutable Branch-Links wie `master` oder `main` sind für
quellcodegebundene Entscheidungen unzureichend; maßgeblich ist der oben
festgehaltene Commit.

### Exakte Vektor- und Test-URL-Tenantzustände

Jedes verpflichtende Einzelgate und der daraus gebildete
`testUrlTenantMeasurementStatus` besitzen exakt einen der drei Werte:

- `PASS`: Die erforderliche Eigenschaft ist für die vollständige aktuelle
  Bindung durch die dafür zulässige Evidenzklasse positiv und widerspruchsfrei
  belegt.
- `FAIL`: Eine vollständige Beobachtung oder maßgebliche Garantie widerspricht
  der Sicherheitsanforderung. Dazu zählen insbesondere automatische
  Dekomprimierung, Byteveränderung, vorherige UTF-8-Ersetzung oder
  Normalisierung, uneindeutig akzeptierte Authentisierungsheader und andere
  fail-open Semantik.
- `UNPROVEN`: Die Eigenschaft ist nicht vollständig belegbar. Timeout,
  abgebrochener Lauf, unbekannte oder außerhalb des geschlossenen Vertrags
  liegende Runtimeantwort, unvollständige Vektorabdeckung, fehlende
  Beobachtung, fehlende notwendige Providergarantie und unvollständige oder
  nicht mehr aktuelle Bindung ergeben `UNPROVEN`.

Die Aggregation ist vollständig deterministisch:

```text
wenn mindestens ein verpflichtendes Einzelgate FAIL ist:
    testUrlTenantMeasurementStatus = FAIL
sonst, wenn jedes verpflichtende Einzelgate PASS ist und die vollständige
Tenant-/Build-/Node-/Workflowbindung vorliegt:
    testUrlTenantMeasurementStatus = PASS
sonst:
    testUrlTenantMeasurementStatus = UNPROVEN
```

Ein `FAIL` darf nicht durch andere bestandene Vektoren kompensiert werden.
Ein `UNPROVEN` darf weder als Teil-PASS noch als optimistische Annahme
normalisiert werden. Für jede Produktaktivierung werden `UNPROVEN` und `FAIL`
gleich behandelt: Das Cloudgate bleibt geschlossen. Ein sauber dokumentiertes
negatives oder unbewiesenes Ergebnis ist ein erfolgreicher Abschluss des
Evidence-Slices, erzwingt aber eine Neubewertung von ADR 0019, bevor die
Cloudarchitektur fortgeführt wird. ADR 0022 ergänzt und blockiert damit die
Cloudfortsetzung aus ADR 0019; es ersetzt ADR 0019 ausdrücklich nicht.

Da in diesem Slice keine freigegebene Cloudmessung stattfindet, lautet der
aktuelle tenantgebundene Messstatus verbindlich:

```text
UNPROVEN
```

Für den oben gepinnten öffentlichen Stable-Quellstand lauten die bereits
widersprochenen Teilgates dagegen:

```text
gzip-/deflate-Wire-Byte-Erhalt: FAIL
Header-Auth-Secret nicht im Standard-Webhook-Output: FAIL
resultierendes aktuelles Aktivierungsgate: FAIL
```

Lokale Tests können die Probe-Foundation selbst vollständig bestehen lassen,
aber weder diese Quellcodewidersprüche aufheben noch den tenantgebundenen
Status auf `PASS` setzen. Eine spätere vollständige Test-URL-Tenantmessung darf
eine tatsächlich abweichende Cloudimplementierung belegen, aber den gepinnten
OSS-Befund nicht nachträglich als Plattformgarantie umdeuten. Auch ein
Test-URL-Tenantmessstatus `PASS` ist ausschließlich Evidenz für eine neue
ADR-0019-Neubewertung und niemals eine Aktivierungsentscheidung.

### Tenant-, Versions- und Workflowbindung

Jeder spätere Messlauf und jede daraus abgeleitete Evidenz wird mindestens an
folgende Merkmale gebunden:

- einen nicht aus Domain, URL, Benutzername oder Credential ableitbaren
  Tenant-Alias;
- Datum, Uhrzeit und Zeitzone der Messung;
- Plan und Region, soweit diese Angaben bekannt und veröffentlichbar sind;
- die beobachtete n8n-Version beziehungsweise konkrete Buildkennung;
- die Webhook-Node-`typeVersion`;
- SHA-256 der vorab geprüften, secretfreien Probe-Workflowdefinition;
- die für Speicherung, Anzeige und Verfügbarkeit von Ausführungsdaten
  relevanten allowlist-basierten Execution-Data-Einstellungen.

Der Workflow-Hash wird ausschließlich lokal über eine geprüfte Definition
gebildet, die keine URL, Tenantdomain, Credential-ID, Secret-, Authorization-
oder sonstige Credentialwerte enthält. Nicht bekannte oder nicht
veröffentlichbare Plan- oder Regionsangaben werden nicht erraten. Eine
fehlende notwendige Build-, Node-, Workflow- oder Settings-Bindung macht die
betroffenen Gates `UNPROVEN`.

Die Evidenz gilt nur für genau diese Bindung. Vor einer späteren Aktivierung
und nach jeder relevanten Änderung an Tenant, Plan, Region, n8n-Build,
Ingress, Webhook-Node-`typeVersion`, Probe-Workflow, Execution-Data-
Einstellungen, Header-Authentication, Binary-Buffer-API, Code-Node-Runtime,
`TextDecoder`-Semantik oder maßgeblichen Providerzusagen muss das vollständige
Gate erneut ausgeführt und bewertet werden. Alte Ergebnisse werden nicht auf
eine neue Bindung übertragen.

Diese Revalidierungspflicht gilt auch dann, wenn ein früherer gebundener Lauf
vollständig `PASS` war.

### Lokales, importseitig inaktives Probe-Tooling

Die lokale Foundation besteht aus den getrennten, menschenprüfbaren Dateien:

```text
scripts/n8n/n8nCloudIngressProbe.js
scripts/n8n/n8nCloudIngressProbeObserver.js
tests/n8nCloudIngressProbe.test.js
docs/evidence/n8n-cloud-ingress-runtime-evidence.template.json
```

Der kanonische und vorgesehene Operator-Laufweg ist das Paket-Script
`npm run probe:n8n:cloud:test -- --vector <probeId>`. Das Paket-Script bindet
intern exakt `node scripts/n8n/n8nCloudIngressProbe.js --run`; die nach
`--` weitergereichte Option wählt genau einen allowlist-validierten Vektor.
Import, bloße Factory-Erzeugung, normale Tests, Produktions-Build, Dev-Server
und `bundle:n8n:check` binden keinen Real-HTTPS-Transport. Ein direkter CLI-
Start darf erst mit `--run`, exakt einer gültigen `--vector`-Option und
vollständig gültiger Runtimekonfiguration einen Probe starten.

Endpoint und Wegwerfsecret werden ausschließlich zur Laufzeit aus den zwei
eindeutig benannten Umgebungsvariablen gelesen:

```text
GOLDENDAWN_N8N_CLOUD_PROBE_ENDPOINT
GOLDENDAWN_N8N_CLOUD_PROBE_SECRET
```

Das Secret ist kein Kommandozeilenargument und weder Endpoint noch Secret
werden persistiert. Das Tool akzeptiert ausschließlich `https:` ohne URL-
Userinfo, Query oder Fragment und ausschließlich kanonische Test-URL-Pfade der
Form `/webhook-test/<segment>[/<segment>…]`. Jedes nicht leere Suffixsegment
besteht nur aus ASCII-Buchstaben, Ziffern, Bindestrich oder Unterstrich.
Prozentkodierungen, rohe oder kodierte Backslashes, Steuerzeichen, leere
Segmente sowie `.` und `..` werden vor der Transportauflösung abgelehnt.
Production-URLs und andere Pfade werden ebenfalls vor Transportzugriff
abgelehnt. Factory und Katalog besitzen keinen impliziten Real-HTTPS-Zugriff:
Die Factory arbeitet ausschließlich mit einem explizit injizierten Transport.
Nur der CLI-Adapter darf nach vollständiger Argument-, Runtimekonfigurations-
und Vektor-ID-Validierung den Real-HTTPS-Transport binden.

Ein erfolgreicher Aufruf sendet genau den ausgewählten Vektor in genau einem
HTTPS-Request und stoppt danach. Das Tool folgt keinen Redirects, wiederholt
keinen Request automatisch, registriert keinen Test-Webhook und unternimmt
keinen zweiten Versuch. Vor jedem weiteren erfolgreichen Vektor muss der
Operator die Test-URL in n8n manuell neu registrieren beziehungsweise erneut
in Listening versetzen und einen neuen expliziten CLI-Aufruf starten. Deadline,
kontrollierter Abort und begrenzte Responsegröße bleiben verbindlich.
Redirect, Timeout, Abort, Übergröße, unerwarteter Status, Parsefehler und
unbekannte Responseform enden fail-closed mit statisch redigierten Fehlern und,
soweit dadurch eine Eigenschaft nicht vollständig beobachtet wurde,
`UNPROVEN`.

Weder Consoleausgabe noch Fehler, Workflowexport oder Evidenz dürfen Endpoint,
Tenantdomain, URL-Pfad, Secret, Credential-ID, Authorization-Wert oder -Header,
Raw Body, binäre Bytes oder Base64-Repräsentationen enthalten. Antworten der
Cloudlaufzeit bleiben unvertrauenswürdige Eingabe und werden vor jeder
Bewertung auf den geschlossenen Beobachtungsvertrag projiziert. Das lokale
Tool berechnet Bytezahlen und SHA-256 über die unveränderten festen
synthetischen Ausgangsbytes und sendet exakt diese Bytes ohne Normalisierung,
Stringkonvertierung oder Reparatur.

### Menschenprüfbarer Code-Node-Observer

Der temporäre Code-Node-Observer bezieht Binärdaten ausschließlich über die
offiziell dokumentierte n8n-Hilfsfunktion
[`this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName)`](https://docs.n8n.io/build/code-in-n8n/cookbook/code-node/get-the-binary-data-buffer/).
Direkter Zugriff auf eine interne `binary.data`-Repräsentation ist keine
zulässige Ersatz-API.

Der Observer:

- ruft weder SyncContract noch Boundary oder Bundle auf und parst kein
  fachliches SyncRequest;
- gibt keinen Requestinhalt und keine Byte-, Text-, Hex- oder
  Base64-Repräsentation zurück;
- vergleicht Bytezahl und jedes Byte mit der vorab festgelegten synthetischen
  Erwartung;
- prüft die Verfügbarkeit und Semantik von
  `TextDecoder('utf-8', { fatal: true, ignoreBOM: true })`;
- verlangt bei gültigem UTF-8 den exakten erwarteten String, beim BOM-Vektor
  den Erhalt von U+FEFF und bei ungültigem UTF-8 einen Throw;
- normalisiert weder NFC/NFD noch Zeilenenden oder Whitespace;
- gibt höchstens die sechs eigenen Felder `probeId`, `exactMatch`,
  `receivedByteLength`, `strictUtf8Outcome`,
  `authorizationHeaderPresence` und `contentEncodingOutcome` aus.

`authorizationHeaderPresence` besitzt ausschließlich `absent`, `present` oder
`unavailable`. `contentEncodingOutcome` besitzt ausschließlich `match`,
`mismatch` oder `unavailable`. Der Observer erfindet weder Aufruf- noch
Workflow-Ausführungszahlen; diese Werte müssen aus getrennt gebundener
Tenant-/Execution-Evidenz stammen.

Für jede übernommene erfolgreiche und eindeutig zugeordnete `2xx`-
Observerresponse kann nur `authorizationHeaderPresence: absent` dieses
Teilgate bestehen lassen. `present` ist ein bekannter Widerspruch und ergibt
`FAIL`; `null` beziehungsweise `unavailable` ergeben mindestens `UNPROVEN`.
Ein bereits bekannter anderer Widerspruch behält `FAIL`-Vorrang.

Es gibt keinen schwächeren Ersatzhash. Falls eine kryptografische Hashfunktion
in der Code-Node-Runtime nicht sicher verfügbar ist, verwendet der Observer
nur den exakten Bytevergleich. Der für die Evidenz bestimmte SHA-256 wird
lokal über die kanonischen synthetischen Vektorbytes berechnet.

Eine unbekannte Helper-, `TextDecoder`- oder Response-Semantik ist kein
positiver Nachweis und führt für das betroffene Gate zu `UNPROVEN`. Eine
beobachtete Ersetzung, Normalisierung oder andere Byteabweichung führt zu
`FAIL`.

### Verpflichtende 32 synthetische Vektoren

Die Vektorregistry besitzt exakt 32 feste IDs, exakt festgelegte Bytes,
erwartete Bytezahlen und lokal berechnete SHA-256-Werte. Sie deckt alle
folgenden Kategorien ab.

**Inhalt und unveränderte Textbytes:**

- gültiges synthetisches `syncTest`-JSON;
- syntaktisch ungültiges JSON, ohne es im Observer zu parsen;
- ASCII;
- Mehrbyte-UTF-8;
- ein gültiges Vierbytezeichen;
- UTF-8-BOM, die bei `ignoreBOM: true` als U+FEFF erhalten bleiben muss;
- getrennte, byteverschiedene NFC- und NFD-Vektoren;
- CRLF und abschließender Whitespace;
- eingebettetes NUL.

**Strikte ungültige UTF-8-Folgen:**

- `C3 28`;
- die unvollständige Folge `E2 82`;
- eine überlange UTF-8-Folge;
- ein isoliertes Fortsetzungsbyte.

Jeder dieser ungültigen Vektoren muss beim fatalen Decoder einen Throw
auslösen. Vorherige Ersetzung durch U+FFFD, stilles Abschneiden oder andere
Reparatur ist `FAIL`.

**Bytegrenzen:**

- exakt 65.535 Bytes;
- exakt 65.536 Bytes;
- exakt 65.537 Bytes;
- mindestens ein Grenzfall, dessen Bytezahl durch Mehrbytezeichen und nicht
  durch die JavaScript-Stringlänge bestimmt wird.

Die erwarteten Bytezahlen stammen aus der lokalen Bytefixture und nicht aus
einer Zeichenanzahl. Eine Providerablehnung darf nur dort als bestandene
fail-closed Eigenschaft zählen, wo das konkrete Einzelgate ausdrücklich die
Ablehnung misst; sie ersetzt keinen erforderlichen Byteerhaltungsnachweis.

**Content-Encoding und Kompression:**

- kein `Content-Encoding`;
- `Content-Encoding: identity`;
- `Content-Encoding: gzip`;
- `Content-Encoding: deflate`;
- `Content-Encoding: br`;
- ein kleiner komprimierter Body, dessen dekomprimierte Form mehr als 65.536
  Bytes, mindestens 65.537 Bytes, besitzt.

Das Compression-Gate darf nur `PASS` sein, wenn der codierte Request entweder
eindeutig vor Observerausführung fail-closed verworfen wird oder der Observer
nachweislich die exakten codierten Bytes ohne automatische Dekomprimierung
beobachtet und die spätere Policy sie vor fachlicher Verarbeitung ablehnen
kann. Automatische Dekomprimierung, Größenprüfung erst nach unkontrollierter
Expansion oder jede andere Byteveränderung ist `FAIL`. Eine nicht
unterscheidbare Ablehnung, fehlende Observerinformation oder unbekannte
Headersemantik ist `UNPROVEN`. Aus der OSS-Beobachtung für `gzip` und
`deflate` wird kein Ergebnis für `br` abgeleitet.

**Header Authentication:**

- fehlendes Credential;
- falsches Credential;
- korrektes Credential;
- doppelt gleiches Authorization-Feld;
- doppelt widersprüchliches Authorization-Feld mit korrektem Wert zuerst und
  falschem Wert zuletzt als
  `auth-duplicate-conflicting-correct-first-wrong-last`;
- doppelt widersprüchliches Authorization-Feld mit falschem Wert zuerst und
  korrektem Wert zuletzt als
  `auth-duplicate-conflicting-wrong-first-correct-last`.

Der bisherige einzelne Vektor `auth-duplicate-conflicting` entfällt. Fehlende,
falsche sowie alle drei doppelten Authorization-Varianten müssen fail-closed
vor dem Observer enden. Eine `2xx`-Akzeptanz ist jeweils `FAIL`. Ein HTTP-
Status `400`, `401` oder `403` allein ist dagegen nur `UNPROVEN`: `PASS`
verlangt zusätzlich gebundene Werte `observerCallCount: 0`,
`workflowExecutionCount: 0` und `uniqueVectorAttribution: true`.

Nur das einzelne korrekte Credential darf den Observer und die
Workflowausführung jeweils exakt einmal erreichen. Sein `PASS` verlangt
`observerCallCount: 1`, `workflowExecutionCount: 1`, eindeutige
Vektorzuordnung und `authorizationHeaderPresence: absent`. Ein im Observer
vorhandener Authorization-Header ist `FAIL`; `unavailable` ist `UNPROVEN`.
Zusammenführung, First-/Last-Value-Wins oder sonstige uneindeutige Akzeptanz
eines doppelten Authorization-Felds ist `FAIL`; kann die Semantik nicht
eindeutig gemessen werden, bleibt das Gate `UNPROVEN`.
Der erfolgreiche Secret-Besitznachweis bleibt Header Authentication und ist
weder starke Geräte-, Prozess- oder Benutzeridentität noch Bodysignatur,
Replay- oder Idempotenzschutz. Zusätzlich muss belegt sein, dass der
erfolgreich verwendete Wegwerfwert weder im Webhook-Output noch in
persistierten oder abrufbaren Execution-Daten verbleibt. Abschalten der
Execution-Speicherung reduziert Persistenz, beweist aber nicht, dass der Wert
den Runtime-Output nie durchlaufen hat. Read-time-Redaction ist dafür ebenfalls
kein Beweis. Der gepinnte öffentliche Standard-Webhook widerspricht dieser
Anforderung; sein zugehöriges Teilgate ist `FAIL`.

**HTTP-Framing:**

- Übertragung mit `Content-Length`;
- Übertragung desselben synthetischen Inhalts mit chunked Framing.

Beide Pfade müssen die für ihr Einzelgate festgelegte eindeutige
Bytebeobachtung beziehungsweise fail-closed Ablehnung liefern. Unterschiedliche
Bodybytes, implizite Textkonvertierung oder uneindeutige Framingsemantik sind
`FAIL`; eine unvollständige Beobachtung ist `UNPROVEN`.

Die Fixture-Beziehungen sind ebenfalls Vertragsbestandteil: Alle
Authentisierungsvektoren verwenden exakt denselben Body; die Varianten ohne
`Content-Encoding` und mit `identity` verwenden exakt denselben Body;
`Content-Length` und Chunked verwenden exakt denselben Body; die drei
Größenfixtures sind A-Präfix-kompatibel; und die
`gzip`-/`deflate`-/`br`-Payloads decodieren zu demselben synthetischen Sentinel.
Der Expansionsvektor bleibt die getrennte 65.537-Byte-Grenzprobe. Für Encoding besitzt die
Observerklassifikation ausschließlich `match`, `mismatch` oder `unavailable`.
Ein exakter Bodyvergleich allein genügt nicht für `PASS`. Dekomprimierung,
Header-/Byte-Widerspruch oder `mismatch` sind `FAIL`; ein HTTP-Status `400`
oder `415` allein bleibt `UNPROVEN`. Eine fail-closed Encoding-Ablehnung ist
nur mit gebundenem `observerCallCount: 0`, `workflowExecutionCount: 0` und
`uniqueVectorAttribution: true` `PASS`.

Es werden keine Request-Smuggling-, Slowloris-, Last-, Parallelitäts- oder
Erschöpfungstests gegen n8n Cloud ausgeführt. Die Vektoren enthalten keine
privaten oder realen Daten und greifen nicht auf PromptVault, LearningHub oder
LichtwaldLog zu.

### Geschlossener Beobachtungs- und Evidenzvertrag

Die Observerresponse ist eine gewöhnliche geschlossene Datenstruktur mit
höchstens den sechs bereits genannten Feldern. Unbekannte Felder,
Accessor-Properties, falsche Typen, ungültige Vektor-IDs, nicht endliche oder
außerhalb der erwarteten Grenzen liegende Bytezahlen und unbekannte
`strictUtf8Outcome`-, `authorizationHeaderPresence`- oder
`contentEncodingOutcome`-Werte werden nicht übernommen. Eine solche Antwort
ist keine partielle Bestätigung, sondern macht die betroffene Beobachtung
`UNPROVEN`.

Die sanitierte Vorlage
`docs/evidence/n8n-cloud-ingress-runtime-evidence.template.json` ist ebenfalls
geschlossen. Bei `schemaVersion: 1` besitzt sie exakt diese Top-Level-Felder in
dieser Bedeutung:

- `schemaVersion`;
- `endpointKind`;
- `tenantAlias` als nicht ableitbaren Tenant-Alias;
- `observedAt` und `timezone`;
- `plan` und `region`, sofern veröffentlichbar;
- `n8nBuild`;
- `webhookNodeTypeVersion`;
- `secretFreeWorkflowSha256`;
- `executionDataSettings`;
- `vectors` als geordnete Vektorergebnisse;
- `testUrlTenantMeasurementStatus`;
- `stableOssCompatibility`;
- `providerExecutionEvidenceStatus`;
- `productionUrlMeasurementStatus`;
- `activationDecision`;
- `redactedProviderReference` als optionalen redigierten Verweis;
- `cleanupConfirmed`.

`schemaVersion` ist für diese Foundation exakt `1`; `endpointKind` ist exakt
`test`. `stableOssCompatibility` ist wegen des gepinnten Quellbefunds exakt
`FAIL`, `productionUrlMeasurementStatus` exakt `UNPROVEN` und
`activationDecision` exakt `FAIL`. Diese drei Werte sind in Schema 1
unveränderlich. Insbesondere wird `activationDecision: PASS` stets abgelehnt.
Eine Änderung eines dieser festen Werte benötigt einen neuen ADR und eine neue
Evidenz-Schemaversion; sie darf nicht durch eine Tenantmessung oder eine
Templateänderung erfolgen.

Die eingecheckte Vorlage enthält keine behauptete Cloudmessung: Ihre
Beobachtungsfelder sind leer, alle 32 Vektorgates,
`testUrlTenantMeasurementStatus` und `providerExecutionEvidenceStatus` stehen
auf `UNPROVEN`, und `cleanupConfirmed` ist `false`. Ein Feld `overallGate`
existiert nicht.

`executionDataSettings` besitzt exakt die eigenen Felder
`saveDataErrorExecution`, `saveDataSuccessExecution`,
`saveManualExecutions`, `executionDataPruning` und `readTimeRedaction`.
Beliebige weitere Execution-Settings oder dynamische Schlüssel sind in der
sanitisierten Evidenz nicht erlaubt. Nullwerte bleiben `UNPROVEN`. Für einen
vollständigen `providerExecutionEvidenceStatus: PASS` müssen die beiden
Produktions-Speicherwerte `none`, manuelle Speicherung `false`, Pruning und
Read-time-Redaction `enabled` vollständig gebunden sein. Ein beobachteter
unsicherer Speicherwert ist mit `FAIL`-Präzedenz auch bei sonst noch
unvollständiger Bindung `FAIL`; `readTimeRedaction: unavailable` bleibt
`UNPROVEN`.
Auch `enabled` ist nur eine notwendige, keine hinreichende Bedingung, weil die
offizielle Funktion gespeicherte Daten nicht nachträglich verändert.

Jedes der exakt 32 Vektorergebnisse enthält ausschließlich und in geschlossener
Bedeutung `probeId`, `expectedByteLength`, `observedByteLength`,
`expectedSha256`, `httpStatus`, `observerCallCount`,
`workflowExecutionCount`, `uniqueVectorAttribution`, `exactMatch`,
`strictUtf8Outcome`, `authorizationHeaderPresence`,
`contentEncodingOutcome` und `gate`. `httpStatus`, beide Counts,
`uniqueVectorAttribution` und alle Observerwerte sind nullable. Counts werden
niemals aus einem HTTP-Status, einer Response oder einer Erwartung erfunden;
sie benötigen getrennt gebundene Execution-Evidenz. Fehlende Beobachtungen
werden explizit als nicht beobachtet und `UNPROVEN` repräsentiert; sie werden
nicht mit erwarteten Werten aufgefüllt. Die Vorlage darf insbesondere keine Webhook-URL,
Tenantdomain, Credential-ID, Secrets, Authorization-Werte oder -Header,
Request-/Response-Bodies, Binär-, Hex- oder Base64daten aufnehmen.

Sobald für einen `2xx`-Pfad eine geschlossene erfolgreiche Observerresponse
übernommen wurde, muss jeder nicht-nullische Count exakt `1` sein. Ein
bekannter Wert `0` oder größer als `1` ist ein Widerspruch und ergibt `FAIL`.
Bei normalen und komprimierten erfolgreichen Observerpfaden darf `null`
weiterhin „noch nicht separat gebunden“ bedeuten, sofern das Einzelgate Counts
nicht zwingend verlangt. `auth-correct` bleibt mit 1/1 strenger; frühe
eindeutig gebundene Auth- oder Compression-Ablehnungen mit `400`, `401`, `403`
oder `415` dürfen weiterhin 0/0 verwenden. Ein HTTP-Status allein erzeugt
keinen Count.

Ein einzelner One-shot-Result kann ausschließlich die sanitierte Beobachtung
des ausgewählten Vektors beitragen. Die festen Längen und Digests aller 32
Katalogeinträge bleiben reine lokale Erwartungsmetadaten; Beobachtungsfelder
der übrigen 31 Vektoren dürfen weder damit noch mit der ausgewählten Messung
aufgefüllt werden. Der One-shot darf außerdem weder
`testUrlTenantMeasurementStatus` auf `PASS` setzen noch
`activationDecision` verändern. Der vollständige persistierbare Evidenzrecord
wird erst aus 32 getrennt registrierten und eindeutig zugeordneten One-shots,
vollständiger Bindung und den getrennten Execution-/Providerbelegen validiert.

`testUrlTenantMeasurementStatus` aggregiert ausschließlich die vollständig
gebundene Test-URL-Tenantmessung: mindestens ein Vektor-`FAIL` ergibt `FAIL`;
ausschließlich 32 Vektor-`PASS`-Werte und vollständige
Tenant-/Build-/Workflowbindung ergeben `PASS`; jedes andere Bild ist
`UNPROVEN`. `providerExecutionEvidenceStatus` bleibt davon getrennt. Sein
`PASS` verlangt sichere Settings, auf jedem erfolgreichen eindeutig
zugeordneten Observerpfad einen abwesenden Authorization-Header, den gebundenen
erfolgreichen `auth-correct`-Pfad zusätzlich mit Observer-/Workflow-Counts
`1`/`1` und eindeutiger Attribution, eine zulässige Providerreferenz,
bestätigten Cleanup sowie nicht-nullische `tenantAlias`,
`observedAt`, `timezone`, `n8nBuild`, `webhookNodeTypeVersion` und
`secretFreeWorkflowSha256`. `plan` und `region` dürfen `null` bleiben. Fehlt
mindestens eine dieser sechs Pflichtbindungen, bleibt er ohne bekannten
Widerspruch `UNPROVEN`; `null` oder `unavailable` auf einem erfolgreichen
Observerpfad verhindern ebenfalls `PASS`. Ein dort bekanntes `present` sowie
bekannte unsichere Setting-, Count- oder Attributionswerte behalten auch bei
unvollständiger Bindung mit `FAIL` Vorrang. Weder dieser Status noch ein
Test-URL-Tenantmessstatus `PASS` kann die
feste `activationDecision: FAIL` in Schema 1 ändern.

Ein Providerverweis ist nur eine redigierte, nicht geheime Referenz. Er enthält
weder den Wortlaut einer möglicherweise vertraulichen Supportantwort noch
interne Tenant- oder Ticketdetails. Die Aussage selbst muss weiterhin ihrer
Evidenzklasse und Bindung zugeordnet werden. Das Feld ist strukturell nullable.
Ein positiver `providerExecutionEvidenceStatus` benötigt wegen der nicht
workflowseitig attestierbaren Providergrenzen jedoch einen nicht leeren
redigierten Verweis auf die maßgebliche veröffentlichte Garantie oder
Providerantwort. Auch dieser Nachweis ist keine Aktivierungserlaubnis.

### Lokale Verifikation der Foundation

Die automatisierte lokale Prüfung belegt mindestens:

- deterministische Bytes, Bytezahlen und SHA-256-Werte aller 32 Vektoren sowie
  die festgelegten Fixture-Gleichheits- und Präfixbeziehungen;
- pro explizitem Aufruf genau einen allowlist-validierten Vektor und genau
  einen beabsichtigten ausgehenden Request ohne Normalisierung oder implizite
  Textkonvertierung;
- HTTPS-only, Verbot von Userinfo und Redirects, keine Retries sowie strikt
  Test-URL-only unter `/webhook-test/`, keinen Sweep, kein Autoregister und
  keinen Production-URL-Pfad;
- feste Deadline, kontrollierten Abort und begrenzten Responsebuffer;
- Importinaktivität und keinerlei externen Netzwerkzugriff in Tests, Build,
  Dev-Server oder Bundle-Check; ausschließlich der kontrollierte lokale
  HTTP/1.1-Wiretest öffnet kurzzeitig TCP-Loopback auf `127.0.0.1`;
- vollständige statische Redaction von Endpoint, Tenantdomain, Secret,
  Credential-, Header- und Bodywerten;
- geschlossene Observer- und Evidenzschemata;
- getrennte Test-URL-, OSS-, Provider-, Production-URL- und
  Aktivierungsstatusfelder mit unveränderlichem Schema-1-`FAIL` für
  `activationDecision`;
- `UNPROVEN` bei Timeout, unbekannter Runtimeantwort oder unvollständiger
  Beobachtung;
- defensive Verarbeitung unvertrauenswürdiger Probe-Responses;
- unveränderte Contract-, Boundary-, Bundle- und Local-SyncGateway-Grenzen.

Globale Instrumentierungen laufen seriell und werden in `finally` vollständig
restauriert. Lokale Testdoubles dürfen keine echte DNS-, Socket-, HTTPS- oder
sonstige externe Kommunikation auslösen. Ein erfolgreicher lokaler Testlauf
belegt die Foundation, nicht den n8n-Cloud-Tenant.

### Verbindlicher Stopp vor Cloudzugriff

Nach Abschluss und Verifikation der lokalen Foundation wird gestoppt. Vor
jedem n8n- oder sonstigen externen Zugriff werden Jan separat vorgelegt:

1. alle lokal geänderten Dateien und Prüfergebnisse;
2. die exakte temporäre n8n-Komposition;
3. ausschließlich die Namen
   `GOLDENDAWN_N8N_CLOUD_PROBE_ENDPOINT` und
   `GOLDENDAWN_N8N_CLOUD_PROBE_SECRET`, niemals deren Werte;
4. die vorbereiteten gezielten Supportfragen;
5. getrennte Freigabepunkte für temporären Testworkflow,
   Wegwerfcredential, synthetischen Test-URL-Verkehr und eine Supportanfrage.

Bis zu dieser ausdrücklichen Freigabe werden weder n8n noch ein anderer
externer Endpoint kontaktiert oder verändert. Die Supportfragen werden in
diesem Slice nur formuliert. Sie wurden und werden ohne die gesonderte
Freigabe nicht gesendet. Sie betreffen mindestens:

- ob und an welcher Stufe Requestbytes durch Edge oder Ingress gepuffert,
  größenbegrenzt, dekomprimiert, decodiert oder normalisiert werden;
- ob `Raw Body` im gebundenen Cloudpfad ursprüngliche Wire-Oktette oder bereits
  transformierte Bytes bezeichnet;
- welche Semantik für doppelte gleiche und widersprüchliche Authorization-
  Header gilt;
- ob Test- und Production-URL unterschiedliche Ingresspfade oder Limits
  besitzen; diese Frage ist rein informativ und autorisiert keinen
  Production-URL-Lauf;
- welche Requestdaten vor Workflowausführung in Providerlogs oder
  Ausführungsdaten gelangen, wie sie redigiert werden und wie lange sie
  verbleiben;
- ob und wie ein erfolgreich konsumierter Header-Auth-Wert vor Webhook-
  Runtime-Output, Node-Zwischendaten, persistierten Executions, Telemetrie,
  Backups und Supportzugriff entfernt wird und welche tenantgebundene
  Attestierung dafür verfügbar ist;
- wie Tenantbuild, Region und relevante Plattformänderungen belastbar
  identifiziert beziehungsweise angekündigt werden.

Eine Supportantwort darf nur nach eigener Freigabe eingeholt werden. Sie wird
inhaltlich geprüft, der nicht beobachtbaren Provider-Evidenzklasse zugeordnet
und ausschließlich durch einen redigierten Verweis in die Repositoryevidenz
gebunden.

### Spätere freigegebene Messung, Cleanup und Neubewertung

Nach gesonderter Freigabe gilt unveränderlich folgende Reihenfolge:

1. Tenant-, Plan-, Regions-, Versions-, Node- und Execution-Data-Bindung
   erfassen.
2. Ein ausschließlich für diesen Probe bestimmtes Wegwerfcredential anlegen.
3. Genau einen Vektor auswählen und seine `probeId` allowlist-validieren.
4. Den temporären Test-Webhook für genau diesen One-shot manuell neu
   registrieren beziehungsweise in Listening versetzen.
5. Exakt `npm run probe:n8n:cloud:test -- --vector <probeId>` ausführen; der
   Lauf unternimmt höchstens einen HTTPS-Requestversuch an `/webhook-test/`,
   führt keinen Retry aus und stoppt danach. Eine atomare Exactly-once-
   Zustellung oder -Ausführung wird nicht behauptet.
6. Beobachtung, Observer-/Workflow-Counts und eindeutige Vektorzuordnung
   getrennt binden; Counts niemals aus dem HTTP-Status ableiten.
7. Vor jedem weiteren Vektor die Schritte 3 bis 6 mit manueller erneuter
   Registrierung wiederholen. Es gibt keinen Sweep, keinen zweiten Versuch und
   keinen Production-URL-Lauf.
8. Bei `FAIL` oder `UNPROVEN` gemäß dem freigegebenen Messplan stoppen und
   bereinigen; ein einzelnes Vektor-`PASS` öffnet keinen Folgeslice.
9. Den temporären Workflow deaktivieren oder löschen.
10. Das Wegwerfcredential widerrufen oder löschen.
11. Testausführungen soweit plattformseitig möglich entfernen.
12. Die Test-URL auf Nichtausführbarkeit prüfen.
13. Erst danach die sanitierte Evidenz und den Input für die getrennte
    ADR-0019-Neubewertung aktualisieren.

Cleanup ist Teil der Evidenz. Fehlende Cleanup-Bestätigung lässt das Gate für
jede Aktivierung geschlossen. Secrets, Endpointwerte und unsanitierte
Ausführungsdaten werden auch vorübergehend nicht in Repository, Vault,
Workflowexport, Evidenz, Screenshot oder Log übernommen.

Jedes `FAIL` oder `UNPROVEN` hält das Cloudgate geschlossen und löst vor
weiterer Cloudarbeit die Neubewertung von ADR 0019 aus. Die Compression-Gates,
Redaction oder Bindung dürfen nicht gelockert werden, um ein positives Ergebnis
zu erzeugen. Auch ein vollständiger Test-URL-Tenantmessstatus `PASS` lässt
`activationDecision` in Schema 1 unverändert auf `FAIL` und erlaubt nur, die
Ergebnisse in eine getrennte Neubewertung von ADR 0019 einzubringen. Erst ein
neuer ADR mit neuer Evidenz-Schemaversion könnte einen späteren
Webhook-/Credential-Spezifikationsslice autorisieren.

### Explizite Nichtziele

Dieser Slice implementiert keinen produktiven oder dauerhaften Webhook, keinen
dauerhaften n8n-Workflow, keine Boundary-Komposition in n8n, keinen SyncAgent,
keine normale SyncResponse, keinen Browser-SyncTransport und keinen
Cloud-Upstream des lokalen Gateways. Er besitzt außerdem keinen
Production-URL-Runner oder -Messpfad und registriert keinen Test-Webhook
automatisch. Er ergänzt weder Rate Limits, Retries,
Replay-, Signatur-, HMAC-, JWT- oder Idempotenzlogik noch AgentHub- oder
AutomationHub-Oberflächen.

Paket- und Lockfile-Version bleiben `0.2.2`; Tag und neuestes veröffentlichtes
Release bleiben `v0.2.2`. Es gibt keine Git-Schreiboperation und keine
Änderung an privaten Daten oder am GoldenDawn Vault.

## Konsequenzen

Positive Auswirkungen:

- Lokale technische Parität und Cloudtatsachen werden nicht länger in einem
  einzigen unscharfen „Raw Body“-Versprechen vermischt.
- Die dreiwertige Aggregation verhindert, dass fehlende oder teilweise
  Evidenz stillschweigend als Erfolg behandelt wird.
- Deterministische synthetische Bytes, geschlossene Responses und eine
  sanitierte Evidenzstruktur ermöglichen einzeln registrierte, reviewbare
  One-shot-Messungen ohne private GoldenDawn-Daten.
- Tenant-, Build-, Node-, Workflow- und Settings-Bindung macht sichtbar, wann
  ein positiver Nachweis nicht mehr übertragen werden darf.
- Der explizite Stopp, die manuelle erneute Test-Webhook-Registrierung sowie
  Wegwerfworkflow und -credential begrenzen jede spätere Cloudmessung zeitlich
  und operativ.
- Ein negatives Ergebnis bleibt ein wertvolles und erfolgreich dokumentiertes
  Slice-Ergebnis, ohne die Produktgrenze zu öffnen.

Kosten und Einschränkungen:

- Die lokale Foundation kann `testUrlTenantMeasurementStatus` niemals allein
  auf `PASS` setzen.
- Eine vollständige spätere Test-URL-Evidenz benötigt 32 manuell getrennt
  registrierte One-shots, manuelle Cloudkomposition, separate Freigaben und
  sorgfältigen Cleanup.
- Ein Tenant-Probe kann vorgelagerte Allokation, Edge-Buffering und
  Providerlogs nicht beobachten; hierfür bleiben offizielle Aussagen oder
  Providerantworten erforderlich.
- Ein positiver Nachweis ist eng an Zeitpunkt und Plattformbindung gekoppelt
  und muss nach relevanten Änderungen wiederholt werden.
- Die öffentlichen OSS-Details können von n8n Cloud abweichen; ihr Nutzen ist
  auf Risikoerkennung und Formulierung konkreter Gates begrenzt.
- Selbst ein vollständiger Test-URL-Tenantmessstatus `PASS` ändert
  `activationDecision: FAIL` in Schema 1 nicht und implementiert oder aktiviert
  keinen produktiven GoldenDawn-Cloudfluss.

## Erwogene Alternativen

### `Raw Body` als ausreichende Wire-Byte-Garantie behandeln

Verworfen. Die offizielle Dokumentation macht die dafür benötigte Aussage
nicht und belegt weder Transformationsfreiheit noch den Zeitpunkt der
Materialisierung.

### Cloudverhalten allein aus dem öffentlichen n8n-Code ableiten

Verworfen. Der commitgebundene OSS-Code ist eine wichtige Beobachtung, aber
keine Deploymentattestierung für Tenant, Build, Region oder vorgelagerten
Providerpfad.

### Das bestehende Boundary-Bundle bereits im Probe-Workflow einsetzen

Verworfen. Der Probe muss zuerst die vorgelagerte Byte- und Laufzeitgrenze
isoliert messen. Eine Boundary-Komposition würde Beobachtung und zu prüfende
Fachlogik vermischen und eine spätere Phase vorwegnehmen.

### Einen produktiven Webhook oder reale GoldenDawn-Daten für den Nachweis nutzen

Verworfen. Wegwerfworkflow, Wegwerfcredential und feste synthetische Bytes
reichen für die Messung aus und vermeiden eine unnötige Produkt- und
Datenschutzexposition.

### Automatische Redirects, Retries oder parallele Probes zulassen

Verworfen. Diese Mechanismen erschweren eindeutige Korrelation, können Secrets
an einen anderen Endpoint tragen und vergrößern den externen Effekt eines
fehlgeschlagenen Probes.

### Alle Vektoren in einem Lauf senden oder den Test-Webhook automatisch registrieren

Verworfen. GoldenDawn behandelt den n8n-Test-Webhook in diesem Slice
operatorisch als manuell neu registrierten One-shot. Jeder Vektor benötigt eine
neue menschlich bestätigte Listening-Registrierung, genau einen expliziten
CLI-Aufruf und höchstens einen Requestversuch ohne Retry. Eine technische
atomare Exactly-once-Garantie wird nicht behauptet. Ein automatischer Sweep
oder Autoregister würde die eindeutige Zuordnung und die tatsächliche
Test-Webhook-Lifecycle-Grenze verdecken.

### Nach Test-URL-PASS denselben Runner gegen die Production-URL ausführen

Verworfen. Schema 1 misst ausschließlich den manuell registrierten Test-URL-
Pfad. Der Runner akzeptiert keinen Production-URL-Pfad. Die informativ
vorbereitete Supportfrage nach möglichen Unterschieden autorisiert keine
Productionmessung.

### Dekodierte Strings oder einen schwächeren Runtimehash vergleichen

Verworfen. Stringvergleiche können vorherige Byteveränderungen verbergen; ein
nicht kryptografischer Ersatzhash erzeugt einen stärkeren Nachweisanschein als
er tatsächlich bietet. Maßgeblich bleiben exakter Bytevergleich und lokaler
SHA-256.

### Unbeobachtbare Providereigenschaften aus einem erfolgreichen Workflow ableiten

Verworfen. Eine nachgelagerte Workflowbeobachtung kann keine Aussage über
vorherige Allokation, Edge-Buffering oder Providerlogs beweisen.

### Bei unvollständiger Evidenz mit der Webhookimplementierung fortfahren

Verworfen. `UNPROVEN` wird für Aktivierung bewusst wie `FAIL` behandelt und
führt zur Neubewertung von ADR 0019.

## Bedingungen für eine Neubewertung

Diese Entscheidung wird überprüft, wenn:

- n8n eine hinreichend genaue, versionsgebundene Wire-Byte- und
  Content-Encoding-Garantie veröffentlicht;
- der gebundene Cloud-Tenant, Plan, die Region, der Build, Webhook-Node-
  `typeVersion`, Workflow oder Execution-Data-Einstellungen geändert werden;
- die Binary-Buffer-API, Code-Node-Runtime oder `TextDecoder`-Semantik geändert
  wird;
- Tenantmessung und dokumentierte beziehungsweise quellcodebeobachtete
  Semantik einander widersprechen;
- ein erforderliches Gate `FAIL` oder `UNPROVEN` ergibt;
- Providerantworten neue Informationen über Allokation, Edge-Buffering,
  Limits, Dekomprimierung, Header oder Logs liefern;
- ein produktiver Webhook, Credential, Cloudtransport, Boundary-Adapter oder
  SyncAgent eingeführt werden soll;
- private Daten, weitere Aktionen, Signatur-, Replay- oder
  Idempotenzanforderungen in den Scope gelangen.

Die festen Schema-1-Werte `stableOssCompatibility: FAIL`,
`productionUrlMeasurementStatus: UNPROVEN` und `activationDecision: FAIL`
werden innerhalb dieser Entscheidung nicht umgeschrieben. Jede künftige
Änderung benötigt ausdrücklich einen neuen ADR und eine neue
Evidenz-Schemaversion; ADR 0022 selbst ersetzt ADR 0019 nicht.

## Verwandte Dokumente und Quellen

- [ADR 0018: Transportneutrale SyncGateway Request Boundary](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
- [ADR 0019: Lokales SyncGateway vor n8n Cloud](0019-local-sync-gateway-before-n8n-cloud.md)
- [ADR 0020: Lokale SyncGateway Raw-Wire- und HTTP-Foundation](0020-local-sync-gateway-raw-wire-http-foundation.md)
- [ADR 0021: Generated n8n Boundary Bundle Foundation](0021-generated-n8n-boundary-bundle-foundation.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
- [Offizielle n8n-Dokumentation: Webhook node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Offizielle n8n-Dokumentation: Get binary data buffer](https://docs.n8n.io/build/code-in-n8n/cookbook/code-node/get-the-binary-data-buffer/)
- [Offizielle n8n-Dokumentation: Execution data redaction](https://docs.n8n.io/deploy/host-n8n/configure-n8n/security/redact-execution-data/)
- [Offizielles Stable-Release `n8n@2.35.4`](https://github.com/n8n-io/n8n/releases/tag/n8n%402.35.4)
- [Offizieller n8n-Quellcode: Body-Parser am Commit `d2ce3c084c228622c2ffe7c245d25870430e18a9`](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/middlewares/body-parser.ts)
- [Offizieller n8n-Quellcode: Webhook-Requestpfad am Commit `d2ce3c084c228622c2ffe7c245d25870430e18a9`](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/webhooks/webhook-helpers.ts)
- [Offizieller n8n-Quellcode: Header Authentication am Commit `d2ce3c084c228622c2ffe7c245d25870430e18a9`](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/nodes-base/nodes/Webhook/utils.ts)
- [Offizieller n8n-Quellcode: Webhook-Output am Commit `d2ce3c084c228622c2ffe7c245d25870430e18a9`](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/nodes-base/nodes/Webhook/Webhook.node.ts)
- [Offizieller n8n-Quellcode: Test-Webhook-Lifecycle am Commit `d2ce3c084c228622c2ffe7c245d25870430e18a9`](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/webhooks/test-webhooks.ts)
