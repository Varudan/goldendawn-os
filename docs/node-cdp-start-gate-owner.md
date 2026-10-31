# Node-CDP-Startsperren-Ownerkern

`scripts/browser/nodeCdpStartGateOwner.js` ergänzt die unveränderte
[Kontrollanbindung](node-cdp-context-control.md) nach
[ADR 0041, Abschnitte 5 und 6.4](decisions/0041-isolated-local-same-origin-sync-test.md).
Dies ist ein lokaler In-Memory-Kern mit netzwerkfreien Tests, kein vollständig
angebundener Betriebs-Owner. SAC bleibt aktiv.

## API und externe Zustandsauskünfte

Einziger Export: `createNodeCdpStartGateOwner(options)`. Die Factory gibt eine
eingefrorene API mit genau `acquire`, `isCurrent`, `block`, `complete` zurück,
direkt als `startGate` verwendbar. Import und Factory rufen keine Dependency
auf; die Factory liest auch keine Optionsfelder. Erst `acquire` liest die drei
Ports und übernimmt ihre Funktionsreferenzen für die jeweilige Lease.

`options` enthält genau diese drei erforderlichen Funktionen. Jede liefert
ohne Argumente endlich und synchron einen Datensatz mit **genau** den hier
genannten eigenen Datenfeldern (gewöhnliches oder Null-Prototyp-Objekt).
Accessor-Felder, fehlende/zusätzliche Felder, unbekannte Werte, Exceptions,
Promises und Thenables gewähren keine Zulassung. Es gibt keine positiven Defaults.

| Port | Erforderliche Rückgabe |
| --- | --- |
| `readSession()` | `{ status: 'CONFIRMED', sessionId, generation, exclusive: true, continuity: 'CONFIRMED' }` |
| `readService()` | `{ status: 'CONFIRMED', sessionId, sessionGeneration, generation, binding }` |
| `readPermission()` | `{ sessionId, sessionGeneration, serviceId, serviceGeneration, startAllowed: true, externalBlock: 'CLEAR' }` |

`sessionId`, beide Generationen und `runId` sind ASCII-Kennungen aus
`[A-Za-z0-9._:-]`, Länge 1–128. Generationen sind externe Lebensdauerkennungen,
keine Versionsnummern: Der Host muss sie bei Sitzungs-/Dienstwechsel ändern und
darf alte Kennungen nicht wiederverwenden. `exclusive: true` bestätigt die alleinige
Zuständigkeit dieses Owners für den gesamten Prüfpfad. `continuity: 'CONFIRMED'`
bestätigt die extern geklärte Bindung der Operatorsitzung, einschließlich einer
etwaigen Wiederaufnahme, vorhandener Reservierungen und früherer Sperren.
Ein bloß neuer Owner, gleicher Endpoint oder gleiche Versionen reichen nicht.

`binding` hat genau `serviceId`, `webSocketUrl` und `version`; `version` genau
`protocolVersion`, `product`, `revision`, `userAgent`, `jsVersion` (je 1–512
Zeichen). Dienstkennung und exakter Loopback-WebSocket-Endpunkt entsprechen dem
Kontrollvertrag. Alle Bindungswerte werden defensiv kopiert. Der Kern verändert
oder friert keine fremden Eingaben ein. Sitzungsbezüge in Dienst und Berechtigung
sowie Dienstkennung/-generation in der Berechtigung müssen exakt korrelieren.

Diese Auskünfte sind vertrauenswürdige externe Bestätigungen, keine vom Kern
bewiesenen Fähigkeiten. Die Ports müssen einen zusammenhängenden aktuellen Stand
liefern. Der Kern liest Sitzung und Dienst vor und nach der Startberechtigung,
prüft die Korrelation und verweigert beobachtete Widersprüche. Das ist keine
atomare Beobachtung eines externen Dienstes und erkennt keine zwischen den
Auskünften unsichtbar erfolgten Wechsel. Reentrante Start-/Abschlussversuche
werden verweigert. Kein Port führt im Kern Sockets, Prozesse, Timer, Dateien,
Umgebungszugriffe oder Persistenz ein; solche Effects gehören auch nicht in die
hier verwendeten Testauskünfte.

## Zustandsübergänge

- `acquire(binding, runId)` liefert bei vollständig bestätigter Zulassung eine
  frische eingefrorene Lease mit genau `{ status: 'ACQUIRED', serviceId,
  webSocketUrl, runId }`, sonst `null`. Ihre Objektidentität und die kopierte
  Generationsbindung werden privat geführt. Pro Owner besteht höchstens eine
  aktive Reservierung, auch über unterschiedliche Dienste hinweg. Die
  Reentranzsperre wird vor jeder Eingabereflexion gesetzt.
- `isCurrent(lease)` liefert ausschließlich für die eigene aktive, noch nicht
  abgeschlossene Lease mit weiterhin bestätigter Sitzung und identischer
  vollständiger Dienst-/Generationsbindung `true`. Erkannter Verlust bleibt
  endgültig und setzt vorsorglich die lokale Startsperre. Später passende Werte
  heilen ihn nicht. Dieser Hook liest keine Startberechtigung: Eine Startsperre
  allein entzieht nicht die noch gültige Identität für den Normalabschluss.
- `block(lease, finding)` akzeptiert für eine bekannte eigene Lease genau
  `{ runId, resourceStatus: 'FAIL' | 'UNPROVEN', code }`; Laufkennung muss
  korrelieren, `code` dieselbe ASCII-Grammatik erfüllen. Nur eine tatsächlich
  übernommene Sperre erhält synchron `true`; sonst `false`. Auch eine bereits
  abgeschlossene Lease darf sperren, selbst während eines anderen Hooks.
  Wiederholung schwächt nichts ab und gibt keine fremde Reservierung frei.
- `complete(lease, report)` verarbeitet ausschließlich die eigene aktive Lease
  einmal. Der unten beschriebene korrelierte Bericht erhält bei Übernahme `true`.
  Ressourcen-PASS prüft die aktuelle Identität erneut und gibt die Reservierung
  nur ohne lokale Sperre frei. Ressourcen-FAIL/-UNPROVEN setzt die Sperre; ein
  solcher Abschluss kann auch nach Identitätsverlust übernommen werden.
  Eine gesperrte abgeschlossene Reservierung bleibt intern gehalten, ist aber
  nicht mehr `isCurrent`. Fehlerhafte Berichte, fremde/kopierte Leases und
  doppelte Abschlüsse liefern `false` und geben nichts frei.

Bekannte Leases werden über eine private WeakMap verfolgt. Normale Abschlüsse
ohne Sperre erlauben einen neuen Lauf und eine neue Lease, auch bei gleicher
Laufkennung. Ein späteres `block` der alten Lease sperrt den Owner weiterhin;
eine inzwischen aktive neue Lease bleibt für ihren Normalabschluss gültig.

Ein beim Startcheck korrekt korreliert beobachtetes `externalBlock: 'BLOCKED'`
setzt ebenfalls die lokale dauerhafte Sperre. Unbekannte externe Sperrzustände
verweigern die Zulassung. Die lokale Sperre überlebt neue Kontrollfactories,
Laufkennungen, Sitzungs-/Dienstbindungen und spätere Ressourcen-PASS-Berichte.
Es gibt keine Reset-, Entsperr- oder Wiederanlauf-API.

## Abschlussbericht

Der Owner prüft eine begrenzte Projektion des tatsächlichen Kontrollberichts:
`runId`, `serviceId`, `status`, `resourceStatus`, `resources`, `evidenceSaved`,
`contextReturned`, `connectionClosed`, `gateBlocked`, `gateAcknowledged`,
`runtimeRecord`. Das sind erforderliche eigene Datenfelder. Weitere Felder des
Kontrollberichts sind zulässig und werden nicht ausgewertet; `then` ist unzulässig.
Sämtliche fünf Bestätigungsfelder müssen boolesch und `runtimeRecord` muss `null`
sein. Beide Statuswerte sind `PASS`, `UNPROVEN` oder `FAIL`; der Ablaufstatus darf
nicht günstiger als der Ressourcenstatus sein.

`resources` ist ein gewöhnliches dichtes Array mit genau sieben eigenen
Datenpositionen in Kontrollreihenfolge: `connection`, `context`, `target`,
`session`, `document`, `registrations`, `timer`. Jede Position besitzt genau
`name` und `state`; zulässige Zustände sind `notAttempted`, `possible`,
`confirmed`, `closed`. Ressourcen-PASS verlangt ausschließlich `closed` oder
`notAttempted`, bestätigte Belegsicherung und Gatebestätigung, kein berichtetes
`gateBlocked` sowie bei geschlossener Verbindung/Kontext deren bestätigten
Abschluss. Das erlaubt auch Ressourcen-PASS bei fachlich fehlgeschlagenem Ablauf.

Der Owner beweist weder die Wahrheit dieser Angaben noch CDP-Beobachtungen,
Fristen, Stages oder Dokumentfrische. Diese Prüfungen verbleiben beim
Kontrollmodul und den später gebundenen Beobachtungswegen. Ein synthetischer
gültiger Bericht ist kein Betriebsnachweis. Promise-Rückgaben werden weder
abgewartet noch als spätere Freigabe übernommen.

## Selbstprüfung und verbleibende Bindungen

`tests/nodeCdpStartGateOwner.test.js` prüft Zulassung, Eingabeschutz, atomare
Reservierung/Reentranz, Lease-Provenienz, irreversible Generationsverluste,
Sperrerhalt, späte Sperren und ungültige/verspätete Bestätigungen mit positiven
Gegenfällen. Kleine Integrationstests importieren das tatsächliche unveränderte
Kontrollmodul und diesen Owner; ein eigener Simulator liefert WebSockets,
Ereignisse und deterministische Zeit. Sie prüfen Erfolg, gesperrte Folgeversuche
ohne zusätzliche Socket-/Timer-/Uhrerzeugung und Normalabschluss trotz Sperre.
Die bestehende Kontrolltestdatei wird nicht als Harness importiert.

Der freigegebene Prüfablauf ist seriell:

```text
node --test --test-concurrency=1 tests/nodeCdpContextControl.test.js tests/nodeCdpStartGateOwner.test.js
npm.cmd run build
```

Rohbytebindungen, konkrete Auswahl, Dependencies, Tool-/Umgebungsbindung,
Buildkonfiguration einschließlich der vier Production-Env-Dateien, vollständige
Originalausgaben und native Start-/Enddaten/Exitcodes liegen im gesonderten
eindeutigen Belegordner. Tatsächliche Ergebnisse werden dort nach Ausführung
erfasst; diese Notiz setzt keine Testzahl oder Erfolg voraus.

Offen bleiben Hostkomposition und Lebensdauer des gemeinsamen Owners,
prozessübergreifende Exklusivität, tatsächliche Sitzungs-/Dienstbeobachtung,
verlässliche Generationen, über Sitzungsneustarts dauerhafte Sperrspeicherung,
gesonderte Klärung/Aufhebung durch Jan, Browserbereitstellung, Fähigkeitsnachweise
und reale Produktprüfung. Ein anderer neu erzeugter Owner besitzt keinen Zugriff
auf den Speicher dieses Owners; die äußere Instanz muss vor neuer Zulassung
Kontinuität und Sperrlage bestätigen. Ein fälschlich positiv auskunftgebender Host
wird durch diesen Kern nicht abgesichert. Neue Kontrollfactories müssen denselben
Owner nutzen; ein Factorywechsel ist keine Aufhebung nach ADR 0041.

Das Ergebnis bleibt lokale Selbstprüfung, kein unabhängiger Review und kein
vollständiger Betriebs-Owner. `overallGate: FAIL`,
`causeStatus: CAUSE_NOT_PROVEN`, fehlendes authentisches `A_obs`, `NOT_EVIDENCE`
und `runtimeRecord:null` sowie die bisherigen Runtimegrenzen bleiben unverändert.
