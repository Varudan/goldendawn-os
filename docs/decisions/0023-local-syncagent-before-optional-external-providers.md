# ADR 0023: Lokaler SyncAgent vor optionalen externen Providern

## Status

Angenommen – 2026-08-21

## Kontext

[ADR 0002](0002-syncagent-gateway.md) legte den `SyncAgent` als einzigen
Einstieg und Router des Agentensystems fest, verortete ihn aber zugleich in
n8n. [ADR 0019](0019-local-sync-gateway-before-n8n-cloud.md) ergänzte davor ein
lokales SyncGateway auf GD-WS01 und entschied die zwingende Zieltopologie
`lokales SyncGateway → n8n Cloud → SyncAgent`.

Die lokale Raw-Wire- und HTTP-Grenze aus
[ADR 0020](0020-local-sync-gateway-raw-wire-http-foundation.md) ist inzwischen
implementiert. Das nach
[ADR 0021](0021-generated-n8n-boundary-bundle-foundation.md) erzeugte
n8n-Boundary-Bundle und sein Manifest sind reproduzierbar geprüft, aber weder
komponiert noch aktiviert.

[ADR 0022](0022-n8n-cloud-ingress-runtime-evidence-gate.md) trennt
dokumentierte Plattformgarantien, commitgebundene OSS-Beobachtungen,
Tenantmessungen und workflowseitig nicht beobachtbare Providergrenzen. Der
geprüfte Stable-OSS-Stand dekomprimiert `gzip` beziehungsweise `deflate` vor
`req.rawBody` und reicht den erfolgreich geprüften Header-Auth-Wert im
Standard-Webhook-Output in Runtime-Execution-Daten weiter. Deshalb bleiben
`stableOssCompatibility: FAIL`, `productionUrlMeasurementStatus: UNPROVEN`
und `activationDecision: FAIL` in Evidence-Schema 1 unverändert. Eine konkrete
Tenantmessung wurde nicht ausgeführt und bleibt `UNPROVEN`.

Diese Befunde erfüllen die in ADR 0019 festgelegte Bedingung zur formalen
Neubewertung. Sie zeigen zugleich, dass Standort, Policygrenze und fachlicher
Einstieg des Agentensystems nicht von einem optionalen externen
Workflowprovider abhängen dürfen.

Dieser Slice entscheidet ausschließlich Architektur, Vertrauensgrenzen,
Providerrollen und Implementierungsreihenfolge. Er implementiert keinen
`SyncAgent`, Transport, Provideradapter, normalen Response-Upstream oder
externen Datenfluss.

## Formale ADR-Wirkung

ADR 0023 ersetzt:

- [ADR 0002](0002-syncagent-gateway.md);
- [ADR 0019](0019-local-sync-gateway-before-n8n-cloud.md).

Die historischen Entscheidungstexte bleiben als damaliger Stand erhalten.
ADR 0023 übernimmt den weiterhin gültigen Kern beider Entscheidungen und
ersetzt nur ihre Bindung des `SyncAgent` an n8n sowie den zwingenden
n8n-Cloud-Kernhop.

[ADR 0020](0020-local-sync-gateway-raw-wire-http-foundation.md) bleibt
angenommen und unverändert. [ADR 0021](0021-generated-n8n-boundary-bundle-foundation.md)
bleibt angenommen und unverändert; Bundle und Manifest bleiben korrekte, aber
derzeit nicht komponierte und nicht aktivierte n8n-Derivate.

[ADR 0022](0022-n8n-cloud-ingress-runtime-evidence-gate.md) bleibt angenommen
und vollständig unverändert. Insbesondere bleiben:

- Evidence-Schema-Version `1`;
- `stableOssCompatibility: FAIL`;
- `productionUrlMeasurementStatus: UNPROVEN`;
- `activationDecision: FAIL`;
- das Fehlen eines Felds `overallGate`.

ADR 0022 dokumentiert weiterhin den gescheiterten beziehungsweise unbewiesenen
ursprünglichen n8n-Cloud-Ingresspfad. Die neue Architektur löscht diesen Befund
nicht und deutet ihn nicht nachträglich in `PASS` um.

## Entscheidung

### Neue Zieltopologie

Die verbindliche Zieltopologie lautet:

```text
GoldenDawn-Browser
→ SyncService
→ späterer lokaler SyncTransport
→ lokales SyncGateway auf GD-WS01
→ lokaler SyncAgent
   ├─ zunächst: lokaler deterministischer syncTest-Handler
   ├─ später optional: capability-spezifischer ModelProvider
   │  ├─ OpenAI-Adapter
   │  └─ lokaler Modelladapter
   └─ später optional: capability-spezifischer WorkflowProvider
      └─ n8n-Adapter
→ lokal validierte und korrelierte SyncResponse
```

Der lokale `SyncAgent` ist die verbindliche Policy-, Validierungs-, Routing-
und Antwortgrenze des Agentensystems. n8n ist weder Standort noch zwingender
Eingang des `SyncAgent`. n8n Cloud, self-hosted n8n, OpenAI und lokale Modelle
sind ausschließlich optionale, später getrennt zu entscheidende Provider
hinter dem lokalen `SyncAgent`.

Der erste Implementierungsslice darf den `SyncAgent` als logisch getrennte,
injizierte serverseitige Komponente hinter dem bestehenden lokalen Gateway
vorsehen. Diese Entscheidung autorisiert keinen zweiten Listener, keine neue
IPC-Grenze und keinen zusätzlichen lokalen Netzwerkdienst.

### Fortgeltender Agentengrundsatz

Der aus ADR 0002 übernommene verbindliche Kern lautet:

- Der `SyncService` bleibt die einzige Kommunikationsschicht des Browsers.
- Der lokale `SyncAgent` bleibt der einzige Einstieg und Router des
  Agentensystems.
- UI und Browser wählen keinen Fachagenten und keinen Provider direkt.
- Version 1 bleibt auf `SyncAgent`, `DataAgent` und `TestAgent` begrenzt.
- Das lokale SyncGateway ist kein vierter Agent.

Provideradapter sind keine Agentenrollen. Der `SyncAgent` darf keine
domänenspezifische Test- oder Datenlogik ansammeln und greift nach Einführung
des `DataAgent` nicht selbst auf Airtable zu.

### Zone A – Browser

Zone A umfasst Browser, UI und den transportneutralen `SyncService`.

- Der Browser ist unvertrauenswürdig und besitzt keine Secrets.
- Er erzeugt weiterhin ausschließlich den geschlossenen Sechs-Felder-Request
  für `syncTest` mit exakt leerem `payload`.
- Er wählt weder Provider, Modell, Workflow, Endpoint noch Umgebung.
- Er wählt keinen Fachagenten und übermittelt keinen generischen Ausführungs-
  oder Toolauftrag.
- `VITE_*`, Browserbundle, DOM, Storage, URL und Browserkonfiguration sind
  keine vertrauenswürdigen Secret-Speicher.
- PromptVault, LearningHub, LichtwaldLog und GoldenDawn-Vault bleiben lokal und
  werden für `syncTest` weder gelesen noch exportiert.

### Zone B – lokales SyncGateway

Zone B bleibt die autoritative Raw-Wire-, HTTP-, UTF-8- und Boundary-Grenze
auf GD-WS01.

- Das Gateway bindet ausschließlich an Loopback und behandelt Browsercaller
  sowie lokale Prozesse trotzdem als unvertrauenswürdig.
- Es besitzt keine Agenten-, Modell-, Provider- oder Fachlogik.
- Es begrenzt höchstens 65.536 tatsächlich empfangene Anwendungsbytes und
  bricht ab Byte 65.537 vor Decode und Boundary-Aufruf ab.
- Es dekomprimiert nicht, dekodiert genau einmal streng als UTF-8, erhält eine
  gültige BOM als U+FEFF und normalisiert, repariert oder trimmt nicht.
- Es ruft die kanonische Request Boundary exakt einmal auf und darf
  ausschließlich deren validierte defensive Projektion weitergeben.
- Es leitet niemals Browser-Raw-Body, Browserheader, URL, Query oder die
  ursprüngliche Serialisierung an einen Provider weiter.
- Es ist kein Agent, kein allgemeines Backend, kein Storage und kein Ersatz
  für den lokalen `SyncAgent`.

### Zone C – lokaler SyncAgent

Zone C ist die autoritative lokale Policy-, Routing- und Responsegrenze.

- Der `SyncAgent` akzeptiert ausschließlich einen bereits begrenzten,
  validierten und defensiv projizierten Request aus Zone B.
- Er validiert den Request defense-in-depth erneut.
- Er besitzt eine feste Aktions-Allowlist und keinen generischen
  Ausführungspfad.
- Er entscheidet Routing und eine spätere Providerverwendung ausschließlich
  aus vertrauenswürdiger lokaler Composition und lokaler Policy.
- Er erzeugt, validiert und korreliert die normale SyncResponse lokal.
- Providerantworten bleiben unvertrauenswürdige Eingaben. Sie werden lokal
  begrenzt, allowlist-basiert defensiv projiziert, validiert und korreliert.
- Modelloutput darf niemals selbst Berechtigungen, Routing, Providerwahl oder
  Toolausführung bestimmen.
- Fehler bleiben fail-closed und statisch redigiert. Fremde Provider-,
  Dependency- oder Exceptiondetails werden nicht an den Browser gespiegelt.

### Zone D – optionale externe oder lokale Provider

Zone D umfasst ausschließlich später separat freigegebene Provider hinter dem
lokalen `SyncAgent`.

- Provider sind standardmäßig deaktiviert.
- Sie sind nicht Bestandteil des aktuellen `syncTest`.
- Sie sind ausschließlich über capability-spezifische Adapter erreichbar.
- Sie erhalten nur eine explizite, minimierte und neu erzeugte Projektion.
- Sie erhalten niemals den Browser-Raw-Body, Browserheader, die Browser-URL,
  Queryparameter oder die ursprüngliche Serialisierung.
- Sie antworten niemals direkt an Browser, `SyncService` oder lokales
  SyncGateway.
- Ihre Antworten werden vor einer normalen SyncResponse vollständig an Zone C
  zurückgeführt und dort begrenzt, projiziert, validiert und korreliert.

### Vollständig lokaler und modellfreier `syncTest`

Der erste lokale `SyncAgent` bleibt vollständig modellfrei. Der bestehende
leere, synthetische und fachlich nebenwirkungsfreie `syncTest` wird
deterministisch und vollständig lokal beantwortet.

Der Handler:

- ruft keinen `ModelProvider` auf;
- ruft keinen `WorkflowProvider` auf;
- ruft keinen n8n-, OpenAI-, lokalen Modell- oder sonstigen externen Adapter
  auf;
- setzt keinen solchen Provider oder Adapter als erforderliche Dependency
  voraus;
- liest keine privaten GoldenDawn-Bestände;
- führt keine Tools, Persistenz oder fachlichen Nebenwirkungen aus.

`dataOrigin: "synthetic"` bleibt ausschließlich eine Contractklassifikation
und ist kein Herkunfts- oder Datenschutzbeweis.

### Konzeptionelle Providergrenzen

Für spätere Entscheidungen werden genau zwei getrennte Portklassen
konzeptionell vorgesehen:

- `ModelProvider`;
- `WorkflowProvider`.

Dieser ADR definiert keine JavaScript-Signaturen, Methoden, Schemas oder
Dateien für diese Portklassen. Es gibt keinen gemeinsamen generischen Port wie
`execute`, keinen frei wählbaren Endpoint und keinen Requestpfad für beliebige
Modelle, Prompts, Workflows, Tools oder Agenten.

Provider, Modell, Workflow, Endpoint und Umgebung werden ausschließlich durch
vertrauenswürdige lokale Composition festgelegt. Sie stammen niemals aus
Browserwerten, Requestfeldern oder Modelloutput.

Die GoldenDawn-seitige Kopie späteren Credentialmaterials liegt ausschließlich
in der vertrauenswürdigen Laufzeitkonfiguration oder Secretverwaltung des
konkreten serverseitigen Adapters auf GD-WS01. Sie ist niemals Bestandteil von
SyncRequest, SyncResponse oder Agentenresultat und gelangt weder in Browser-
oder `VITE_*`-Konfiguration, Storage, URL, Repository, GoldenDawn-Vault,
Workflow-Export, Testfixture, Screenshot noch Anwendungslog. Benötigt eine
später gesondert entschiedene Authentisierung providerseitiges Prüf- oder
Credentialmaterial, liegt dieses ausschließlich im Credential-/Secret-Store
des Providers. Lokale Adapterkopie und providerseitiges Prüfmaterial bilden
getrennte Vertrauens- und Betriebsgrenzen. Eine Providerablage beweist weder
Redaction noch Retention oder Nichtweitergabe. Same-Realm-Komposition ist keine
Sandbox und wird nicht als technische Secret-Isolation dargestellt.

### Aktivierungsgate für einen späteren OpenAI-Adapter

Dieser ADR autorisiert keinen OpenAI-Adapter. Vor dessen Aktivierung sind
mindestens erforderlich:

- ein eigener Adapter- und Datenschutzslice;
- ein dediziertes serverseitiges Credential auf GD-WS01;
- eine feste Modell- und Endpoint-Allowlist;
- explizite Datenminimierung;
- ein endlicher Timeout;
- Request-, Response- und Kostenlimits;
- keine Redirects und zunächst keine automatischen Retries;
- vollständige lokale Outputvalidierung;
- keine Tools oder autonomen Aktionen im ersten Modellslice;
- eine bewusste Entscheidung über externe Verarbeitung und Retention.

### Aktivierungsgate für einen späteren lokalen Modelladapter

Dieser ADR autorisiert keinen lokalen Modelladapter. Vor dessen Aktivierung
sind mindestens erforderlich:

- eine kontrollierte Modellquelle und Integritätsbindung;
- keine automatischen Downloads oder Telemetrie;
- Ressourcen-, Zeit- und Antwortgrenzen;
- dieselbe lokale Outputvalidierung wie für ein Cloudmodell.

Ein lokales Modell ist kein vertrauenswürdiger Policy- oder
Berechtigungsentscheider.

### Aktivierungsgate für einen späteren n8n-Adapter

Ein n8n-Adapter bleibt aktuell gesperrt.

- n8n darf später nur einen vom lokalen `SyncAgent` neu erzeugten,
  minimierten und sanitisierten Request erhalten.
- Ursprüngliche Browserbytes und Browserheader dürfen n8n nie erreichen.
- `Raw Body` ist kein erforderlicher Beweis mehr für ursprüngliche
  Browserbytes und darf nicht nachträglich als solcher dargestellt werden.
- Der bekannte Header-Auth-/Execution-Data-Befund aus ADR 0022 bleibt ein
  Blocker, entscheidet aber keine Authentisierungslösung.
- ADR 0023 entscheidet weder Header Authentication, Bearer-Secret, konkreten
  Headernamen, JWT, HMAC, asymmetrisches Verfahren, Credentialformat noch
  Rotationsmechanismus.
- Ein langlebiges wiederverwendbares Header-Secret darf ohne neue positive
  Authentisierungs- und Execution-Data-Entscheidung nicht aktiviert werden.
- ADR 0023 autorisiert weder Cloudzugriff noch Tenantmessung. Vor jeglicher
  Vorbereitung oder Ausführung einer neuen n8n-Tenantmessung müssen ein neuer
  n8n-Adapter-ADR angenommen und eine neue, auf den nachgelagerten Adapter
  zugeschnittene Evidenz-Schemaversion festgelegt sein.
- Erst danach benötigen die Anlage eines temporären Workflows, ein
  Wegwerfcredential, jeder einzelne synthetische Test-URL-One-shot sowie der
  vorab definierte Cleanup und die Entfernung der Cloudartefakte jeweils eine
  eigene ausdrückliche Freigabe.
- Jede Supportanfrage ist unabhängig davon separat freizugeben. Sie darf eine
  spätere Entscheidung vorbereiten, autorisiert aber weder Workflow,
  Credential, Tenantvorbereitung oder -ausführung, Adapteraktivierung noch
  Productionlauf.
- Ohne angenommenen neuen n8n-Adapter-ADR und festgelegte neue Evidenz-
  Schemaversion gibt es keinen Workflow, kein Credential und keinen Test-URL-
  Verkehr. Ein Production-URL-Runner oder -Messpfad existiert nicht.
- Evidence-Schema 1 bleibt unverändert mit `stableOssCompatibility: FAIL`,
  `productionUrlMeasurementStatus: UNPROVEN`, `activationDecision: FAIL` und
  ohne `overallGate`.
- Test- oder Production-Webhook, Credential, Workflow und Tenantmessung bleiben
  außerhalb dieses Slices.

n8n Cloud und self-hosted n8n bleiben mögliche Implementierungen eines
`WorkflowProvider`, nicht Teile der verbindlichen Kernarchitektur. Das Bundle
und Manifest aus ADR 0021 bleiben dafür als lokale, derzeit unkomponierte und
inaktive Derivate erhalten.

### Response-, Fehler- und Datenschutzgrenze

Normale SyncResponses werden ausschließlich lokal durch den `SyncAgent`
erzeugt, vollständig validiert und mit dem angenommenen Request korreliert.
Eine gültige normale Contract-Fehlerresponse bleibt eine normale SyncResponse;
der fachliche Erfolg liegt ausschließlich in `syncResponse.success`.

Frühe Gateway-Responses, lokale HTTP- oder Boundaryfehler, Transportfehler,
Providerfehler und ungeeignete Provideroutputs werden nicht in normale
SyncAgent-Responses umgeschrieben. Sie bleiben statisch redigierte Fehler ihrer
jeweiligen lokalen Grenze.

PromptVault, LearningHub, LichtwaldLog und GoldenDawn-Vault bleiben lokal. Der
aktuelle `syncTest` liest oder exportiert keinen dieser Bestände. Jede spätere
private Datenklasse, weitere Aktion, Toolausführung oder Nebenwirkung benötigt
vorher neue Contract-, Identitäts-, Berechtigungs-, Replay-, Idempotenz- und
Datenschutzentscheidungen.

Die Verwendung einzelner Prinzipien wie Least Privilege, Defense-in-Depth und
fail-closed Verarbeitung ist kein vollständiger Zero-Trust-, DSGVO-, AI-Act-,
Exactly-once- oder sonstiger Compliance-Nachweis.

### Verbindliche Implementierungsreihenfolge

Innerhalb von `v0.3.0` und für die nachfolgenden Providerentscheidungen gilt:

1. ADR 0023 – Entscheidung „lokaler SyncAgent, optionale Provider“;
2. vollständig lokaler, modellfreier und importinaktiver SyncAgent-Kern
   ausschließlich für `syncTest`;
3. getrennte kontrollierte Komposition von lokalem Gateway und lokalem
   SyncAgent;
4. browserseitiger konkreter SyncTransport und lokaler
   End-to-End-`syncTest`;
5. lokale Missbrauchs-, Parallelitäts-, Zeit- und Ressourcenbegrenzung;
6. erst danach gesonderte Providerentscheidungen;
7. OpenAI-, lokales-Modell- und n8n-Adapter jeweils als getrennte Slices;
8. private Daten, weitere Aktionen, Tools und Nebenwirkungen erst nach neuen
   Contract-, Identitäts-, Berechtigungs-, Replay-, Idempotenz- und
   Datenschutzentscheidungen.

Bis zur tatsächlichen späteren Gateway-/SyncAgent-Komposition endet jeder
lokal akzeptierte Request weiterhin mit dem statischen HTTP-Status `503`.

## Konsequenzen

Positive Auswirkungen:

- Die zentrale Agenten- und Policygrenze ist lokal kontrolliert und nicht an
  einen einzelnen Workflow- oder Modellprovider gebunden.
- Der erste End-to-End-Flow kann ohne Modell, Cloud, Credential oder externen
  Provider geprüft werden.
- Providerwechsel und lokale Alternativen verändern weder Browservertrag noch
  den einzigen Einstieg des Agentensystems.
- Browser-Raw-Material und lokale Sicherheitsentscheidungen bleiben vor jeder
  optionalen Providergrenze.
- Negative und unbewiesene n8n-Evidenz bleibt sichtbar und blockiert den
  n8n-Adapter, ohne den vollständig lokalen `syncTest`-Pfad zu blockieren.

Kosten und Einschränkungen:

- Der lokale `SyncAgent` wird eine kritische Komponente und benötigt enge,
  mutationswirksame Tests für Policy, Routing, Korrelation und Redaction.
- Gateway und `SyncAgent` müssen trotz Same-Realm-Komposition logisch und
  testbar getrennt bleiben.
- Jeder Provider benötigt einen eigenen Adapter-, Sicherheits-, Datenschutz-
  und Betriebsentscheid statt einer generischen Integrationsschicht.
- Lokale Ausführung beseitigt weder Missbrauchs-, Ressourcen-,
  Supply-Chain- noch Same-Realm-Risiken.
- Der vorhandene n8n-Bundle- und Evidence-Aufwand bleibt als korrektes, aber
  derzeit inaktives optionales Providerfundament bestehen.

Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
`v0.2.2` bleiben unverändert. Dieser Slice erzeugt keinen Code, Test,
Transport, Listener, Providerport, Adapter, Credential, Workflow, Request,
externen Datenfluss, Storage, Log, Telemetrie oder UI.

## Erwogene Alternativen

### n8n Cloud weiterhin als zwingenden Standort des SyncAgent verwenden

Verworfen. Der Agentenkern und seine Policy würden von einem optionalen
externen Provider und dessen aktuell negativem beziehungsweise unbewiesenem
Ingress- und Execution-Data-Stand abhängen.

### n8n self-hosted als neuen zwingenden Kernhop verwenden

Verworfen. Self-Hosting ändert Betriebs- und Plattformgrenzen, beseitigt aber
nicht die unnötige Kopplung der lokalen Agentenpolicy an einen
Workflowprovider.

### Provider direkt aus Browser oder lokalem SyncGateway aufrufen

Verworfen. Der Browser kann Secrets nicht schützen und darf weder Provider
noch Routing bestimmen. Das Gateway würde Agenten- und Providerlogik mit seiner
autoritativen Wire-/HTTP-Grenze vermischen.

### Einen generischen Providerport mit frei wählbarer Operation einführen

Verworfen. Ein `execute`-Pfad oder frei gewählte Modelle, Workflows, Endpoints,
Tools und Agenten würden die feste Capability- und Composition-Allowlist
umgehen.

### Bereits der erste SyncAgent-Slice verwendet ein Modell

Verworfen. `syncTest` ist leer, synthetisch und deterministisch. Ein Modell
würde Kosten-, Datenschutz-, Output-, Timeout- und Supply-Chain-Grenzen ohne
fachliche Notwendigkeit einführen.

### Den lokalen SyncAgent als zweiten Dienst oder IPC-Hop starten

Verworfen. Für den ersten Kern genügt eine logisch getrennte injizierte
serverseitige Komponente hinter dem bestehenden Listener. Eine neue
Prozessgrenze benötigt eine eigene spätere Entscheidung.

### ADR 0022 wegen der neuen Topologie als bestanden oder gegenstandslos werten

Verworfen. ADR 0022 bleibt die verbindliche Evidenz des ursprünglichen
n8n-Ingresspfads und ein Blocker für jeden späteren n8n-Adapter mit der
betroffenen Header-Auth-/Execution-Data-Semantik.

## Bedingungen für eine Neubewertung

Diese Entscheidung wird überprüft, wenn:

- eine andere Aktion, ein nicht leeres Payload oder private Daten zugelassen
  werden sollen;
- ein Fachagent oder Provider eine neue Berechtigungs- oder Toolgrenze
  benötigt;
- der lokale `SyncAgent` außerhalb der bestehenden Gateway-Laufzeit in einen
  eigenen Prozess oder Dienst verschoben werden soll;
- mehrere lokale Listener, IPC oder Remotezugriff benötigt werden;
- ein `ModelProvider` oder `WorkflowProvider` aktiviert werden soll;
- OpenAI, ein lokales Modell oder n8n konkrete Modell-, Credential-, Daten-,
  Retention-, Kosten- oder Laufzeitgrenzen ändert;
- Provideroutput Tools, Nebenwirkungen oder autonome Aktionen auslösen soll;
- die bestehende Contract-, Boundary-, Response- oder Korrelationssemantik
  geändert wird;
- Calleridentität, Authentisierung, Autorisierung, Replay- oder
  Idempotenzschutz eingeführt werden;
- eine vollständige technische Secret-Isolation statt Same-Realm-Composition
  erforderlich wird.

## Verwandte Dokumente

- [ADR 0002: SyncAgent als einziges externes Gateway](0002-syncagent-gateway.md)
- [ADR 0005: Version 1 bleibt auf drei Agenten begrenzt](0005-v1-three-agent-scope.md)
- [ADR 0016: Transportneutraler SyncContract-Kern](0016-transport-neutral-sync-contract-foundation.md)
- [ADR 0017: Transportneutrale SyncService Foundation](0017-transport-neutral-sync-service-foundation.md)
- [ADR 0018: Transportneutrale SyncGateway Request Boundary](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
- [ADR 0019: Lokales SyncGateway vor n8n Cloud](0019-local-sync-gateway-before-n8n-cloud.md)
- [ADR 0020: Lokale SyncGateway Raw-Wire- und HTTP-Foundation](0020-local-sync-gateway-raw-wire-http-foundation.md)
- [ADR 0021: Generated n8n Boundary Bundle Foundation](0021-generated-n8n-boundary-bundle-foundation.md)
- [ADR 0022: n8n Cloud Ingress & Runtime Evidence Gate](0022-n8n-cloud-ingress-runtime-evidence-gate.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`README.md`](../../README.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
