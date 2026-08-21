# ADR 0019: Lokales SyncGateway als Sicherheitsgrenze vor n8n Cloud

## Status

Ersetzt durch [ADR 0023](0023-local-syncagent-before-optional-external-providers.md) – 2026-08-21

## Kontext

Die transportneutralen Foundations aus
[ADR 0016](0016-transport-neutral-sync-contract-foundation.md),
[ADR 0017](0017-transport-neutral-sync-service-foundation.md) und
[ADR 0018](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
sind implementiert. Sie definieren den geschlossenen `syncTest`-Vertrag, den
einzigen ausgehenden SyncService-Port und die kanonische Request Boundary für
einen bereits materialisierten Raw-Body-String. Sie implementieren keinen
HTTP-Transport und keine Grenze für tatsächlich empfangene Wire-Bytes.

Vor dem ersten realen, weiterhin rein synthetischen Transport muss deshalb
entschieden werden, wo Browserkonfiguration endet, wo exakte Byte- und
Decodierungsregeln durchgesetzt werden und wo das Secret für n8n Cloud liegt.
Ein Vite-Browserclient kann kein dauerhaftes Secret vertrauenswürdig halten.
Ein direkter Browseraufruf an einen Cloud-Webhook würde entweder ein Secret im
Client offenlegen oder einen dauerhaft erreichbaren, nicht authentisierten
Webhook voraussetzen.

Diese Entscheidung konkretisiert die von ADR 0016 bis ADR 0018 ausdrücklich
verlangte Neubewertung vor einem realen Transport. Sie ersetzt oder verändert
[ADR 0002](0002-syncagent-gateway.md),
[ADR 0005](0005-v1-three-agent-scope.md) und ADR 0016 bis ADR 0018 nicht
rückwirkend. Insbesondere bleiben der SyncService die einzige externe
Kommunikationsschicht des Frontends und der `SyncAgent` der einzige Einstieg in
das Agentensystem. Version 1 bleibt auf `SyncAgent`, `DataAgent` und `TestAgent`
begrenzt.

ADR 0019 entscheidet ausschließlich Architektur und Policy. Alle nachfolgend
beschriebenen Transport-, Gateway-, n8n- und Betriebsbausteine sind weiterhin
**geplant** und nicht implementiert.

## Entscheidung

### Zieltopologie und Verantwortungsgrenze

Der erste spätere reale `syncTest`-Fluss verwendet verbindlich diese
Zieltopologie:

```text
GoldenDawn-Browser
  → SyncService
  → künftiger lokaler SyncTransport
  → künftiges lokales SyncGateway auf GD-WS01
  → authentisierter n8n-Cloud-Webhook
  → SyncAgent
  → validierte normale SyncResponse
```

Das lokale SyncGateway ist eine schmale Transport- und Sicherheitsgrenze. Es
ist kein zusätzlicher Agent, keine Fachlogik, kein allgemeines Backend, kein
Storage oder DataAgent, kein Ersatz für den `SyncAgent` und keine
UI-Komponente. Es liest weder private GoldenDawn-Module noch den
GoldenDawn-Vault. Es entscheidet keinen Fachagenten und kennt für diesen Flow
ausschließlich die serverseitig festgelegte Capability `syncTest`.

[ADR 0002](0002-syncagent-gateway.md) bleibt damit gültig: Der SyncService ist
die einzige externe Kommunikationsschicht des Frontends, während der
`SyncAgent` der einzige Eingang in das Agentensystem bleibt. Der lokale
Transport und das lokale Gateway vermitteln nur zwischen diesen Grenzen.
[ADR 0005](0005-v1-three-agent-scope.md) bleibt ebenfalls gültig: Das lokale
Gateway ist kein vierter Agent.

### Vertrauenszonen und Datenfluss

#### Zone A – GoldenDawn-Browser

Zone A umfasst den Vite-Browserclient und den implementierten SyncService.

- Der Browser besitzt keinen vertrauenswürdigen Secret-Speicher.
- `VITE_*`, JavaScript-Bundle, DOM, `localStorage`, URLs und
  Browserkonfiguration sind keine Orte für dauerhafte Secrets.
- Browserwerte bestimmen weder Cloud-Endpoint, Umgebung, Handler noch
  Berechtigungen.
- Der Browser erzeugt weiterhin ausschließlich den vorhandenen gültigen
  Sechs-Felder-Request für `syncTest` mit exakt leerem `payload`.
- PromptVault, LearningHub, LichtwaldLog, Vault und lokale Dateien werden nicht
  gelesen oder exportiert.
- Der Browsercaller gilt am lokalen Gateway als nicht authentisiert und nicht
  vertrauenswürdig.

#### Zone B – lokales SyncGateway auf GD-WS01

Zone B ist ein künftiger separater lokaler Node-Prozess.

- Er bindet ausschließlich an eine Loopback-Schnittstelle und nicht an LAN-
  oder öffentliche Interfaces.
- Er behandelt Browserrequests dennoch als unvertrauenswürdig. Loopback,
  Prozesseigentümerschaft und Origin beweisen keine Identität.
- Er ist die geplante exakte Raw-Wire-, Decodierungs-, Boundary-, Policy- und
  Cloud-Transportgrenze.
- Er hält später Cloud-Konfiguration und Secrets in vertrauenswürdiger
  serverseitiger Laufzeitkonfiguration außerhalb des Browserbundles.
- Er besitzt keine Fachlogik, Persistenz, privaten Modulzugriffe oder
  Agentenentscheidung.

#### Zone C – n8n Cloud

n8n Cloud ist ein externer Dienst und eine eigene Vertrauenszone.

- Ein authentisierter Webhook ist der geplante Eingang.
- Der Workflow führt später das minimale `SyncAgent`-Gerüst aus.
- Die Cloudgrenze vertraut nicht allein auf `source`, Request-ID, Timestamp,
  Webhook-Pfad oder die behauptete Herkunft vom lokalen Gerät.
- n8n-Ausführungsdaten, Netzwerkmetadaten und Providergrenzen sind externe
  Verarbeitung und werden vor Aktivierung transparent geprüft.
- Die Cloudgrenze validiert defense-in-depth erneut und vertraut nicht allein
  auf die lokale Validierung.

### Browser zum lokalen Gateway

Für den ersten späteren Transport gilt:

- Der fachliche Request verwendet ausschließlich `POST`.
- Ein CORS-Preflight darf technisch separat über `OPTIONS` beantwortet werden,
  führt aber niemals den Syncfluss aus.
- Das lokale Gateway bietet ausschließlich einen serverseitig festgelegten
  Pfad. Der Client wählt weder Route noch Umgebung oder Cloud-URL.
- Akzeptiert wird ausschließlich kontrolliertes JSON mit UTF-8. Komprimierte
  Request-Bodies und nicht unterstützte Content-Encodings werden abgelehnt.
- Eine exakte serverseitige Origin-Allowlist wird verwendet. `*` und ein
  unkontrolliertes Spiegeln des eingehenden Origin-Werts sind ausgeschlossen.
- Eine fehlende oder nicht vertrauenswürdig bestimmbare Origin wird nicht
  stillschweigend als Identitätsnachweis behandelt.
- CORS ist ausschließlich eine Browserdurchsetzung und weder Authentisierung
  noch Autorisierung.
- Die erste Capability bleibt auf den nebenwirkungsfreien synthetischen
  `syncTest` ohne Nutzdaten begrenzt. Alle anderen Aktionen, Payloads,
  Datenklassen und Routen bleiben nicht vorhanden oder fail-closed verboten.

Bösartige lokale Prozesse werden nicht durch CORS kontrolliert und können eine
Loopback-Schnittstelle direkt ansprechen. Loopback liefert keine
Zero-Trust-Identität. Dieses verbleibende Risiko ist für die kleine anonyme
`syncTest`-Capability nur vertretbar, weil sie keine privaten Daten liest,
keinen fachlichen Zustand verändert und ausschließlich eine synthetische Antwort
erzeugen darf.

### Raw-Wire-, Decodierungs- und Single-Parser-Grenze

Das künftige lokale SyncGateway muss diese Reihenfolge einhalten:

```text
Methode, Pfad, Content-Type, Content-Encoding und frühe Transportregeln prüfen
→ Origin/CORS-Policy für Browserzugriffe prüfen
→ Content-Length nur als frühes Signal prüfen, niemals allein darauf vertrauen
→ tatsächlich empfangene Bytes während des Streamings auf 65.536 begrenzen
→ bei Byte 65.537 abbrechen, ohne den vollständigen Body zu materialisieren
→ kontrolliert exakt einmal als UTF-8 dekodieren
→ ungültiges UTF-8 fail-closed ablehnen
→ eine gültige BOM als U+FEFF erhalten und weder entfernen noch reparieren
→ keine Unicode-Normalisierung, Trimmung oder Inhaltsreparatur
→ materialisierten String exakt einmal an die bestehende Request Boundary geben
→ ausschließlich deren defensive Projektion weiterverwenden
→ anhand serverseitiger Policy autorisieren
→ erst danach kontrolliert an n8n Cloud senden
```

`Content-Length` kann fehlen, falsch sein oder für Streaming ungeeignet sein.
Die reale Bytezählung erfolgt unabhängig davon. Die konkrete
Decoderkonfiguration muss ein späterer Implementierungsslice mit gültigem und
ungültigem UTF-8, BOM und Unicode-Grenzfällen belegen. ADR 0019 erfindet keinen
Decodercode.

[ADR 0018](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
bleibt die kanonische Grenze für den danach materialisierten String. Sie trimmt,
normalisiert oder repariert nichts, entfernt keine BOM und ruft natives
`JSON.parse` exakt einmal ohne Reviver auf. Doppelte JSON-Membernamen behalten
die native Last-Key-Wins-Semantik. Es wird weder duplikatfreies noch kanonisches
JSON behauptet.

Die spätere kontrollierte Serialisierung der defensiven lokalen Projektion für
den neuen Cloud-Wire-Hop ist kein zweiter Parser desselben Browser-Raw-Bodys.
Der Cloud-Hop ist eine neue unvertrauenswürdige Transportgrenze und wird dort
separat genau einmal verarbeitet.

### Identitäts-, Ressourcen- und Policy-Modell

Für den ersten `v0.3.0`-Flow gilt:

| Element | Verbindliche Entscheidung |
| --- | --- |
| Browsercaller | nicht authentisiert und nicht vertrauenswürdig |
| Erlaubte Ressource | ausschließlich der synthetische `syncTest` |
| Erlaubte Operation | genau ein kontrollierter Aufruf ohne Nutzdaten |
| Verbotene Ressourcen | PromptVault, LearningHub, LichtwaldLog, Vault, Airtable, DataAgent und TestAgent |
| Routing | ausschließlich aus lokaler Gateway-Konfiguration und serverseitiger Policy |
| Clientwerte | keine generische Execute-, Action-, Payload-, Agenten-, Umgebungs- oder Routenauswahl |

`source: "goldendawn-os"` bleibt rein syntaktisch. `req_`- und `gateway_`-IDs
sowie Timestamp beweisen keine Identität, Berechtigung, Kollisionsfreiheit,
Idempotenz oder Replay-Sicherheit. Vor jeder weiteren Aktion, privaten
Datenklasse oder Nebenwirkung ist eine neue Contract-, Identitäts-,
Berechtigungs- und Datenschutzentscheidung erforderlich.

### Authentisierung vom lokalen Gateway zu n8n Cloud

Der erste spätere synthetische Cloudfluss verwendet n8n Header Authentication
mit einem dedizierten hochentropischen gemeinsamen Bearer-Secret.

- Das Secret liegt ausschließlich im n8n-Credential-Store und in
  vertrauenswürdiger serverseitiger Laufzeitkonfiguration des lokalen Gateways.
- Es darf niemals in Browserbundle, `VITE_*`, `localStorage`, eine URL, das
  Repository, GoldenDawn-Vault, Workflow-Export, eine Testfixture, einen
  Screenshot oder ein Log gelangen.
- Webhook-URL und zufälliger Pfad gelten als sensible Konfiguration, aber nicht
  als Authentisierung.
- Der Cloudaufruf verwendet ausschließlich HTTPS.
- Serverseitige Rotation und Widerruf müssen möglich sein.
- Das dedizierte Credential wird ausschließlich für den einen
  `syncTest`-Webhook verwendet und nicht mit anderen Workflows geteilt.

Der erfolgreiche Header-Secret-Besitznachweis authentisiert den präsentierenden
Caller nur als Inhaber des dedizierten Gateway-Credentials; er beweist keine
starke Geräte-, Prozess- oder Benutzeridentität und keinen gesonderten
n8n-RBAC-Principal. Header Authentication ist keine anwendungsspezifische
Signatur über den Body. TLS schützt den Transport, ersetzt aber keinen Replay-
oder Idempotenzschutz. Der erste synthetische Flow besitzt bewusst noch keinen
HMAC-, JWT-Body-Binding- oder Replay-Nachweis. Falls später eine Bodysignatur
eingeführt wird, muss sie über die exakten relevanten Raw-Bytes und Header vor
Decodierung und Parsing geprüft werden. Vor privaten Daten oder schreibenden
Aktionen sind Body-Binding, Replay-Schutz, Idempotenz und stärkere
Secret-Verwaltung neu zu entscheiden und umzusetzen.

ADR 0019 legt keine Variablennamen, Headernamen, Tokenwerte, Workflow-IDs,
Ports oder URLs fest.

### Kanonischer Contract und n8n-Cloud-Plattformgrenzen

Der datierte Plattformbefund vom 2026-08-15 beschreibt ausschließlich die
aktuell offiziell dokumentierten n8n-Fähigkeiten und keine bereits
ausgelieferte oder konfigurierte Integration:

- n8n Cloud erlaubt im Code Node keinen Import beliebiger externer npm-Module;
  offiziell bereitgestellt werden dort `crypto` und `moment`.
- Der Webhook Node unterstützt die dokumentierte Methode `Header auth` und die
  Option `Raw Body`.
- Die dokumentierte Option `Raw Body` beweist jedoch keinen byteidentischen
  Zugriff auf die ursprünglichen Request-Oktette und keine konkrete
  Allokations-, Decodierungs-, Parsing- oder Signaturreihenfolge.
- Die Webhook-Seite dokumentiert 16 MB. Nur die verlinkte self-hosted
  Konfiguration beschreibt einen Default von 16 MiB und eine dortige
  Konfigurationsmöglichkeit. Für n8n Cloud ist keine nutzerseitige Absenkung auf
  65.536 Bytes dokumentiert; exakte Byteinterpretation und
  Enforcement-Reihenfolge bleiben offen. Keine dieser Angaben beweist die
  GoldenDawn-Grenze oder eine Prüfung vor Provider- oder Runtime-Allokation.

Deshalb bleiben `src/contracts/syncContract.js` und
`src/gateways/syncGatewayRequestBoundary.js` die kanonischen Quellen. Im
n8n-Workflow wird keine zweite Contract- oder Boundary-Implementierung manuell
gepflegt. Ein späterer Cloudworkflow darf nur ein reproduzierbar generiertes,
selbstständiges Artefakt verwenden, das automatisiert gegen die kanonischen
Module geprüft wird. Generiertes Artefakt und bereinigter Workflow-Export
benötigen eigene Integritäts-, Paritäts- und Mutationsprüfungen.

Bis dieser Generierungs- und Prüfpfad implementiert ist, wird kein operativer
n8n-SyncAgent-Workflow als sicher oder fertig bezeichnet. Dieser Slice erzeugt
weder Bundle noch Workflow-Export. Die Plattformfähigkeiten und die konkrete
n8n-Cloud-Tenant-Version werden vor der Implementierung erneut geprüft.

### n8n-Raw-Body-Grenze

Der spätere n8n-Webhook muss `Raw Body` verwenden. Header Authentication soll
vor der Workflowausführung greifen. Die konkrete n8n-Repräsentation und deren
Byteidentität vor Decodierung sind im Implementierungsslice versions- und
tenantgebunden nachzuweisen; die heutige Plattformdokumentation garantiert
diesen Zugriff nicht. Nur wenn dieser Laufzeitnachweis tatsächliche Binärdaten
vor Decodierung belegt, darf der Cloudpfad aktiviert werden. Andernfalls ist
n8n Cloud für diese Boundary-Komposition ungeeignet und ADR 0019 neu zu
bewerten.

Nach erfolgreichem Nachweis wird vor Decodierung die tatsächliche Bytezahl
erneut geprüft. Danach folgen eine kontrollierte UTF-8-Decodierung und genau ein
Aufruf der generierten kanonischen Boundary. Es gibt keinen zweiten JSON-Parser
für denselben Cloud-Raw-Body. Die Cloudgrenze verwendet ausschließlich die
defensive Boundary-Projektion und validiert defense-in-depth erneut.

Das n8n-Plattformlimit beweist keine GoldenDawn-Grenze von 65.536 Bytes vor
Allokation. Die erneute n8n-Prüfung ist daher eine zusätzliche Schutzschicht
nach möglicher Provider-Allokation und keine DoS-Garantie. Das lokale
SyncGateway bleibt die geplante exakte vorgelagerte Wire-Byte-Grenze.

### Response- und Fehlerentscheidung

Der SyncService akzeptiert weiterhin ausschließlich normale, vollständig
korrelierte SyncResponses. Frühe Gateway-Responses werden nicht zu normalen
SyncResponses umgeschrieben. `src/services/syncService.js` und die vorhandenen
Contract-Fehlerprofile bleiben unverändert.

Eine vollständig gültige normale Contract-Fehlerresponse bleibt im
SyncService außen `ok: true`; ausschließlich `syncResponse.success: false`
trägt den fachlichen Misserfolg.

Der spätere Clienttransport behandelt nicht erfolgreiche HTTP-Statuswerte,
frühe `gateway_`-Responses, Authentisierungsfehler, Timeouts und ungeeignete
Responseformen als statisch redigierte lokale Transportfehler. Die konkrete
HTTP-Statuszuordnung und das exakte Transportfehler-API werden erst zusammen mit
der Implementierung getestet und zugesagt.

Transportablehnungen vor einem gültigen Request behaupten keine Verarbeitung
durch den `SyncAgent`. Lokale Gateway- und Cloudfehler spiegeln keine fremden
Meldungen, Header, URLs, Raw Bodies, Tokens, Validatorlisten oder Stacks an den
Browser.

| Fall | Ebene | Geplante Einordnung ohne neue Contractzusage |
| --- | --- | --- |
| falsche Methode | lokaler HTTP-Transport | frühe statisch redigierte Transportablehnung; kein SyncAgent |
| ungeeigneter Content-Type oder Content-Encoding | lokaler HTTP-Transport | frühe statisch redigierte Transportablehnung |
| nicht erlaubte Origin | lokale Browserpolicy | Policyablehnung; CORS ist keine Authentisierung |
| mehr als 65.536 empfangene Bytes | lokale Wire-Grenze | Empfang bei Byte 65.537 abbrechen; keine vollständige Bodyallokation |
| ungültiges UTF-8 | lokale Decodierungsgrenze | fail-closed vor Boundary-Aufruf |
| ungültiges JSON | kanonische Request Boundary | vorhandene frühe `INVALID_JSON`-Gateway-Response |
| Contractablehnung | kanonische Request Boundary | vorhandenes statisches Gateway-Profil gemäß ADR 0018 |
| Cloud-Authentisierungsfehler | lokaler Cloudtransport | redigierter lokaler Transportfehler; keine Upstreamdetails |
| Upstream-Timeout | lokaler Cloudtransport | redigierter lokaler Transportfehler; kein automatischer Retry |
| ungeeignete Cloudresponse | lokale Responsegrenze | nicht an den SyncService als normale Response weitergeben |
| lokaler interner Gatewayfehler | lokaler Programmfehler | statisch redigierter lokaler Fehler; keine Gateway-Contractresponse erfinden |

Transportstatus, frühe Gateway-Contractresponse und lokaler Programmfehler
bleiben getrennte Ebenen.

### Timeout, Retry, Replay, Idempotenz und Rate Limits

- Jeder spätere Netzaufruf erhält einen endlichen kontrollierten Timeout.
- Der erste Flow führt keine automatischen Retries aus.
- Timestamp-Toleranz ist kein Replay-Schutz.
- `requestId` ist keine Idempotenz- oder Deduplizierungsgarantie.
- Der synthetische `syncTest` ist fachlich nebenwirkungsfrei; daraus folgt keine
  pauschale Wiederholbarkeit anderer Aktionen.
- Jede spätere schreibende oder private Aktion benötigt vor Freigabe Replay-,
  Idempotenz- und Deduplizierungsregeln.
- Lokales Gateway und Cloudgrenze benötigen risikogerechte mehrschichtige Rate
  Limits vor einem dauerhaft aktiven Betrieb.

Dieser ADR-Slice implementiert keinen dieser Mechanismen und legt keine
unbelegten konkreten Timeout- oder Rate-Limit-Werte fest.

### Daten-, Datenschutz- und Logginggrenze

Der spätere `v0.3.0`-Testfluss überträgt – neben dem getrennt beschriebenen
Gateway-Credential – höchstens die folgenden Contract- und Flowdaten sowie
technisch unvermeidbaren Metadaten:

- Contractversion;
- Aktion `syncTest`;
- Quellklassifikation;
- zufällige Request-ID;
- kontrollierten UTC-Zeitstempel;
- exakt leeres Payload;
- technisch unvermeidbare HTTP-, TLS-, IP- und Provider-Metadaten;
- eine als `synthetic` klassifizierte Antwort.

Getrennt davon überträgt der Gateway-zu-Cloud-Hop das dedizierte gemeinsame
Secret ausschließlich im noch nicht namentlich festgelegten
Authentisierungsheader über HTTPS. Der Wert wird weder in diesem ADR noch im
Repository festgehalten.

Er liest oder exportiert keine Daten aus PromptVault, LearningHub,
LichtwaldLog, GoldenDawn-Vault, Airtable, lokalen Dateien oder Gesundheits-,
Reflexions- und Lerndaten.

Sobald der spätere Workflow aktiviert wird, ist n8n Cloud eine externe
Verarbeitung mit möglicher Speicherung technischer Ausführungsdaten. Vor der
Aktivierung werden Ausführungsspeicherung, Aufbewahrung und Redaction
tenant-, plan- und versionsgebunden geprüft. Secrets, Authentisierungsheader,
produktive URLs, Raw Bodies, Parsermeldungen und fremde Stacks dürfen nicht
gespeichert oder geloggt werden. Vor Aktivierung ist nachzuweisen, dass lokale
Fehlerpfade, Workflow-Ausführungsdaten und verfügbare Provider-Redaction diese
Anforderung erfüllen; andernfalls bleibt der Workflow deaktiviert. Dieser Slice
implementiert weder Logging, Telemetrie noch Monitoring.

Die Architektur wendet einzelne Prinzipien wie Least Privilege,
Defense-in-Depth und fail-closed Verarbeitung an. Sie behauptet keine
vollständige Erfüllung von DSGVO, AI Act, Zero Trust oder anderen
Compliance-Rahmenwerken.

### Bedrohungen und verbleibende Grenzen

Alle Schutzschichten dieser Tabelle sind durch ADR 0019 **entschieden oder
geplant**, aber in diesem Slice nicht implementiert.

| Bedrohung | Betroffene Grenze | Geplante Schutzschichten | Verbleibendes Risiko | Implementierungsstatus |
| --- | --- | --- | --- | --- |
| bösartige Webseite im Browser | Zone A → B | Loopback, exakte Origin-Allowlist, POST-only, geschlossene `syncTest`-Capability | Browserfehler, kompromittierter erlaubter Origin und CORS-Umgehung durch Nicht-Browser | geplant; Architektur durch ADR 0019 entschieden |
| bösartiger lokaler Prozess | Zone B | Loopback-only, kleine nebenwirkungsfreie Capability, Rate Limits | lokale Prozesse werden nicht durch CORS kontrolliert; keine Calleridentität | geplant; Architektur durch ADR 0019 entschieden |
| manipulierte oder übergroße Bodybytes | lokale Wire-Grenze | Streamzählung bis 65.536, Abbruch bei Byte 65.537, keine Kompression | Ressourcenverbrauch vor Prozessannahme und Plattformgrenzen bleiben | geplant; Architektur durch ADR 0019 entschieden |
| ungültiges UTF-8 oder JSON | Decoder und Boundary | strikte einmalige UTF-8-Decodierung, keine Reparatur, kanonische Single-Parser-Boundary | Decoder-/Runtimefehler und Same-Realm-Manipulation | geplant; Architektur durch ADR 0019 entschieden |
| direkte Umgehung des lokalen Gateways | n8n Cloud | HTTPS, dediziertes Header-Secret nur am `syncTest`-Webhook | gestohlenes Secret oder Fehlkonfiguration | geplant; Architektur durch ADR 0019 entschieden |
| gestohlenes Cloud-Secret | Zone B → C | serverseitige Ablage, dedizierte Verwendung, Rotation und Widerruf | Nutzung bis Erkennung oder Widerruf; kein Body-Binding | geplant; Architektur durch ADR 0019 entschieden |
| Replay eines gültigen Requests | Zone B → C | keine automatische Wiederholung; spätere Replay-/Idempotenzentscheidung | erster Flow besitzt keinen Replay-Nachweis | Schutzprüfung und Härtung geplant |
| Provider- oder n8n-Ausführungsdaten | Zone C | Review von Speicherung, Retention und Redaction vor Aktivierung | externe Metadatenverarbeitung bleibt | Aktivierungsgate entschieden; Prüfung geplant |
| Contractdrift zwischen Repository und Cloudworkflow | Build-/Deploymentgrenze | reproduzierbares generiertes Artefakt, Paritäts-, Integritäts- und Mutationstests | Toolchain- oder Deploymentdrift | geplant; Architektur durch ADR 0019 entschieden |
| manipulierte Same-Realm-Dependencies | lokale und Cloud-JavaScript-Laufzeit | kleine Composition, defensive Projektion, Tests, keine Sandboxbehauptung | ausgeführte Seiteneffekte können nicht rückgängig gemacht werden | Härtung geplant |
| Cloudausfall oder Timeout | Zone B → C | endlicher Timeout, keine automatischen Retries, redigierter Fehler | zeitweise Nichtverfügbarkeit | geplant; Architektur durch ADR 0019 entschieden |
| unbeabsichtigte Aktivierung eines unvollständigen Workflows | n8n Deployment | kein Fertigstatus vor Bundle-/Paritätsprüfung, bereinigter Export, Aktivierungsgate, Abschaltweg | menschliche oder Plattformfehlkonfiguration | Aktivierungsgate entschieden; Umsetzung geplant |

### Reihenfolge späterer Implementierungsslices

Innerhalb von `v0.3.0` gilt nach diesem ADR die Reihenfolge:

1. ADR 0019 – Local SyncGateway before n8n Cloud Decision – entschieden;
2. lokale SyncGateway Raw-Wire- und HTTP-Foundation – geplant;
3. reproduzierbares n8n-Cloud-Boundary-Bundle mit Paritätsprüfungen – geplant;
4. bereinigter n8n-Cloud-Webhook und minimales `SyncAgent`-Gerüst – geplant;
5. browserseitiger konkreter SyncTransport zum lokalen Gateway – geplant;
6. erster kontrollierter End-to-End-`syncTest` – geplant;
7. Timeout-, Rate-Limit-, Replay- und Idempotenzhärtung – geplant;
8. AutomationHub- und AgentHub-Darstellung – erst später geplant.

Keiner der Schritte 2 bis 8 wird durch diesen ADR-Slice implementiert.

## Konsequenzen

Positive Auswirkungen:

- Browser und Cloud-Secret werden durch eine schmale lokale serverseitige
  Grenze getrennt.
- Die reale 65.536-Byte-Grenze kann während des Streamings vor vollständiger
  Bodymaterialisierung im lokalen Gateway und vor der vorhandenen
  String-Boundary durchgesetzt werden.
- Contract, SyncService und Request Boundary bleiben kanonisch und unverändert.
- Der n8n-Workflow erhält keine manuell gepflegte Contractkopie.
- Die erste Capability bleibt anonym, minimal, synthetisch und
  nebenwirkungsfrei.
- Cloudplattform-, Provider- und Ausführungsdatengrenzen werden ausdrücklich
  sichtbar.

Kosten und Einschränkungen:

- Ein separater lokaler Prozess muss später betrieben, aktualisiert und
  abgesichert werden.
- Loopback und CORS authentisieren keinen lokalen Caller.
- Header Authentication bindet den Request nicht an seinen Body und verhindert
  keinen Replay.
- n8n Cloud bietet keine dokumentierte GoldenDawn-spezifische
  65.536-Byte-Preallocation-Garantie.
- Generierung, Paritätstests und bereinigter Workflow-Export erhöhen den
  Implementierungs- und Reviewaufwand.
- Ein Cloudausfall bleibt sichtbar; der erste Flow besitzt keine automatischen
  Retries.

Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
`v0.2.2` bleiben unverändert. Es entstehen in diesem Slice kein Server,
Transport, Gateway-Prozess, Webhook, Workflow, Bundle, Credential, operativer
Agent, externer Datenfluss, Storage, Logging, Monitoring oder UI.

## Erwogene Alternativen

### Direkter Browserzugriff auf n8n Cloud

Verworfen. Der Browser könnte das Cloud-Secret nicht schützen; ohne Secret
bliebe ein dauerhaft erreichbarer Produktionswebhook unzureichend begrenzt.

### Secret im Vite-Client

Verworfen. `VITE_*`, Bundle, DOM, Browserstorage und Browsernetzwerk sind für
dauerhafte Secrets ungeeignet.

### Öffentliches unauthentisiertes Produktionswebhook

Verworfen. Auch ein synthetischer Flow benötigt Missbrauchsbegrenzung und darf
keinen dauerhaft offenen Produktionszugang etablieren.

### n8n Cloud als einzige exakte 65.536-Byte-Preallocation-Grenze

Verworfen. Die offizielle Dokumentation belegt weder dieses Limit noch seine
Durchsetzung vor Provider- oder Runtime-Allokation.

### Manuell kopierter Contract im Code Node

Verworfen. Eine zweite manuell gepflegte Implementierung würde Contractdrift
und abweichende Sicherheitssemantik erzeugen.

### Sofortiger Wechsel zu self-hosted n8n

Verworfen. Self-Hosting würde den Betriebsumfang stark erweitern, bevor der
kleine synthetische Flow und seine Grenzen validiert sind. Die Option bleibt
bei geänderten Plattformanforderungen neu bewertbar.

### Separates vollständiges Fachbackend

Verworfen. Für den einzigen nebenwirkungsfreien `syncTest` wäre ein
allgemeines Backend unverhältnismäßig und würde neue Fach- und Storagegrenzen
einführen.

### Private Daten bereits im ersten Flow

Verworfen. Identität, Berechtigung, Body-Binding, Replay, Idempotenz,
Aufbewahrung und Datenschutz sind dafür noch nicht entschieden oder
implementiert.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn:

- eine andere Aktion, ein nicht leeres Payload oder private Daten vorgesehen
  werden;
- eine schreibende oder fachlich nebenwirkende Capability eingeführt wird;
- der Browsercaller authentisiert oder mehreren Benutzern zugeordnet werden
  soll;
- das lokale Gateway außerhalb von Loopback erreichbar werden soll;
- Header Authentication, Body-Binding, Replay- oder Idempotenzanforderungen
  geändert werden;
- die konkrete n8n-Cloud-Version Raw-Body-, Code-Node-, Credential- oder
  Payloadeigenschaften anders bereitstellt;
- der versions- und tenantgebundene Laufzeitnachweis keinen byteidentischen
  Binärzugriff vor Decodierung für die Cloudgrenze belegt;
- ein reproduzierbares kanonisches Boundary-Artefakt nicht sicher in n8n Cloud
  ausgeführt werden kann;
- Ausführungsdaten, Providerstandort oder Aufbewahrung nicht mit der
  vorgesehenen Datenminimierung vereinbar sind;
- self-hosted n8n oder ein vollständiges Backend durch neue Anforderungen
  verhältnismäßig wird.

## Verwandte Dokumente

- [ADR 0002: SyncAgent als einziges externes Gateway](0002-syncagent-gateway.md)
- [ADR 0005: Version 1 bleibt auf drei Agenten begrenzt](0005-v1-three-agent-scope.md)
- [ADR 0016: Transportneutraler SyncContract-Kern](0016-transport-neutral-sync-contract-foundation.md)
- [ADR 0017: Transportneutrale SyncService Foundation](0017-transport-neutral-sync-service-foundation.md)
- [ADR 0018: Transportneutrale SyncGateway Request Boundary](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
- [n8n: Using the Code node](https://docs.n8n.io/build/code-in-n8n/using-the-code-node/)
- [n8n: Webhook node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [n8n: Webhook credentials](https://docs.n8n.io/integrations/builtin/credentials/webhook/)
- [n8n: Endpoint environment variables](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/use-environment-variables/endpoints/)
- [n8n: Manage execution data](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/manage-execution-data/)
- [n8n: Redact execution data](https://docs.n8n.io/deploy/host-n8n/configure-n8n/security/redact-execution-data/)
