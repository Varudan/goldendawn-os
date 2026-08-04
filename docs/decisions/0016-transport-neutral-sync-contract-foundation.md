# ADR 0016: Transportneutraler SyncContract-Kern und künftige Transportgrenze

## Status

Angenommen – 2026-08-03

## Kontext

Mit `v0.3.0 – SyncAgent and Webhook Foundation` beginnt die Vorbereitung der
ersten kontrollierten externen Kommunikation von GoldenDawn OS. Ein
browserbasierter Vite-Client kann jedoch keinen eingehenden öffentlichen
Webhook terminieren und darf keine dauerhaften Secrets verwahren. Gleichzeitig
sollen Request-, Response- und Fehlerverträge unabhängig von UI, HTTP, n8n und
Agentenlaufzeit streng prüfbar sein, bevor ein Transport hinzukommt. Die
deterministische und seiteneffektfreie Garantie gilt dabei für stabile,
seiteneffektfreie gewöhnliche Records, Arrays und Strings; JavaScript-Proxies
bilden eine ausdrücklich engere Vertrauensgrenze.

[ADR 0002](0002-syncagent-gateway.md) bestimmt den `SyncAgent` langfristig als
einzigen kontrollierten Einstiegspunkt in das Agentensystem. ADR 0016 ersetzt
diese Entscheidung nicht. Sie präzisiert, dass eine serverseitige
Webhook-/Gateway-Grenze den browserinitiierten HTTP-Aufruf entgegennimmt, bevor
ein operativer `SyncAgent` validierte Daten verarbeitet. Der kanonische Name in
Vertrag und Dokumentation ist exakt `SyncAgent`; ein zusätzlicher Alias oder
abweichender Wire-Identifier wird nicht eingeführt.

Die umfangreicheren LearningTest-, TestAgent- und DataAgent-Verträge sind noch
Zielplanung späterer Versionen. Der erste Slice benötigt deshalb einen bewusst
kleinen Vertrag, dessen Kern keine privaten lokalen Bestände liest, persistiert
oder exportiert und der spätere Transport- oder Fachentscheidungen nicht
vorwegnimmt.

## Entscheidung

`v0.3.0` beginnt mit einer transportneutralen **SyncContract Foundation** in
`src/contracts/syncContract.js`. Das Modul kennt weder UI noch Storage,
Netzwerk, Endpoint, HTTP, Webhook, n8n oder Agentenlaufzeit. Es exportiert
geschlossene, eingefrorene Allowlists und transportneutrale Validatoren für
genau ein geschlossenes `syncTest`-Vertragsprofil:

- Contract-Version `1.0`;
- Aktion `syncTest`;
- Quelle `goldendawn-os`;
- zuständiger Handler `SyncAgent`;
- Response-Klassifikation `dataOrigin: "synthetic"` im Erfolgsprofil.

`source: "goldendawn-os"` ist nur eine syntaktische Klassifikation dieses
Objektvertrags. Der Wert beweist weder Authentisierung noch technische
Herkunft, Identität oder Berechtigung. Eine spätere serverseitige Grenze leitet
vertrauenswürdige Herkunft aus ihrem Transport- und Authentisierungskontext ab;
Routing und Autorisierung beruhen niemals allein auf `source`.

Der reguläre Request besitzt exakt die sechs Felder `version`, `action`,
`source`, `requestId`, `timestamp` und `payload`. Er besitzt kein vorgesehenes
Inhalts- oder Freitextfeld; `payload` ist exakt `{}`. Freier Text, Echo-Daten,
Client-Kontext oder deklarativer Modus sind ausgeschlossen. Ein Client-Modus
dürfte auch später keine Umgebung, Endpoints oder Berechtigungen bestimmen;
diese Zuordnung ist serverseitig.

`requestId` ist verpflichtend und wird nur strukturell geprüft. `timestamp`
wird nur als kanonischer UTC-Wert und relativ zu einer explizit übergebenen
Referenzzeit im inklusiven Fenster von `±300000 ms` geprüft. Das beweist weder
ihre semantische Herkunft noch, dass sie keine privaten oder nutzergenerierten
Informationen codieren. Ein späterer vertrauenswürdiger Request-Builder muss
die ID über einen kontrollierten Generator und den Zeitpunkt über eine
kontrollierte Clock erzeugen; beide Werte dürfen niemals aus privaten oder
nutzergenerierten Inhalten abgeleitet werden. Die Präfix- und Längenprüfung
garantiert auch keine Kollisionsarmut. Dafür sind später der
GoldenDawn-Generator für `req_`-IDs und der serverseitige Gateway-Generator für
`gateway_`-IDs verantwortlich.

Eine normale Response korreliert Version, Aktion und `requestId` exakt mit dem
vollständig gültigen Request. Erfolg verwendet `handledBy: "SyncAgent"`,
`data: { status: "ok", dataOrigin: "synthetic" }`, `error: null`, leere
Warnungen und `meta.processedBy: ["SyncAgent"]`. Normale Fehler verwenden
ebenfalls den korrelierten Umschlag, `data: null` und ausschließlich die
statischen Profile `VALIDATION_ERROR`, `SERVICE_UNAVAILABLE` oder
`INTERNAL_ERROR`.

`dataOrigin: "synthetic"` ist nur eine validierte Vertragsklassifikation. Der
Wert beweist weder tatsächliche Herkunft noch die Abwesenheit privater Daten
oder allgemeine Datenschutzkonformität.

Frühe Fehler vor einem gültig korrelierbaren Request bilden ein getrenntes
Gateway-Profil. Es verwendet eine serverseitige `gateway_`-Korrelations-ID,
`action: null`, `handledBy: null`, `data: null`, leere Warnungen und eine leere
`processedBy`-Kette. Erlaubt sind nur `INVALID_JSON`, `VALIDATION_ERROR`,
`UNSUPPORTED_VERSION`, `UNKNOWN_ACTION`, `PAYLOAD_TOO_LARGE` und `FORBIDDEN`.
Alle Clientmeldungen, Retry-Werte und leeren Detailarrays sind statisch und
redigiert; ungültige Rohwerte werden nicht übernommen.

Der reine Raw-Body-Helper akzeptiert ausschließlich einen bereits vorhandenen
String und erlaubt inklusive genau 65.536 UTF-8-Bytes. Er serialisiert keine
Objekte. Weil dieser Slice keinen Transport enthält, ist der Helper keine
Durchsetzung an einem Webhook; ein späteres Gateway muss rohe Bodybytes vor dem
JSON-Parsing selbst begrenzen. Danach parst es JSON unter kontrollierter
Fehlerbehandlung und validiert erst den resultierenden datenförmigen, weiterhin
unvertrauenswürdigen Wert. `JSON.parse` ohne benutzerdefinierten Reviver
transportiert keine Proxies, Accessors, Symbole oder Trap-Funktionen.

Die Validatoren prüfen stabile gewöhnliche Records und Arrays über eigene Keys
und Property-Deskriptoren. Sie schreiben selbst keine Properties und lesen
gewöhnliche eigene Accessors nicht als Werte; deren Getter werden dabei nicht
aufgerufen. Unbekannte Felder, Symbole, ungeeignete Prototypen sowie sparse oder
manipulierte Arrays werden anhand der beobachteten Struktur abgelehnt.

Reflection auf Proxies kann jedoch `getPrototypeOf`-, `ownKeys`- und
`getOwnPropertyDescriptor`-Traps ausführen. Beim Normalisieren eines von einer
Trap gelieferten Descriptors kann die JavaScript-Laufzeit zusätzlich Getter
auf dem Descriptorobjekt ausführen. Traps und Descriptor-Getter können die
Eingabe mutieren, externen Zustand ändern, inkonsistente Ergebnisse liefern
oder werfen. Same-Realm-Proxy-Traps sind beliebiger JavaScript-Code und können
globale Laufzeitobjekte verändern, die Ausführung blockieren oder spätere
Operationen zum Werfen bringen. Reflection-Catches behandeln beobachtbare
Fehler kontrolliert, können diese Wirkungen aber weder verhindern noch
rückgängig machen.

Eine portable vollständige Proxy-Erkennung existiert nicht. Ein transparenter
oder zustandsabhängiger Proxy kann während einer Validierung wie sein Ziel
erscheinen. Ein erfolgreiches Ergebnis bestätigt daher ausschließlich die in
diesem Aufruf beobachtete Struktur; es garantiert weder Seiteneffektfreiheit
noch unveränderliche Objektidentität oder einen später identischen Zustand.

Der erste reale verbundene Fluss wird später browserinitiiert:

```text
GoldenDawn
  → SyncService
  → serverseitiger n8n-Webhook/Gateway
  → SyncAgent
  → validierte Antwort
```

Der `SyncAgent` wird später im AgentHub dargestellt. Verbindungen, Webhooks und
Workflows werden später im AutomationHub dargestellt; ausschließlich dort wird
`syncTest` ausgelöst. Diese Zuständigkeiten werden im aktuellen Slice nur
dokumentiert. Es wird keine Hub-UI implementiert.

## Konsequenzen

- Request-, Response-, Korrelations- und Fehlersemantik können für stabile,
  seiteneffektfreie gewöhnliche Daten ohne Netzwerk, Uhrzugriff oder
  Infrastruktur reproduzierbar getestet werden.
- Geschlossene Profile verhindern zusätzliche Felder und frei gewählte Agenten
  oder Modi; ein vorgesehenes Inhalts- oder Freitextfeld existiert nicht. Sie
  beweisen nicht, dass zulässige Metadaten keine privaten Fragmente codieren.
- PromptVault, LearningHub und LichtwaldLog bleiben vollständig lokal. Der
  Vertragskern liest, persistiert, synchronisiert oder exportiert deren private
  Bestände nicht. Mangels Transport ist in diesem Slice kein privater externer
  Datenfluss implementiert.
- Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
  `v0.2.2` bleiben unverändert; `v0.3.0` ist unveröffentlicht und in Arbeit.
- Der Slice schafft weder Netzwerksicherheit noch einen operativen Agenten. Es
  gibt keinen Webhook, `SyncService`, n8n-Workflow, keine Authentisierung,
  Signaturprüfung, CORS- oder Rate-Limit-Durchsetzung, Retries, Idempotenz-,
  Telemetrie- oder Persistenzschicht.
- Die späteren LearningTest- und DataAgent-Zielverträge werden durch diese
  Entscheidung nicht als implementiert erklärt und können vor Umsetzung eine
  neue Vertragsversion oder einen weiteren ADR benötigen.

## Erwogene Alternativen

### Webhook und SyncAgent gleichzeitig mit dem Vertrag implementieren

Verworfen. Transport, serverseitiger Schutz und Orchestrierung würden die
erste Änderung unnötig koppeln und könnten Vertragsfehler erst in einer
laufenden Infrastruktur sichtbar machen.

### Den Browser selbst als Webhook-Endpunkt behandeln

Verworfen. Das statische Vite-Frontend initiiert ausgehende Requests; es ist
keine vertrauenswürdige serverseitige Terminierungsgrenze für eingehende
öffentliche Webhooks.

### `requestId` optional lassen oder im SyncAgent erzeugen

Verworfen. Normale Antworten benötigen eine vom Aufrufer festgelegte, exakte
Korrelation. Frühe nicht korrelierbare Fehler besitzen dafür bewusst das
getrennte `gateway_`-Profil.

### Freien Text oder Echo-Daten in `syncTest.payload` erlauben

Verworfen. Ein exakt leerer Payload minimiert Datenabfluss, Missbrauchsfläche
und Schemakomplexität; der Vertrag sieht kein Inhalts- oder Freitextfeld vor.
Das beweist nicht, dass syntaktisch gültige `requestId`- oder `timestamp`-Werte
keine privaten Fragmente codieren.

### Client-Modus und Endpoint in den Request aufnehmen

Verworfen. Clientangaben dürfen keine Umgebung, Datenquelle, Berechtigung oder
Route bestimmen. Diese Werte gehören in eine spätere vertrauenswürdige
serverseitige Konfiguration.

### Ungültige Objekte vorab serialisieren

Verworfen. Getter, Proxies und nicht serialisierbare Werte könnten dabei Code
ausführen oder Exceptions auslösen. Strukturprüfung und reine Größenmessung
bleiben getrennt; der Größenhelper akzeptiert nur Strings.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, bevor eine weitere Aktion oder Datenherkunft
in die implementierte Allowlist aufgenommen, der Envelope erweitert, ein
Transport oder operativer `SyncAgent` eingeführt oder private Daten für einen
expliziten minimierten externen Use Case freigegeben werden. Webhook-
Terminierung, Authentisierung, Signaturen, CORS, Rate Limits, Retry- und
Idempotenzverhalten benötigen vor produktivem Einsatz eine dokumentierte
serverseitige Sicherheitsentscheidung.
