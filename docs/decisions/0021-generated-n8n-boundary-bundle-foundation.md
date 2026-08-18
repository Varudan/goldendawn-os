# ADR 0021: Generated n8n Boundary Bundle Foundation

## Status

Angenommen – 2026-08-17

## Kontext

Die transportneutralen Foundations aus
[ADR 0016](0016-transport-neutral-sync-contract-foundation.md),
[ADR 0017](0017-transport-neutral-sync-service-foundation.md) und
[ADR 0018](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
sowie die lokale HTTP-/Wire-Grenze aus
[ADR 0020](0020-local-sync-gateway-raw-wire-http-foundation.md) sind
implementiert. [ADR 0019](0019-local-sync-gateway-before-n8n-cloud.md)
verlangt vor einem späteren n8n-Cloud-Workflow ein reproduzierbar generiertes,
selbstständiges Boundary-Artefakt. Eine manuell gepflegte zweite Contract- oder
Boundary-Implementierung ist ausgeschlossen.

Ein n8n Code Node kann nicht unmittelbar die ES-Module aus dem Repository
importieren. Der auf den 2026-08-17 datierte offizielle Plattformstand trennt
außerdem n8n Cloud von selbst gehosteter Konfiguration:

- Die [Code-Node-Dokumentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/)
  erlaubt externe npm-Module nur für selbst gehostete Instanzen; daraus folgt
  keine entsprechende n8n-Cloud-Garantie.
- Die aktuelle selbst gehostete Anleitung
  [Enable modules in Code node](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/configuration-examples/enable-modules-in-code-node/)
  beschreibt die dortigen Allowlist-Environmentvariablen. Diese
  Self-Hosted-Konfiguration ist keine Cloudfähigkeit.
- Die [Webhook-Node-Dokumentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
  beschreibt die Option `Raw Body` nur als Empfang in einem Rohformat. Sie
  belegt weder einen byteidentischen ursprünglichen Wire-Buffer noch eine
  GoldenDawn-spezifische Prüfung vor Provider- oder Runtime-Allokation.

Dieser Slice setzt deshalb ausschließlich Schritt 3 der in ADR 0019
festgelegten Reihenfolge um: Er erzeugt und prüft das eigenständige Boundary-
Artefakt. Er implementiert keinen n8n-Workflow und keinen Cloudtransport. ADR
0016 bis ADR 0020 bleiben unverändert und werden nicht rückwirkend umgedeutet.

## Entscheidung

### Kanonische Quellen, gepflegte Buildgrenze und generierte Derivate

Die einzigen fachlich kanonischen Quellen bleiben:

```text
src/contracts/syncContract.js
src/gateways/syncGatewayRequestBoundary.js
```

Der kleine Entry
`scripts/n8n/syncGatewayBoundaryBundleEntry.js` exponiert ausschließlich die
für das Artefakt erlaubte Factory. Er ist eine explizit gepflegte,
manifestierte nichtfachliche Glue- und Quelldatei, aber keine dritte fachlich
kanonische Implementierung. Der Generator
`scripts/n8n/generateSyncGatewayBoundaryBundle.js` ist ebenfalls explizit
gepflegtes Repository-Tooling. Ausschließlich das eingecheckte Bundle und sein
Manifest sind reproduzierbar generierte Derivate; das Bundle wird niemals
manuell fachlich gepflegt.

Die vollständige Struktur lautet:

```text
scripts/n8n/
├── generateSyncGatewayBoundaryBundle.js
└── syncGatewayBoundaryBundleEntry.js

artifacts/n8n/
├── syncGatewayRequestBoundary.bundle.js
└── syncGatewayRequestBoundary.bundle.manifest.json

tests/
└── n8nSyncGatewayBoundaryBundle.test.js
```

### Generator und Toolchain

Der Generator verwendet die bereits im Lockfile gebundene Vite-`8.1.4`-/
Rolldown-Toolchain. Es wird keine neue npm-Abhängigkeit ergänzt und kein
`npm install` benötigt. Zwei explizite Paket-Scripts bilden die einzige
Projektoberfläche:

```text
npm run bundle:n8n:generate
npm run bundle:n8n:check
```

`bundle:n8n:generate` erzeugt beziehungsweise aktualisiert Bundle und Manifest.
`bundle:n8n:check` erzeugt dieselben erwarteten Bytes ausschließlich im
Arbeitsspeicher, verändert keine Projektdatei und endet bei jeder Abweichung mit
einem Fehlercode. Beide Modi verwenden fest geordnete repository-relative
Quellpfade; der absolute Build-Root geht nicht in die Ausgabebytes ein. Jede der
drei manifestierten Quellen Contract, Boundary und Entry wird über einen
sicheren FileHandle exakt einmal vollständig gelesen. SHA-256 und die
Vite-Virtualmodule stammen aus demselben danach unveränderlichen
In-Memory-Snapshot. Der Build liest diese Quellen nicht erneut aus dem
Arbeitsbaum; ein ABA-Wechsel der Live-Datei kann deshalb nicht unbemerkt andere
Bundler- als Manifestbytes liefern.

Die Bundlerausgabe wird mit `strict: true` und
`attachDebugInfo: "none"` erzeugt, sodass keine potenziell pfadabhängigen
`//#region …`-/`//#endregion`-Direktiven entstehen. Der Generator validiert den
exakten Drei-Modul-Graphen, leere statische und dynamische Chunkimports sowie
die vollständige bekannte Wrapperform. Er entfernt fail-closed ausschließlich
den deklarativen Wrapper und bearbeitet fachlichen Code nicht textuell.

Vor jedem Generate-Write werden kanonischer Repository-Root, Zielordner und
beide festen Outputpfade auf Containment, von Node erkannte symbolische Links
und Junctions sowie `realpath`-Abweichungen geprüft. Unklare oder aus dem Root
herausführende Pfade werden fail-closed abgelehnt. Der Generator legt
unvorhersagbar benannte Tempdateien exklusiv im verifizierten Zielordner an,
prüft ihre Identität und Bytes, ersetzt zuerst das Artefakt und zuletzt das
Manifest, prüft das Paar abschließend erneut und bereinigt weiterhin
identitätsgleich zuordenbare Tempdateien. Ein kontrollierter Abbruch zwischen
beiden Replaces hinterlässt ein nicht zusammenpassendes Paar, das der
Checkmodus anschließend ablehnt. Jeder Replace betrifft nur seine einzelne
Datei; es gibt keine atomare Paartransaktion und keine Power-Loss- oder
Single-Writer-Garantie. Die portable Node-API attestiert nicht jeden
Windows-Reparse-Tag; ebenso gibt es keine Garantie gegen einen bösartigen
gleichzeitig ausgeführten Reparse-Austausch.

Artefakt und Manifest sind UTF-8 ohne BOM, verwenden ausschließlich LF und
besitzen einen finalen Zeilenumbruch. Es gibt keine Source Map, Zeitstempel,
absoluten oder temporären Pfade, Hostnamen, Localewerte oder zufälligen
Buildwerte. Identische Quellen und dieselbe Lockfile-Toolchain erzeugen
byteidentische Ergebnisse, unabhängig vom absoluten Arbeitsverzeichnis.

### Artefaktformat und öffentliche API

Nach dem statischen menschenprüfbaren Header sind die Artefaktbytes selbst
genau ein seiteneffektfreies, direkt bindbares Expression-IIFE. `"use strict";`
ist der erste Prolog im IIFE-Body und kein Top-Level-Statement; nach dem
Ausdruck folgt kein separates Semikolon-Statement. Das Artefakt kann deshalb
unverändert unmittelbar hinter `const boundaryBundle =` eingesetzt werden.
Es besitzt kein Top-Level-`var` und mutiert keinen globalen Namespace. Seine
Auswertung liefert eine gewöhnliche, eingefrorene API mit exakt einem eigenen
Feld:

```js
{
  createSyncGatewayRequestBoundary
}
```

Die Factory behält die bestehende Dependency-Injection für
`generateGatewayRequestId` und `getCurrentTimestamp`. Ihr Result bleibt die
eingefrorene gewöhnliche API mit exakt:

```js
{
  processSyncRawBody
}
```

Das Laden beziehungsweise Auswerten des Ausdrucks verarbeitet keinen Request.
Das Bundle benötigt zur Laufzeit weder ESM- noch CommonJS-Imports und enthält
kein `import`, `export`, `require()`, `eval()` oder `new Function()`. Es greift
nicht auf Netzwerk, Dateisystem, Prozesse, Environment, Credentials oder
Secrets zu, erzeugt keine Logs oder Telemetrie und mutiert keinen globalen
Namespace. Es erfindet keine Webhook-, `$json`-, `$input`-, `items`- oder
sonstige n8n-Eingabestruktur.

Das Artefakt beginnt ausschließlich an derselben bereits materialisierten
JavaScript-Stringgrenze wie die kanonische Boundary. Es verspricht keine
Wire-Byte-Begrenzung, Decodierung oder n8n-Raw-Body-Adaption.

### Deterministisches Integritätsmanifest

Das Manifest besitzt eine feste Schema-Version und enthält ausschließlich:

- `schemaVersion: 1`;
- `artifact.path` mit dem repository-relativen kanonischen Artefaktpfad und
  `artifact.sha256` über dessen exakte Bytes;
- `sources` mit den drei geordneten Einträgen Contract, Boundary und Entry,
  jeweils exakt aus `path` und `sha256` über die exakten Quellbytes.

Property- und Arrayreihenfolge sind fest. Das Manifest enthält weder Uhrzeit
noch lokalen Pfad, Hostnamen oder sonstige maschinenabhängige Metadaten. Sein
Hashmodell erkennt Drift zwischen den eingecheckten Quellen, dem erzeugten
Artefakt und dem Manifest. Ein daneben gespeicherter Hash ist jedoch keine
kryptografische Herkunftsattestierung gegen einen Angreifer, der Artefakt und
Manifest gemeinsam verändern kann.

### Paritäts-, Reproduzierbarkeits-, Snapshot-, Outputpfad- und Mutationstests

Die kanonische lokale `createSyncGatewayRequestBoundary` bleibt das
Referenzorakel. Das Bundle wird in einer begrenzten lokalen Testlaufzeit als
Expression ausgewertet und gegen diese Implementierung geprüft. Die Tests
decken neben Werten auch eigene Felder und Reihenfolge, Prototypen,
Null-/Arraystruktur, Freeze-Zustand, Frische und defensive Entkopplung ab.

Geprüft werden insbesondere gültige und ungültige Raw Bodies, Größen- und
BOM-Grenzen, geschlossene Contractfelder, Clock- und ID-Injektion,
Dependencyfehler, statische Redaction, fehlende Eingabemutation,
Console-Stille und exakt eine Verarbeitung. Zusätzlich werden die unveränderte
direkte Bindung des vollständigen Artefakts, der einmalige gemeinsame
Quellsnapshot einschließlich ABA-Mutation sowie die fail-closed Outputpfad-,
Tempdatei-, Replace-Reihenfolge- und Cleanup-Grenze geprüft. Temporäre
Mutationen belegen außerdem, dass Bundle- und Quelldrift, eine semantische
Abweichung sowie entfernte API- oder Freeze-Garantien erkannt werden. Private
Marker dürfen weder in kontrollierten Resultaten noch in Consoleausgaben
erscheinen. Kanonische Dateien werden dafür niemals verändert.

Tests verwenden nur synthetische Werte und kontrollierte temporäre
Verzeichnisse. Sie kontaktieren weder n8n Cloud noch das Internet.

Die erneute lokale Verifikation besteht mit 61/61 gezielten Bundle-Tests,
115/115 Tests für Bundle plus kanonische Request Boundary, 253/253 kombinierten
Tests für SyncContract, SyncService, Boundary, Local SyncGateway und Bundle
sowie 1186/1186 Tests der vollständigen seriellen Suite. Alle vier Läufe
besitzen 0 Fehlschläge, 0 Skips und 0 Todos. Der Produktions-Build
transformiert weiterhin exakt 46 Browsermodule; der schreibfreie Bundle-Check
meldet keinen Drift. Das aktuelle Artefakt besitzt SHA-256
`15b84126852a597d429304d66d723a356b18537ba3910db9dd9443b3b787114f`,
die exakten Manifestdateibytes SHA-256
`87c4fa153d2af2753aaaf4d74fd515b3edae5268b9935d63faef24d10bcf593f`.
Die konzeptionelle API-Kompatibilität mit den CI-Zielen Node `20.19.0` und
`22.12.0` ersetzt keinen tatsächlich dort ausgeführten CI-Nachweis.

### Unveränderte Cloud- und Aktivierungsgrenze

Das eingecheckte Bundle ist nur für eine spätere Code-Node-Komposition
vorbereitet. Dieser Slice belegt keine Kompatibilität mit einer konkreten
n8n-Cloud-Version oder einem Tenant. Vor Aktivierung muss weiterhin
versions- und tenantgebunden nachgewiesen werden, dass tatsächliche Binärdaten
vor Decodierung zugänglich sind. Erst danach darf der Cloud-Hop Bytezahl,
strikte UTF-8-Decodierung und genau einen Boundary-Aufruf komponieren. Scheitert
dieser Nachweis, ist ADR 0019 neu zu bewerten.

Die Option `Raw Body`, das Bundle und seine lokale Parität beweisen keine
ursprünglichen Wire-Oktette, keine Prüfung vor Provider-Allokation und keinen
vollständigen DoS-Schutz. Das lokale SyncGateway aus ADR 0020 bleibt die
vorgelagerte implementierte Wire- und Decodierungsgrenze.

Dieser Slice implementiert ausdrücklich keinen n8n-Workflow, Webhook,
Credential, Authentisierungsheader, Secret, Browser- oder Cloudtransport,
Cloudaufruf, operativen `SyncAgent`, normalen SyncResponse-Upstream,
Aktivierung, Persistenz, Retry, Rate Limit, Logging, Telemetrie, UI oder
`src/main.js`-Komposition. Das lokale HTTP-Verhalten bleibt unverändert.
Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
`v0.2.2` bleiben unverändert.

## Konsequenzen

Positive Auswirkungen:

- Cloudcode kann später dieselbe generierte Contract- und Boundary-Semantik
  verwenden, ohne eine manuell gepflegte zweite Implementierung einzuführen.
- Der einmalige unveränderliche Quellsnapshot bindet Bundler- und
  Manifestbytes an dieselben gelesenen Contract-, Boundary- und Entrybytes;
  byteidentische Generierung, Checkmodus und SHA-256-Manifest machen Drift
  automatisiert sichtbar.
- Paritäts- und Mutationstests schützen nicht nur den Erfolgspfad, sondern auch
  Fehler-, Redaction-, Freeze- und Identitätsgarantien.
- Das importfreie Expression-IIFE ist als vollständiges Artefakt unverändert
  direkt bindbar und passt zu einer eingeschränkten JavaScript-Laufzeit, ohne
  n8n-Eingaben oder Workflowlogik vorwegzunehmen.

Kosten und Einschränkungen:

- Das eingecheckte Derivat und Manifest müssen bei jeder kanonischen Änderung
  neu generiert und geprüft werden.
- Die vorhandene lockfile-gebundene Bundler-Toolchain wird Teil der
  Reproduzierbarkeitsgrenze.
- Artefakt und Manifest werden einzeln und in fester Reihenfolge ersetzt; ein
  Prozessabbruch zwischen beiden Dateien kann vorübergehend ein vom Checkmodus
  abgelehntes Mischpaar hinterlassen.
- Die Outputprüfung reduziert unbeabsichtigte Link- und Containmentfehler,
  garantiert aber weder Power-Loss-Atomizität noch Schutz vor einem bösartigen
  gleichzeitig ausgeführten Reparse-Rennen.
- Lokale Parität beweist keine konkrete n8n-Tenant- oder
  Webhook-Laufzeitsemantik.
- Integrität im Repository ersetzt weder signierte Herkunft noch eine
  Deploymentattestierung.

## Erwogene Alternativen

### Contract und Boundary manuell in einen Code Node kopieren

Verworfen. Eine zweite handgepflegte Implementierung könnte unbemerkt von den
kanonischen Modulen und ihren Sicherheitsgarantien abweichen.

### ESM- oder CommonJS-Bundle mit Laufzeitimports

Verworfen. Das Artefakt soll unabhängig von Modulauflösung und externen
npm-Freigaben in einer eingeschränkten Laufzeit auswertbar sein.

### Workflow und Inputadapter bereits in das Bundle aufnehmen

Verworfen. Dafür fehlen der versions- und tenantgebundene Raw-Body-Nachweis,
die konkrete Workflowkomposition und deren eigene Sicherheitsentscheidung.

### Artefakt ausschließlich zur Deploymentzeit erzeugen

Verworfen. Ein eingechecktes menschenprüfbares Artefakt mit Manifest ermöglicht
Review, reproduzierbaren Driftcheck und mutationsgerichtete Regressionen vor
einem späteren Deployment.

### Neue direkte Bundler-Abhängigkeit hinzufügen

Verworfen. Die vorhandene lockfile-gebundene Vite-/Rolldown-Toolchain erfüllt
den begrenzten Zweck ohne Lockfile- oder Supply-Chain-Erweiterung.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn:

- Contract oder Boundary ihre öffentliche API oder fachliche Semantik ändern;
- eine andere Aktion, ein nicht leeres Payload oder private Daten zugelassen
  werden;
- die gewählte Toolchain keine deterministischen selbstständigen Artefakte mehr
  erzeugt;
- n8n Cloud das Artefaktformat oder die benötigte JavaScript-Laufzeit nicht
  unterstützt;
- der versions- und tenantgebundene Nachweis keine tatsächlichen Binärdaten vor
  Decodierung belegt;
- eine Workflow-, Credential-, Secret-, Transport- oder Aktivierungskomposition
  eingeführt wird;
- stärkere Herkunfts-, Signatur- oder Deploymentattestierung benötigt wird.

## Verwandte Dokumente

- [ADR 0016: Transportneutraler SyncContract-Kern](0016-transport-neutral-sync-contract-foundation.md)
- [ADR 0017: Transportneutrale SyncService Foundation](0017-transport-neutral-sync-service-foundation.md)
- [ADR 0018: Transportneutrale SyncGateway Request Boundary](0018-transport-neutral-sync-gateway-request-boundary-foundation.md)
- [ADR 0019: Lokales SyncGateway vor n8n Cloud](0019-local-sync-gateway-before-n8n-cloud.md)
- [ADR 0020: Lokale SyncGateway Raw-Wire- und HTTP-Foundation](0020-local-sync-gateway-raw-wire-http-foundation.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
- [n8n: Code node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/)
- [n8n: Enable modules in Code node](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/configuration-examples/enable-modules-in-code-node/)
- [n8n: Webhook node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
