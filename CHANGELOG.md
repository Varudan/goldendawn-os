# Changelog

Dieses Changelog dokumentiert nachvollziehbare GoldenDawn-OS-Meilensteine.
Die Versionsnummern strukturieren den Projektfortschritt, sind aber keine
Zusicherung einer strikt semantischen Versionierung. Ein Eintrag allein
behauptet weder einen veröffentlichten Git-Tag noch ein veröffentlichtes
Release.

## Unveröffentlicht – v0.3.0 in Arbeit – ADR-0038-Reparatur vollständig lokal neu gebunden; Re-Review und Ubuntu-CI offen; Runtimegate FAIL

### ADR-0038-Lokale Neubindung / 2026-10-03

**Vollständige lokale Selbstprüfung erfolgreich; unabhängiger Re-Review und
 tatsächliche Ubuntu-CI-Abnahme ausstehend.** Der Verifikationsauftrag begann
auf `codex/docs/adr-0038-ci-isolation`, HEAD
`031322fdac56bba245e120da528d448047a26662`, mit leerem Index und genau den
zwölf vorhandenen uncommitteten Implementierungs-/Statusdateien. Es gab keine
Code-, Workflow- oder ADR-Korrektur. Erst nach erfolgreicher Neubindung wurden
ausschließlich die sechs bisherigen Statusdokumente nachgeführt.

Die reparierten Bytes sind unter Windows `10.0.26300`, Node
`24.19.0` vollständig lokal neu gebunden: **115/115**
Infrastrukturtests, **2627/2627** im separaten `remaining`-Einstieg und
**3637/3637** im einmaligen vollständigen npm-Referenzlauf. Danach bestehen
alle sechs strikt nacheinander ausgeführten Gruppen mit `193/122/222/318/102/53`
Tests. Die echte positive Aggregate-CLI bestätigt exakt dieselben 1010
Fallidentitäten und 2322 Obligationen wie die neue Referenz; der feste Plan-SHA-256
`1ec700dba82e0e93aa60c01968b717434fa22d4dd51e25d3cc4a0da576dc09a6` bleibt erhalten.
Native Abschlüsse sind jeweils Exit 0/Signal `null`, ohne Fehlschläge,
Cancellations, Skips oder Todos; Cleanup ist vollständig bestätigt.
21 Gegenproben auf eigenen Artefaktkopien enden nativ mit Exit 1,
einschließlich der trotz konsistent neu gebundener Loggröße und SHA-256
verworfenen Kopie ohne TAP-Root-Plan. Produktions-Build: 46 Module, Exit 0;
`bundle:n8n:check`: Exit 0, driftfrei.

Dies ist neue Selbstprüfung, kein unabhängiger Review-PASS. Die Belege vom
2026-09-28 bleiben historisch; der frühere unabhängige Implementierungsreview
mit `FAIL` wird nicht umgedeutet oder auf die Reparaturbytes übertragen.
Unabhängiger Re-Review und tatsächliche Ubuntu-CI-Abnahme auf Node `20.19.0`
und `22.12.0` stehen aus. Lokale Zeiten und Adapterprozess-`maxRSS` belegen
weder Runnergesamtverbrauch noch das unveränderte Zehn-Minuten-CI-Joblimit
inklusive Setup und Artefaktübergabe. `overallGate: FAIL`,
`causeStatus: CAUSE_NOT_PROVEN`, `NOT_EVIDENCE` und `runtimeRecord:null`
bleiben unverändert. Die folgenden Reparatur- und Implementierungsabschnitte
beschreiben ihre jeweiligen historischen Prüfstände.

Die neue Referenz lief von `2026-10-03T17:53:36.191Z` bis
`2026-10-03T18:42:53.408Z`, native Testaufrufdauer **2957.217 s**;
die Hülle dauerte 2958.004 s.
Die Gesamtzahl ist aus dem neuen Footer abgeleitet, keine Wiederverwendung
der historischen 3620. Die 757 unveränderten Foundationtests und die
Bestandsregressionen sind im Referenzlauf enthalten. Der zusätzliche
`remaining`-Workflow-Einstieg dauerte 15.615 s; er ersetzt weder
die Referenz noch Ubuntu-CI. Alle sechs Gruppen liefen danach in derselben
Kontextbindung, jeweils in frischem Prozess und neuem Verzeichnis:

| Gruppe | Tests | Obligationen | native Testaufrufdauer s | maxRSS KiB | Kopien erzeugt/entfernt |
| --- | ---: | ---: | ---: | ---: | ---: |
| `source` | 193 | 193 | 1141.081 | 2022776 | 234/234 |
| `parser` | 122 | 125 | 1255.706 | 1241464 | 142/142 |
| `record` | 222 | 481 | 5.072 | 432432 | 243/243 |
| `boundary` | 318 | 1368 | 493.287 | 1209624 | 282/282 |
| `lifecycle` | 102 | 102 | 537.866 | 1303556 | 117/117 |
| `timing` | 53 | 53 | 272.474 | 984092 | 66/66 |
| Summe | 1010 | 2322 | 3705.485 | nicht addiert | 1084/1084 |

Die Referenz bestätigt 1084/1084 bereinigte Kopien,
alle Läufe null Pending-Copies. Der Wert `process.resourceUsage().maxRSS`
wurde im After-Hook des Adapter-Testprozesses in KiB gemessen; Referenz:
3391352 KiB. Er schließt Runner, Eltern- und Kindprozesse aus,
ist weder Heap noch Runnergesamt-RSS und garantiert kein späteres
Lebenszeitmaximum. Runnergesamtspeicher wurde nicht gemessen.
Die Gruppenhülle einschließlich Planung und Quell-/Ergebnisprüfung liegt
zwischen 0.436 und 0.973 s;
CI-Bereitstellung, Installation und Artefakttransfer sind nicht enthalten.
Die Gruppen wurden auch oberhalb zehn Minuten vollständig auslaufen gelassen;
eine Aussage zur Ubuntu-Laufzeiteignung oder zu einem Beschleunigungsfaktor
wird daraus nicht abgeleitet. Das CI-Limit bleibt zehn Minuten.

Die positive Aggregation vergleicht vollständige Fall-/Variantenidentitäten,
nicht bloß Zähler. Die 20 dokumentierten Gegenproben wurden mit ausschließlich
neuen Artefaktkopien wiederholt; die fehlende, konsistent neu gehashte
TAP-Root-Plan-Kopie ist die 21. Gegenprobe. Alle CLI-Abschlüsse sind Exit 1,
Signal `null`; ihre konkreten Ablehnungsgründe sind erhalten. Die maßgeblichen
positiven Gruppen- und Referenzartefakte bleiben bytegleich.

Ausgeführte Implementierungsbytes, vor und nach allen Läufen identisch:

| Datei | Rohbytes | SHA-256 |
| --- | ---: | --- |
| `.github/workflows/ci.yml` | 3336 | `1007ae71d38bb42a55c8149cacc11809f2435b9cd3ce82075fb05c1495b17aad` |
| `scripts/ci/adapterResults.js` | 14776 | `4022910b8e1539df46feb72aec68005d4fb9acf31343f00332795cfb0cade044` |
| `scripts/ci/adapterTestPlan.js` | 17411 | `a35592b5caa60cff8ec22c18696b1a3a9c3ce0507f85c5a83498d29fb6d0bbb2` |
| `scripts/ci/runAdapterGroups.js` | 19827 | `8f107c9959870e0f36c7da0165ce710ef6ee011298aee71ebf7e4978c6fedab4` |
| `tests/browserSyncTransportRuntimeDiagnosticAdapter.test.js` | 481679 | `225108863e2a966b71ccaa1badccfe3449b1ad5df802770341a262105d17b701` |
| `tests/ciTestGrouping.test.js` | 29089 | `b833131222bdbd4a54f04d19b7c296c9094dacfaa7e5e27b69d4706d4704075c` |

Neue Belegwurzel ausschließlich außerhalb des Repositorys:
`C:/Users/jslom/AppData/Local/Temp/goldendawn-adr0038-rebind-20261003-77ab4b03`.
`baseline.json` bindet die zwölf Ausgangsdateien, 159 geschützte Dateien,
165 Harnessquellen, rohe HEAD-Blobs, Index und Refs. Neuer Kontext:
`adr0038-cf94cfc1-244f-4051-a52d-a22efaa43efc`, Versuch `1`.
`reference/` und `groups/<gruppe>/` erhalten vollständige Rohlogs sowie
Child-, Binding-, Ergebnis- und native Abschlussdaten. `captures/` enthält
je Einstieg Start-/Endquellen, Konfiguration, rohe stdout/stderr-Ausgaben und
nativen Abschluss. `actual-aggregate-negatives/` bewahrt alle mutierten Kopien;
Vor-/Nachinventare bestätigen unveränderte positive Artefakte.
`verification-summary.json` enthält Einzelzeiten, Speichermessumfang,
Abschlüsse und Grenzen; `final-audit.json` bindet die finalen sechs
Dokumentfassungen, relevante Links, Dateihygiene und unveränderte
Implementierungs-/Schutzdateien, HEAD, Index und relevante Refs. Finale
Dokumenthashes stehen im Abschlussaudit, nicht als Selbsthash in den Dokumenten.

Vor dem ersten Testlauf scheiterte ein externer Auditwrapper am Entfernen des
führenden Porcelain-Leerzeichens. Dieser reine Wrappervorversuch ist getrennt
unter `goldendawn-adr0038-rebind-20261003-CD1wdy` erhalten; er hatte keinen
Kontext und keine Testartefakte. Der korrigierte Wrapper begann mit neuer
Belegwurzel und neuem Kontext. Ergebnisse werden nicht zwischen Versuchen
gemischt. Browser-/Runtime-Diagnoselauf, Remote-CI und Git-Schreibaktionen
unterblieben; Git-Schritte bleiben manuell bei Jan.

### ADR-0038-P1-Reparatur / 2026-10-03

Die uncommittete Reparatur ändert ausschließlich
`scripts/ci/adapterTestPlan.js`, `scripts/ci/runAdapterGroups.js` und
`tests/ciTestGrouping.test.js` sowie diese sechs Statusnachführungen. Der
vollständige kanonische Plan wird vor Rückgabe oder Nutzung gegen den externen,
nicht in den Plan einfließenden SHA-256
`1ec700dba82e0e93aa60c01968b717434fa22d4dd51e25d3cc4a0da576dc09a6`
geprüft. Zusätzlich gelten die festen Gruppenfallzahlen
`source 193 / parser 122 / record 222 / boundary 318 / lifecycle 102 /
timing 53`, insgesamt 1010 Fälle, 1312 Zusatzvarianten und 2322 Obligationen.
Die kausalen Gegenproben verschieben am L728-Marker die Family zu
`registerAdr36ClockContractTests` beziehungsweise die Site zu L729; beide
lassen die rekonstruierte Baseline unverändert und werden dennoch verworfen.

Die TAP-Auswertung verlangt für Gruppen genau einen ungerückten
`TAP version 13`-Header, genau einen terminalen Root-Plan mit `N === # tests`
und unmittelbar danach `tests`, `suites`, `pass`, `fail`, `cancelled`,
`skipped`, `todo`, `duration_ms` in dieser Reihenfolge. Zähler sind sichere
nichtnegative Ganzzahlen, die Dauer ist endlich und nichtnegativ. Der getrennte
npm-Referenzmodus erlaubt den Banner und einen positiven Root-Plan kleiner als
die Gesamtzahl verschachtelter Tests; historische Zahlen werden nicht gepinnt.

Der gezielte Lauf
`node --test --experimental-vm-modules --no-warnings --test-concurrency=1
tests/ciTestGrouping.test.js` besteht mit **115/115**. Er umfasst vollständige
LF-/CRLF-Positivlogs, ein verschachteltes Referenzlog, die verlangten
Negativformen und den tatsächlichen Aggregate-CLI-Pfad: Sechs neu erzeugte,
vollständig gebundene Gruppenartefakte aggregieren positiv; eine eigene Kopie,
bei der nur der Root-Plan entfernt und Loggröße sowie SHA-256 in `result.json`
und `native.json` konsistent nachgeführt wurden, endet nicht erfolgreich. Die
Plan-CLI besteht mit dem festen Digest und allen Sollsummen; auch die
historischen echten Source-/Referenzlogs werden vom neuen Gruppen-/Referenzmodus
mit 193 beziehungsweise 3620 Tests akzeptiert.

Der Standardlauf, sechs reale Gruppenläufe, die positive Referenzaggregation,
Build und `bundle:n8n:check` wurden unter den Reparaturbytes nicht erneut
ausgeführt. Die Rohbelege vom 2026-09-28 bleiben ausschließlich historische
Evidenz; ein vollständiger neuer lokaler Erfolgsnachweis wird nicht behauptet.
Unabhängiger Re-Review und tatsächliche Ubuntu-CI-Abnahme auf Node `20.19.0`
und `22.12.0` stehen aus. Browser-/Diagnoselauf, Remote-CI und Git-Schritte
unterblieben. `overallGate: FAIL`, `causeStatus: CAUSE_NOT_PROVEN`, Foundation
und Testkopien als `NOT_EVIDENCE` sowie `runtimeRecord:null` bleiben unverändert.

### ADR-0038-CI-Testgruppierung / 2026-09-28

**Implementiert und lokal geprüft; unabhängiger Implementierungsreview und
tatsächliche CI-Abnahme ausstehend.** ADR 0038 bleibt angenommen und bytegleich.
Der gesonderte Auftrag autorisierte Implementierung, lokale Tests, Build und
Bundlecheck; die frühere Beschränkung auf Dokumentation gilt für ihren damaligen
Slice. Basis war der saubere Branch `codex/docs/adr-0038-ci-isolation`, HEAD
`031322fdac56bba245e120da528d448047a26662`, mit leerem Index und gleichstehendem
lokalem Remote-Tracking-Ref. Eine aktuelle Remoteprüfung erfolgte nicht.

Geändert sind die Adaptertestdatei und `.github/workflows/ci.yml`; neu sind die
drei Helfer `scripts/ci/adapterTestPlan.js`, `adapterResults.js`,
`runAdapterGroups.js` und ausschließlich die Infrastrukturtests in
`tests/ciTestGrouping.test.js`. Hinzu kommen kurze Statusnachführungen in
AGENTS, Changelog, Architektur, Datenverträgen, Sicherheitsgrundlage und
Entscheidungsindex. Produktiver Adapter, Foundation, Foundationtests, übrige
Bestandstests, alle ADRs/Evidence-Records, Paket-/Lockdateien und Commithelper
bleiben unverändert. Der neue Stand ist uncommittet.

Der Ausgangszuschnitt aus sechs fachlich zusammenhängenden Gruppen erhält alle
Registrierungs-/Kontrollfamilien ungeteilt: Source samt Checkpoints und Handles,
Parser samt Dequeue, Recordableitung/-mutanten, Eingabe-/Effect-/Command-/Replay-
Grenzen, Lebenszyklus sowie Clock-/Deadline-/Cap-Regeln. Er ist ein begründeter
Startzuschnitt, keine auf Ubuntu gemessene Laufzeitoptimierung. Je Node-Version
läuft jede Gruppe in einem eigenen Job/Runner/Checkout und frischen Prozess;
innerhalb bleiben vollständige Testcallbacks und Kopielebenszyklen seriell.
`derivation-conformance` und `virtual-runtime-conformance` behalten ihre
jeweiligen vier Exports, Transformationen, Selector-Sperren, Byteprüfungen,
byte-owned Foundationloads und `adapterEvidenceEligible:false`.

Der Metadatenplan steht vor der Resultatauswertung fest und führt keine
Adaptercallbacks, Testkopien oder produktiven Runtimepfade aus. Fall-IDs binden
Familie, ursprüngliche Quellstelle und konkreten Vektor; gleichnamige
Registrierungen sind ausdrücklich disambiguiert. Die mechanische Rückführung aller
markierten Gruppierungszusätze rekonstruiert exakt die ursprünglichen 463641
UTF-8-/LF-Bytes mit SHA-256
`cf8cd3802e2ae2904f6743a5c3ad7535b1dcd2d11029a1dbb59b19d8e704f6c7`:
1010 Fälle, 1000 verschiedene Anzeigenamen. Es bestehen 2322 gebundene
Abschlussobligationen: 1010 erfolgreiche Originalcallbacks plus 1312 explizite
Iterationsmarken; keine 2322 eigenständigen Tests. Die gesondert ausgewiesenen
Schema-/Treiberiterationen bleiben mit allen ursprünglichen Assertions und
Schedulingordnungen erhalten. Reporting fügt dort keine asynchronen Eingriffe
ein. Metadatenfehler werden auch dann nachträglich abgelehnt, wenn ein kausaler
Test eine Assertion abfängt; sie zählen nicht als Mutantenkill.

Die geschlossene Auswahl registriert ausschließlich die gewählte Gruppe;
unbekannte, leere oder widersprüchliche Angaben scheitern. Ohne Auswahl bleibt
der vollständige Standardlauf erhalten. Die beiden CI-`verify`-Jobs führen die
übrigen 2610 Tests einschließlich 98 neuer Infrastrukturtests seriell und den
Build aus. Die zwölf Adapterjobs verwenden unverändert Ubuntu, Node `20.19.0`
und `22.12.0`, zehn Minuten Joblimit, VM-Flags, `npm ci`, minimale Rechte und
deaktivierte persistente Checkoutcredentials. Trigger bleiben PR gegen `main`
und Push auf `main`. Der Aggregationsjob verlangt erfolgreiche Vorgänger und
alle zwölf Ergebnisse desselben Laufs/Versuchs; ein Teil-Rerun mit alten
Ergebnissen genügt nicht. Die ergänzten Actions-Versionen wurden gegen die
Primärquellen geprüft: [upload-artifact v6.0.0](https://github.com/actions/upload-artifact/releases/tag/v6.0.0)
und [download-artifact v7.0.0](https://github.com/actions/download-artifact/releases/tag/v7.0.0).

Das geschlossene Ergebnisformat bindet tatsächlich gelesene Quellen und
Konfiguration, den vollständigen Plan, Node, Gruppe, Lauf/Versuch, Fall-/
Variantenmengen, Cleanup und Abschluss. Das lokale Quellenmanifest enthält
165 Dateien und benennt die sechs uncommitteten Implementierungsdateien;
HEAD allein wird nicht als Bytebindung verwendet. Die sechs erst nach den
Läufen nachgeführten Statusdokumente werden vom Harness nicht gelesen und sind
aus dieser Ausführungsbindung ausgeschlossen. Plan-SHA-256:
`1ec700dba82e0e93aa60c01968b717434fa22d4dd51e25d3cc4a0da576dc09a6`.
Erfolg benötigt zusätzlich den vom Elternprozess erst nach `close` geschriebenen
nativen Abschluss, einen vollständigen erfolgreichen Footer und passende
Rohlog-Hashes. Artefakte werden begrenzt als Daten gelesen: JSON höchstens
8 MiB, Tiefe 32 und 100000 Knoten; Logs jeweils höchstens 64 MiB. Ungültiges
UTF-8, doppelte JSON-Schlüssel, unerwartete Felder und ungeeignete Dateipfade
werden abgelehnt; es erfolgt keine Codeauswertung aus Artefakten.

Lokal ausgeführt unter Windows `10.0.26200`,
`x64`, Node `24.19.0`: zuerst 98/98
Infrastrukturtests, danach einmal der vollständige Standardpfad über das
unveränderte npm-Testscript mit `--experimental-vm-modules --no-warnings
--test-concurrency=1 --test-reporter=tap`. Dieser besteht mit **3620/3620**,
exakt `3522 + 98 = 1010 + 2512 + 98`; Foundation 757/757 und sämtliche
Bestandsregressionen sind darin enthalten und wurden nicht redundant wiederholt.
Referenzzeit: `2026-09-28T20:34:03.905Z` bis
`2026-09-28T21:13:17.501Z`, 2353.593 s.
Anschließend liefen alle Gruppen strikt nacheinander in frischen Prozessen:

| Gruppe | Fälle | Abschlussobligationen | Prozesslaufzeit s | maxRSS KiB | Kopien erzeugt/entfernt |
| --- | ---: | ---: | ---: | ---: | ---: |
| `source` | 193 | 193 | 618.098 | 2022508 | 234/234 |
| `parser` | 122 | 125 | 654.462 | 1182736 | 142/142 |
| `record` | 222 | 481 | 6.780 | 432436 | 243/243 |
| `boundary` | 318 | 1368 | 591.680 | 1132664 | 282/282 |
| `lifecycle` | 102 | 102 | 470.151 | 1150992 | 117/117 |
| `timing` | 53 | 53 | 250.717 | 1116712 | 66/66 |
| Summe | 1010 | 2322 | 2591.890 | nicht addiert | 1084/1084 |

Alle Testläufe endeten nativ mit Exitcode 0 und Signal `null`, ohne
Fehlschläge, Cancellations, Skips oder Todos. Der Referenzlauf bestätigt
1084/1084 bereinigte Testkopien; auch alle Gruppen bestätigen jeweils null
Pending-Copies und vollständigen Cleanup. Alle gebundenen Quellen blieben
während sämtlicher Läufe unverändert. Die tatsächliche positive Aggregation
vergleicht sämtliche Gruppenfälle und Varianten exakt mit der Referenz und
besteht. Zusätzlich lehnt derselbe CLI-Pfad 20 manipulierte Kopien dieser echten
Artefakte mit jeweils nativem Exitcode 1 ab: unter anderem fehlende/doppelte/
unbekannte Gruppen, falsche Node-/Quell-/Plan-/Versuchsbindung, fehlende/doppelte
Fälle, fremde Varianten, Skip, fehlender Cleanup oder nativer Abschluss,
widersprüchlicher nativer Befehl, Extrafelder, abgeschnittenes JSON, verändertes
Rohlog und ein trotz neu gebundener Loghashes fehlender Footer. Die 98 kleinen
Infrastrukturtests decken die weiteren geschlossenen Fehler-/Variantenklassen
sowie ein vollständiges positives Zweiversions-Ergebnis ab; dieses synthetische
Ergebnis ist kein ausgeführter Ubuntu-Nachweis. Produktions-Build: exakt
46 Module, Exit 0; schreibfreier `bundle:n8n:check`: Exit 0, driftfrei.

`process.resourceUsage().maxRSS` wird im Adapter-After-Hook in KiB erfasst;
[Node dokumentiert maxRSS](https://nodejs.org/download/release/v20.19.0/docs/api/process.html#processresourceusage).
Die Referenz liefert 3565056 KiB (rund
3.40 GiB) für den Adapter-Testprozess,
die Gruppen 432436 bis 2022508 KiB.
Das ist weder Heap noch Gesamt-RSS des Runners, schließt Eltern-/Kindprozesse
aus und ist eine Abfrage am After-Hook, kein garantierter späterer
Lebenszeitmaximalwert. Der lokal gemessene zusätzliche Hüllenaufwand für Planung,
Quellprüfung und Ergebnisprüfung beträgt je Gruppe
0.848 bis 1.265 s;
CI-Installation, Runnerbereitstellung und Artefakttransfer sind darin nicht
enthalten. Die lokalen Source-/Parserzeiten liegen über zehn Minuten; daraus
wird keine Ubuntu-Laufzeiteignung abgeleitet und das CI-Limit wird nicht erhöht.

Ausgeführte Implementierungsbytes (vor und nach den Läufen identisch):

| Datei | Rohbytes | SHA-256 |
| --- | ---: | --- |
| `.github/workflows/ci.yml` | 3336 | `1007ae71d38bb42a55c8149cacc11809f2435b9cd3ce82075fb05c1495b17aad` |
| `scripts/ci/adapterTestPlan.js` | 16053 | `199b255e792e9c68979459d8504f30762a53a3fe82605fde04edae1f9af07739` |
| `scripts/ci/adapterResults.js` | 14776 | `4022910b8e1539df46feb72aec68005d4fb9acf31343f00332795cfb0cade044` |
| `scripts/ci/runAdapterGroups.js` | 17374 | `e66ed33c22a870ac923a04f1bf867875df5fcf1a5117d009c61ee0085fc9b8ec` |
| `tests/browserSyncTransportRuntimeDiagnosticAdapter.test.js` | 481679 | `225108863e2a966b71ccaa1badccfe3449b1ad5df802770341a262105d17b701` |
| `tests/ciTestGrouping.test.js` | 19062 | `3ac44f779632534de864419a2e5a9597da0b05dced08bccdb0c900e825d6639e` |

Die erhaltenen Rohbelege liegen ausschließlich unter
`C:/Users/jslom/AppData/Local/Temp/goldendawn-adr0038-verification-KXPS0R`:
`baseline.json` bindet Checkoutbytes, Commitblobs, Index und Refs;
`reference/` und `groups/<gruppe>/` enthalten Bindung, Child-/Native-/Ergebnis-
JSON und vollständige stdout/stderr-Logs. Die Capture-Verzeichnisse
`infrastructure/`, `reference-runner/`, `group-<gruppe>/`,
`aggregation-positive/`, `aggregation-negative-driver/`, `build/` und
`bundlecheck/` enthalten je Start-/Endquellen, Konfiguration, Umgebung,
Rohausgaben und native Abschlüsse. `actual-aggregate-negatives/` bewahrt alle
20 Gegenproben einschließlich der manipulierten Artefaktkopien;
`verification-summary.json` fasst die Messwerte zusammen.
`final-audit.json` bindet den abschließenden Datei-/Link-/Git-Schutzabgleich.
Diese Nachweisdateien bleiben ausdrücklich erhalten und gehören nicht in den
Commit; temporäre Adapterkopien wurden nachweislich entfernt.

Die abschließende statische Prüfung umfasst die exakte Änderungsallowlist,
Diff/Whitespace, UTF-8 ohne BOM und LF, lokale Dokumentlinks sowie alle
159 geschützten ursprünglichen Dateien. HEAD, Branch, Index und erfasste Refs
bleiben unverändert. Die zwei bereits vorgesehenen CRLF-Checkoutfassungen der
PowerShell-Githelfer werden getrennt von ihren LF-Commitblobs gebunden;
ihre Checkoutbytes bleiben unverändert. Historische Reviewpassagen und
Annahme-/Rohhashbindungen bleiben unverändert. Diese Arbeit einschließlich
delegierter Teilprüfungen ist Selbstprüfung, kein unabhängiger Review-PASS.

Unabhängiger Implementierungsreview und tatsächliche Ubuntu-CI-Abnahme auf Node `20.19.0` und `22.12.0` stehen aus. Die lokalen Windows-/Node-24-Ergebnisse belegen weder die Einhaltung des unveränderten Zehn-Minuten-Joblimits noch einen Beschleunigungsfaktor. Git-Schritte bleiben vollständig manuell bei Jan; kein PR und kein entfernter CI-Lauf wurden gestartet.

`overallGate: FAIL`, `causeStatus: CAUSE_NOT_PROVEN`, Foundation und Testkopien als `NOT_EVIDENCE` sowie `runtimeRecord:null` bleiben unverändert. Authentisches Runtime-`A_obs` fehlt; Diagnose, Browserkomposition, Browser-E2E, Writer und Persistenz bleiben geschlossen. Windows-Prozessbaumownership, handlegebundene Pfadbereinigung und unabhängige Adapterausgabestille bleiben spätere Runtimeblocker.

Die folgenden Annahme-, Review- und Statuspassagen beschreiben ihre damaligen Slices. Ihre Aussagen zur noch ausstehenden Gruppierung und zur Beschränkung auf statische Prüfungen gelten nicht für diesen gesondert beauftragten Implementierungsslice. Frühere Reviews und Rohhashbindungen werden nicht auf die neuen Bytes übertragen.

### ADR-0038-Dokumentreview und Annahme / 2026-09-28

Jan hat [ADR 0038](docs/decisions/0038-isolated-ci-test-grouping-for-diagnostic-adapter.md)
am 2026-09-28 ausdrücklich angenommen: „ADR 0038 wird hiermit angenommen.“
Die isolierte CI-Gruppierung mit vollständiger Serialität innerhalb jeder
Gruppe ist damit entschieden; sie ist noch nicht implementiert oder ausgeführt.
Gruppenzahl, Zuschnitt, Auswahltechnik und sämtliche Abnahmenachweise bleiben
offen und benötigen einen gesonderten Implementierungs- und Nachweisauftrag.

Der von Jan übermittelte unabhängige Dokumentreview meldet technisches `PASS`
ohne relevante Befunde in allen sechs Reviewbereichen. Er gilt ausschließlich
für die folgenden sieben Vorannahmefassungen auf Branch
`codex/docs/adr-0038-ci-isolation`, HEAD
`1299011e63455658ac645fe7646fc55af8b07997`, Parent
`02412d2a054f86fef12f14c451ad6a3b7f38bbfc`, Tree
`47547d43f7c12eca803c049d38145ba50f19476e`. Der Bericht bindet einen leeren
Änderungsindex, die sechs modifizierten getrackten Dokumente und den damals
ungetrackten neuen ADR. Alle sieben Rohbytebindungen wurden vor dieser
Statusnachführung erneut gegen den vorhandenen Arbeitsbaum bestätigt.

| Reviewdatei, relativ zum Repositoryroot | Rohbytes | SHA-256 der Vorannahmefassung |
| --- | --- | --- |
| `docs/decisions/0038-isolated-ci-test-grouping-for-diagnostic-adapter.md` | 21644 | `5930d5bd9bd2de644cd18ec5464e9e79b32acbed27bda50c3add6fe70411cf35` |
| `docs/decisions/README.md` | 35257 | `9534293c345f479aa5ec9aa812a9a0862d1edf811e23749213319ca7f83fbda0` |
| `docs/data-contracts.md` | 724260 | `0db81f5fa633a43b6d5fcfb01caa84fc0d75600268ad180d986ee28b283b80d7` |
| `docs/architecture.md` | 283572 | `e205bc58c7b986deb7ef03b6b101934db7192d639ae0571332159ea8b973c306` |
| `docs/security.md` | 288046 | `984125185b3f6c297db05a2b91e204bb456c0ec0f88cb51e3d5e97d81a7ef446` |
| `AGENTS.md` | 205177 | `2edddc5441b6af56516e812cd9d94a3d70c8dcb78f4fdcd9ad33842648c25d65` |
| `CHANGELOG.md` | 219161 | `5819c6b971aed1df4f1a5d11c0a8f4ae79e8f7d589de800a5ecbf7fe22093179` |

Der lokal übermittelte Bericht `Eingefügter Text.txt` hat 5.820 Rohbytes und
SHA-256 `814b2c31d398558fdae81d7f8a2a000c8d0c392a78d9b7eaf17347d373bfcd13`.
Vorgesehen war Daybreak Blue / extra high, ein Reviewer ohne Subagenten.
Der Bericht bestätigt einen Reviewer ohne Subagenten, attestiert die
Modellkonfiguration jedoch nicht technisch. Diese Konfigurationsunsicherheit
bleibt vom technischen Dokumenturteil getrennt; weder `max` noch eine
technisch nachgewiesene `xhigh`-Bindung werden daraus abgeleitet. Die ältere
Adapterreviewprovenienz mit technischer PASS-Aussage, damaligem INCOMPLETE und
Jans Akzeptanz von Blue / Ultra bleibt unverändert im Folgeabschnitt erhalten.

Der Dokumentreview nennt vollständige Lektüre von ADR 0038, Begleitdiff und
geltender AGENTS.md, statischen Vertrags-/Harness-/CI-Abgleich, sieben passende
Quellbindungen, 173 auflösbare lokale Links/Anker, Dateihygiene und einen
unauffälligen Whitespace-Diffcheck. Laut Bericht blieben die sieben Reviewdateien,
die 160 übrigen sichtbaren Dateien, Index und erfassten Git-Refs unverändert.
Es wurden keine Tests, Builds, Bundlechecks, Projektmodule, CI- oder Runtimepfade
ausgeführt. Diese Angaben sind die historischen Reviewresultate, keine neuen
Implementierungs-, Performance- oder Runtimebelege.

Die jetzige Annahmenachführung verändert ausschließlich Status- und
Provenienzangaben in denselben sieben Dokumentdateien. Der unabhängig geprüfte
ADR-Hauptteil ab einschließlich `## Kontext` bleibt mit 21.067 Rohbytes und
SHA-256 `75945c53853d0b13f73d6143a77e20da5c26704a47ffa4c18b7e6dced4d174d5`
unverändert. Seine Vorschlags- und nächsten Schrittangaben sind historische
Vorannahmeformulierungen; die technischen Regeln und offenen Abnahmebedingungen
gelten fort. Der Review-PASS wird nicht auf die neuen vollständigen Dokumentbytes
übertragen; ein erneuter unabhängiger Review dieser Nachführung wird nicht behauptet.
Die nachfolgenden historischen Einträge und gebundenen Vorreviewtexte bleiben erhalten.

Auf Jans ausdrückliche Vorgabe umfasst dieser Dokumentationsslice nur statische
Prüfungen von Änderungsumfang, Diff, Dateihygiene, Links und Bindungen; keine
Tests, Builds oder Bundlechecks. Der unveränderte Commithelper wird dafür nicht
verwendet. Dies ändert weder den allgemeinen lokalen Commit-Prüfweg noch die
späteren Implementierungs- und CI-Prüfpflichten. Commit und Push führt Jan manuell
über VS Code aus; derzeit kein PR. Beides wird hier nicht als erfolgt behauptet.

`overallGate: FAIL`, `causeStatus: CAUSE_NOT_PROVEN`, `NOT_EVIDENCE` und
`runtimeRecord:null` bleiben unverändert. Authentisches Runtime-`A_obs` fehlt;
Diagnose, Browserkomposition, Browser-E2E, Writer und Persistenz bleiben geschlossen.
Auch die Runtimeblocker für Windows-Prozessbaumownership, handlegebundene
Pfadbereinigung und unabhängige Adapterausgabestille bleiben bestehen.

### ADR-0038-Isolierte CI-Testgruppierung vorgeschlagen / 2026-09-27

[ADR 0038](docs/decisions/0038-isolated-ci-test-grouping-for-diagnostic-adapter.md) ist neu
vorgeschlagen, nicht angenommen. Er präzisiert ausschließlich die mögliche
Gruppierung der ADR-0036-Adaptersuite in getrennten CI-Jobs mit isolierten
Runnern, Checkouts und frischen Node-Prozessen. Tests und vollständige
Kopielebenszyklen blieben innerhalb jeder Gruppe seriell; zwischen diesen Jobs
wäre keine zusätzliche Serialität verlangt. Eindeutige Fall-/Variantenmengen,
ungeteilte Kontroll-/Mutantenfamilien, gemeinsame Quellen, gebundene Ergebnisse
und vollständiger Cleanup wären Voraussetzungen des Gesamterfolgs. Gruppenzahl,
Zuschnitt und Auswahltechnik bleiben offen. Der lokale Commit-Prüfweg ist eine
getrennte Entscheidung; es entsteht keine wiederkehrende Referenztestpflicht.

Ausgangsbasis ist der von Jan bereitgestellte Branch
`codex/docs/adr-0038-ci-isolation`, HEAD
`1299011e63455658ac645fe7646fc55af8b07997`, sauberer Arbeitsbaum und ohne
staged Änderungen. Featurebranch und lokaler zugehöriger Remote-Tracking-Ref
binden denselben Commit; `main` und lokales `origin/main` bleiben bei
`91eef75adf179de8d32720562ea481bc891319b3`. Adapter und Tests sind damit
implementiert und committet. Die unten erhaltenen Vorreviewpassagen dokumentieren
ihre damaligen Bytes und nächsten Schritte, nicht einen erneuten Reviewauftrag.

Laut Jans Auftrag und vorliegendem lesendem Vertragsabgleich urteilt der
unabhängige Daybreak-Review technisch `PASS`. Ursprünglich verlangt war
`xhigh`; tatsächlich verwendete Jan Blue / Ultra und akzeptierte die Abweichung
ausdrücklich. Technisches PASS, damaliges formales INCOMPLETE und spätere
Akzeptanz bleiben getrennt; allein daraus folgt kein Wiederholungsreview.
Die historischen 1010/1010, 757/757, 1767/1767 und 3522/3522 Tests, der Build
mit 46 Modulen und der driftfreie Bundlecheck wurden hier nicht erneut ausgeführt.

Geändert sind ausschließlich der neue ADR, Entscheidungsindex, Datenverträge,
Architektur, Sicherheitsgrundlage, AGENTS.md und dieser Changelog. Die statische
Verifikation umfasst Allowlist, Diff, lokale Links/Anker, UTF-8/Dateihygiene,
Rohhashbindungen sowie unveränderten Index und Git-Refs. ADRs 0032–0037, Code,
Tests, Workflow, Paketdateien, Commithelfer und übrige Dateien bleiben unverändert.
Keine Tests, Harnessdiscovery, Modulproben, Builds, Bundlechecks, Benchmarks,
CI- oder Runtimevorgänge wurden gestartet.

Der statische Audit bestätigt die 160 übrigen getrackten Dateien rohbytegleich
zur Ausgangsbasis, alle sieben Quellbindungen des neuen ADRs gegen Checkout und
HEAD sowie unveränderte historische Vorreviewtexte. Alle 173 lokalen Links
und Anker in den sieben Dokumenten, darunter 26 neue Verweise, sind auflösbar;
UTF-8 ohne BOM und LF-Zeilenenden sind erhalten, der Whitespace-Diffcheck ist
ohne Befund. Der vorhandene Reviewlog bestätigt lesend 1010 Resultatzeilen bei
1000 Anzeigenamen; dies ist keine Harnessausführung.

`overallGate: FAIL`, `causeStatus: CAUSE_NOT_PROVEN`, `NOT_EVIDENCE` und
`runtimeRecord:null` bleiben unverändert. Authentisches Runtime-`A_obs` fehlt;
Diagnose, Browserkomposition, Browser-E2E, Writer und Persistenz bleiben geschlossen.
Windows-Prozessbaumownership, handlegebundene Pfadbereinigung und unabhängige
Adapterausgabestille bleiben spätere Laufblocker. Nächster möglicher Schritt
ist ein separat beauftragter Review der neuen Dokumentbytes, danach Jans
Entscheidung über Annahme und manuelle Git-Schritte. Die im ADR beschriebenen
Abnahme-, CI-, Laufzeit- und Speichernachweise bleiben spätere Arbeit.

### ADR-0036-Adapterfortsetzung / 2026-09-27

Der ausdrücklich beauftragte netzwerkfreie Adapter-/Testslice ist implementiert und frisch selbst geprüft: 1010/1010 Adaptertests, 757/757 Foundationtests, 1767/1767 gemeinsam und 3522/3522 in der seriellen Gesamtsuite. Die Bestandsregressionen bestehen mit 423/423, 466/466 und 735/735; Build: exakt 46 Module; Bundlecheck: Exit 0, driftfrei.

Dieser Eintrag betrifft den ausdrücklich autorisierten netzwerkfreien Adapter-/Testslice auf Branch `codex/feat/adr-0036-diagnostic-adapter-implementation`, HEAD `02412d2a054f86fef12f14c451ad6a3b7f38bbfc`. Die Fortsetzung begann am 2026-09-20 und wurde am 2026-09-26 auf erneuten ausdrücklichen Nutzerauftrag wiederaufgenommen. Letzter erforderlicher Prüfabschluss: 2026-09-26T22:00:20.7800541Z; das Sektionsdatum verwendet Europe/Berlin.

Der frühere Arbeitsbericht war kein Abschlussbericht und kein Review-PASS. Seine letzten erhaltenen 950 erfolgreichen und 22 fehlgeschlagenen Meldungen besitzen keinen vollständigen Footer und definieren kein N. Ein früher nachgewiesener Heapabbruch und das spätere unvollständig überlieferte Prozessende bleiben getrennt; dessen genaue Abbruchursache ist nicht bewiesen. Alle 104 vorhandenen alten Auditdateien wurden bewahrt.

#### Absichtliche Pause und gesonderte Wiederaufnahme

Der gesonderte Gesamtsuitenversuch full-final begann 2026-09-20T20:50:14.5376974Z und wurde auf ausdrücklichen Nutzerwunsch zur Pause beendet; das Wrapper-Ende ist 2026-09-20T21:08:09.2896742Z, der beobachtete erzwungene Exit -1. Sein Rohoutput besitzt keinen vollständigen Gesamtsuitenfooter und keine bestätigte Gesamttestzahl. Dies ist kein aus einem Testfehler abgeleiteter Suitebefund und wird weder mit dem älteren Heapabbruch noch mit dem früheren unvollständig überlieferten Adapterlauf vermischt. Am 2026-09-26T20:04:44.169Z bestätigte die Wiederaufnahmesicherung dieselben 166 Dateibindungen und 104 unveränderten alten Auditdateien. Die sechs am 20.09. abgeschlossenen Pflichtprüfungen werden nur über diese unveränderte Rohbindung weitergeführt. Als neuer Gesamtsuitenversuch ist ausschließlich full-resume-20260926-r2 ausgewählt; sein Ausgang stammt allein aus seinen eigenen vollständigen Laufbelegen. Alle ursprünglichen Pause-/Laufbelege bleiben erhalten.

| Pausen-/Wiederaufnahmebeleg | Bytes | SHA-256 |
| --- | --- | --- |
| full-final.start.json | 51551 | a37aebae11a9aa0a788b959f5876cf6516f401cb67139be8b50eaf389a2655e4 |
| full-final.completion.json | 101961 | 5b065ee3667354798a048de8cbbc570feb7c69aac76513db498e5abc659473ba |
| full-final.tap | 134532 | f5d9654a2e24ae2029284d38855599c9870ebb07afa81114960f94fe9094a51f |
| pause-checkpoint.json | 53473 | 0730e28e407466b75f37b9b22006f811e8ae13e9110b78f0c3c9c021cae1f8cc |
| pause-stop-request.json | 411 | 5a4df461a84334ed6410be5c39a5250d4393aee6ce3167c3be57f7c869c1f6a7 |
| resume-20260926-baseline.json | 51309 | e7e82c712f0655b2254adfc7d926c96d2427ccc81f1c2578d4c4aadd79500edc |

#### Gesonderter Auditwrapperfehler vor dem zweiten Retry

Der erste Gesamtsuiten-Retry full-resume-20260926 begann 2026-09-26T20:06:14.6381516Z. Sein vollständig erhaltener Rohfooter meldet 3522/3522, jeweils 0/0/0/0 Fail/Cancelled/Skip/Todo und 3795194.2362 ms. Danach scheiterte der Auditwrapper an einer lokalen LASTEXITCODE-Scopeüberschattung. Die Fehlerbeobachtung 2026-09-26T21:10:45.5140101Z ist keine native Laufendzeit; der beobachtete Wrapper-Exit 1 ist kein Testprozess-Exit. Nativer Exit, tatsächliches natives Laufende, Completion-Metadaten und die 166 Nachherbindungen fehlen. Der grüne Footer ersetzt diese fehlenden Belege nicht. Eine getrennte echte Exit-0-/Exit-7-Probe reproduzierte die Scopeüberschattung und bestätigte den expliziten globalen Capture; sie rekonstruiert den fehlenden alten Exit nicht. Dieser Versuch bleibt deshalb getrennte Arbeitsprovenienz und zählt nicht zu den neun abgeschlossenen Pflichtprüfungen. Als vollständiger neuer Gesamtsuitenversuch ist full-resume-20260926-r2 ausgewählt; ausschließlich dessen eigene Laufbelege können den Gesamtsuitennachweis schließen.

| Wrapperfehlerbeleg | Bytes | SHA-256 |
| --- | --- | --- |
| full-resume-20260926-wrapper-failure.json | 2543 | 5a50c0e2953786b6a70e3a6b904cdb8f8968ae5f7e2b324fc0b79d955a433181 |
| full-resume-20260926.start.json | 51869 | 21a36b3965707e9832e1d0f7746fbe1d5efd3bfc0bbb14e6ca4c6c5073aaaca3 |
| full-resume-20260926.tap | 561790 | a662ba863654d5c9f1cc51ceb71b7e69d42d284c0a6f05b0e71c726d51386d53 |
| run-required-resume-20260926.ps1 | 4311 | a2bba48426c16e0199293de2014fa5e61207c78cb196f2678f74fd315b4a4a80 |
| wrapper-exit-scope-probe-20260926.json | 754 | d091a67f6c889cff5097645e6d185ea975347470e5cf0ad22a14b9ef425f26df |

#### Klärung der 22 bekannten Fälle

| Fälle | Gruppe | Bestätigte Klärung |
| --- | --- | --- |
| 1–2 | Git-Alternates und Replace-Refs | Der statische Treiber endete zuvor nicht am tatsächlich erreichten Ablehnungspfad. Nur die erreichbaren List-/Close-Präfixe vor O0 und nach Cleanup wurden begrenzt; beide Sourceverletzungen und die unveränderte produktive Ablehnung bleiben geprüft. |
| 3 | U+FEFF innerhalb eines JSON-Strings | Beide rohen beziehungsweise escapeten inneren BOM-Werte bleiben gültige Stringdaten. Der Treiber liefert nach der getrennten Foundation-Semantikablehnung zuerst die tatsächlichen Post-Settlement-Sourceergebnisse. |
| 4–5 | RAW_PIPE_BYPASS / PRODUCER_EVENT_BYPASS | Der kausale Parserbypass war sichtbar; die alte Annahme von sechs Writes war falsch. Geprüft werden vier tatsächliche Writes, nicht gesendete Cleanupintents, Parserzähler, Caps, Marker, Finalisierung und FAIL. |
| 6–7 | FIFO-Material- und Eintragsgrenze | Gleiche Rohbytes und Schedulingpräfixe, präzise Zustandsprüfung vor der Capfreigabe: 4/5 Einträge bei 1 MiB sowie 256/257 Einträge. Der unabhängig gefundene asynchrone Cleanup-Enqueuefehler wird produktiv als Queueverletzung abgefangen. |
| 8–9 | Dedup und LIFO | Doppelte Antworten bleiben getrennt; LIFO wird anhand des eingefrorenen O0-Snapshots erkannt. Cleanupzeitliche spätere Antworten ersetzen diesen Beobachtungsnachweis nicht. |
| 10–12 | Network-Reihenfolge 10→12→11, Owner und öffentliche Factory | Rohe Ankunftsreihenfolge bleibt erhalten. Der produktive Receipt-Validator akzeptiert eindeutige dichte positive Reihenfolgen je Layer unabhängig von festen Stage-Arraypositionen; ein Sortiermutant erreicht dadurch das eigentliche Kausaloracle. |
| 13 | Inbound-Messagecap | Die 6/7-Grenze wird am festen read-only Vor-Cap-Zeitpunkt geprüft; spätere erlaubte Cleanupframes werden nicht rückwirkend dem ersten Batch zugerechnet. |
| 14–16 | Früher, doppelter und reentranter Marker | Nur die statisch bekannten realen Abbruch-/Cleanupfolgen des Treibers wurden korrigiert. Erfolgreiche importierte Kontrollen und die unveränderten Notification-/No-Record-Oracles bleiben erforderlich. |
| 17 | QUEUE_EMPTY_FULFILLMENT | Das gefälschte leere Fulfillment verletzt zuerst die Clockbuchführung. Das Oracle prüft strukturelles Pending, fehlenden Capture-Dequeue-Clockeintrag und den tatsächlichen confirmed-violation-Pfad statt eines später nicht erreichbaren Labels. |
| 18–22 | Operand 53: roh, doppelt gequotet, doppelt JSON, Whitespace, andere Ziffer | Alle fünf exakten Abweichungen bleiben observed/mismatch/DIVERGED. Ohne zusätzliche bestätigte Obserververletzung lautet das Ergebnis vertragsgemäß UNPROVEN/inconclusive statt FAIL; keine Normalisierung verdeckt die Abweichung. |

Die 22 exakten Namen, Ursachen und historischen Reparaturversuche bleiben in `known22-case-mapping.json` erhalten; dessen ältere offene Ergebnisstände werden nicht überschrieben. Die neuen 55/22-Ergebnisse stehen getrennt in `latest-known22-results.json` (34543 Bytes, SHA-256 `784e11dca0b08eef7610cd4c125af95104856339b49a095c892ef9b935c215bb`) und sind an den nachfolgenden abgeschlossenen Fokuslauf gebunden. Der neue gezielte Lauf `repaired-and-new-matrix-focused` bestand tatsächlich mit 55/55, Exit 0, 0 Fail/Cancellation/Skip/Todo und 317849.3797 ms TAP-Dauer. Er lief von 2026-09-20T19:12:45.8620400Z bis 2026-09-20T19:18:03.8496466Z; alle neun Vorher-/Nachherbindungen stimmen überein. Sein unveränderter UTF-16LE-Rohoutput mit BOM umfasst 25962 Bytes, SHA-256 `fb9e36b2a2552bb45e11934a7050da2fdcb3876275540b344033f35576b3a19c`. Die 55 Fälle enthalten die 22 geklärten Fälle, weitere Kontrollen/Mutanten und alle 23 neu ergänzten Grenzfälle; sie sind kein vollständiges N.

#### Zusätzliche Befunde, Verträge und Ergänzungen

Der asynchrone Cleanup-Enqueuepfad fängt eine volle FIFO als Parser-/Queueverletzung ab und beendet seine äußere Auflösung, ohne einen getrennten unhandled-Rejection-Kanal zu hinterlassen. Der Foundationresultat-Receiptvalidator prüft positive ganze, eindeutige und dichte Werte getrennt je Layer; er verlangt keine falsche Reihenfolge der festen Stagefelder. Negative Null-, Bruch-, Duplikat- und Lückenfälle bleiben abgelehnt.

Ergänzt sind beide Chrome-Spawnthrow-Einstiege, acht Änderungen roher Parent-/Held-Identitäten, drei tatsächliche Root-exit→Tree-Erfolgs-Mutanten, ein tatsächlich vorgezogener Exchange-Ack, drei verbotene Entfernungsanforderungen sowie vier Evaluations-Eingabefehler und zwei gleichlange tatsächliche Wireabweichungen. Die Entfernungsfälle verlangen `rm`, `rmdir` oder `unlink` über den geschlossenen virtuellen Resourceport nach wirklichen Identitätsprüfungen; die unbekannten Operationen werden abgelehnt. Es wird kein natives Delete ausgeführt und keine sichere native Löschprimitive behauptet. Der 4.259-Byte-Evaluationtext wird ausschließlich extrahiert und gehasht, niemals ausgeführt.

Kausale Mutanten erhalten auch bei gefiltertem Einzelaufruf eine frisch erfolgreich importierte passende Kontrolle. Identische Familien dürfen nur unveränderliche abgeschlossene Kontrollergebnisse beziehungsweise ein erfülltes Void-Promise behalten; Adapter-, Foundationmodule, Factories, Owner oder Capabilityinstanzen werden nicht als Importabkürzung wiederverwendet.

Die §15-Zuordnung umfasst K2-Pending/Deadline/Write-Ack/partiellen Gatewaystart, die vollständigen registrierten Capability-, Rawsignal-, Promise-, Parser-, FIFO-, Byte-, Source-/Load-, Replay-, Creation-, Cleanup-, Notification- und Recordgruppen sowie die Pflichtmutanten. Die konkrete 38-zeilige Anforderungsmatrix und ihre gezielten 55-Fall-Bindungen liegen in `living-contracts-section15-map.json`; Zeilenzahl und Testzahl sind verschieden. Die gesamte registrierte Matrix ist in den unten gebundenen ungefilterten Läufen ausgeführt. Die 757 geschützten Foundationtests einschließlich ihrer Array-, Notification-, Join- und Proxy-Deadlinebeweise bleiben unverändert und werden getrennt gezählt.

Der Finalizer besitzt keine Schreibfähigkeit. Frische tief eingefrorene Testergebnisse, unverändertes F, null Writeraufrufe und `runtimeRecord:null` bilden die strukturelle Writertrennung dieses Slices. Ein späterer Writer bleibt gemäß §12 gesondert zu entscheiden; hypothetische Persistenzfehler werden hier nicht ausgeführt.

#### Frische Abschlussverifikation

| Prüfung | Tatsächlicher Befund | Exit | Wallzeit | Beginn UTC | Ende UTC |
| --- | --- | --- | --- | --- | --- |
| Adapter | 1010/1010; 0 Fail/Cancelled/Skip/Todo | 0 | 2539783 ms | 2026-09-20T19:18:38.5763889Z | 2026-09-20T20:00:58.3594140Z |
| Foundation ohne zusätzliches VM-Flag | 757/757; 0 Fail/Cancelled/Skip/Todo | 0 | 3905 ms | 2026-09-20T20:01:16.2628266Z | 2026-09-20T20:01:20.1677626Z |
| Adapter + Foundation | 1767/1767; 0 Fail/Cancelled/Skip/Todo | 0 | 2862334 ms | 2026-09-20T20:01:29.9979459Z | 2026-09-20T20:49:12.3318149Z |
| BrowserSyncTransport | 423/423; 0 Fail/Cancelled/Skip/Todo | 0 | 2939 ms | 2026-09-20T20:49:33.2972248Z | 2026-09-20T20:49:36.2365066Z |
| SyncService + BrowserSyncTransport | 466/466; 0 Fail/Cancelled/Skip/Todo | 0 | 3214 ms | 2026-09-20T20:49:38.7923886Z | 2026-09-20T20:49:42.0069565Z |
| Sechs bestehende Sync-Suites | 735/735; 0 Fail/Cancelled/Skip/Todo | 0 | 6776 ms | 2026-09-20T20:49:44.3718066Z | 2026-09-20T20:49:51.1475887Z |
| Vollständige serielle Suite | 3522/3522; 0 Fail/Cancelled/Skip/Todo | 0 | 2916146 ms | 2026-09-26T21:11:44.6346471Z | 2026-09-26T22:00:20.7800541Z |
| Produktionsbuild | 46 Module | 0 | 803 ms | 2026-09-26T21:11:00.2796551Z | 2026-09-26T21:11:01.0821440Z |
| n8n-Bundlecheck | driftfreier Check | 0 | 508 ms | 2026-09-26T21:11:06.7169353Z | 2026-09-26T21:11:07.2246540Z |

Alle abgeschlossenen Abschlussläufe sind an ihr tatsächliches Repository-CWD, Node-/Vite-Version, ursprüngliches Outputencoding, vollständigen Rohoutput, Prozessende und 166 gleiche Vorher-/Nachher-Dateibindungen gebunden. Die folgenden Metadaten enthalten die vollständige Statistik. Die sechs vor der ausdrücklichen Pause vollständig abgeschlossenen Prüfungen bleiben an ihre unveränderten 166 Rohbytebindungen gebunden. Der unterbrochene full-final ersetzt den ausgewählten Gesamtsuiten-Retry nicht; offene oder abgebrochene Läufe erhalten kein erfundenes Ende und keine Nachherbindung.

| Lauf | Tatsächlicher Befehl | UTF-16LE-Rohoutput mit BOM | Bytes | Roh-SHA-256 | Metadaten | Metadaten-SHA-256 |
| --- | --- | --- | --- | --- | --- | --- |
| adapter-final | node --experimental-vm-modules --no-warnings --test --test-concurrency=1 "C:/Users/jslom/Documents/Projekte/GoldenDawn/tests/browserSyncTransportRuntimeDiagnosticAdapter.test.js" | adapter-final.tap | 188448 | 20669a860ed0f9a0cf2987ed653f755ade2df2a209784cf8771ea8affc7452ee | adapter-final.completion.json | c9fdc8e921db3f7fdaa95ced652531508172607b49b133c76a6d159260b726ce |
| foundation-final | node --test --test-concurrency=1 "C:/Users/jslom/Documents/Projekte/GoldenDawn/tests/browserSyncTransportRuntimeDiagnosticObserver.test.js" | foundation-final.tap | 81650 | 735f78ad9078dd20cebf2b0105dde5c607b82e0b4663d7c076a605a2c2abc627 | foundation-final.completion.json | 7ee416411f832798bd8b12245f2da9ae6dd1601bc29bdbbaef86e283fef77212 |
| combined-final | node --experimental-vm-modules --no-warnings --test --test-concurrency=1 "C:/Users/jslom/Documents/Projekte/GoldenDawn/tests/browserSyncTransportRuntimeDiagnosticObserver.test.js" "C:/Users/jslom/Documents/Projekte/GoldenDawn/tests/browserSyncTransportRuntimeDiagnosticAdapter.test.js" | combined-final.tap | 269998 | 018e1bf86e5e2e77eb1816d1187ebf16095ae7435b75d8d26a60a3d32eda1a87 | combined-final.completion.json | 9fc574bc7c689dd791dfcbf6066e0ade22c217c0be4b38edaa49f4529a35d8d3 |
| transport-final | node --test --test-concurrency=1 tests/browserSyncTransport.test.js | transport-final.tap | 59332 | abbf87e08d27c5293385872da45b5ddf66be20f47b185d799a543939b8a2665f | transport-final.completion.json | a681975f5820d8881d3fe3cba75b4404d29e56a9c3fe422372a2c1db5c001d9c |
| service-transport-final | node --test --test-concurrency=1 tests/syncService.test.js tests/browserSyncTransport.test.js | service-transport-final.tap | 68214 | 902f43b344863047e27a28e9014b8fbf4355ae8f5f2ecdb4acb75a83c84627d0 | service-transport-final.completion.json | ba97c12926041b05ad72d7855f6f634e46f6aa494b4e49d987221c88158e4df8 |
| six-sync-final | node --test --test-concurrency=1 tests/syncContract.test.js tests/syncService.test.js tests/syncGatewayRequestBoundary.test.js tests/syncAgent.test.js tests/localSyncGatewayHttpServer.test.js tests/browserSyncTransport.test.js | six-sync-final.tap | 116538 | b0908b6de8c61fca774e6c6b9610c08e2bfdd0694ddd566eb4d091409c485612 | six-sync-final.completion.json | 91630147cabfdd60a0c509c5a194bf02eb207ca232e1f4154469546adfa1e1a8 |
| full-resume-20260926-r2 | npm.cmd test -- --experimental-vm-modules --no-warnings --test-concurrency=1 | full-resume-20260926-r2.tap | 561766 | eea08e6dac544538818315bc0fb44e660c7eb0d54d7783d0e3adcfec062b45b8 | full-resume-20260926-r2.completion.json | 47b5dc47b9736ecff89bdd9bb74160797ca301caaf686970fb179e3f4f15cdf4 |
| build-final | npm.cmd run build | build-final.tap | 800 | 3c8d348bf9582ae04db4d52055ad4b934b17011121b98929802f468e5f8eb846 | build-final.completion.json | 2be75a1981119093c208514a6999610d8d0b33ad5b028f278962fda80a943fad |
| bundle-final | npm.cmd run bundle:n8n:check | bundle-final.tap | 214 | 76b2cdefb8109d788ba41d35fe5277589c1d2b74a80e74b2240b2aef916a4512 | bundle-final.completion.json | e188f6319b420bb3f8b6a7f65456b31b0869d8e91d26dec7a1af013a797942b7 |

| Abgeschlossener Lauf | CWD | Node | Node-Executable | Vite |
| --- | --- | --- | --- | --- |
| adapter-final | C:/Users/jslom/Documents/Projekte/GoldenDawn | v24.19.0 | C:\Program Files\nodejs\node.exe | 8.1.4 |
| foundation-final | C:/Users/jslom/Documents/Projekte/GoldenDawn | v24.19.0 | C:\Program Files\nodejs\node.exe | 8.1.4 |
| combined-final | C:/Users/jslom/Documents/Projekte/GoldenDawn | v24.19.0 | C:\Program Files\nodejs\node.exe | 8.1.4 |
| transport-final | C:/Users/jslom/Documents/Projekte/GoldenDawn | v24.19.0 | C:\Program Files\nodejs\node.exe | 8.1.4 |
| service-transport-final | C:/Users/jslom/Documents/Projekte/GoldenDawn | v24.19.0 | C:\Program Files\nodejs\node.exe | 8.1.4 |
| six-sync-final | C:/Users/jslom/Documents/Projekte/GoldenDawn | v24.19.0 | C:\Program Files\nodejs\node.exe | 8.1.4 |
| full-resume-20260926-r2 | C:/Users/jslom/Documents/Projekte/GoldenDawn | v24.19.0 | C:\Program Files\nodejs\node.exe | 8.1.4 |
| build-final | C:/Users/jslom/Documents/Projekte/GoldenDawn | v24.19.0 | C:\Program Files\nodejs\node.exe | 8.1.4 |
| bundle-final | C:/Users/jslom/Documents/Projekte/GoldenDawn | v24.19.0 | C:\Program Files\nodejs\node.exe | 8.1.4 |

Verifikationsauswertung: `verification-final-resume-20260927.json`, 16175 Bytes, SHA-256 `137861ec6ab439691995afbf807899bb49f554d3e0255605afc1241329439210`. N = 1010; gemeinsame Suite = 1767; vollständige Suite = 3522.

#### Aufwand und CI-Grenze

Die begrenzten Kostenkorrekturen ersetzen wiederholte Casefold-Vollscans durch eine lokale Mitgliedschaftsmenge, entfernen einen unbenutzten gehaltenen Pfadgraphen, übernehmen bei einem vollständigen ersten Chunk ausschließlich die bereits defensiv kopierten privaten Bytes und vermeiden unnötiges erneutes Sortieren bereits geordneter Snapshotordinale. Bei reentranter ungeordneter Veröffentlichung bleibt der numerische Sortierfallback erhalten. Private statische Raw-Fixtureseeds werden einmal gelesen, jeder Aufrufer erhält eine frische Map und frische Bytearrays; tatsächliche Sourceprüfungen und frische Modulimporte bleiben bestehen.

Die realen großen Sourcegrenzfälle und die kumulierte ungefilterte Suite werden anhand ihrer tatsächlichen Laufoutputs beurteilt. Unterschiedliche Zwischenfassungen sind kein kontrollierter Performancevergleich. Speicher-Samples belegen nur die gemessenen Zeitpunkte, keine exakte Maximalbelegung. Es wurden weder Heaplimits erhöht noch Worker, weitere Testdateien, GC-Schalter oder zusammengesetzte Teilläufe eingeführt.

CI bleibt unverändert bei `ubuntu-latest`, Node `20.19`/`22.12` und `timeout-minutes: 10`. Lokale Windows-/Node-24-Ergebnisse sind kein CI-Matrix- oder Zeitbudgetnachweis. Die autorisierten drei Toolingänderungen ergänzen ausschließlich `--experimental-vm-modules --no-warnings --test-concurrency=1` und ihre Erklärung. Ein tatsächlicher CI-Lauf wurde nicht ausgeführt.

| Zusätzliche tatsächliche Beobachtung | Auditdatei | Bytes | SHA-256 |
| --- | --- | --- | --- |
| Der ausgewählte Gesamtsuiten-Retry dauerte tatsächlich 2916146 ms Wallzeit (rund 48,6 Minuten). Das unveränderte CI-Limit beträgt 10 Minuten; Ubuntu mit Node 20.19/22.12 wurde nicht ausgeführt. Prozesssamples belegen keine exakte V8-Heapspitze. | performance-final-resume-20260927.json | 49050 | 25fd57276a32e5e25cd26e7f902580569eb3d8d882fd3d991b40c49084259965 |
| Alle 22 zuvor offenen Fälle und die 23 neuen Grenzfälle sind mit ihren exakten Namen im vollständigen Adapterlauf 1010/1010 jeweils erfolgreich gebunden. | known22-full-adapter-results.json | 118810 | 4730c3095c51e60e6b4cec44c515c685ba4c4a387ba24cdc3ec535e03e23e2cb |
| 38 Anforderungszeilen ordnen die verpflichtenden Vertragsgruppen und Mutanten konkreten registrierten Fällen zu; die ursprüngliche Fokusbindung 55/55 wird getrennt von den vollständigen Läufen ausgewiesen. | living-contracts-section15-map.json | 69719 | 7f4114ca242a222836e2aa94bac2a4599aad69020bb0bdf36b29d7b0549ada23 |
| Die Wiederaufnahme bestätigt alle 166 Pausebindungen, 104 alte Auditdateien, Projektrefs und Index. Interne Codex-Refänderungen werden getrennt ohne Ursachenbehauptung ausgewiesen. | resume-20260926-baseline.json | 51309 | e7e82c712f0655b2254adfc7d926c96d2427ccc81f1c2578d4c4aadd79500edc |

#### Rohbytebindungen und Schutzprüfung

| Code-/Toolingdatei | Bytes | SHA-256 |
| --- | --- | --- |
| scripts/browser/browserSyncTransportRuntimeDiagnosticAdapter.js | 257839 | 4d27ab936ab4cb2f20ac22f570ded19ebc2f68e7ee1d9014bb8d735979163e7d |
| tests/browserSyncTransportRuntimeDiagnosticAdapter.test.js | 463641 | cf8cd3802e2ae2904f6743a5c3ad7535b1dcd2d11029a1dbb59b19d8e704f6c7 |
| .github/workflows/ci.yml | 865 | 89d968ed7c2551187dab9a7a8816eb794f3d6a04f154f58fbc4f6b819183fca1 |
| scripts/git/Invoke-CommitWorkflow.ps1 | 9860 | 685ba6267103212cd350e49fa1e01ffbe0f23345898ab83bb5d02bf4edd3bc0e |
| docs/git-workflows.md | 4731 | 258c36b560deeffbb45dd9b4b358f7ad223906f379c993a07afe4a9e7a81ab2e |

Die endgültigen Rohhashes der sieben Statusdokumente werden nach dieser Änderung im Abschlussaudit und Bericht gebunden, nicht als Selbsthash in diesen Dateien. Der Vorstatusaudit `scope-protection-audit-resume-20260927-prestatus-result.json` (121662 Bytes, SHA-256 `3e7c0fe9978cde9a52726c10e329575722da097821cd21d05e950e05f175a7db`) bestätigt die 16 geschützten Dateien, alle ADRs und übrigen nicht freigegebenen Dateien gegen Soll- und rohe Baselinebindungen. Die Evaluation besitzt genau einen normativen Treffer, 4259 Bytes und SHA-256 `a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b`. Historischer Commit `8001cc7eb7d2fed68c5ca4061514b486a204ac44`, HEAD und Working Tree besitzen jeweils das unveränderte Frontendmanifest mit 51 Pfaden, 5606 Bytes und SHA-256 `6f3d5740b043308b4d38df33b6293c9064d8dd1b3f0c5801d50844336c195591`. Der Audit nach Anwendung dieser sieben Dokumentänderungen bindet zusätzlich deren vollständige neuen Bytes, Encoding, Links, Anker, Whitespace, Temp-Cleanup und Gitstatus.

HEAD, Branch, Projektrefs und Index blieben im Vorstatusaudit unverändert; es gibt weiterhin 164 getrackte Pfade. Interne Codex-Refänderungen werden getrennt ausgewiesen; aus ihrem Namen folgt kein Ursachenbeweis.

| Vergleich | Ref | Vorher | Nachher |
| --- | --- | --- | --- |
| historisch → Restart | refs/codex/turn-diffs/captures/1789316603132/ec9230b1-9dba-4a14-bf96-85199de0946f/base | refs/codex/turn-diffs/captures/1789316603132/ec9230b1-9dba-4a14-bf96-85199de0946f/base [NUL] 03b0350bbbb969198019adebe046738d0af7582b [NUL] tree [NUL]  | nicht vorhanden |
| historisch → Restart | refs/codex/turn-diffs/captures/1789929215308/8816e5bb-f371-4380-9927-24a7ca66049e/base | nicht vorhanden | refs/codex/turn-diffs/captures/1789929215308/8816e5bb-f371-4380-9927-24a7ca66049e/base [NUL] 44954fa2efc5570aa9360589a18ed4ec4d5c376a [NUL] tree [NUL]  |
| historisch → Restart | refs/codex/turn-diffs/checkpoints/4d9da7a2328a47fcf2a48774c63b94f6/64e9bbe66092224e94c1c67c9c049dcd/1789928433378/6d02f981-e7d9-4a5a-a5e3-564723c43ec2 | nicht vorhanden | refs/codex/turn-diffs/checkpoints/4d9da7a2328a47fcf2a48774c63b94f6/64e9bbe66092224e94c1c67c9c049dcd/1789928433378/6d02f981-e7d9-4a5a-a5e3-564723c43ec2 [NUL] 44954fa2efc5570aa9360589a18ed4ec4d5c376a [NUL] tree [NUL]  |
| Restart → aktueller Audit | refs/codex/turn-diffs/captures/1789929215308/8816e5bb-f371-4380-9927-24a7ca66049e/base | refs/codex/turn-diffs/captures/1789929215308/8816e5bb-f371-4380-9927-24a7ca66049e/base [NUL] 44954fa2efc5570aa9360589a18ed4ec4d5c376a [NUL] tree [NUL]  | nicht vorhanden |
| Restart → aktueller Audit | refs/codex/turn-diffs/captures/1790452952291/a5d44534-afe6-4db3-8399-67716cee0c47/base | nicht vorhanden | refs/codex/turn-diffs/captures/1790452952291/a5d44534-afe6-4db3-8399-67716cee0c47/base [NUL] 9bb8980206dd76d63dc5f23845e4bdef21f6ca15 [NUL] tree [NUL]  |
| Restart → aktueller Audit | refs/codex/turn-diffs/checkpoints/c1925b17cba1a210d944d9a1c3922865/9dedb9908579d4de1c695ae563b503f6/1790373891634/26d2bbf6-618c-4a08-82c3-af5066c2b35b | nicht vorhanden | refs/codex/turn-diffs/checkpoints/c1925b17cba1a210d944d9a1c3922865/9dedb9908579d4de1c695ae563b503f6/1790373891634/26d2bbf6-618c-4a08-82c3-af5066c2b35b [NUL] 9bb8980206dd76d63dc5f23845e4bdef21f6ca15 [NUL] tree [NUL]  |

#### Evidenz-, Sicherheits- und Reviewgrenze

Phase 0/Tor A ist am tatsächlichen begrenzten Diff bestätigt: Es wurden kein Modell, keine statistische Inferenz, kein Provider oder Workflow, keine Credentials oder privaten Inhalts-Payloads und keine neue Logging-, Storage- oder Telemetriefläche ergänzt. Neue Adapter-/Foundationtests bleiben netzwerkfrei. Ausschließlich die unveränderten bestehenden Regressionen beziehungsweise die Gesamtsuite dürfen die bisherigen Loopback-/Testprozessfixtures in `localSyncGatewayHttpServer.test.js` und `n8nCloudIngressProbe.test.js` verwenden. Normale Testinfrastruktur, Auditlogs, sichere temporäre Testkopien und erlaubte Buildoutputs sind keine Runtimeevidenz.

ADR 0035, ADR 0036 und ADR 0037 sowie die geschützte Foundation bleiben unverändert. Foundation und Testkopien bleiben `NOT_EVIDENCE`, die Testfinalisierung liefert `runtimeRecord:null`. Authentisches Runtime-`A_obs`, Diagnoselauf, Browserkomposition, Browser-E2E, Writer und Persistenz sind weder nachgewiesen noch autorisiert. `overallGate: FAIL` und `causeStatus: CAUSE_NOT_PROVEN` bleiben unverändert. Reale handlegebundene Windows-Prozessbaum-/Pfadcleanupfähigkeit und unabhängige Adapterausgabestille bleiben sichtbare Laufblocker; Root-Exit oder Handleclose wird nicht als vollständiger Tree-/Entfernungsbeweis ausgegeben. Keine reale Adapterclock, kein realer Adaptertimer, Browser, Debug-Pipe, manueller Gateway-/Vite-/Devserver, aktiver Portcheck oder externer Zugriff wurde für den neuen Adapter-/Foundationnachweis verwendet.

Historische Foundation-/Korrekturergebnisse, übermittelte frühere Reviews, unterbrochene Adapterarbeit, gezielte Reparaturläufe, frische Vollprüfungen und diese Selbstprüfung sind getrennte Nachweise. Als Nächstes folgt ausschließlich ein separat zu beauftragender unabhängiger Implementierungsreview mit `gpt-daybreak-blue-latest`, Reasoning `xhigh`; danach entscheidet Jan über den manuellen Commit. Ein unabhängiger Review wurde weder als PASS behauptet noch automatisch beauftragt. Es erfolgte keine Git-Schreibaktion.

### ADR-0036-Load-/Hashabgleich nach Foundationkorrektur / 2026-09-13

Dieser Dokumentationsslice gleicht ausschließlich ADR 0036 und die sieben
freigegebenen Living Documents an die unabhängig geprüfte und durch Jan
unverändert committete Arraydescriptor-Korrektur an. Der read-only Preflight
bestätigte Branch `codex/docs/adr-0036-array-descriptor-alignment`, HEAD
`8f8150e1426983ef18755a395fdb8d8c99dfc470`, genau den Parent
`91eef75adf179de8d32720562ea481bc891319b3`, Tree
`0ed2c672d2a05f1f5f41df35dd302ef1435c2f18` und den Commitbetreff
`fix: accept non-writable array length descriptors`. `main` und der nur lokal
gelesene Remote-Tracking-Ref `origin/main` standen auf dem Parent; 164 getrackte
Pfade, sauberer Working Tree, leerer Index, keine ungetrackten Dateien und
sauberer Ausgangsdiff samt `git diff --check`. Der Commitdiff umfasst exakt
die neun nachstehend gebundenen Dateien; produktiv entfernt er ausschließlich
die beiden zusätzlichen Writablebedingungen. Es erfolgte kein Fetch.

Die vor Änderungen erstellte Fundstellen- und Deltamatrix unterscheidet:

| Fundstellen | Bindungsklasse | Gezielter Abgleich |
| --- | --- | --- |
| ADR 0036 §1/§2/§10 und aktive Suiteangaben | aktive operative Bindung | korrigierte Foundation-/Testbytes, Auditbasis `8f8150e…`, aktive 757/757-Suite |
| Alte Hash-/Reviewtabellen und 422er-/595er-Nachweise | historischer Nachweis | Werte erhalten, historische Geltung ausdrücklich kennzeichnen |
| ADR 0036 Status/Kontext/§12/§14/§15/Konsequenzen/Neubewertung sowie Köpfe, Zusammenfassungen und Schrittfolgen der Living Documents | aktuelle Status- oder Schrittfolgeangabe | abgeschlossenen Korrekturreview und anschließenden Commit binden; neuen Dokumentreview und manuellen Dokumentationscommit vor einem neuen Adapterauftrag einordnen |

Jan übermittelte den unabhängigen Korrekturreview von
`gpt-daybreak-blue-latest`, Reasoning `xhigh`, als Chatbericht: `PASS` ohne
relevante Befunde. Dieser Review galt ausschließlich Basis
`91eef75adf179de8d32720562ea481bc891319b3` plus den folgenden neun damals
uncommitteten Rohbytefassungen. Jan übernahm diese Bytes anschließend
unverändert in `8f8150e1426983ef18755a395fdb8d8c99dfc470`. Alle neun
Reviewhashes und Bytezahlen stimmen mit den rohen Commitblobs und den Dateien
vor diesem Dokumentabgleich überein:

| Reviewdatei | Bytes | SHA-256 der damaligen Reviewfassung und des Korrekturcommitblobs |
| --- | ---: | --- |
| `scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js` | 219112 | `d4cadf656bb50e2b062c9d0d66e3f895bc87649362ce995abfbdbe24a9f4e731` |
| `tests/browserSyncTransportRuntimeDiagnosticObserver.test.js` | 325244 | `4cf2698fa2af48750a71a5effbc23e059ef51133e0646c3e0333bb93d633cb64` |
| `AGENTS.md` | 200088 | `3c1ae4b04301e7e1782f003642f347ce4b88a0015b704b1f7f10c479b90e58e9` |
| `CHANGELOG.md` | 178108 | `1333b8b2f2e62eb3bd7957339982e65939904f0f75aee0a60d728aae58c55bc0` |
| `docs/architecture.md` | 278419 | `79c9f2f5673dd261ddf75baf3b220125d49aaf5e820cc63d506e200696c5c680` |
| `docs/data-contracts.md` | 719684 | `27fc7694d974aeeaddf11525807cce341e4db9e27d31418f7749ca09200af5e6` |
| `docs/roadmap.md` | 226600 | `706a89d491310cb531d92ff1809176f3373e9141ad5ac302726d6f003e8f5520` |
| `docs/security.md` | 282890 | `80ed9c5c93c00f3b7fba36a63b934027e7c836077d48743d5884e277e166fe46` |
| `docs/decisions/README.md` | 30305 | `22e3d07e4296d6d709e8b932fa562e9a45b8f1eb4add05d75c68de633820e492` |

Der Review wurde weder auf dem Korrekturcommit noch auf den jetzigen neuen
Dokumentfassungen ausgeführt. Für den Chatbericht werden kein Berichtspfad,
Berichtdateihash oder Ausführungszeitpunkt behauptet. Frühere R1–R4-Reviews,
ADR-0037-Annahme, dessen Implementierungsreview und Featurecommit sowie
ADR-0036-Vorannahmereview und Annahme behalten ausschließlich ihre jeweiligen
historischen Bindungen. Korrekturreview, jetzige Selbstprüfung und erst noch
separat zu beauftragender unabhängiger Dokumentreview sind davon getrennt.

Die Ergebnisprovenienz der abgeschlossenen Korrektur lautet:

| Prüfung | Korrekturimplementierungsbericht | Vom unabhängigen Korrekturreview selbst wiederholt |
| --- | --- | --- |
| Foundation | 757/757 = 595 + 162 | 757/757 |
| BrowserSyncTransport | 423/423 | nicht erneut ausgeführt |
| SyncService plus Transport | 466/466 | nicht erneut ausgeführt |
| sechs serielle Sync-Suites | 735/735 | nicht erneut ausgeführt |
| serielle Gesamtsuite | 2512/2512 = 1755 + 757 | nicht erneut ausgeführt |
| Build | exakt 46 Module | exakt 46 Module |
| Bundlecheck | driftfrei | Exit 0, driftfrei |

Alle genannten abschließenden Testläufe hatten laut ihren jeweiligen Berichten
0 Fehler, Cancellations, Skips und Todos. Die historische 595er-Baseline und
sechs VM-Gegenproben wurden vom Korrekturreview nicht erneut ausgeführt.
Die größeren Implementierungsprüfungen nutzten ihre ausdrücklich erlaubten
bestehenden Loopback-/Testprozessfixtures; sie waren nicht vollständig
netzwerkfrei. Diese berichteten Ergebnisse sind keine eigenen Läufe des
jetzigen Dokumentationsslices.

Aktiv sind in ADR 0036 §2 ausschließlich Foundationhash `d4cadf65…`, in §10
ausschließlich Testhash `4cf2698f…` und die Fokussuite 757/757. Die vollständigen
Hashes stehen in der obigen Tabelle und in den jeweiligen ADR-Abschnitten.
Die Auditbasis `8f8150e…` ist kein fest vorgeschriebener Repositorycommit eines
späteren Laufs: Der unveränderte Loadervertrag bindet weiterhin den tatsächlich
angegebenen `repositoryCommit` und dessen rohen Foundationblob. Frühere
Foundation-/Testhashes bleiben historische Nachweise und sind kein
zusätzlicher akzeptierter Loaderhash oder Fallback.

Die Korrektur setzt die fortgeltende native Arraygrammatik mit beiden
Writablezuständen um; sonstige Descriptor-, Dichte-, Key-, Cap- und Aliasregeln
bleiben erhalten. Die Foundation mutiert oder friert fremde Graphen nicht ein,
und der vollständige Adapter-Deep-Freeze-Vertrag bleibt unverändert. Die 162
zusätzlichen Tests und fünf kausal erkannten Mutanten (vier Writablezwänge und
ein Feld-ID-Bypass) sind reine Foundationnachweise. Die 27 Notificationmutanten,
vier Deadlinemutanten, 18 Joinfälle, elf Joinmutanten sowie das getrennte
Drei-Microtask-Präfix und strukturelle Pending-Oracle bleiben erhalten. Daraus
folgen keine ausgeführten Raw-Adapter-, Parser-, FIFO-/Cap-Wiring-,
Adaptertestkopien- oder authentischen `A_obs`-Nachweise.

ADR 0036 bleibt ausdrücklich durch Jan `Angenommen – 2026-09-12`. Vor diesem
Abgleich bestätigte der Rohbyteaudit seine vollständigen 168357 Bytes mit
`0727943c53644d1381f478e8f28771592493f6010208b3fe25d7f9a70d44e528`
und den Hauptteil ab einschließlich `## Kontext` mit 166449 Bytes und
`c61cd42d8da9ae7d5cfe62884a53e8761301a96c5f471554c884152c77b15566`.
Die Hauptteilgleichheit gilt ausdrücklich historisch für die damalige
Annahmenachführung. Dieser beauftragte Abgleich ändert ausgewählte
Hauptteilpassagen ohne neue Annahme oder Architekturentscheidung; die neuen
vollständigen Bytes werden nicht vom alten Vorannahme-PASS gedeckt. Finale
Dokument- und Hauptteilhashes stehen ausschließlich im Abschlussbericht,
damit keine zirkuläre Selbsthashbindung entsteht.

Dieser Dokumentationsslice führte nach den Dokumentkorrekturen ausschließlich
die folgenden drei bestehenden Projektprüfungen seriell selbst aus:

| Eigene Bestandsprüfung | Ergebnis |
| --- | --- |
| `node --test --test-concurrency=1 "C:/Users/jslom/Documents/Projekte/GoldenDawn/tests/browserSyncTransportRuntimeDiagnosticObserver.test.js"` | Exit 0; 757/757; 0 Fehler, Cancellations, Skips und Todos; kein zusätzliches VM-Flag |
| `npm.cmd run build` | Exit 0; exakt 46 transformierte Module |
| `npm.cmd run bundle:n8n:check` | Exit 0; driftfrei |

Vor und nach diesen Läufen bestätigte der Rohbyteaudit alle 15 Schutzbindungen
gegen Sollhashes und rohe HEAD-Blobs. Die übrigen 156 getrackten Dateien
blieben gegenüber der Start-Rohbytebaseline unverändert, darunter sämtliche
36 anderen ADRs; ADR 0037 blieb auch im getrennt gehashten Hauptteil bytegleich.
Das Frontendmanifest blieb für historischen Commit, aktuelle Basis und Working
Tree bei 51 Pfaden, 5606 Bytes und
`6f3d5740b043308b4d38df33b6293c9064d8dd1b3f0c5801d50844336c195591`.
Die eindeutig extrahierte, niemals ausgeführte Evaluation blieb bei 4259 Bytes
und `a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b`.

Der Abschlussaudit bestätigt ausschließlich die acht erlaubten Dokumente als
ungestagten Diff, weiterhin 164 getrackte Pfade, keine neuen Repositorydateien
oder verbliebenen temporären Foundationtestkopien und einen unveränderten
Bestand ignorierter Pfade. Branch, HEAD, Tree und alle zu Beginn erfassten Refs
blieben unverändert; Index und `git diff --check` sind sauber. Alle acht
Dokumente sind gültiges UTF-8 ohne BOM, mit ausschließlich LF, finaler LF und
ohne NUL-Bytes; 156 lokale Linkziele und 23 verwendete Überschriftsanker sind
gültig. Vorgeschriebene PowerShell-CRLF-Darstellungen wurden anhand der
Start-Rohbytes unverändert bestätigt und nicht normalisiert. Der ADR-0036-Diff
bleibt innerhalb der vorherigen Deltamatrix; die nicht freigegebenen technischen
Passagen und sämtliche gefenceten technischen Blöcke aller acht Dokumente
bleiben bytegleich. Es gab keine weiteren Projektprüfläufe, Git-Schreibaktionen
oder Adapter-, Browser-, Netzwerk- oder Diagnoseausführung.

Als Nächstes folgen ausschließlich der separat beauftragte unabhängige
Dokumentreview der acht neuen Rohbytefassungen, bei erfolgreichem Review Jans
manueller Dokumentationscommit und erst danach ein neu gebundener,
ausdrücklich beauftragter netzwerkfreier Adapterimplementierungs- und
Testslice. Die Selbstprüfung ist kein unabhängiger Review-PASS.
`overallGate: FAIL`, `causeStatus: CAUSE_NOT_PROVEN`, Foundation `NOT_EVIDENCE`
und fehlendes authentisches adapterseitiges `A_obs` bleiben unverändert.
Sämtliche sichtbaren Laufblocker, insbesondere Windows-Prozessbaumownership,
handlegebundener Pfadcleanup und unabhängige Adapterausgabestille, gelten fort.
Adapterimplementierung und ausgeführte Adaptertests sowie Browser-, Diagnose-,
E2E-, Writer- und Persistenzfreigaben fehlen weiterhin. Git-Schritte bleiben
manuell bei Jan.

### Foundation-Arraydescriptor-Korrektur / 2026-09-13

Der folgende Eintrag hält den damaligen Implementierungsabschluss vor
Korrekturreview, Jans Commit und dem oben dokumentierten Load-/Hashabgleich
historisch fest. Seine damaligen Ausgangs-, Ergebnis-, Hash- und
Schrittfolgeangaben werden nicht auf den jetzigen Dokumentationsslice übertragen.

Der vorgeschaltete lokale Vertragsabgleich trägt eine begrenzte Korrektur der
Foundation auf Branch `codex/fix/diagnostic-foundation-array-descriptors`.
Ausgangsbasis ist `91eef75adf179de8d32720562ea481bc891319b3`, Tree
`3813cab2394657b5d3432f8a2cd32848d9b7754b`, identisch zu den lokal gelesenen
Refs `main` und `origin/main`; 164 getrackte Pfade, sauberer Worktree und
leerer Index. Es wurde weder gefetcht noch eine Git-Schreibaktion ausgeführt.

| Prüfer und Callsite | Bestehender Vertrag | Beleg und kleinstes Delta |
| --- | --- | --- |
| `readClosedTargetInfos`, aufgerufen aus `parseGetTargetsResponse`; Baseline Zeile 2448 | [ADR 0033 §6](docs/decisions/0033-browser-sync-transport-diagnostic-foundation-effects-protocol-boundary.md), [ADR 0034 §1](docs/decisions/0034-browser-sync-transport-diagnostic-foundation-grammar-derivation-and-testability-boundary.md) verlangen native Length-/Dense-/Descriptorgrenzen, keinen Writablezwang; [ADR 0036 §5](docs/decisions/0036-browser-sync-transport-runtime-diagnostic-adapter-boundary.md) verlangt den tief eingefrorenen JSON-Graphen | Die zusätzliche Bedingung `lengthDescriptor.writable !== true` verwirft diesen Graphen. Ausschließlich diese Bedingung ist entfernt. |
| `readClosedArray`, aufgerufen aus `copyRunBinding` für genau 59 `replayOperands`; Baseline Zeile 447 | ADR 0033 §2/§6 und ADR 0034 §1 sowie der [Living Contract](docs/data-contracts.md#prototyp--frische--und-freezegrammatik) verlangen dieselbe native Arraygrammatik ohne Pflicht zu `writable: true` | Derselbe zusätzliche Implementierungsguard ist eigenständig nicht normativ verlangt und ebenfalls entfernt. Aus dem R0-Freeze wird kein zweiter Adapterblocker abgeleitet. |

ADR 0034 gilt über ADR 0035 fort; ADR 0037 ändert ausschließlich die
Notificationgrenze und verlangt keine zusätzliche Writablebedingung.
Ein nativer Array-Längendescriptor kann bei unveränderten
`enumerable: false`-/`configurable: false`-Grenzen beide Writablezustände
besitzen. Das Verbot, fremde Eingaben durch die Foundation einzufrieren,
verbietet nicht die Annahme bereits eingefrorener Eingaben. Keine weitere
Array-, Alias-, Descriptor-, Exact-once-, Cap-, Clock-, Korrelations-, Join-,
Notification-, Cleanup-, Projektions- oder Fehlerpräzedenzgrenze wurde geändert.
Es gibt keinen neuen Validator, Import, Export, Anker oder Testseam. Der
Adapter-Freezevertrag bleibt vollständig erhalten; dies ist eine
Implementierungskorrektur ohne neue normative Entscheidung oder Review-PASS.

Vor der ersten Änderung bestanden erneut 595/595 Foundationtests. Sechs
separate Gegenproben liefen danach mit den unveränderten, längen- und
hashgeprüften Produktionsbytes als in-memory `vm.SourceTextModule` mit
kanonischer File-URL, ohne Instrumentierung oder Imports. Beide veränderlichen
Kontrollen erreichten die sechs synthetischen Commandintents einschließlich
Evaluate. Nur `length.writable = false` und der vollständige Deep Freeze
führten bei `targetInfos` jeweils schon nach `Target.getTargets` zu
`FAIL/observer-invalid`, Capture `not-started`; bei `replayOperands` scheiterten
beide Profile bereits am statischen Factory-Dependencyfehler ohne Intent.
Alle sechs erwarteten Baselinebeobachtungen wurden durch Assertions bestätigt.
Der Evaluationstring wurde niemals ausgeführt. Diese reine Gegenprobe
verwendete lokal `node --experimental-vm-modules --no-warnings --input-type=module -`;
die dauerhafte Testsuite benötigt weiterhin keine zusätzlichen Prozessflags.

Die additiven Regressionen liegen ausschließlich in der bestehenden
[Foundationtestsuite](tests/browserSyncTransportRuntimeDiagnosticObserver.test.js):

| Nachweis | Test beziehungsweise Oracle |
| --- | --- |
| Drei gültige Profile je Arrayprüfer, echte Übergabeidentität, unveränderte Eingaben | `akzeptiert beide nativen Arraylaengendescriptoren und tief gefrorene Eingabegraphen`; vollständige Intents und Resultprojektionen einschließlich Stages, Counts, Capturestart und terminalem Cleanup sind wertgleich, getrennte Runs bleiben frisch |
| Beide Writablezustände, kein freier Read/Getter/Freeze/Schreibzugriff | `bewahrt Exact-once-Reflection ohne Fremdreads oder Mutation fuer beide Writablewerte`; Proxyvorbereitung erfolgt vor Messung, alle Descriptorresultate erfüllen Proxy-Invarianten |
| Holes, Symbole, Extras, Accessors, fremder Prototyp, Reflectionthrows, Keyfolge und Alias | `erhaelt die geschlossenen Arraygrenzen und Reflectionfehler bei beiden Writablewerten`; keine unmöglichen nativen Lengthdescriptoren als Fixture |
| Targetgrößen 0/1/128/129, keine Elementreads über 128, doppelte/angehängte Targets und Antwortdubletten | `erhaelt Targetkardinalitaet und den 129er-Guard vor Elementreads bei beiden Writablewerten`; Dublette vor Evaluate bleibt `U` ohne Evaluate, während Capture bleibt sie `UNPROVEN` bis `cap-fired` |
| Alle 59 falschen Feld-IDs unter gültiger gefrorener Kontrolle; fehlende, zusätzliche, vertauschte Positionen, Zustand, Nullregel und Skalarfehler | `prueft gefrorene Replaynegativfixtures hinter einer gueltigen 59-Positionen-Kontrolle`; die frühere vorgeschaltete Freezeablehnung maskiert diese Prüfungen nicht mehr |
| Vier isolierte Writablezwänge und zusätzlicher Feld-ID-Bypass | `erkennt vier getrennte Array-Writablezwang-Mutanten am selben oeffentlichen Verhaltensoracle`; pro Arrayprüfer werden alter True-Zwang durch nicht schreibbare Profile und umgekehrter False-Zwang durch veränderliche Kontrollen erkannt; der fünfte Mutant weist die kausale gefrorene Feld-ID-Ablehnung nach |

Alle fünf Mutanten werden erfolgreich über den unveränderten
ADR-0035-Testkopie-v2-Zugang mit insgesamt fünf Exports importiert und am
gleichen jeweiligen Verhaltensoracle wie ihre Kontrollkopie erkannt.
Jede Kopie entsteht frisch aus rohbytegeprüfter Produktionsquelle mit genau
einer begrenzten Mutation und wird außerhalb des Repositorys seriell geprüft;
das bestehende `finally` bestätigt die Nichtexistenz von Kopie und Testroot.
Alle bisherigen Tests bleiben erhalten, darunter 27 Notificationmutanten,
vier Deadlinemutanten, 18 Joinfälle und elf Joinmutanten sowie das getrennte
Drei-Microtask-Präfix und strukturelle Pending-Oracle. Bei Setup-/Cleanup-
Deadlinegleichheit und -überschreitung bleiben die vier Envelope-Traps null.

Tatsächlich ausgeführte abschließende Prüfungen unter lokalem Node `24.19.0`:

| Befehl | Ergebnis |
| --- | --- |
| `node --test --test-concurrency=1 tests/browserSyncTransportRuntimeDiagnosticObserver.test.js` | 757/757, `F = 595 + 162` |
| `node --test --test-concurrency=1 tests/browserSyncTransport.test.js` | 423/423 |
| `node --test --test-concurrency=1 tests/syncService.test.js tests/browserSyncTransport.test.js` | 466/466 |
| `node --test --test-concurrency=1 tests/syncContract.test.js tests/syncService.test.js tests/syncGatewayRequestBoundary.test.js tests/syncAgent.test.js tests/localSyncGatewayHttpServer.test.js tests/browserSyncTransport.test.js` | 735/735 |
| `npm.cmd test -- --test-concurrency=1` | 2512/2512, exakt `1755 + 757 = 2350 + 162` |
| `npm.cmd run build` | Exit 0; exakt 46 Module |
| `npm.cmd run bundle:n8n:check` | Exit 0; driftfrei |

Alle abschließenden Testläufe besitzen 0 Fehler, Cancellations, Skips und Todos.
Ein erster erweiterter Zwischenlauf hatte drei falsche neue Erwartungen zur
wohlgeformten Dublette vor Evaluate und den dadurch fehlschlagenden Elterntest.
Diese Erwartungen wurden an den unveränderten ADR-0035-§8-Vertrag angeglichen;
das produktive Delta blieb bei den zwei entfernten Writablebedingungen.

Neue Foundationlogik, neue Fixtures und ihre Nachweise sind netzwerkfrei.
Die bestehenden Gesamtregressionen verwenden getrennt ausschließlich die
erlaubten Loopbackabläufe von `localSyncGatewayHttpServer.test.js` und
`n8nCloudIngressProbe.test.js` samt vorhandenen Socket-, Listener-, Timer-
und Child-Cleanupprüfungen. Bestehende kontrollierte Node-Testkindprozesse,
temporäre Testkopien und Buildartefakte bleiben Test-/Buildausnahmen. Es gab
keinen Browser-, CDP-, manuellen Gateway-, Vite-, Diagnose- oder Replaylauf,
keinen externen Request und keine neue Hostfähigkeit der Korrekturfixtures.

| Artefakt | Alte Bytes / SHA-256 an HEAD | Neue Bytes / SHA-256 im ungestagten Diff |
| --- | --- | --- |
| Foundation | 219196 / `ff55a775ccbb7588474fc1efe3e1a08d871ce3524f133a000b0b3d8c7512eb1d` | 219112 / `d4cadf656bb50e2b062c9d0d66e3f895bc87649362ce995abfbdbe24a9f4e731` |
| Foundationtests | 305890 / `1e8ce75e175b3e74c8c8b064e343550f32865fd5703aa54e01ead909a86e100c` | 325244 / `4cf2698fa2af48750a71a5effbc23e059ef51133e0646c3e0333bb93d633cb64` |

Vor Änderungen trafen alle 16 Schutzdateien ihre festen Sollhashes und rohen
HEAD-Blobs. Aus diesem Bestand ändern sich ausschließlich Foundation und
Foundationtests. Die übrigen 14, alle weiteren ADRs sowie Produkt-, Paket-,
Lockfile-, CI-, Workflow-, Bundle-, Generator- und Evidencepfade bleiben
bytegleich. Der ADR-0037-Hauptteil bleibt bei 30763 Bytes und
`83d728f3d4fb088b78e1577457aad561d971579c57c8f5898fcce83f61df831c`.
Die eindeutige Evaluationextraktion bleibt bei 4259 Bytes und
`a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b`.
Das Frontendmanifest bleibt für historischen Commit
`8001cc7eb7d2fed68c5ca4061514b486a204ac44`, Ausgangsbasis und Working Tree bei
51 Pfaden, 5606 Bytes und
`6f3d5740b043308b4d38df33b6293c9064d8dd1b3f0c5801d50844336c195591`.
Der abschließende Audit prüft alle 164 getrackten Pfade gegen die gesicherten
Ausgangsbytes, die Neun-Dateien-Whitelist, UTF-8/LF und unverändertes
PowerShell-CRLF, lokale Dokumentlinks, Diffcheck, leeren Index und unveränderte
Refs. Es gibt keine neue Repositorydatei oder verbliebene temporäre Testkopie.

Phase 0/Tor A bleibt anhand des Diffs bestätigt: keine Modelle, statistische
Inferenz, Provider, Credentials, privaten Inhaltspayloads, Telemetrie oder
neu autorisierte Persistenz; Kommunikations- und Produktkomposition bleiben
unverändert. Foundation bleibt `NOT_EVIDENCE`, ohne Runtime-Record, Writer,
authentischen adapterseitigen `A_obs`-Nachweis oder Ursachenbeweis.
`overallGate: FAIL` und `causeStatus: CAUSE_NOT_PROVEN` bleiben fest.

Dieser Auftrag endet mit geprüftem, ungestagtem Diff; der unabhängige
Implementierungsreview steht aus. Ausschließlich separat beauftragt folgen
`gpt-daybreak-blue-latest` mit Reasoning `xhigh`, nach bestandenem Review Jans
manueller Korrekturcommit, danach ein dokumentarischer ADR-0036-Load-/Hashabgleich
samt Prüfung und erst anschließend ein neu gebundener Adapterauftrag.
ADR 0036 bleibt angenommen und unverändert: Seine alten Load-/Testhashes
passen ausdrücklich noch nicht zu diesen korrigierten Foundationbytes.
Die Adapterimplementierung wird hier nicht fortgesetzt. Frühere Review-PASS-
Urteile und Berichtshashes bleiben an ihre damaligen Bytes gebunden. Lauf-,
Browser-, E2E-, Writer- und Persistenzfreigaben werden nicht erteilt.

### ADR-0036-Annahme und abgeschlossener Dokumentreview / 2026-09-12

Jan hat ADR 0036 am `2026-09-12` ausdrücklich angenommen:
„Ja, ADR0036 wird hiermit ausdrücklich von mir angenommen.“ Der Status lautet
`Angenommen – 2026-09-12`. Unmittelbar davor übermittelte Jan den unabhängigen
Daybreak-Blue-Latest-/xhigh-Dokumentreview als Chatbericht: `PASS`, keine
Befunde, kein belegbarer Dokumentvertragsverstoß und kein normativer
Anschlussblocker. Dieser abgeschlossene Review gilt ausschließlich für die
folgenden vollständigen Vorannahmebytes, nicht für die vollständigen
Dokumenthashes nach dieser Statusnachführung:

| Dokument | SHA-256 der unabhängig geprüften Vorannahmefassung |
| --- | --- |
| [ADR 0036](docs/decisions/0036-browser-sync-transport-runtime-diagnostic-adapter-boundary.md) | `788c6fc074148278476d776417ad04767ac4384d46f8d84d78cf3b7f94e79682` |
| [AGENTS.md](AGENTS.md) | `b2b59ec5acb818b71086f22b7f3a060d47bfdec618b03538b5e48a9cdcac50af` |
| [CHANGELOG.md](CHANGELOG.md) | `ade84b93fbf6534517cf6d5b7efca84d2eb5538fbc796e1898cf92d5bff57b35` |
| [architecture.md](docs/architecture.md) | `427ddd610040d2eb2b1a78a1c7a47af9bd2b78bddda6d7f5f14a3d4e06fcfbfa` |
| [data-contracts.md](docs/data-contracts.md) | `80e27e95c8330ff74d3cc814b180db3148bd47eb5b482aac0441cdfecd63b698` |
| [roadmap.md](docs/roadmap.md) | `7518e3bcc616219b62eeee662e5b23d7f3316e97728bdc3abf3f78dbaf3764ba` |
| [security.md](docs/security.md) | `b3d2b214374541420933033b52905f2c82c25810dbecb09e3e0f14409ccc1bea` |
| [ADR-Index](docs/decisions/README.md) | `7ad815d56fbce7e9b0f391e8f97651640c4c4f57328c92eb84c807a904635523` |

Laut Jans übermitteltem Reviewbericht blieben diese acht Hashes vor und nach
den Prüfläufen unverändert. Der Bericht bestätigt 595/595 Foundationtests bei
jeweils 0 Fehlschlägen, Cancellations, Skips und Todos, einen erfolgreichen
Produktionsbuild mit exakt 46 Modulen, den driftfreien n8n-Bundlecheck mit
Exit 0 sowie bestandene Schutz-, Hauptteil-, Evaluation-, Manifest-, Link-,
Byte- und Git-Audits. Dies sind berichtete Ergebnisse des unabhängigen
Dokumentreviews, keine eigenen Prüfergebnisse dieser Statusnachführung.
Ein Berichtdateipfad, Berichtdateihash oder Ausführungszeitpunkt wird für den
Chatbericht nicht behauptet. R1–R4-Review, ADR-0037-Dokumentreview und Annahme,
ADR-0037-Implementierungsreview, Jans unveränderte Übernahme in den
Featurecommit, dieser ADR-0036-Dokumentreview und die anschließende Annahme
bleiben getrennte Bindungen.

Die damalige Annahmenachführung beschränkte sich auf den ADR-0036-Statuspräfix
und die Status-/Review-/Schrittfolgeangaben der sieben Living Documents. Der
geprüfte Hauptteil ab einschließlich `## Kontext` wurde damals unverändert übernommen:
166.449 Bytes, SHA-256
`c61cd42d8da9ae7d5cfe62884a53e8761301a96c5f471554c884152c77b15566`.
ADR 0035 und ADR 0037 bleiben unverändert angenommen; Foundation und Tests
bleiben unverändert implementiert und geprüft. Die Adaptergrenze ist
entschieden, Adapter und Adaptertests fehlen weiterhin. Ein eigener
netzwerkfreier Adapterimplementierungs- und Testslice benötigt einen neuen
gesonderten Auftrag. Foundation `NOT_EVIDENCE`, fehlendes authentisches
adapterseitiges `A_obs`, `overallGate: FAIL` und
`causeStatus: CAUSE_NOT_PROVEN` bleiben unverändert. Windows-Prozessbaumownership,
handlegebundene Pfadbereinigung und unabhängige Adapterausgabestille bleiben
sichtbare Laufblocker; Lauf-, Browser-, E2E-, Writer- und Persistenzfreigaben
fehlen weiterhin. Dieser Auftrag endet nach Statusnachführung und Verifikation;
Git-Schritte bleiben manuell bei Jan.

In dieser Statusnachführung tatsächlich und seriell ausgeführt: die bestehende
Foundation-Fokussuite mit 595/595 Tests bei jeweils 0 Fehlschlägen,
Cancellations, Skips und Todos, der erfolgreiche Build mit exakt 46 Modulen
und `bundle:n8n:check` mit Exit 0 ohne Drift. Der begrenzte Status-/Differenz-
und Integritätsaudit bestätigt den bytegleichen ADR-0036-Hauptteil, alle
anderen ADRs, die 15 Schutzdateien gegen Sollhashes und rohe HEAD-Blobs,
den unveränderten und nicht ausgeführten 4.259-Byte-Evaluationstring sowie
das identische 51-Pfade-/5.606-Byte-Frontendmanifest für historischen Commit,
HEAD und Worktree. UTF-8/LF, lokale Links und verwendete Überschriftsanker,
Diffcheck, die Acht-Dateien-Whitelist, die übrigen 156 getrackten Dateien
gegen die gesicherten Ausgangsbytes sowie unveränderte Refs und leerer Index
sind bestätigt; neue Repositorydateien und verbliebene temporäre Testkopien
fehlen. Ein neuer unabhängiger Review dieser Statusänderungen wird nicht
behauptet. Die historischen 423/423-, 466/466-, 735/735- und
2350/2350-Ergebnisse wurden hier nicht erneut ausgeführt.

### ADR-0036-Foundationabgleich – Dokumentation / 2026-09-12

Die acht freigegebenen Dokumente gleichen ADR 0036 an die angenommene,
implementierte und unabhängig geprüfte ADR-0037-Foundation an. Aktive
Foundation- und Testhashes sowie die ergänzende ADR-0037-Bindung sind
nachgeführt; byte-owned Load, zwei erforderliche Portrollen, einmaliger
Marker nach erfolgreichem `O0`, drei getrennte Testzugänge und die tatsächlichen
Deadline-Proxytrap-Nachweise sind konsistent beschrieben. Foundation und
Tests bleiben bytegleich; Adapter, Adaptertests und Runtime wurden nicht ergänzt.

Der unabhängige Daybreak-xhigh-Implementierungsreview meldete PASS ohne
Befund für HEAD `4dc4d6f98e0d4dd0418544b286fd1bb204597f55` plus neun
gehashte uncommittete Dateien. Jan hat diese neun Fassungen unverändert in
`799e23e2f122ec2df3262af28a883616a8120327` committet; alle neun
Berichthashes stimmen mit den jeweiligen Blobs überein. Der Berichthash lautet
`f94935a30c429fbe052adc81a4760cdeb2e0f6f1a1f40f5b2aaa614e372ae139`.
Das ist kein nachträglich auf dem Featurecommit oder Dokumentationsbranch
ausgeführter Review und kein PASS für den jetzigen Dokumentationsdiff.
Der frühere R1–R4-Review bindet nur ADR 0036 mit Rohhash
`08ba627230077020f2b3ae50b9903ebf768f4413ede242aac35294d2c1453d2e`.
Ein Datum für den undatierten Implementierungsbericht wird nicht behauptet.

Zum Abschluss dieses Foundationabgleichs war die Foundationabhängigkeit erfüllt;
der neue unabhängige Dokumentreview stand noch aus und ADR 0036 blieb
`Vorgeschlagen – 2026-09-06`, ohne Annahme- oder Implementierungsfreigabe.
Der anschließend abgeschlossene gebundene Dokumentreview und Jans ausdrückliche
Annahme sind im vorstehenden Eintrag getrennt dokumentiert. Ein authentisches
adapterseitiges `A_obs` bleibt unbewiesen; Adapter-, Lauf- und Git-Schritte
bleiben geschlossen.

In diesem Dokumentationsslice erneut und seriell ausgeführt: die bestehende
Foundation-Fokussuite mit 595/595 Tests bei jeweils 0 Fehlschlägen,
Cancellations, Skips und Todos, der Produktions-Build mit exakt 46 Modulen
und `bundle:n8n:check` ohne Drift. Die folgenden 423/423-, 466/466-,
735/735- und 2350/2350-Ergebnisse gehören zum früheren
ADR-0037-Implementierungsnachweis; diese Suites wurden hier nicht erneut
ausgeführt. Historische 422/422 und 2177/2177 bleiben unverändert eingeordnet.

### Foundation Observation-Close Notification – ADR 0037 implementiert und unabhängig geprüft

Der unabhängige Astra-Review hat die R1–R4-Dokumentkorrektur von ADR 0036
im eng begrenzten Dokumentationsscope mit PASS abgeschlossen. Er gilt nur für
die dort gebundenen Rohbytes, nicht für ausgeführte Adapter-/Testkopiennachweise.
ADR 0036 blieb damals vorgeschlagen und nicht annahmereif. Der unabhängige
dokumentarische Review von ADR 0037 ist ohne Befund mit PASS abgeschlossen;
Jan hat ADR 0037 am 2026-09-08 ausdrücklich angenommen.

[ADR 0037](docs/decisions/0037-browser-sync-transport-diagnostic-foundation-observation-close-notification.md)
entscheidet `D_K4` als gezielte Ergänzung von ADR 0035 und ersetzt keinen ADR
formal. Die getrennt autorisierte netzwerkfreie Implementierung erweitert den
Effectport auf exakt `{ exchange, observationClosed }` mit zwei erforderlichen
Capabilityrollen. Die Notification wird mit eigenem nicht-enumerablem
Data-Descriptor `length: 0` genau einmal erfasst und nach Ownertransfer auch
nach Exchange-Portschluss erhalten, bis `O0` gebunden ist. Der einzige synchrone
Callsite konsumiert sie unmittelbar nach `O0` und vor Cleanup; nur `undefined`
ist ein gültiger Rückgabewert. Fehler und interne Exchange-Reentranz erzeugen
einen sticky Cleanupverstoß mit `FAIL`-Präzedenz, ohne `O0` zu ändern oder
Rückgabewerte zu reflektieren, zu assimilieren oder abzuwarten.

Die vorhandene Foundation-Testdatei besteht nun mit 595/595 Tests, exakt
`422 + 173`. Sie erkennt 27 neue Notificationmutanten und vier
Deadlinevarianten. Die sieben Notification-Fallklassen umfassen auch portlose
Pfade sowie Pending vor und nach `O0`; die 18 Joinfälle, das getrennte
Drei-Microtask-Präfix und das strukturelle Pending-Oracle bleiben erhalten.
Die vier getrennten Proxytrap-Zähler `get`, `getPrototypeOf`, `ownKeys` und
`getOwnPropertyDescriptor` bestätigen für Setup und Cleanup positive Reflection
bei `deadline-1` sowie jeweils null Traps bei `deadline` und `deadline+1`.
Der vorhandene temporäre Testexportzugang v2 wird nicht vergrößert.

Die unveränderten Regressionen bestehen mit 423/423 Transporttests, 466/466
gemeinsamen SyncService-/Transporttests und 735/735 Tests der sechs Sync-Suites.
Die vollständige serielle Suite besteht mit 2350/2350, exakt `1755 + 595`;
alle Läufe besitzen 0 Fehlschläge, Cancellations, Skips und Todos. Der
Produktions-Build transformiert exakt 46 Module; `bundle:n8n:check` besteht
driftfrei. Der rohe Schutz-/Hashaudit bestätigt die übrigen 14 gebundenen
Dateien gegen ihre Baselinehashes und bytegleich zu HEAD, alle ADRs sowie den
unveränderten 4259-Byte-Evaluationstring. Das Frontendmanifest ist im
historischen Commit, in HEAD und im Worktree mit 51 Pfaden und 5606 Bytes
identisch. Die neuen rohen Worktree-SHA-256-Werte lauten:

- Foundation `scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js`:
  `ff55a775ccbb7588474fc1efe3e1a08d871ce3524f133a000b0b3d8c7512eb1d`;
- Tests `tests/browserSyncTransportRuntimeDiagnosticObserver.test.js`:
  `1e8ce75e175b3e74c8c8b064e343550f32865fd5703aa54e01ead909a86e100c`.

Die historischen ADR0035-Nachweise mit 422/422 und 2177/2177 sowie die damaligen
unabhängigen Reviews gelten unverändert nur für ihre damaligen Bytes. Im
ADR-0037-Implementierungsslice blieben alle ADRs bytegleich. Der inzwischen
abgeschlossene unabhängige Implementierungsreview und Jans nachfolgender
Featurecommit sind im neuen Abgleichseintrag oben gebunden. Der aktuelle
Dokumentationsslice ändert ausschließlich ADR 0036 und sieben Living Documents.
Sein unabhängiger Review ist mit gebundenem PASS abgeschlossen; Jan hat
ADR 0036 anschließend am 2026-09-12 ausdrücklich angenommen. Die vollständigen
Vorannahmebytes sind im Annahmeeintrag oben gebunden; das PASS wird nicht auf
die nachgeführten Vollhashes übertragen.
Adapter, Adaptertests, adapterseitiges `A_obs`, Diagnoselauf und Runtime-Evidenz
sind nicht umgesetzt oder nachgewiesen. Foundation `NOT_EVIDENCE`,
ADR-0029-`overallGate: FAIL` und `causeStatus: CAUSE_NOT_PROVEN` bleiben
unverändert; Adapter-, Lauf- und Git-Schritte bleiben in diesem Auftrag geschlossen.

### BrowserSyncTransport Runtime Diagnostic Adapter Boundary – ADR 0036 angenommen

- [ADR 0036](docs/decisions/0036-browser-sync-transport-runtime-diagnostic-adapter-boundary.md)
  ergänzt ADR 0035 und ersetzt keinen ADR. Der Status lautet seit Jans
  ausdrücklicher Annahme `Angenommen – 2026-09-12`; der nach R1–R4 korrigierte Diff arbeitet K2
  konstruktiv aus und hat den begrenzten R1–R4-Dokumentreview bestanden. Die
  K4-Foundationentscheidung ist durch ADR 0037 angenommen und inzwischen
  getrennt implementiert und mit 595/595 fokussierten Tests geprüft. Der
  Implementierungsreview und Jans Featurecommit sind inzwischen abgeschlossen,
  der neue Foundationabgleich ist dokumentiert. Sein unabhängiger Dokumentreview
  ist laut Jans Chatbericht mit gebundenem PASS ohne Befund abgeschlossen;
  Vorannahmebindung und anschließende Annahme sind oben getrennt dokumentiert.
  Die übrigen ADRs bleiben bytegleich.
- Der rein dokumentarische Slice beschreibt für eine spätere Implementierung
  die inaktive One-shot-Adapterfactory, den byte-owned Foundationload, das
  Sieben-Intent-Effects-Protokoll, Windows-Debug-Pipe, NUL-Framing,
  fatalen UTF-8-/Duplicate-Key-Parser, eine FIFO, Write-Acks, drei Caps,
  Launcher-/Ressourcenownership, den selbst gebauten 59-Operanden-
  `runBinding` sowie die identitätsgebundene Integrity-, Cleanup- und
  Finalrecord-Ableitung.
- Korrigiert sind die Clockgrenze (Dequeue ohne Read, genau ein nachgelagerter
  Foundation-Clockread; `>=` nur für Setup/Cleanup, Capture nur per
  `cap-fired`), die Gatepräzedenz (bestätigte Verletzung zuerst und unabhängig
  von `zero|unknown|multiple|one` Stimuli), die alleinige Sechs-Codeunit-
  Vertragsprojektion des rohen Vier-Codeunit-Portwerts für Operand 53 und die
  K2-Konstruktion. Deren zwei disjunkte bytegeprüfte Vier-Export-Profile sind
  `derivation-conformance` mit einer synchronen Selector-Sperre vor jedem
  Hostzugriff und weiterhin erreichbaren Gate-/Finding-/Finalizerableitungen
  sowie `virtual-runtime-conformance` für produktiven Owner, vollständige
  Producer-Eventgrenze und einmaligen virtuellen Capabilityinstaller. Das
  virtuelle Profil umfasst exakt Entropie einschließlich 17-/15-Byte-Reads,
  Clock, Process-/Environment-/Runtimequellen, Scheduler, Pipe, Launcher und
  geschlossene Ressourcenoperationen; mutable Bytes, opaque Handles,
  Raw-Fixtureevents und Foundation-Dequeuewerte sind getrennt. Beide Profile
  bleiben `adapterEvidenceEligible:false`; Poison- und Wiringnachweise stehen
  nur als spätere Solltests fest. Der vorhandene ADR-0035-Testexportzugang v2
  bleibt unter ADR 0037 unvergrößert. K2 ist dokumentarisch geprüft; seine
  Adaptertestnachweise bleiben offen.
- Adaptertests bleiben am Raw-Byte-/Producerpfad und decken Setup/Cleanup an
  `deadline-1`, `deadline`, `deadline+1` sowie Capture ereignisbasiert ab.
  Getter-/Proxy-Envelopes entstehen dort nicht. Der getrennte ADR-0037-
  Foundation-Slice schließt die bisherige Deadline-Nachweislücke: Für Setup
  und Cleanup bleiben `get`, `getPrototypeOf`, `ownKeys` und
  `getOwnPropertyDescriptor` bei `=` und `>` jeweils null, bei `<` wird
  Reflection positiv erreicht. Vier kausale Deadlinevarianten werden erkannt;
  dies ersetzt keinen späteren Adapter-Wiringnachweis.
- Einzelne Cancelpayloads und spätere Projektionen tragen keine O0-Phasenbindung;
  daraus folgt weder Injektivität noch Nicht-Injektivität der vollständigen
  öffentlichen Historie. Der beschlossene bounded syntaktische Tracker besitzt
  unter seinem Spiegelungsverbot keinen authentischen Pre-Cleanup-Marker für
  alle Pfade, und ein Promisezaun kommt für Old-Cap sowie portlosen Pre-Cleanup
  zu spät. Als minimale eindeutige Phasenbindung unter den bestehenden
  Architekturgrenzen gewählt ist die neue Entscheidungsabhängigkeit `D_K4`:
  genau eine synchrone argumentlose
  `effectPort.observationClosed()`-Notification unmittelbar nach `O0` und vor
  jedem Cleanup. Sie ist kein achter Intent und trägt keine Ursache. Die
  Entscheidung ist durch ADR 0037 angenommen und getrennt implementiert und
  geprüft. Implementierungsreview und Jans unveränderter Featurecommit sind
  abgeschlossen; der Foundationabgleich ist dokumentiert. Sein unabhängiger
  Dokumentreview und Jans ausdrückliche ADR-0036-Annahme sind abgeschlossen.
  Die gesonderte Beauftragung von Adapterimplementierung und Adaptertests
  bleibt ein zukünftiger Schritt.
- `browser.engineBuild`, globale Portfreiheit, effektive Proxy-/VPN-/Policy-/
  Extension-/Permission-/Service-Worker-/Cachewerte und unabhängige
  Adapterattestierung bleiben ohne authentische Quelle ausdrücklich
  `UNPROVEN`. Es gibt weder einen siebten CDP-Befehl noch positive Ableitung
  aus frischem Profil, Childexit, Callerwerten oder `cleanup-fact: true`.
- Node Core liefert in dieser Grenze weder einen gebundenen Windows-Job-Owner
  für Prozessnachfahren noch handle-relative Profil-/Fragmentlöschung. Nach
  möglichem Spawn oder Create bleiben diese Cleanupchecks `UNPROVEN`; ein
  Root-Childexit oder Pfad-Vorcheck ist kein positiver Beweis.
- Dieser Slice implementiert oder startet keinen Adapter, Test, Loader,
  Parser, Timer, Launcher, Browser, CDP-, Vite-, Gateway- oder Netzwerkpfad,
  Recordwriter oder Diagnoselauf. ADR-0029-`overallGate: FAIL`,
  `causeStatus: CAUSE_NOT_PROVEN`, geschlossene Browserkomposition und
  fehlendes Browser-End-to-End bleiben unverändert.

### BrowserSyncTransport Diagnostic Effects-as-Data Foundation – historischer ADR-0035-Implementierungsstand

- Die getrennte, importinaktive und vollständig netzwerkfreie Foundation ist
  in `scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js`
  implementiert. Das Produktionsmodul besitzt genau den öffentlichen Export
  `createBrowserSyncTransportRuntimeDiagnosticObserver({ effectPort,
  runBinding })`, sieben geschlossene Effects-as-Data-Intents, sechs
  Protocol Commands und keine lokale oder relative Implementierungsdependency.
- Die öffentliche Factory, Owner-/Lease-Zustandsmaschine, 59
  Replayvergleiche, Setup-/Capture-/Cleanup-Caps, der tief eingefrorene
  Pre-Cleanup-Snapshot `O0`, exakt 20 Cleanupchecks sowie die geschlossene
  17-Felder-`FoundationProjection` sind umgesetzt. Öffentliche Resultate
  bleiben auf `FAIL/observer-invalid` oder `UNPROVEN/inconclusive` begrenzt;
  `NOT_EVIDENCE`, `runtimeAuthorized: false`, `persistenceAuthorized: false`,
  ADR-0029-`overallGate: FAIL` und `causeStatus: CAUSE_NOT_PROVEN` bleiben
  unverändert.
- Die getrennte Testdatei
  `tests/browserSyncTransportRuntimeDiagnosticObserver.test.js` besteht mit
  422/422 Tests. Sie prüft unter anderem die exakte 18-Fälle-Join-Matrix, das
  zweiteilige Forever-pending-Oracle, elf disjunkte Joinmutanten, die
  byteidentische temporäre Testkopie v2, alle sieben Intentarten, Cap- und
  Cancelmatrizen, Network-/Routingregressionen, `O0`-Irreversibilität,
  Completion/Stage 10 und die öffentliche PASS-Unerreichbarkeit.
- Die unveränderten Regressionen bestehen mit 423/423 BrowserSyncTransport-
  Tests, 466/466 gemeinsamen SyncService-/Transporttests und 735/735 Tests der
  sechs seriellen Sync-Suites. Die vollständige serielle Suite besteht mit
  2177/2177, exakt `1755 + 422`, bei jeweils 0 Fehlschlägen, Cancellations,
  Skips und Todos. Der Produktions-Build transformiert weiterhin exakt 46
  Module; `bundle:n8n:check` bleibt driftfrei.
- Der abschließende rohe Hashaudit bestätigt den historischen Commit, alle
  acht gebundenen Artefakthashes, das 51-Pfade-/5606-Byte-Frontendmanifest,
  den historischen Evidence-Record sowie den 4259-Byte-Evaluationstring mit
  SHA-256
  `a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b`
  unverändert. Drei unabhängige read-only Daybreak-xhigh-Reviews meldeten
  keinen belegten Befund.
- Foundationmodul und fokussierte Tests starteten weder Browser, CDP,
  Gateway, Vite, Netzwerk, Timer, Childprozess noch Diagnoselauf und erzeugten
  weder Evidence, Persistenz, Logs noch Telemetrie. Nur die vollständige
  Bestandssuite verwendete ihre zwei unveränderten Loopback-Fixtures. ADR 0036
  war damals als dokumentarische Adaptergrenze vorgeschlagen. ADR 0037 entscheidet
  `D_K4`; sein unabhängiger dokumentarischer Review ist abgeschlossen und Jan
  hat ihn angenommen. Die danach getrennt implementierte und geprüfte
  Foundationanpassung ist oben als eigener ADR-0037-Nachweis dokumentiert.
  Der gebundene unabhängige Implementierungsreview und Jans anschließender
  unveränderter Featurecommit sind inzwischen abgeschlossen; der aktuelle
  ADR-0036-Abgleich ist oben getrennt dokumentiert. Dessen unabhängiger Review
  ist mit gebundenem PASS abgeschlossen; Jan hat ADR 0036 anschließend am
  2026-09-12 ausdrücklich angenommen. Adapterimplementierung, Adaptertests und
  sichtbarer Diagnoselauf bleiben separat und nicht autorisiert.

### BrowserSyncTransport Diagnostic Foundation Join and Internal Transition Testability Boundary – Entscheidung / ADR 0035

- ADR 0035 ist am `2026-09-05` angenommen und ersetzt ADR 0034 formal; kein
  weiterer ADR wird ersetzt. ADR 0034 bleibt mit bytegleichem Hauptteil ab
  `## Kontext` als historische Entscheidungsebene erhalten. Alle nicht
  ausdrücklich korrigierten Regeln aus ADR 0034, ADR 0033 und ADR 0032 gelten
  fort.
- Die geschlossene Testkopie v2 darf aus den bytegenauen Produktionsquellbytes
  in einer eindeutig benannten `.mjs`-Datei in einem aufgelösten
  Betriebssystem-Temporärverzeichnis außerhalb des Repositorys entstehen. Eine
  einzige lexikalisch eindeutige Exportdeklaration öffnet dort ausschließlich
  `deriveCandidateObserverGate` (Arity `1`, rein),
  `deriveCandidateFinding` (Arity `1`, rein),
  `createBrowserSyncTransportRuntimeDiagnosticRunMachine` (Arity `1`,
  zustandsbehafteter produktiver Factorypfad) und
  `requestBrowserSyncTransportRuntimeDiagnosticExchange` (Arity `2`,
  zustandsbehaftete einzige Grenze aller sieben Intents). So adressiert der
  Test dieselbe produktive Run-Machine und deren aktive Lease, ohne fünften
  Inspector-, Debug- oder Produktionsseam. Die Kopie wird ausschließlich über
  eine aus ihrem vollständig aufgelösten Pfad erzeugte `file:`-URL importiert;
  der öffentliche Originalpfad behält exakt
  einen Export.
- Die echte Exchange-Grenze unterdrückt bei `lease: observable-pending` einen
  zweiten internen Exchange vor Intentkonstruktion, Intent-ID-Erhöhung,
  Count-, Ledger-, Cap-, Snapshot- oder Cleanupmutation und vor jedem Port-
  oder Capabilityaufruf. Die dynamische Matrix treibt die normale Maschine
  getrennt in `prestart`, `observation` und `cleanup`, hält jeweils genau einen
  Exchange pending und belegt delta-basiert: keine zusätzlichen Intents, IDs,
  Port-, Send- oder Capabilityaufrufe. Ausschließlich
  `pendingInternalExchangeViolation` erhält die jeweilige Phasenklasse.
- Der finite Join-Nachweis umfasst exakt `3 × 2 × 3 = 18` Fälle aus den
  Maschinenphasen `prestart|observation|cleanup`, den Ausgängen
  `fulfillment|rejection` und den Zeitlagen `pre-invocation`,
  `synchronous-post-invocation` sowie `observable-pending`. Das Promise ist
  dabei vor dem Capabilityaufruf bereits gesettelt, wird unmittelbar nach dem
  synchronen Rücksprung der ersten Grenze gesettelt oder bleibt bis nach dem
  zweiten Boundaryaufruf pending. Der zweite Aufruf erfolgt stets im selben
  Turn ohne Yield vor Handlerzutritt; Settlement allein ist kein
  Maschinenübergang.
- Fulfillment und Rejection werden in allen 18 Fällen geprüft, ohne Payload
  oder Grund zu lesen. Danach sind Lease
  und Port geschlossen, `activeExchange` ist `null`, weitere Exchanges bleiben
  `zero` und lebende Caps werden `terminal-unknown`; die phasengenauen Folgen
  reichen vom statischen Prestartfehler ohne `O0` über sticky `V` und
  portlosen Observation-Cleanup bis zu unverändertem `O0`,
  `cleanupViolation: true` und `cleanup-terminal-failure` im Cleanup.
- Das von den 18 settelnden Fällen getrennte Forever-pending-Oracle kombiniert
  pro Phase eine endliche dynamische
  Präfixprobe mit exakt drei testlokalen Microtask-Checkpoints und die
  vollständige private Transitionstabelle. Nur gemeinsam belegen sie, dass es
  aus `observable-pending` ohne kontrollierten Handler keinen Fortschritts-,
  Snapshot-, Cleanup-, Terminalisierungs- oder Resolvepfad gibt. Es verwendet
  weder reale Uhr, Timer, Timeout noch `Promise.race`, lässt eine Zusatzprobe
  bis zum Testende pending und behauptet keine empirisch beobachtete
  Unendlichkeit.
- Der spätere mutationswirksame Nachweis lässt kontrollierte, von der
  unveränderten Konformitätskopie getrennte Mutanten insbesondere bei
  umgangenem oder verspätetem Join-Guard, zweitem Port-/Capabilityaufruf,
  künstlichem Run-Settlement, vorzeitigem `O0` oder Cleanup, verlorener
  Phasenklasse und Cleanupmutation des eingefrorenen `O0` scheitern. Mutanten
  verändern niemals den Produktionssource; alle Testkopien und Ergebnisse
  bleiben `NOT_EVIDENCE`, werden seriell importiert und im `finally`
  vollständig entfernt.
- Drei öffentliche Effects-as-Data-Regressionen werden für den späteren
  Implementierungsslice präzisiert: Die mit dem ersten Endpoint-Request
  initialisierte private Network-Clock
  `lastValidBrowserNetworkTimestamp` verlangt vor jeder Stage-, Count-, Timing-
  oder Sequenzmutation endliche, nichtnegative, sicher umrechenbare und
  monotone Werte, erlaubt
  Gleichheit, hält Timing am ersten Request gebunden und erkennt insbesondere
  `10 → 12 → 11`; `NaN`, `Infinity` und unsicherer Millisekundenüberlauf sind
  ebenfalls Pflichtfälle. Eine unkorrelierte Endpoint-Response bei gebundener
  Session und exakter URL macht Attribution und `requestBudget.sequence`
  sticky `ambiguous`, liest nach fehlender Request-ID-Korrelation keine
  unnötigen Responsefelder, erfindet weder Count noch ID und setzt ohne eigene
  Verletzung kein `V`; eine spätere korrelierte Response heilt die Unsicherheit
  nicht. Eine wohlgeformte doppelte `Target.getTargets`-Antwort lässt den
  bereits belegten einzelnen Send-Ack sowie das Operationsergebnis `one/match`
  unverändert: vor Evaluate folgt `U/setup-terminal-unproven`, während Capture
  bleibt der Candidate bis `C` `UNPROVEN/inconclusive`; nur eine malformed
  routbare Dublette vor `O0` bleibt `V/FAIL/observer-invalid`.
- ADR 0035 implementiert oder autorisiert weder Foundation noch Tests,
  Adapter oder Runtimevorgang. Es wurden keine neuen Tests ergänzt. ADR 0029,
  sein Evidence-Record, `overallGate: FAIL` und
  `causeStatus: CAUSE_NOT_PROVEN` bleiben unverändert. Schema, öffentliche API
  und die bestehenden Kardinalitäten bleiben unverändert; öffentlich bleiben
  ausschließlich `FAIL/observer-invalid` und `UNPROVEN/inconclusive`
  erreichbar, Candidate-`PASS` und PASS-spezifische Findings unerreichbar. Der
  nächste Schritt ist ausschließlich die getrennte netzwerkfreie Effects-as-
  Data-Foundationimplementierung samt fokussierter Tests; Adapter-ADR,
  Adapterimplementierung und sichtbarer Diagnoselauf bleiben geschlossen und
  nachgelagert.

### BrowserSyncTransport Diagnostic Foundation Grammar, Derivation and Testability Boundary – historische Entscheidung / ADR 0034

- ADR 0034 wurde am `2026-09-04` angenommen. Er ersetzte ADR 0033 formal und übernahm
  alle nicht ausdrücklich korrigierten Regeln aus ADR 0033 und ADR 0032; ADR
  0034 ersetzte keinen weiteren ADR. ADR 0033 bleibt mit bytegleichem Hauptteil
  ab `## Kontext` als historische Entscheidungsebene erhalten.
- Schema, API und Kardinalitäten bleiben unverändert:
  `createBrowserSyncTransportRuntimeDiagnosticObserver({ effectPort,
  runBinding })`, `schemaVersion: 1`, 17 Rootfelder der
  `FoundationProjection`, 59 Replayvergleiche, sieben Effects-Intents, sechs
  Protocol Operations, 17 Integrity Checks, zehn Stages, zehn Capzustände, 20
  Cleanupchecks und ein öffentlicher Export.
- ADR 0034 totalisiert die geschlossenen lokalen Prototyp-,
  Frische- und Deep-Freeze-Grammatiken, `printable-ascii-v1`,
  `iana-shaped-ascii-time-zone-v1`, Core-SemVer sowie die privaten I1–I8-,
  Replay-, Observerfeld-, Protocol-Operation-, Integrity-, Stage-, Hash- und
  Cleanupableitungen.
- Operations- und Ressourcenstatus werden sendzustandsabhängig getrennt: Ein
  fehlender Intent ergibt nur bei konstruktiv sicher nie aktivierter Ressource
  `zero/match`, sonst `zero/unproven`; ein Intent ohne belegbaren Sendestatus
  ergibt `unknown/unproven`, exakt ein gültiger Sende-Ack `one/match` und
  mindestens zwei bestätigte Sende-Acks `multiple/mismatch`. Eine fehlende
  Session-ID beweist nach möglicherweise oder bestätigt gesendetem
  `Target.attachToTarget` niemals eine geschlossene Session. Nur
  sicher nie gesendetes Attach erlaubt `targetSessionClosed: confirmed` und
  Detach `zero/match`; ohne bindbare Session bleiben beide unbewiesen, ein
  korrelierter exakter Detach-Erfolg bestätigt den Abschluss. Connection-Close
  ohne diesen Erfolg bestätigt ihn nicht. Dieselbe epistemische Trennung gilt
  symmetrisch für `Network.enable`, `Network.disable` und
  `networkDomainClosed`: Sicher nie gesendetes Enable bestätigt den
  Domainabschluss mit Disable `zero/match`; möglicherweise oder bestätigt
  gesendetes Enable bleibt ohne korrelierten
  exakten Disable-Erfolg unbewiesen. Bei gebundener Session und sicher nie
  gesendetem Enable bleibt der Detachversuch erforderlich.
- `candidateObserverGate: PASS` und PASS-spezifische Findings bleiben über die
  unveränderte öffentliche API konstruktiv unerreichbar; öffentliche
  Foundationresultate können nur `FAIL/observer-invalid` oder
  `UNPROVEN/inconclusive` enthalten. Die vollständigen privaten hypothetischen
  PASS-Ableitungen dürfen später ausschließlich über die beschlossene
  temporäre Kopie der exakten Produktionsquellbytes geprüft werden. Ein exakt
  einmal passender lexikalischer Anker darf nur testlokale Exports ergänzen;
  ausschließlich diese Kopie wird seriell importiert, im `finally` entfernt
  und ihre Entfernung bestätigt. Kopie und Ergebnisse bleiben `NOT_EVIDENCE`,
  permanente Testexports oder manipulierte öffentliche PASS-Projections
  unzulässig; die öffentliche Original-API muss die PASS-Unerreichbarkeit
  zusätzlich black-box belegen.
- Netzwerkfreiheit gilt für Foundationmodul, neue fokussierte Tests, Effects
  und jeden Diagnoselauf dieses Slices. Nur die unveränderte vollständige
  Repository-Regressionsprüfung darf ihre bestehenden kurzlebigen
  Loopback-Fixtures `tests/localSyncGatewayHttpServer.test.js` und
  `tests/n8nCloudIngressProbe.test.js` ausführen; neue, externe oder
  diagnostische Netzwerkaktivität bleibt verboten.
- ADR 0034 implementiert oder autorisiert weder Foundation, Tests, Adapter noch
  Runtimevorgang. ADR 0029, sein Evidence-Record, `overallGate: FAIL` und
  `causeStatus: CAUSE_NOT_PROVEN` bleiben unverändert. Die Foundation ist
  weiterhin nicht implementiert. Im angenommenen ADR-0034-Stand sollte als
  Nächstes ausschließlich ihre getrennte netzwerkfreie Implementierung folgen;
  ADR 0035 hat zuvor die verbliebene Testbarkeitslücke adressiert und ADR 0034
  inzwischen formal ersetzt. ADR 0034 bleibt mit bytegleichem Hauptteil ab
  `## Kontext` historische Entscheidungsebene. Adapter-ADR,
  Adapterimplementierung und sichtbarer Diagnoselauf bleiben nachgelagert.

### Historischer Stand: BrowserSyncTransport Diagnostic Foundation Effects Protocol Boundary – Entscheidung / ADR 0033

- ADR 0033 am `2026-09-03` als reinen Dokumentations- und Entscheidungsslice
  angenommen. Er ersetzt ADR 0032 formal und übernimmt alle dortigen Regeln,
  die er nicht ausdrücklich korrigiert. ADR 0032 bleibt mit seinem
  unveränderten Hauptteil ab `## Kontext` als historische Entscheidungsebene
  erhalten. ADR 0029, sein
  Evidence-Record, `overallGate: FAIL` und `causeStatus: CAUSE_NOT_PROVEN`
  bleiben unverändert.
- Die einzige spätere API auf
  `createBrowserSyncTransportRuntimeDiagnosticObserver({ effectPort,
  runBinding })` begrenzt: Factory-Arity `1`, geschlossene Options- und
  Portform, keine Realdefaults oder Factoryeffekte. Factoryfehler sind nur
  synchrone statische Dependency-`TypeError`s ohne API, Promise oder Result;
  `runBinding` wird dort vollständig kopiert. Die erfolgreiche Factory liefert
  eine frische tief eingefrorene `{ run }`-API; jeder kontrollierte Runpfad
  liefert ein lokales Promise und wirft nicht synchron. Der erste Run wird vor
  Arityprüfung alleiniger Owner; bei gültiger Arity erfolgt der atomare
  Transfer `capturedExchange -> activeExchange`. Falsche Erst-Arity
  terminalisiert ohne Effekt, Nicht-Owner-Aufrufe erhalten isolierte statische
  Fehler-Promises ohne Slot-, Zähler-, Effekt- oder Cleanupzugriff.
- Das pauschale Referenzverbot präzisiert: Genau die einmal
  descriptorbasiert aus `effectPort.exchange` gelesene Funktionsreferenz darf
  zeitlich disjunkt in `capturedExchange`, dann `activeExchange` gehalten
  werden. Der Container wird verworfen; Owneraufrufe verwenden nur erfasstes
  Apply, `undefined` und ein Frozen Intent. Der Owner löscht nach dem letzten
  Exchange und vor Resulterfüllung. Nicht-Owner verändern keinen Slot.
- Vier transiente Rollen geschlossen: aktueller Promise-Kandidat, aktueller
  Fulfillmentgraph jeder Ack-Art, unreflektierter Dequeuegraph während seines
  Clock-Samples und synchron benötigte allowlistete Nachfahr-/Descriptor-/
  Prototypreferenzen. Nur die festgelegte Clock-Überlappung ist zulässig;
  Nullstellen-Rejectionhandler lesen keinen Grund und der Folgepromise wird
  nicht gespeichert. Keine Inputreferenz erreicht Result, Projection,
  Snapshot oder Ledger.
- Den einzigen Effectport auf sieben geschlossene Intentarten totalisiert:
  `capability-probe`, `controller-clock-sample`, `cap-arm`, `cap-cancel`,
  `protocol-command-send`, `observation-dequeue`, `cleanup-step`. Für jeden
  Kandidaten gilt allein
  `currently-observable-local-native-promise-profile` mit exact-once OwnKeys-,
  Prototyp-, Constructor-, Species- und Then-Descriptorprüfung sowie genau
  einer erfassten nativen `then`-Anwendung. Daraus folgen keine Same-Realm-,
  Erzeugungsrealm-, Constructor-, Subclass-, Native- oder
  Proxyfreiheitsbehauptungen. Nullstellige Rejectionhandler lesen keinen Grund
  und geben wie Fulfillmenthandler nur `undefined` zurück.
- Statische Redaction ausdrücklich auf Foundation-kontrollierte Resultate und
  Handler begrenzt. Ein vor Handlerinstallation profilwidriges bereits oder
  später rejected Promise kann getrennt einen hostabhängigen
  `unhandledrejection`-/`unhandledRejection`-Restkanal mit Originalgrund
  auslösen; Eintritt, Zeitpunkt, Häufigkeit, Inhalt und Prozessfortsetzung
  werden nicht behauptet.
- Die Exchange-Lease exakt als `idle | observable-pending |
  settlement-unobservable | closed` geschlossen; nur `idle` erlaubt einen
  Portaufruf. Erst kontrollierter Handlerzutritt ist `observed-settlement` und
  gibt sie vor dem intent-spezifischen Übergang frei. Synchroner
  `exchange`-Throw, malformed Promise-Kandidat, Promiseprofil-Reflectionthrow
  oder native-Then-Throw vor Handlerzutritt ist `settlement-unobservable` und
  setzt mit höchster Präzedenz `lease: closed`, `portState: closed`,
  `activeCapability: null`, `affectedCapState: terminal-unknown` und
  `furtherExchangeCount: zero`; `activeExchange` wird gelöscht, und Cancel,
  Retry sowie jeder Folge-Exchange sind verboten. Ein gültiges pending Promise
  hält den gesamten Run pending.
- Die Pending-Join-Regel vollständig gebunden: Ein intern angeforderter zweiter
  Exchange wird vor Intent, ID, Zähler und Portaufruf unterdrückt; nur das
  Original bleibt. Sein Settlement schließt ohne nutzbares `idle`-Fenster und
  ergibt je nach Phase statischen Pre-start-Fehler, `V` mit lokalem Cleanup
  oder nach dem Snapshot ausschließlich `cleanupViolation`. Fulfillment- und
  Dequeuegraph bleiben dabei ungelesen; Forever-pending bleibt pending.
- Alle erreichbaren kontrollierten Rejection-Tupel ausschließlich als
  `observed-settlement` phasenlokal geschlossen:
  Probe und Setup-Origin-Clock enden pre-start statisch; ein nach beobachteter
  Rejection oder malformed Ack bei wieder `idle` unklarer Setup-Arm erhält
  genau einen Best-effort-Cancel, ein unobservables Arm-Settlement setzt dagegen
  das vollständige Closed-Tupel und endet ohne Cancel oder Exchange. Setup-Send,
  Setup-/Capture-Dequeue-Clock, Setup-/Capture-Dequeue und Capture-Arm setzen
  während Observation zuerst ihren spezifischen `V`-Zustand und quieszenzieren
  danach einen bekannten Cap genau einmal vor `O0`. Beobachtete Cleanup-
  Rejections ändern ausschließlich Ledger und bei offenem Port sichere
  Folgeschritte; unobservable Settlements finalisieren portlos. Eine Rejection des bereits
  laufenden Cancels erzeugt keinen zweiten Cancel. Nur unmögliche interne Tupel
  dürfen den allgemeinen Catch-all erreichen.
- Capture-Arm-Fehler getrennt totalisiert: beobachtete Rejection oder malformed
  Ack setzt `V`, Evaluate `zero` und `activation-unknown` vor dem einmaligen
  Cancel. Ein bereits am Arm unobservables Settlement setzt das vollständige
  Closed-Tupel und `V`, verbietet Cancel und weitere Portaufrufe und führt
  unmittelbar zu `O0` mit lokalem portlosem Cleanup; pending bleibt
  pending.
- `runBinding` auf neun feste Felder und exakt 59 kanonische Replayoperanden
  begrenzt. Historische Werte, Vergleichsbasis, Status, Gates, Findings,
  Counts, Provenienz, IDs und Evaluationbytes bleiben privat. ADR und Living
  Contract schreiben für alle 59 Felder Basis, historischen Wert, Typgrenze,
  Projektion und Cross-Field-Invarianten aus.
- `attemptStarted` erst nach positiver Capabilityprobe, gültigem `m_setup`,
  sicherer Setupdeadline, bestätigtem Setupcap und eingefrorener Stage 1
  festgelegt. Fehler davor erzeugen nur den statischen Foundationfehler ohne
  Projection, Snapshot oder Cleanup; bestätigte Verstöße nach
  `attemptStarted` und vor `O0` sind sticky `V`, danach bleibt der Snapshot
  unverändert und nur Cleanup darf noch fehlschlagen.
- Exact-once-Reflection für jeden geschlossenen Inputknoten, Arrayindex und
  alle allowlisteten offenen CDP-Descriptoren festgelegt; freie Propertyreads,
  Rereads, Destructuring, Spread, `hasOwn` und Inputmutation bleiben verboten.
- Den Capturecap zunächst pending gemacht und seine Aktivierung atomar allein
  an den Evaluate-Ack `sent-and-capture-cap-started` gebunden. Eine durch den
  kontrollierten Handler als `observed-settlement` beobachtete Evaluate-
  Exchange-Rejection setzt `lease: idle`, `closeClass: V` und
  `cap: activation-unknown`, beweist aber weder Send noch Nichtsenden,
  Aktivierung, Auswertung, Factory-, Transport- oder späteren Stimulus. Dann
  gelten exakt `controllerEvaluateIntentCount: one`,
  `Runtime.evaluate.observedCountClass: unknown`,
  `Runtime.evaluate.result: unproven`, `mainWorldEvaluationCount: unknown`,
  `transportFactoryCallCount: unknown`, `factoryCallCount: unknown`,
  `transportCallCount: unknown`, `evaluateReplyCountClass: unknown`,
  `productEvidenceComplete: false`, `captureWindowState: truncated` und
  `publicSettlement: null`.
- Nach dieser Evaluate-Rejection ausschließlich genau einen Cancel der
  gebundenen Arm-ID zugelassen: exakter Ack bewahrt `V` und ergibt
  `cancelled`; beobachtete Rejection oder malformed Ack ergeben
  `terminal-unknown` plus `cleanupViolation`; unobservables Settlement setzt
  das vollständige Closed-Tupel und erzwingt lokalen portlosen Cleanup ohne
  zweiten Cancel oder sonstigen Exchange; ein gültiges pending
  Cancel hält den Run pending. Zweiter Evaluate-Send und Capture-Dequeue sind
  ausgeschlossen. Der intern gebundene Rejectiondispatch über `{ phase,
  intentKind, intentId, capKind, capState }` besitzt Vorrang vor Capquieszenz,
  Snapshot und dem nur für unmögliche Tupel erlaubten Catch-all.
- Evaluate-Intent, bestätigten Send, Evaluate-Reply, Main-World-Auswertung,
  Factoryaufruf, Transportaufruf und Networkrequest getrennt. Die
  controllerabgeleiteten Domains von `factoryCallCount` und
  `transportCallCount` lauten `zero | one | unknown`; `zero` ist nur
  konstruktiv, `unknown` nie callerlieferbar. Ein unterdrückter Exchange
  erzeugt keinen Count, und ein ungelesener Ack bleibt `unknown`, nie
  `multiple`.
- Setup-, Capture- und Cleanupcap vor jeder Envelope-Reflection anhand roher
  Zeit totalisiert; Gleichheit gehört zum absoluten Cap und der Envelope bleibt
  dort ungelesen. Capture schließt nur durch das korrelierte Capereignis, nie
  durch `S && N`. Das erste Capture-Connection-Close ergibt
  `U/capture-terminal-unproven`, `truncated` und gleichnamigen
  `observationCloseReason`; bei aktivem Cap erfolgt dessen einmaliger Cancel
  vor dem Snapshot. Exakter Ack bewahrt `U`, beobachtete Fehler promovieren zu
  `V`; unobservables Settlement promoviert ebenfalls zu `V`, setzt aber das
  Closed-Tupel und lässt nach `O0` nur portlosen Cleanup zu. Pending hält den
  Run ohne Snapshot pending;
  Connection-Close und Cap folgen nur der Dequeue-Reihenfolge.
- Die Capzustände exakt als `absent | arm-pending | armed |
  pending-activation | active | activation-unknown | cancel-pending |
  cancelled | fired | terminal-unknown` festgelegt. Arm, Aktivierung,
  verarbeiteter Cap, falsche, frühe, späte und doppelte IDs sowie alle vier
  Cancelausgänge sind ohne Retry und mit höchstens einem Cancel je Arm total.
- Geschlossene Descriptor-, Ressourcen- und Networkgrenzen ergänzt:
  `targetInfos` 128, flüchtige IDs 256, CDP-URLs 2048,
  HTTP-Methodentokens 16 Codeunits und 128 Dequeues; nur vier Networkevents,
  keine Header-, Body- oder Fehlertextlesung und nur ebenenlokale Zeitrechnung.
- Den Pre-Cleanup-Snapshot `O0` als unveränderlich geschlossen: Danach bleiben
  `U`, `V`, `C`, `closeClass`, Stages 1 bis 8, Replay, Settlement,
  Requestbudget, Counts und Observationwerte eingefroren. Vor `O0` wird ein
  Clockverstoß `V`; danach wirken alle Ausgänge nur über Cleanup-Ledger,
  Checkzustände und Candidateableitung, nie rückwirkend auf den Snapshot.
  `cleanupViolation` und `cleanup-terminal-failure` entstehen ausschließlich
  auf den jeweils dafür festgelegten Pfaden.
- Cleanup in `await-cleanup-protocol-responses(openCommandIds)` und
  `await-cleanup-fact(checkId)` getrennt, ohne zufällige Checkattribution bei
  unlesbarem Routing oder Identifier. Disable-/Detach-Reihenfolge,
  Connection-Close, beliebige Antwortreihenfolge und alle zwölf externen
  Schritte sind total; `false -> failed`, `true -> unproven`. Alle 20
  unveränderten Cleanup-IDs werden ohne ausgegebenes `pending` finalisiert.
  Nach terminalen Checks 1 bis 19 erlaubt bei offenem Port nur der exakte
  abschließende Cap-Cancel den Sample
  `cleanup-completion-after-cap-cancel`; unobservables Cancel-Settlement erlaubt
  keinen weiteren Exchange. Jeder nicht vollständig gültige Completion-Sample
  setzt zwingend `relativeMilliseconds: null` und `timingState: unavailable`;
  kein alter oder provisorischer Timingwert wird erhalten, gerundet, projiziert,
  gehasht oder serialisiert, und `receiptOrder` beweist niemals gültiges Timing.
  Daraus folgen
  Check 20, Stage 10, Timing/Receipt Order und exakt `all-steps-terminal`,
  `cleanup-cap` oder `cleanup-terminal-failure`. `cleanup.result` und
  `cleanupFinalized` folgen erst der totalen Statuspräzedenz.
- Den künftigen privaten einzeiligen ASCII-Evaluationstring mit exakt 4259
  UTF-8-Bytes und SHA-256
  `a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b`
  bytegenau in ADR und Living Contract gebunden, aber nicht ausgeführt.
- Das öffentliche Result als Null-Prototyp-Record auf sieben Felder ohne
  Own-`then`, mit `NOT_EVIDENCE`,
  `runtimeAuthorized: false` und `persistenceAuthorized: false` begrenzt. Die
  17-Felder-FoundationProjection besitzt nur `candidateObserverGate` und
  `candidateFinding`, kein `recordType`, echtes `observerGate` oder `finding`;
  `foundationSha256` und sämtliche Adapterprovenienz bleiben unbewiesen.
- Die unveränderten Grenzen von exakt 59 Replayvergleichen, 20 Cleanup-IDs und
  dem 4.259 ASCII-Bytes langen Evaluationstring mit unverändertem Lower-Hex-
  SHA-256 beibehalten. Die Foundation kann kein echtes `observerGate: PASS`
  belegen; `NOT_EVIDENCE`, `runtimeAuthorized: false`,
  `persistenceAuthorized: false`, `overallGate: FAIL` und
  `CAUSE_NOT_PROVEN` bleiben zwingend.
- Weder Foundationmodul noch Tests, Adapter, Parser, Queue, Timer, Browser,
  CDP, Netzwerk, Gateway, Request oder echter Record erstellt oder ausgeführt.
  Die damalige Annahme autorisierte keinen Adapter oder
  Diagnoseruntimevorgang. ADR 0034 hat ADR 0033 inzwischen formal ersetzt; ADR
  0033 bleibt mit bytegleichem Hauptteil ab `## Kontext` historische
  Entscheidungsebene. Im angenommenen ADR-0034-Stand sollte als Nächstes die
  getrennte netzwerkfreie Effects-as-Data-Foundationimplementierung folgen;
  ADR 0035 hat zuvor die verbliebene Join-Testbarkeitslücke adressiert und ADR
  0034 inzwischen formal ersetzt. Der nächste Schritt ist ausschließlich die
  getrennte netzwerkfreie Effects-as-Data-Foundationimplementierung samt
  fokussierter Tests; Adapter-ADR, Adapterimplementierung und sichtbarer
  Diagnoselauf bleiben nachgelagert.

### BrowserSyncTransport Diagnostic Capture, Timing and Projection Determinism Boundary – Entscheidung / ADR 0032

- ADR 0032 am `2026-09-02` als reinen Dokumentations- und Entscheidungsslice
  angenommen. Er ersetzt ADR 0031 formal und übernimmt alle nicht ausdrücklich
  korrigierten ADR-0030-/ADR-0031-Regeln. ADR 0031 bleibt mit bytegleichem
  Hauptteil ab `## Kontext` historische Ebene; ADR 0030 bleibt durch ADR 0031
  ersetzt. ADR 0020, ADR 0028, ADR 0029 und der historische Evidence-Record
  bleiben unverändert.
- Schema 1 und sämtliche Kardinalitäten des
  `BrowserTransportDiagnosticRecord` unverändert gelassen: 17 Rootfelder,
  sechs CDP-Operationen, 17 Integritätschecks, neun Requestzähler plus Sequenz,
  zehn Stages, drei Clock-Domänen, exakt 20 Cleanup-IDs und fünf Findings. Die
  exakte Fortführung ohne Versionswechsel ist nur zulässig, weil weder eine
  Implementierung noch eine konforme persistierte Instanz existiert.
- Einen getrennten globalen Setupcap von exakt `6.000 ms` entschieden. Vor dem
  einzigen Send werden Cap-/Clock-Fähigkeit validiert und scharf geschaltet,
  `m_setup` exakt einmal erfasst, `t_setup := 0` gesetzt, die Deadline
  `m_setup + 6000` als konkreter Timer armiert und Stage 1 `observer-armed`
  gesetzt; erst danach wird
  `Target.getTargets` nichtblockierend gesendet. Der Setup führt
  `Target.getTargets`, `Target.attachToTarget` und `Network.enable` strikt
  sequenziell mit höchstens einem ausstehenden Kommando aus und setzt den Cap
  nie pro Kommando zurück. Scheitert die Cap-/Clock-Fähigkeit, entsteht `V`
  oder kein gültig gestarteter Versuch; die pure Foundation erzeugt nur den
  nichtblockierenden Command-Intent.
- Für jede antwortartig eingereihte Nachricht beim Dequeue vor Reflection
  `m_answer` genau einmal erfasst und roh `d := m_answer - m_setup` gebildet.
  Nur bei `d < 6000` darf die geschlossene Setupantwort-Grammatik synchron und
  begrenzt geprüft werden; bei `d >= 6000` gewinnt der Cap und der Inhalt
  bleibt ungelesen. Ungültige, negative, rückläufige oder werfende Clockwerte
  ergeben `V`. Die genaue Antwortgrammatik bleibt in ADR 0032 und im Living
  Contract normativ. Nur drei eindeutig korrelierte, erfolgreiche und
  vollständig validierte Antworten ergeben `setupReady`. Bei
  `Target.getTargets` wird zuerst die Anzahl der `page`-Kandidaten mit exakt
  gebundener URL unabhängig von `attached` bestimmt; nur bei genau einem wird
  `attached === false` geprüft und danach `targetId` gebunden. Eine Antwort
  gilt erst am verarbeiteten Setupcap oder nach irreversibler
  Verbindungsschließung als fehlend, nicht schon bei leerer Queue oder bloßem
  Noch-nicht-Eintreffen. Fehlende oder eindeutig terminal unbrauchbare
  Setupergebnisse schließen ohne Obserververstoß als `U` mit
  `UNPROVEN/inconclusive`.
- Die Abschlusslogik als `setupClosed := setupReady || U || V` und
  `observationClosed := V || U || C` totalisiert. Persistierte 10-ms-Rundung
  beeinflusst die Capentscheidung nicht; bei `elapsed >= 6000 ms` gewinnt der
  Setupcap, außer ein bereits bestätigtes sticky `V` besitzt `FAIL`-Präzedenz.
  Späte Setupantworten werden verworfen und können weder Setup noch Stimulus
  rückwirkend erzeugen.
- `Runtime.evaluate` ausschließlich nach `setupReady` und höchstens einmal
  zugelassen. Erst sein bestätigter Sendeübergang startet das getrennte
  6.000-ms-Capturefenster. `P := S && N` bezeichnet nur vorläufig vollständige
  Produktevidenz und schließt die Beobachtung nicht; ohne sticky bestätigtes
  `V` bleibt der Observer bis zum verarbeiteten `C` aktiv. So bleiben doppelte
  Evaluate-Antworten und zusätzliche budgetrelevante Requests im vollständigen
  Capturefenster sichtbar.
- Für einen Setupabschluss durch `U` verbindlich
  `captureWindowState: not-started`, `observerGate: UNPROVEN`,
  `finding: inconclusive` und
  `causeStatus: CAUSE_NOT_PROVEN` festgelegt. Evaluation, Factory und
  Transportstimulus bleiben `zero`, gegatete Downstream-Kommandos
  `zero/unproven`, nicht zuverlässig beobachtete Networkcounts `unknown` und
  die Sequenz `incomplete`. Stage 1 `observer-armed` bleibt
  `observed/match`; nur die gegateten Stages 2 bis 8 werden
  `not-observed/unproven` mit `null` für Timing und `receiptOrder`. Ein Versuch
  enthält höchstens einen Stimulus; `PASS` und jeder nicht-inkonklusive Befund
  verlangen exakt einen.
- Den Abschluss zweiphasig getrennt: zuerst ein frischer tief eingefrorener
  Pre-Cleanup-Observation-Snapshot bei `U`, `V` oder `C`, danach ein eigenes
  Cleanup-Ledger aus dem tatsächlich erreichten partiellen Setupzustand. Der
  getrennte Cleanup-Finalisierungscap bleibt `60.000 ms`, die bestehenden 20
  Cleanup-IDs bleiben unverändert und der Finalrecord wird erst nach
  Cleanupfinalisierung frisch aus beiden unveränderten Projektionen erzeugt.
  Die Gründe umfassen mindestens `setup-cap`, `setup-terminal-unproven`,
  `capture-cap` und `confirmed-violation`.
- Die exakte 10-ms-Timingfunktion und ihre Nullpunkte, die feste Stage-/Layer-/
  Clock-Matrix sowie getrennte Clock-Domänen entschieden. Die Foundation-
  Hashdomäne bindet rohe Bytes des tatsächlich geladenen späteren Pfads
  `scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js`; die
  Evaluation-Hashdomäne bindet UTF-8 ohne BOM über exakt den tatsächlich
  gesendeten primitiven `Runtime.evaluate.params.expression`-String.
- Die Main-World-Projektion auf den geschlossenen verschachtelten Baum aus
  `preTransportContext`, `execution` und optionalem `settlement` erweitert.
  Alle konsumierten untrusted CDP-Felder werden descriptorbasiert ausschließlich
  als eigene Data-Properties geprüft; beobachtbare Accessor-, Descriptor- oder
  Hüllenverletzungen werden fail-closed behandelt, ohne verbotene Inhalte zu
  lesen. Der unvertrauenswürdige Eingangsgraph erhält dadurch weder bestätigte
  Plain-Data-/Proxyfreiheit noch Parser-/Pipe-Provenienz. Nur die frische
  Controllerprojektion kann als gewöhnlich und geschlossen bestätigt werden.
- Die pure Foundation allein kann kein reales `observerGate: PASS` belegen.
  Adapterabhängige Provenienz darf erst aus identitätsgebundener Evidenz des
  späteren Adapters abgeleitet und nie als freies Bool übernommen werden.
- Die Replayrelation auf `adr-0032-causal-replay-v2` und exakt 59 Vergleiche
  totalisiert: acht Artefakte einschließlich des geschlossenen Frontend-
  Runtime-Source-Set-Manifests, separat `repository.state` und 50 kausale
  Kontextwerte einschließlich `toolchain.vite.lockfileVersion`.
- Weder Foundation, Adapter, Tests, Record, Controller, Launcher noch Browser-,
  CDP-, Netzwerk-, Gateway-, Port-, Request-, Permission- oder Profiloperation
  erstellt beziehungsweise ausgeführt. Das ADR-0029-`overallGate` bleibt vor
  und nach der Diagnose `FAIL`; `causeStatus` bleibt ausnahmslos
  `CAUSE_NOT_PROVEN`. Im damaligen ADR-0032-Stand sollte als Nächstes die reine
  netzwerkfreie effects-as-data-Foundation folgen. ADR 0033 hat ADR 0032
  inzwischen formal ersetzt und behält dessen nicht ausdrücklich korrigierte
  Regeln bei. ADR 0034 hat ADR 0033 inzwischen formal ersetzt und übernimmt
  alle nicht ausdrücklich korrigierten Regeln aus ADR 0033 und ADR 0032; ADR
  0033 bleibt historische Entscheidungsebene. Im angenommenen ADR-0034-Stand
  sollte als Nächstes die getrennte netzwerkfreie Effects-as-Data-
  Foundationimplementierung folgen. ADR 0035 hat zuvor die verbliebene Join-
  Testbarkeitslücke adressiert und ADR 0034 inzwischen formal ersetzt; der
  nächste Schritt ist ausschließlich die getrennte netzwerkfreie Effects-as-
  Data-Foundationimplementierung samt fokussierter Tests. Adapter-ADR,
  Adapterimplementierung und sichtbarer Lauf bleiben nachgelagert und
  geschlossen.

### Historischer Stand: BrowserSyncTransport Diagnostic Envelope and Observation Completion Boundary – Entscheidung / ADR 0031

- ADR 0031 am `2026-08-30` als reinen Korrektur- und Dokumentationsslice
  angenommen. Er ersetzt ADR 0030 formal und übernimmt sämtliche nicht
  ausdrücklich korrigierten ADR-0030-Regeln. ADR 0020, ADR 0028, ADR 0029,
  der historische Evidence-Record und der ADR-0030-Hauptteil bleiben
  unverändert.
- Bestätigt, dass Schema 1 des `BrowserTransportDiagnosticRecord` exakt die
  bestehenden 20 Cleanup-Check-IDs enthält. Es wird keine 21. ID ergänzt und
  keine ID entfernt, umbenannt oder umgeordnet.
- Erfolgreiche `Runtime.evaluate`-Kommandoantwort, Methodenergebnis und
  flüchtige `Runtime.RemoteObject`-Hülle getrennt. Zulässig ist ausschließlich
  die unmittelbare geschlossene Vier-Felder-By-Value-Projektion ohne Handle,
  Preview, Exceptiondetails, alternative Serialisierung, Folgeinspektion oder
  Rohpersistenz. Verbotene Hüllenfelder werden nur auf Own-Presence geprüft;
  ihre Inhalte werden nie gelesen.
- Den Profilwert auf
  `immediate-closed-by-value-primitives-via-transient-cdp-remote-object-envelope-no-handle-v1`
  korrigiert. Die drei zulässigen outcome/profile-Paare sind geschlossen;
  `relationId` und `deltaProfile` bleiben unverändert.
- Mit `S` für das gültig projizierte Settlement, `N` für das eindeutig
  POST-zugeordnete Networkterminal und `C` für das controllerlokale
  6.000-ms-Capturefenster die Abschlussformel exakt als
  `observationClosed := (S && N) || C` festgelegt. Erst der atomare
  Beobachtungsfreeze erlaubt Cleanup; der endgültige Cleanupstatus folgt
  getrennt aus allen 20 Checks. Späte Ereignisse werden verworfen.
- Eine eindeutig falsche Hüllenform, vorzeitiger Cleanup oder Änderung des
  eingefrorenen Zustands ergibt `observerGate: FAIL` und
  `finding: observer-invalid`. Eine fehlende, abgeschnittene, doppelte oder
  nicht eindeutig korrelierbare Antwort bleibt ohne bestätigte Verletzung
  `UNPROVEN`/`inconclusive`; bestätigte Verletzungen besitzen
  `FAIL`-Präzedenz.
- Weder Diagnosefoundation, Tests, Recordvorlage, Controller, Harness,
  Fixture oder Launcher erstellt noch Browser-, CDP-, Netzwerk-, Gateway-,
  Port-, Request-, Permission- oder Profiloperation ausgeführt. Das
  ADR-0029-`overallGate` bleibt `FAIL`, die Ursache `CAUSE_NOT_PROVEN`; im
  damaligen ADR-0031-Stand war der nächste Slice ausschließlich die
  netzwerkfreie Implementierung und Prüfung der passiven Diagnosefoundation.

### BrowserSyncTransport Runtime Diagnostic Observer Boundary – Entscheidung / ADR 0030

- ADR 0030 am `2026-08-30` als reinen Dokumentations- und
  Entscheidungsslice angenommen. Er ergänzt ADR 0028 und ADR 0029, ersetzt
  keinen ADR und bewertet ADR 0020 ausdrücklich erneut, ohne dessen
  Produktions-Gateway-Baseline zu ändern. ADR 0020 sowie ADR 0026 bis ADR 0029
  und der historische Evidence-Record bleiben bytegleich.
- Den unveränderten Ausgangsbefund festgehalten: `OPTIONS 204`, vollständig
  beantwortetes `POST 200`, erwartete JavaScript-sichtbare Responsewerte und
  danach statisch redigierte Transportablehnung. Das ADR-0029-Runtimegate bleibt
  `FAIL`; der Ursachenstatus bleibt `CAUSE_NOT_PROVEN`. ADR 0030 ist weder
  Ursachennachweis noch Runtime-`PASS`, Produktfreigabe, Implementierung oder
  Laufautorisierung.
- Die neue Bindung `T_replay ≡R T₀` und
  `T_diag = T_replay + Δ_observer` entschieden. `T_replay` ist eine neue
  vollständige Referenzbindung und kein observerfreier Kontrolllauf. Neue
  Run-ID, Messzeit, Repositorycommit und Wegwerfprofilinstanz werden getrennt
  gebunden; sie sind kein Observerdelta. Nur tatsächlich persistierte
  historische Klassifikationen und aus dem historischen Git-Tree ableitbare
  Einzelartefakthashes dürfen verglichen werden.
- `Δ_observer` auf einen exklusiven lokalen Pipe-Controller, genau ein
  Top-Level-Target, eine Session, eine geschlossene minimale Target-/Runtime-/
  Network-Operations-Allowlist, genau eine Main-World-Auswertung, genau eine
  argumentlose Factoryerzeugung und genau einen gültigen synthetischen
  v1-`syncTest` begrenzt. Sourceinstrumentierung, Composition-Seams,
  Runtimeoberflächenmutation, Fetch-Interception, Debugger, Profiler, Tracing,
  Responsebody-Lesen, freie Rohinspektion, Zusatzrequests und Observerausgabe
  während des Laufs bleiben verboten.
- Ausschließlich zehn externe Diagnosestufen mit ebenenlokaler
  Empfangsreihenfolge und getrennten Clock-Domänen zugelassen.
  `internalStage` und `internalOwner` bleiben `unknown`;
  `Network.loadingFinished` beweist keinen JavaScript-Streamabschluss und eine
  Nähe zur 5.000-ms-Grenze höchstens `deadline-compatible`. Absolute
  Observerneutralität wird nicht behauptet.
- Das Requestbudget auf einen Default-Transportaufruf, null Retries, null
  direkte Diagnose-Fetches, null Negativvektoren, erwartbar genau einen
  `OPTIONS` und einen `POST` sowie null Observerrequests zum Produktendpoint
  geschlossen. Ein zusätzlicher Transportaufruf oder `POST` ist ein
  Diagnosevertragsbruch; fehlende oder mehrdeutige Zuordnung bleibt ohne
  belegten Verstoß `UNPROVEN`.
- In `docs/data-contracts.md` den unabhängigen geschlossenen
  `BrowserTransportDiagnosticRecord` entschieden. Seine Achsen sind
  `observerGate: PASS | FAIL | UNPROVEN`, die fünf geschlossenen
  Diagnosefindings und ausnahmslos `causeStatus: CAUSE_NOT_PROVEN`; das
  ADR-0029-`overallGate` bleibt davor und danach `FAIL`. Der Vertrag speichert
  keine Roh-CDP-/HAR-/Header-/Body-/Fehlerdaten, Requestidentitäten,
  persönlichen Pfade, Prozess- oder Browserkennungen, privaten Netzwerkdetails
  oder GoldenDawn-/Vault-/Credentialdaten.
- In diesem Slice weder Recordvorlage noch Record, Controller, Harness,
  Fixture, Observer oder Diagnosefoundation erstellt und keine Runtimeoperation
  ausgeführt. Im damaligen ADR-0030-Stand sollte als nächster Slice
  ausschließlich die vollständig netzwerkfreie Implementierung und Prüfung der
  passiven Diagnosefoundation folgen.
  Ein sichtbarer Diagnoselauf benötigt danach eine neue ausdrückliche
  Autorisierung; Browserkomposition und Browser-End-to-End bleiben bis zu einem
  späteren vollständig neuen ADR-0029-Gesamt-`PASS` geschlossen.
- Den reinen Dokumentationsstand mit 1755/1755 Tests der vollständigen
  seriellen Suite bei 0 Fehlschlägen, Abbrüchen, Skips und Todos, dem
  Produktions-Build mit exakt 46 transformierten Modulen sowie dem
  schreibfreien driftfreien `bundle:n8n:check` regressionsgeprüft. Diese lokalen
  Prüfungen sind weder Runtime- noch Diagnoseevidenz.

### Local Browser Runtime Evidence – Chrome Stable unter Windows

- Den einmalig autorisierten, sichtbaren Chrome-Stable-Lauf unter dem
  vollständigen Basistupel `chrome-stable-win-t0-01` ausgeführt und als
  geschlossenen Schema-1-Record unter
  `docs/evidence/browser-runtime-evidence.chrome-stable-windows-01.json`
  dokumentiert. Gebunden waren Chrome `151.0.7922.174`, Windows 11 Home 25H2
  Build `26200.9168`, Node `24.19.0`, die Top-Level-Origin
  `http://127.0.0.1:5173` und der feste Gatewayendpoint auf
  `127.0.0.1:8787`.
- Im einzigen gestarteten Vektor `positive-default` genau einen gewöhnlichen
  CORS-Preflight mit `OPTIONS 204`, danach genau einen vollständig
  beantworteten `POST 200` und die erwarteten JavaScript-sichtbaren
  Responsewerte beobachtet. Das öffentliche BrowserSyncTransport-Promise wies
  dennoch mit dem statisch redigierten Transportfehler zurück. Dieser belegte
  Widerspruch der JavaScript-, Browsernetzwerk- und Gatewayebene setzt
  `normalSyntheticTransport` und damit `overallGate` auf `FAIL`; die
  Korrelation blieb unbeobachtet und der positive Vektor nach der geschlossenen
  Vektorgrammatik `UNPROVEN`.
- Den Lauf unmittelbar ohne Retry gestoppt. `negative-origin` und
  `redirect-error`, ihre Deltas und ihre Restores wurden nicht ausgeführt und
  bleiben `UNPROVEN`. Die PNA-/LNA-Klassifikation bleibt wegen unbekanntem
  Zieladressraum ebenfalls `UNPROVEN`; es wurde kein zusätzlicher Header,
  keine Permission-, Policy- oder Produktanpassung vorgenommen.
- Jan bestätigte nach dem Cleanup, dass kein Local-Network-/Loopback-Dialog
  sichtbar war und keine Browserinteraktion erfolgte. Diese Beobachtung
  beweist weder allgemeine Permissionfreiheit noch einen anderen Browser-,
  Versions-, OS-, Origin- oder Produktkontext.
- Chrome, Controller, Gateway und Vite kontrolliert beendet, alle gebundenen
  Ports freigegeben sowie temporäres Profil, Harness und sanitierte Fragmente
  entfernt. Repository und gesondert gebundener Vite-Cache entsprachen danach
  wieder exakt ihrer Baseline; Produkt-, Test-, ADR-, Paket-, Bundle- und
  Generatorquellen blieben unverändert.
- Browserkomposition und Browser-End-to-End-`syncTest` bleiben geschlossen.
  Der danach verlangte Architekturentscheidungsslice ist inzwischen mit ADR
  0030 abgeschlossen, ohne den historischen Befund oder das Gesamt-`FAIL` zu
  ändern. Ein sichtbarer Diagnose- oder Runtime-Evidence-Lauf benötigt erneut
  eine ausdrückliche Autorisierung.

### Local Browser Runtime Evidence Gate – Entscheidung / ADR 0029

- ADR 0029 am `2026-08-30` als reinen Dokumentations- und
  Entscheidungsslice angenommen. Er ergänzt ADR 0020 und ADR 0028,
  operationalisiert die fortgeltenden ADR-0026-/ADR-0027-
  Runtimeanforderungen und ersetzt keinen bestehenden ADR.
- Alle positiven Pflichtbeobachtungen an ein vollständiges unveränderliches
  Basistupel `T₀` gebunden. Die Negativvektoren verwenden ausschließlich
  `T_origin = T₀ + Δ_origin` mit absichtlich abweichender Allowed-Origin und
  `T_redirect = T₀ + Δ_redirect` mit einer ausdrücklich klassifizierten
  lokalen Redirectfixture. Jede weitere Abweichung bleibt `UNPROVEN` oder
  ergibt bei beobachteter Grenzverletzung `FAIL`.
- Zehn Pflichtgates, die getrennten JavaScript-, Browsernetzwerk-, Gateway-
  und Benutzerbeobachtungsebenen sowie die ausschließlichen Status `PASS`,
  `FAIL` und `UNPROVEN` festgelegt. Ein Gesamt-`PASS` verlangt alle positiven
  Gates exakt unter `T₀`, beide Negativkontrollen ausschließlich unter ihren
  allowlisteten Deltas, Restore auf `T₀` nach jedem Negativvektor und bestätigten
  abschließenden Cleanup.
- Den geschlossenen sanitisierten Evidence-Record mit eindeutiger
  `baseContextId`, Basistupelreferenz je Vektor, tatsächlich geänderten
  Deltafeldern, erwarteten und beobachteten Deltawerten, Ausschluss weiterer
  Bindungsabweichungen sowie `restoreConfirmed` und `cleanupConfirmed`
  normativ in `docs/data-contracts.md` definiert.
- Gewöhnlichen CORS-Preflight, historisches PNA und aktuelles
  permissionbasiertes LNA getrennt. Hersteller- und Spezifikationsquellen
  bleiben Kontext, keine Runtimeevidenz; jedes Ergebnis ist an Browserprodukt,
  Vollversion, Channel, Betriebssystem, Profil, Policies, Berechtigungen,
  Top-Level-Origin und Endpoint gebunden.
- In diesem Slice keinen Browser, Gateway, Vite-/Preview-Server, Port,
  Request, Permissionpfad, Harness, Fixture oder Evidence-Template gestartet,
  angelegt oder verändert. Produktcode, Tests, Endpoint, Header,
  Konfiguration, Komposition, Browser-E2E, private Daten, Cloud, Provider, n8n
  und Vault blieben außerhalb. Der tatsächliche Runtimegate-Status bleibt
  `UNPROVEN`; als Nächstes folgt nur ein gesondert autorisierter realer
  Runtime-Evidence-Slice.

### Browser SyncTransport Validator Integrity Boundary – Implementierung

- Die in ADR 0028 entschiedene private feste v1-Wire-Policy ausschließlich in
  `src/transports/browserSyncTransport.js` implementiert. Derselbe frische
  interne Graph erreicht den Contractvalidator weiterhin exakt zweimal vor
  und nach Deep Freeze; danach läuft die Policy nach dem bestehenden
  terminalen Profilguard und unmittelbar vor `JSON.stringify` exakt einmal.
  Ein dritter oder alternativer Validatorpfad wurde nicht ergänzt und der
  Contractvalidator selbst nicht gehärtet.
- Die Policy bindet unabhängig die festen v1-Werte, das geschlossene
  ASCII-Request-ID-Profil, den tatsächlich gültigen kanonischen UTC-Timestamp
  samt Rückprojektion und 300.000-ms-Konsistenz sowie den exakten normalen
  eingefrorenen Sechs-Felder-Graphen ohne `toJSON` und mit leerem
  eingefrorenem Payload. Damit schließt sie die bestätigte Transportlücke vor
  Stringify, Encoding, Controller, Timer und Fetch.
- Die vollständige netzwerkfreie ADR-0028-Matrix additiv in
  `tests/browserSyncTransport.test.js` umgesetzt. Sie weist die aktive Policy
  bei Validator-, Descriptor-, Collection-, Regex-, Iterator-, Date-/UTC-,
  Request-ID-, Prototype-, Constructor-/Species-, Deadline-, UTF-8-,
  Coercion-, Content-Length-, Stream- und Promise-/Host-Mutationen nach. Der
  kausale Haupttest zeigt, dass die echte Policy denselben Validatorbypass vor
  Stringify und Fetch stoppt, der bei gezielt neutralisiertem Policy-Callsite
  exakt einen Fetch erreicht.
- Die fokussierte BrowserSyncTransport-Suite besteht mit 423/423 Tests, der
  gemeinsame Lauf von SyncService und BrowserSyncTransport mit 466/466 Tests,
  die sechs seriellen Sync-Suites mit 735/735 Tests und die vollständige
  serielle Gesamtsuite mit 1755/1755 Tests. Der ausschließlich aus den
  Transporttests stammende Zuwachs beträgt `Δ = 151`; alle Läufe besitzen
  0 Fehlschläge, 0 Cancellations, 0 Skips und 0 Todos. Der Produktions-Build
  transformiert weiterhin exakt 46 Module und `bundle:n8n:check` ist
  driftfrei.
- API, Seams, Dependencies, Endpoint, Caps, SyncContract, Exports, n8n-Bundle,
  Manifest, Generator, Response-, Promise-, Buffer-, Deadline-, Cleanup-,
  Redaction- und SyncService-Regeln blieben unverändert. Der
  BrowserSyncTransport bleibt vom SyncService und von `src/main.js`
  unkomponiert; ein Browser-End-to-End-Fluss wurde nicht geschaffen.
- Phase 0/Tor A anhand der tatsächlichen Implementierung erneut bestätigt:
  keine Modelle, statistische Inferenz, Provider, Credentials, privaten
  Inhalts-Payloads, Logs, Storage oder Telemetrie. Für Implementierung und
  Nachweis erfolgte kein realer Browser-, externer Netzwerk-, Gateway-, Cloud-,
  n8n-, Provider-, Credential- oder Vaultzugriff.
- Die Promise-/Host-Restgrenze bleibt bestehen: Der Transport assimiliert
  ungültig profilierte bereits abgelehnte Fetch-, Read- oder Cleanup-Promises
  nicht und gibt ihren Grund nicht aus. Ein späterer getrennter
  `unhandledrejection`-/`unhandledRejection`-Hostkanal ist dennoch möglich;
  Eintritt, Zeitpunkt, Häufigkeit und Prozessfortsetzung werden nicht
  hostübergreifend garantiert.
- Der nachfolgende ADR-0029-Entscheidungsslice operationalisiert das reale
  kontext- und versionsgebundene Runtimegate. Seine Messung bleibt ein
  gesondert zu autorisierender Slice; Browserkomposition und Browser-End-to-
  End-`syncTest` folgen weiterhin erst nach dessen an `T₀` gebundenem `PASS`.

### Browser SyncTransport Validator Integrity Boundary – Entscheidung / ADR 0028

- ADR 0028 am `2026-08-29` als reinen Dokumentations- und
  Entscheidungsslice angenommen. ADR 0028 ersetzt ADR 0027 formal, übernimmt
  dessen beide Korrekturen vollständig und lässt sämtliche nicht ausdrücklich
  geänderten ADR-0026-/ADR-0027-Regeln fortgelten. ADR 0026 behält unverändert
  seinen direkten Verweis auf ADR 0027; in ADR 0027 wurde ausschließlich die
  Statuszeile auf ADR 0028 aktualisiert, der Body ab `## Kontext` blieb
  bytegleich.
- Einen bestätigten, damals noch nicht behobenen Produktfehler dokumentiert: Die
  beiden erforderlichen `validateSyncRequest`-Aufrufe verwenden live
  manipulierbare Laufzeitfunktionen. Die bestehende terminale Prüfung bestätigt
  Shape, Freeze und Snapshotidentität, aber keine davon unabhängigen festen
  v1-Werte. Kontrollierte netzwerkfreie Proben konnten vertragswidrige
  Versionen, Aktionen, Quellen und Request-IDs bis zu Serialisierung,
  Controller, Timer und Fetch-Seam gelangen lassen. Die damalige grüne Suite
  mit 1604/1604 Tests schließt diese Nachweislücke nicht.
- Die spätere Requestreihenfolge verbindlich präzisiert:
  `descriptorbasierter Snapshot → frischer interner Graph →
  validateSyncRequest #1 → Deep Freeze → validateSyncRequest #2 → bestehende
  terminale Shape-/Freeze-Prüfung → neue feste v1-Wire-Policy → Stringify →
  UTF-8-Encoding → Controller → Timer → Fetch`. Derselbe frische Graph bleibt
  exakt zweimal Validatorinput; ein dritter Aufruf bleibt ebenso verboten wie
  jeder weitere generische oder alternative Validatorpfad.
- Genau eine private, nicht exportierte feste v1-Wire-Policy unmittelbar vor
  `JSON.stringify` entschieden. Sie liest Properties ausschließlich aus dem
  internen tief eingefrorenen Graphen über bei Modulevaluation erfasste
  Intrinsics und verwendet daneben nur die bereits erfasste primitive
  Referenzzeit. Callerroot und Callerpayload werden nicht erneut gelesen;
  live aufgelöste oder importierte Regex-, Array-, Set-, Map-, Iterator-,
  String-, Date-, Number-, Math-, Object-, Reflect- oder Validator-Allowlist-
  Oberflächen bleiben ausgeschlossen.
- Die feste Policy ausschließlich an Version `1.0`, Aktion `syncTest`, Quelle
  `goldendawn-os`, das 5- bis 64-Codeeinheiten-ASCII-Request-ID-Profil mit
  Präfix `req_`, den exakt 24 Zeichen langen kanonischen UTC-Timestamp mit
  echter Datumsvalidität und identischer UTC-Rückprojektion, höchstens 300.000
  ms interne Zeitdifferenz sowie den exakten normalen eingefrorenen
  Sechs-Felder-Graphen ohne `toJSON` und mit leerem eingefrorenem Payload
  gebunden. Der Zeitvergleich beweist keine unabhängige Frische,
  Uhrvertrauenswürdigkeit oder Replayabwehr.
- Jede Policyabweichung muss mit dem bestehenden statischen Transportfehler vor
  transportgesteuertem Stringify, Encoding, Controller, Timer und Fetch
  scheitern. Die Policy verhindert keine eigenen Nebenwirkungen eines zuvor
  ausgeführten kompromittierten Same-Realm-Validator-Hooks; Same-Realm bleibt
  keine Sandbox. Eine neue Version, Aktion oder Quelle benötigt eine eigene
  Entscheidung und einen eigenen Implementierungsnachweis.
- Factory, Methoden-API, Arity, vier Composition-Seams, fester
  Loopbackendpoint, Snapshot, frischer disjunkter Graph, zwei
  Contractvalidatoraufrufe, private Requestgrenze 65.536, ADR-0027-Nachweis
  193/192, höchstens ein Fetch, Deadline, First-Terminal-Owner, Abort, Cleanup,
  beobachtbare Promise-/Bufferprofile, Streamcopy, striktes UTF-8, einmaliges
  JSON-Parsing, Redaction, SyncService-Korrelation und fehlende
  `src/main.js`-Komposition unverändert fortgeschrieben.
- Promise-/Host-Restgrenze explizit dokumentiert: keine freie `.then`-
  Auflösung, kein `Promise.resolve` und keine Anwendung der erfassten nativen
  `then`-Methode vor vollständig bestandenem Promiseprofil. Der Transport
  übernimmt keinen fremden Rejectiongrund; ein bereits abgelehntes ungültig
  profiliertes Fetch-, Read- oder Cleanup-Promise kann dennoch später einen
  getrennten hostabhängigen `unhandledrejection`- beziehungsweise
  `unhandledRejection`-Kanal auslösen. Eintritt, Zeitpunkt, Häufigkeit und
  Prozessfortsetzung werden nicht hostübergreifend garantiert.
- Die Responseheader- und Content-Length-Entscheidung unverändert belassen:
  fehlende beziehungsweise `null` Content-Length scheitert vor
  `content-encoding`, Body, Reader und Chunk; `16.384` bleibt inklusive,
  deklarierte `16.385` scheitert in der Headerprüfung. Ein 16.385-Byte-Chunk
  bei deklarierter Länge 16.384 verletzt zugleich Restlänge und absoluten Cap
  und muss vor Kopie, weiterer Allokation und weiterem Read abbrechen; er ist
  kein isolierter Nachweis nur des absoluten Caps.
- Die spätere mutationswirksame Testmatrix um Validator-, Reflection-,
  Collection-, Regex-, Iterator-, Date-/UTC-, Request-ID-, Prototype-,
  Constructor-/Species-, Deadline-, UTF-8-, Coercion-, Content-Length-,
  Stream- und Promise-/Host-Proben ergänzt. Eine gültige Kontrolle verlangt
  exakt zwei Contractvalidatoraufrufe, eine Policyprüfung und einen Fetch. Ein
  temporärer kausaler Mutationstest muss bei neutralisierter oder umgangener
  Policy mindestens einen Validatorbypass wieder bis Fetch lassen.
- Dieser damalige Entscheidungsslice änderte keinen Produkt- oder Testcode.
  SyncContract, Exports, n8n-Bundle, Manifest und Generator blieben
  unverändert. Der anschließend getrennt ausgeführte Implementierungsslice ist
  im vorstehenden Abschnitt dokumentiert.

### Browser SyncTransport Foundation – Implementierung

- Den gemäß ADR 0027 geschlossenen BrowserSyncTransport isoliert in
  `src/transports/browserSyncTransport.js` implementiert. Das Modul exportiert
  ausschließlich `createBrowserSyncTransport`; jede Factory liefert eine
  frische gewöhnliche und eingefrorene API exakt mit `{ sendSyncRequest }`.
  Import und Factory bleiben request-, timer- und netzwerkinaktiv.
- Composition und Requestgrenze descriptorbasiert geschlossen: Die vier Seams
  und der Callerrequest werden in fester Reihenfolge genau einmal erfasst und
  nicht erneut gelesen. Ausschließlich aus dem Snapshot entsteht ein frischer,
  disjunkter Sechs-Felder-Requestgraph; nur derselbe Graph wird mit derselben
  Timestampreferenz genau einmal vor und genau einmal nach seinem Deep Freeze
  validiert. Callergraph und Callerpayload bleiben unverändert.
- Genau einen erfassten Stringify- und Encoderaufruf, den festen Endpoint
  `http://127.0.0.1:8787/api/sync-test`, frische eingefrorene Null-Prototyp-
  Records für Header und RequestInit sowie höchstens einen Fetch-Seam-Aufruf
  ohne Retry, Redirect oder Fallback umgesetzt. Der gültige maximale v1-Request
  mit exakt 193 UTF-8-Bytes erreicht Fetch genau einmal; eine 65 Zeichen lange
  `requestId` scheitert vor Serialisierung und Nebenwirkungen. Bereinigte
  temporäre Quellkopien mit Caps 193 und 192 belegen mutationswirksam nur die
  private Request-Cap-Verdrahtung und deren Position vor Nebenwirkungen.
- Die 5.000-ms-First-Terminal-Owner-Deadline, höchstens einen nicht blockierenden
  Abort nach Fetchbeginn und best-effort Timer-, Reader- und Abortcleanup
  umgesetzt. Fetch-, Read- und zulässige Cleanup-Promises werden ausschließlich
  über die erfasste native `Promise.prototype.then`-Methode und das geschlossene
  Brand-, Prototyp-, Own-Key-, Constructor- und Speciesprofil beobachtet. Freie
  `.then`-Reads, `Promise.resolve`, Thenableassimilation und transportseitige
  Prototypänderungen bleiben ausgeschlossen.
- Response und browserexponierte Header fail-fast geprüft, akzeptierte echte
  `Uint8Array`-/feste `ArrayBuffer`-Chunks sofort in genau einen eigenen lokalen
  Puffer kopiert und die öffentliche Responsekante 16.384/16.385 Bytes getrennt
  geprüft. Nach deaktivierter Deadline folgen strikt fataler UTF-8-Decode,
  genau ein `JSON.parse` ohne Reviver und der geschlossene Parsed-Value-Handoff.
- Die mutationswirksame Unit-Suite ausschließlich in
  `tests/browserSyncTransport.test.js` ergänzt. Sie verwendet kontrollierte
  Doubles und `node:vm`-Fixtures, restauriert globale Mutationen in `finally`
  und besitzt weder reale Browser- noch Netzwerk- oder Gatewayzugriffe.
- Die fokussierte BrowserSyncTransport-Suite besteht mit 272/272 Tests,
  SyncService und BrowserSyncTransport gemeinsam mit 315/315 Tests, die sechs
  seriellen Sync-Suites mit 584/584 Tests und die vollständige serielle
  Gesamtsuite mit 1604/1604 Tests. Alle Läufe besitzen 0 Fehlschläge,
  0 Cancellations, 0 Skips und 0 Todos. Der Produktions-Build transformiert
  weiterhin exakt 46 Module; der schreibfreie `bundle:n8n:check` meldet keinen
  Drift.
- Phase 0/Tor A anhand der tatsächlichen Implementierung eng erneut bestätigt:
  kein Modell, keine statistische Inferenz, kein Provider oder Workflow, keine
  Credentials oder privaten Inhalts-Payloads, kein Logging, Storage oder
  Telemetrie und keine Rechts- oder Complianceklassifikation. Es gab keine
  reale Browser-, Netzwerk-, Gateway-, Cloud-, n8n-, Provider-, Credential-
  oder Vaultnutzung.
- Der Transport bleibt vom `SyncService` und von `src/main.js` unkomponiert;
  ein Browser-End-to-End-Fluss existiert nicht. Der nächste Slice ist
  ausschließlich das getrennte reale, kontext- und versionsgebundene
  Runtimegate für CORS/Preflight, PNA/LNA, lokale Netzwerkberechtigung und
  Secure Context/Mixed Content. Browserkomposition, End-to-End-`syncTest`,
  operative Limits und Provider bleiben spätere getrennte Slices.

### Beobachtbare Browser-SyncTransport-Nachweisgrenzen / ADR 0027

- ADR 0027 wurde am `2026-08-27` angenommen und ersetzt ADR 0026 formal. Alle
  nicht ausdrücklich korrigierten Entscheidungen von ADR 0026 gelten normativ
  fort; bei Konflikten ist ausschließlich ADR 0027 maßgeblich.
- Der erste Implementierungsversuch wurde vor jeder Dateiänderung hart
  gestoppt. Working Tree, Index sowie
  `src/transports/browserSyncTransport.js` und
  `tests/browserSyncTransport.test.js` blieben unverändert; Browser, Netzwerk
  und lokales Gateway wurden nicht angesprochen. Ursache waren zwei
  unbeweisbare beziehungsweise im gültigen Version-1-Requestraum unerreichbare
  Nachweisanforderungen, keine Produktlücke. Es entsteht keine neue API,
  Dependency oder Test-Seam; die Implementierung bleibt bis zum Merge dieser
  Entscheidung pausiert.
- Fremde Fetch-, Read- und zulässige Cleanup-Promises werden nicht mehr anhand
  einer unbeweisbaren Erzeugungsrealm- oder historischen Subclass-Provenienz
  beurteilt. Entscheidend ist ausschließlich ihr geschlossenes beobachtbares
  Profil aus echter nativer Promise-Brand, exakt lokalem erfasstem Prototyp und
  unveränderter Kette, leerer Own-Key-Menge ohne eigene `constructor`-Property,
  unveränderten Constructor-/Species-Deskriptoren und -Identitäten sowie der
  Anwendung der erfassten nativen `then`-Methode. Unveränderte Cross-Realm-
  Werte bleiben negativ; vollständig fixtureseitig umprototypisierte echte
  Cross-Realm-Promises und native Subclasses ohne beobachtbaren Rest dürfen
  positiv sein. Der Transport setzt nie Prototypen; sein äußeres Promise bleibt
  mit dem erfassten lokalen Konstruktor erzeugt.
- Streamchunks folgen derselben Nachweislogik: echte `Uint8Array`- und
  Backing-`ArrayBuffer`-Brands, exakt lokale Prototypen und Ketten sowie fester,
  nicht geteilter, nicht resizable und nicht detached Speicher. Nur eine
  vollständig vor Übergabe umprototypisierte echte View samt ihrem echten
  Buffer kann bestehen; die Änderung nur einer Seite scheitert. Akzeptierte
  Bytes werden sofort in einen tatsächlich lokalen eigenen Zielbuffer kopiert,
  sodass spätere Quellmutationen die Kopie nicht beeinflussen.
- Der private produktive Browser-Request-Cap bleibt als Defense-in-Depth bei
  65.536 Bytes; Byte 65.537 scheitert weiterhin vor Controller, Timer und
  Fetch. Der größte öffentlich gültige kanonische Version-1-Requestbody ist
  jedoch exakt 193 UTF-8-Bytes groß: 129 feste Bytes plus höchstens 64
  ASCII-Zeichen für die gesamte `requestId` einschließlich `req_`. Eine
  65-Zeichen-ID scheitert vor Stringify, Encode, Controller, Timer und Fetch.
  Dies ist getrennt von der real erreichbaren Gateway-Raw-Wire-Grenze
  65.536/65.537 und der Browser-Response-Grenze 16.384/16.385 Bytes.
- Die spätere mutationswirksame Unit-Suite führt den gültigen 193-Byte-Fall bis
  exakt einen Fetch und weist die 65-Zeichen-ID früh ab. Temporäre, danach
  entfernte Quellkopien mit Cap 193 beziehungsweise 192 sowie ein roter
  Gegenbeweis bei entferntem, umgangenem oder falsch verglichenem Check belegen
  nur aktive Verdrahtung, inklusive Vergleichssemantik und Position vor
  Nebenwirkungen. Cross-Realm-Fälle verwenden `node:vm`, native Intrinsics und
  kontrollierte Doubles, laufen seriell und stellen globale Mutationen in
  `finally` wieder her; reale Browser- und Netzwerkzugriffe, Skips und Todos
  bleiben ausgeschlossen.
- Thenables, Proxies, Fakes, zusätzliche Keys, Symbole, Accessors, sichtbare
  Subclass-Prototypen, mutierte Constructor-/Species-Zustände, freie `.then`-
  Reads und `Promise.resolve` bleiben negativ. Eine mutierte globale `.then`-
  Oberfläche dient ausschließlich als Hostile-Hook-Unabhängigkeitsnachweis:
  Die ersetzte Property wird nicht frei gelesen oder aufgerufen; die beim
  Import erfasste Methode bleibt autoritativ.
- Dieser Slice ändert ausschließlich die zehn freigegebenen
  Entscheidungs- und Living-Documentation-Pfade. Transport, Unit-Suite,
  Anwendungskomposition, Browser-End-to-End-Fluss, Gateway, n8n, Cloud,
  Provider, Credentials, Vault, Paketversion, Tag und Release bleiben
  unverändert. Kein Runtime-, Provider-, Privatdaten- oder Aktivierungsgate
  wird geöffnet. Nächster Slice bleibt die isolierte Implementierung gemäß ADR
  0027; erst danach folgt der getrennte reale Browser-Runtime-Nachweis.
- Die unveränderte technische Baseline wurde real geprüft: `1332/1332` Tests
  der vollständigen seriellen Suite bestehen bei `0` Fehlschlägen, `0` Skips
  und `0` Todos; der Produktions-Build transformiert exakt `46` Module und der
  schreibfreie n8n-Bundlecheck meldet keinen Drift.

Der folgende ADR-0026-Eintrag dokumentiert den damaligen, inzwischen durch ADR
0027 ersetzten Stand unverändert. Bei Konflikten gilt ADR 0027.

### Browser SyncTransport Contract / ADR 0026

- ADR 0026 am `2026-08-24` als reinen Dokumentations- und Entscheidungsslice
  angenommen und korrigiert. Er ergänzt ADR 0017, ADR 0020, ADR 0023 und ADR
  0025, ersetzt keine bestehende Entscheidung und verändert weder SyncContract,
  SyncService-Port, Gateway noch SyncAgent.
- Für die spätere isolierte Implementierung den Modulpfad
  `src/transports/browserSyncTransport.js`, den einzigen Export
  `createBrowserSyncTransport` und eine frische gewöhnliche eingefrorene API
  exakt mit `{ sendSyncRequest }` festgelegt. `sendSyncRequest` akzeptiert exakt
  ein Argument und gibt auf jedem Methodenpfad sofort ein echtes natives
  Promise zurück; falsche Arity scheitert redigiert vor Argument-, Dependency-,
  Timer- oder Netzwerkbeobachtung.
- Die Factorygrenze geschlossen: Nur ein wirklich argumentloser Aufruf wählt
  private Wrapper um die bei Modulevaluation erfassten Browserdefaults.
  Explizites `undefined`, Extras sowie accessor-, symbol-, partial- oder
  nichtgewöhnliche Composition-Container scheitern synchron mit statischem
  `TypeError("Ungültige BrowserSyncTransport-Komposition.")`. Own-Keys und die
  vier Own-Data-Funktionen werden jeweils einmal descriptor-basiert erfasst,
  danach nicht erneut gelesen und nicht aufgerufen. Fehlende oder ungeeignete Browserdefaults scheitern
  ebenfalls bereits an der Factory. Erfasst werden außerdem der native
  Same-Realm-Promise-Konstruktor, Promiseprototyp und `then`, `Symbol.species`,
  die ursprünglichen Constructor-/Species-Deskriptoren samt Species-Getter,
  die Promise-/Object-Ketten sowie Typed-Array-/ArrayBuffer-Intrinsics und
  Prototypen. JSON, Encoding, Reflection, Promise, Typed Arrays und ArrayBuffer
  sind keine injizierbaren Seams.
- Einen autoritativen Request-Snapshot statt eines Validate-then-Reread-Pfads
  entschieden. Die beobachtbare Reihenfolge ist exakt Root-Own-Keys einmal,
  Rootprototyp einmal, sechs Deskriptoren in der Reihenfolge `version`,
  `action`, `source`, `requestId`, `timestamp`, `payload` je einmal,
  Payloadidentität nur aus dem erfassten Descriptor, Payload-Own-Keys einmal,
  Payloadprototyp einmal. Danach wird weder Root noch Payload erneut gelesen.
  Der Snapshot ist nur die interne Reflectionmenge. Aus ihr entsteht genau ein
  frischer disjunkter Sechs-Felder-Graph; ausschließlich derselbe Graph wird
  mit derselben Timestampreferenz genau einmal vor und genau einmal nach seinem
  Freeze validiert. Caller, Callerpayload und zweites Snapshotobjekt werden nie
  Validatorinput; dritten oder alternativen Pfad gibt es nicht. Die
  Timestamp-Differenz null
  belegt nur Snapshot-Selbstkonsistenz, weder Frische noch Replay-Schutz; die
  operative Zeitprüfung bleibt Gatewayaufgabe und benötigt keine Browserclock.
- Der eine frische Requestgraph wird tief eingefroren und terminal auf exakte
  Own-Data-Felder, Root-/Payload-Prototypketten bis `null`, Frozen-Zustand,
  fehlendes eigenes `toJSON` an Root, Payload und erfasstem Object-Prototyp
  sowie fehlende fremde verschachtelte Identitäten geprüft. Erfasstes natives
  `JSON.stringify` läuft exakt einmal ohne Replacer und muss einen primitiven
  String ergeben. Erfasstes `TextEncoder.prototype.encode` läuft exakt einmal
  mit korrektem Receiver; nur ein echter, nicht abgeleiteter, brand-geprüfter
  `Uint8Array` mit exaktem Prototyp zählt. 65.536 Bytes sind zulässig, 65.537
  scheitern vor Timer oder Fetch.
- Pro zulässigem Aufruf einen frischen eingefrorenen Null-Prototyp-
  `RequestInit` mit exakt zehn aufzählbaren Own-Data-Eigenschaften und einen
  frischen eingefrorenen Null-Prototyp-Headerrecord mit ausschließlich
  `Content-Type: application/json; charset=utf-8` festgelegt. Das interne
  Signal wird weder als Eigentum noch als eingefroren behauptet. Ziel bleibt
  ausschließlich `http://127.0.0.1:8787/api/sync-test`; `localhost`, IPv6,
  Konfiguration, Discovery, Redirect, Fallback, Retry und Caller-Signal bleiben
  ausgeschlossen.
- Controller, Signal und Abortmethode werden vor Timer und Fetch einmal
  aufgelöst. Die 5.000 ms sind eine Eventloop-Deadline ausschließlich für
  asynchrones Fetch- und Streamwarten, keine harte Echtzeitgrenze und keine
  Grenze der anschließend synchronen Decodierung oder des Parsings. Ein
  expliziter `active → success | transportFailure | deadline`-Eigentümer
  entscheidet zuerst; synchroner Timer-Callback gewinnt vor Fetch, während
  später erhaltene Handles trotzdem genau einmal bereinigt werden. Timer- und
  Fetch-Throw gewinnen nur aus dem aktiven Zustand. `fetchStarted` wird direkt
  vor dem Seam-Aufruf gesetzt; jeder danach gewinnende Transportfehler oder die
  Deadline abortiert den Controller höchstens einmal nicht blockierend, auch
  bei Fetch-Throw/-Rejection und jedem späteren Response-, Header-, Body-,
  Reader-, Chunk-, Cap-, EOF-, Release-, UTF-8-, JSON- oder Handoff-Fehler. Vor
  Fetch und bei Erfolg bleibt Abort nullmal; Readercleanup kommt erst nach
  Readerübernahme hinzu.
- Vor jedem erfassten `Promise.prototype.then` auf Fetch-, Read- oder
  Cleanup-Promise werden ohne fremden Zwischenhook exakter Same-Realm-
  Promiseprototyp, leere Own-Keys ohne eigene `constructor`, unveränderte Kette,
  ursprünglicher Constructor-Datendescriptor samt Konstruktoridentität und
  ursprünglicher Species-Accessordescriptor samt Getteridentität geprüft.
  Brand-, Descriptor-, Species- oder Applyfehler scheitern. Es gibt weder
  `Promise.resolve` noch freien `.then`-Zugriff. Alle kontrollierten
  Settlementhandler fangen beherrschte Throws, prüfen bei spätem Settlement
  zuerst den Owner und geben auf jedem Pfad ausschließlich primitives
  `undefined` zurück, sodass der unbenutzte Folgepromise keinen Fremdwert
  assimiliert.
- Responsefelder werden fail-fast in der Reihenfolge `status`, `redirected`,
  `url`, `type`, `headers`, `body` jeweils genau einmal gelesen und sofort
  geprüft; ein Fehler liest alle späteren Felder nullmal. Non-200 stoppt nach
  `status`, abortiert höchstens einmal und liest weder Header noch Bodymethode.
  `headers.get` wird einmal aufgelöst; `content-type`, `content-length`,
  `content-encoding` werden nur nach bestandener Vorprüfung je einmal gelesen
  und sofort geprüft, bevor `body` gelesen wird. Nur HTTP `200`, keine
  Umleitung, exakte finale URL, Typ `cors`, exakter JSON-/UTF-8-Content-Type und
  eine kanonische browserexponierte Content-Length bis 16.384 öffnen den Body.
- Der browserexponierte Content-Encoding-Wert muss exakt `null` sein.
  `Content-Encoding` ist nicht CORS-safelisted und wird vom aktuellen Gateway
  nicht zusätzlich exponiert; `null` belegt deshalb nur gefilterte
  Unsichtbarkeit, weder Wire-Abwesenheit noch fehlende Browserdekompression.
  Ein exponierter nicht-null-Wert scheitert. Das Cap zählt browserexponierte,
  möglicherweise bereits decodierte Bytes; die Gleichheit von
  browserexponierter Content-Length und kopierten Bytes ist nur ein enger
  Gateway-Kompatibilitätscheck, kein Kompressions- oder Wire-Oktett-Beweis. Der
  aktuelle Gateway und seine CORS-Header bleiben unverändert. Ein sichtbarer
  Nachweis benötigt einen neuen Gateway-/CORS-Slice.
- `getReader` und dessen `read`, `cancel`, `releaseLock` werden jeweils nur
  einmal aufgelöst. Serielle Reads akzeptieren ausschließlich gewöhnliche
  exakte Iteratorresults. Ihre Own-Key-Sequenz wird einmal als exakt `value`,
  `done` erfasst; danach folgen die Deskriptoren je einmal in der Reihenfolge
  `done`, `value` und keine Rereads;
  beobachtbare Proxyinkonsistenzen scheitern, ohne transparente Record-Proxies
  universell erkennen zu wollen. `done: true` verlangt exakt
  `value: undefined`. `done: false` verlangt einen echten nicht abgeleiteten,
  brand-geprüften `Uint8Array` mit sicherer positiver Ganzzahl-ByteLength. Ein
  Nullchunk scheitert nach genau diesem Read ohne Kopie oder zweiten Read und
  führt zu Abort und Cleanup; dadurch sind höchstens 16.384 akzeptierte
  Nicht-EOF-Reads möglich.
- Der Chunkbuffer wird über erfasste Intrinsics als echter fester Same-Realm-
  `ArrayBuffer` mit exakt erfasstem `ArrayBuffer.prototype` geprüft.
  SharedArrayBuffer, Growable SharedArrayBuffer, Proxy, fremder Buffer,
  detached Buffer, malformed Buffer, falscher Bufferprototyp und, sofern
  prüfbar, resizable Buffer werden abgelehnt.
  Der einzige transport-eigene Zielbuffer ist ebenfalls fest und nicht
  geteilt. Zwischen letzter Prüfung und sofortiger Kopie liegt kein fremder
  Hook; die Chunkidentität wird nicht behalten. Byte 16.385 scheitert vor
  Kopie, weiterer Allokation oder weiterem Read. Erfolg verlangt EOF, exakte
  Längengleichheit, null Cancel und genau ein erfolgreiches Release; Fehler und
  Deadline versuchen Cancel/Release jeweils höchstens einmal best effort.
- Vor der synchronen Terminalphase wird der Timer disarmed und genau einmal
  bereinigt. Erfasstes `TextDecoder.prototype.decode` läuft mit korrektem
  Receiver, `fatal: true` und `ignoreBOM: true`, sodass eine BOM als U+FEFF
  sichtbar bleibt. Danach folgt genau ein erfasstes natives `JSON.parse` ohne
  Reviver, Trim, Reparatur oder Normalisierung. Primitive JSON-Werte sind
  zulässig; Objekte und Arrays müssen ihre exakten erfassten Prototypketten bis
  `null` besitzen, und die erfassten Object-/Array-Prototypen dürfen keine
  eigene `then`-Property besitzen. Ein eigenes `then` am Top-Level darf nur eine nicht
  aufrufbare Dateneigenschaft sein. Erst dieser geschlossene Wert erfüllt das
  bereits erzeugte native Promise unmittelbar; Validierung und Korrelation der
  SyncResponse bleiben unverändert beim SyncService.
- Alle beherrschten Methodenfehler rejecten mit demselben gewöhnlichen, tief
  eingefrorenen exakten Zwei-Felder-Record
  `BROWSER_SYNC_TRANSPORT_FAILED` / `Der lokale Browser-SyncTransport ist fehlgeschlagen.`,
  ohne URL, Status, Header, Body, Request-ID, Exceptiondetails oder Logging.
  Factory-`TypeError` bleibt davon getrennt. Fetch-/Wire-/Decode-/Parsefehler
  werden im Service `transportFailed`; parsebares ungeeignetes oder falsch
  korreliertes HTTP-200-JSON und frühe Gatewayresponses bleiben
  `invalidResponse`.
- Browserseitige Request-Metadaten ausdrücklich nicht verschwiegen: Die App
  setzt keine Cookies, Credentials, Authorization, Referrer, privaten Payload,
  Provider-Secrets, Logs oder Telemetrie; der Browser kann trotzdem Origin,
  User-Agent, Accept/Accept-Language, Sec-Fetch-*, Client Hints und PNA/LNA-
  Metadaten an den lokalen Port senden. `credentials: "omit"`,
  `no-referrer`, Loopback und CORS sind weder Anonymitäts-, Datenschutz-,
  Authentisierungs- noch Autorisierungsbeweise.
- Die isolierte Implementierung und ihre mutationswirksame Unit-Suite unter
  `tests/browserSyncTransport.test.js` bleiben vollständig netzwerkfrei und
  verwenden ausschließlich Doubles. Die Matrix umfasst zusätzlich exakte
  Root-/Payload-Trapfolge, nur denselben frischen Graphen als genau zweimaligen
  Validatorinput, Constructor-/Species-Mutationen und `undefined`-Handler,
  Nullchunk nach einem Read, native `value`-/`done`-Keyfolge, Shared-/Resizable-/
  Detached-Buffer, Abort jedes Post-Fetch-Fehlerprofils, null Abort vor Fetch
  und bei Erfolg, fail-fast Getter-/Headerzahlen sowie gefiltertes
  Content-Encoding `null` gegenüber exponiertem Nicht-null ohne Wireclaim. Vor Browserkomposition oder End-to-End-
  Slice muss ein getrenntes, reales und an OS, Browserversion, Frontend-Origin
  und -Kontext sowie Endpoint gebundenes Gate CORS/Preflight, Private/Local
  Network Access, Browserberechtigungen, Secure Context/Mixed Content,
  Loopbackziel, Redirect, sichtbare und blockierte Responseheader, finale URL,
  Response-Typ, Browserunterschiede und nötige Benutzerfreigaben als `PASS`
  belegen. Das Ergebnis bleibt kontext- und versionsgebunden und ist keine
  allgemeine Browsergarantie. Benötigte Header-, Permission- oder CORS-Änderungen öffnen
  ADR 0020/0026 neu; es gibt keinen Fallback.
- Den Tor-A-Befund ausschließlich auf diesen dokumentarischen Slice begrenzt.
  Vor Merge der Implementierung werden deren tatsächlicher Code, Browser-APIs,
  Dependencies und Datenflüsse erneut auf fehlende Modelle, modell-, lern- oder
  statistikbasierte Inferenz, Training, Lernen oder Adaptieren, Provider,
  Workflows, private Payloads, Telemetrie, Persistenz und fachliche
  Nebenwirkungen geprüft. Browserkomposition und reale menschliche Interaktion
  erhalten ein eigenes vollständiges scopegebundenes Gate. Das Ergebnis bleibt
  eine vorläufige Arbeitshypothese, keine Rechtsberatung oder Compliancegarantie.
- Keinen Code, Test, Fetch, Browser-, UI- oder `src/main.js`-Pfad, keinen
  Provider, Cloudfluss, private Daten, Storage, Logging, Telemetrie, Bundle,
  Evidence oder Dependency geändert. Nächster separat freizugebender Slice ist
  ausschließlich die isolierte Implementierung samt vollständiger
  mutationswirksamer Matrix in `tests/browserSyncTransport.test.js`; das reale
  Browser-Runtimegate und der Browser-End-to-End-Fluss folgen getrennt.
- Die Dokumentationsänderung mit der vollständigen seriellen Suite bei
  1332/1332 Tests, 0 Fehlschlägen, 0 Skips und 0 Todos verifiziert. Der
  Produktions-Build transformiert weiterhin exakt 46 Browsermodule, und der
  schreibfreie `bundle:n8n:check` meldet keinen Drift.

### Local SyncGateway–SyncAgent Composition – Implementierung

- Den durch ADR 0025 entschiedenen lokalen In-Process-Pfad umgesetzt.
  `server/startLocalSyncGateway.js` erzeugt nach gültiger Runtimekonfiguration
  genau eine lokale SyncAgent-Instanz pro HTTP-Server-Factory und injiziert sie
  als erforderliche Dependency; Import und ungültige Konfiguration starten
  weiterhin weder Agent noch Listener.
- Die HTTP-Factory ohne versteckten Agentendefault gehärtet. Sie löst
  `syncAgent.processSyncRequest` vor dem Serveraufbau genau einmal sicher auf
  und verwendet dieselbe Funktion mit demselben Receiver. Ausschließlich die
  exakte defensive Boundary-Requestidentität erreicht den Agenten synchron, mit
  exakt einem Argument und pro akzeptiertem Requestpfad höchstens einmal; es
  gibt weder Await, Promise-/Thenable-Auflösung, Retry noch Fallback.
- Das unvertrauenswürdige Agentenresultat gegen die exakte tief eingefrorene
  ADR-0024-Erfolgsform und dessen normale Response gegen denselben Boundary-
  Request geprüft. Nur daraus entsteht descriptor-basiert ein frischer,
  erneut validierter und tief eingefrorener Zehn-Felder-Responsegraph ohne
  übernommene fremde verschachtelte Identitäten.
- Die terminale Erfolgsgrenze mit bei Modulevaluation erfassten Object-/Array-
  Prototypen, Reflection-, Freeze-/Frozen-, Array- und JSON-Funktionen
  umgesetzt. Exakte Own-Data-Properties, Frozen-Zustand, feste
  Prototypketten bis `null`, eigene `toJSON`-Properties und die genau einmalige
  Vorabserialisierung werden fail-closed geprüft.
- Der exakt leere synthetische `syncTest` endet im explizit gestarteten lokalen
  Gateway nun ausschließlich mit der defensiven normalen SyncResponse und HTTP
  `200`. Kontrollierte Boundary-Ablehnungen bleiben HTTP `400`; Agenten-,
  Projektions-, terminale Prüf- oder Vorabserialisierungsfehler ergeben
  ausschließlich das statisch redigierte HTTP-`500 gatewayFailed`-Profil. Der
  bisherige statische `503 upstreamUnavailable`-Pfad und seine nicht mehr
  erreichbaren Fixtures wurden entfernt.
- Den bestehenden Gateway-Lifecycle und seine alleinige HTTP-, Header-, CORS-,
  Serialisierungs-, Socket- und Cleanup-Verantwortung unverändert beibehalten.
  Weder ein Browser-SyncTransport noch ein Cloud-, n8n-, Modell-, Provider-,
  Workflow-, Credential-, Persistenz-, Logging-, Telemetrie- oder privater
  Datenpfad wurde ergänzt.
- Der nächste Slice entscheidet und definiert ausschließlich den Browser-
  SyncTransport-Vertrag. Seine Implementierung und der lokale Browser-End-to-
  End-`syncTest` folgen getrennt; lokale Missbrauchs-, Parallelitäts-, Zeit-
  und Ressourcenbegrenzung beginnt erst nach diesem End-to-End-Pfad.
- Die enge vorläufige Phase-0-/Nicht-KI-Arbeitshypothese bleibt ausschließlich
  auf diesen deterministischen modellfreien lokalen Slice begrenzt und ist kein
  Compliance-Siegel. Die fokussierte Local-SyncGateway-Suite besteht mit 67/67
  Tests, die kombinierte serielle Sync-Suite mit 312/312 Tests und die
  vollständige serielle Gesamtsuite mit 1332/1332 Tests; alle drei Läufe haben
  0 Fehlschläge, 0 Skips und 0 Todos. Der Produktions-Build transformiert
  weiterhin exakt 46 Browsermodule; der schreibfreie Bundle-Check meldet keinen
  Drift.

### Local SyncGateway–SyncAgent Composition / ADR 0025

- ADR 0025 am `2026-08-23` als reinen Dokumentations- und Entscheidungsslice
  angenommen. Er ergänzt ADR 0023, erfüllt das von ADR 0024 verlangte
  Entscheidungsgate und verändert weder ADR 0023/0024 noch die Grundlagen aus
  ADR 0016, ADR 0017, ADR 0018 und ADR 0020.
- Die spätere Komposition ausschließlich im bestehenden lokalen Gateway-
  Prozess auf GD-WS01 entschieden. `server/startLocalSyncGateway.js` bleibt der
  einzige Produktions-Kompositionsroot; ein zweiter Listener, Dienst, IPC-,
  Worker-, Queue-, Browser- oder Providerpfad ist ausgeschlossen.
- Die exakte Übergabe der defensiven Boundary-Requestidentität, höchstens einen
  synchronen SyncAgent-Aufruf sowie die fail-closed Prüfung und frische
  Zehn-Felder-Projektion der unvertrauenswürdigen Agentenresponse festgelegt.
  Das Gateway bleibt alleiniger HTTP-Response-, Serialisierungs-, CORS-,
  Socket- und Cleanup-Owner.
- Die terminale Serialisierungsgrenze präzisiert: Das spätere Gateway-Modul
  erfasst Object-/Array-Prototypen, Reflection-, Freeze-/Frozen-Funktionen,
  `Array.isArray` und `JSON.stringify` bei Modulevaluation. Nach der letzten
  untrusted Reflection werden exakte Prototypen, Own-Data-Properties, Freeze
  sowie mit der erfassten `Object.getPrototypeOf`-Referenz exakt die Kette
  `capturedArrayPrototype → capturedObjectPrototype → null` geprüft. Zulässig
  sind ausschließlich `Response-Record → capturedObjectPrototype → null` und
  `Response-Array → capturedArrayPrototype → capturedObjectPrototype → null`.
  Erst danach werden der
  erfasste Array- und anschließend der erfasste Object-Prototyp auf eine eigene
  `toJSON`-Property geprüft; dann folgt genau ein Aufruf der erfassten
  Erfolgsserialisierung. Eine Kettenabweichung ergibt vor Responsebesitz
  statisch `500 gatewayFailed`, ruft die Erfolgsserialisierung nullmal auf und
  serialisiert den kompromittierten Graphen nicht. Fremder Body, Sentinel und
  Exceptiontext werden nicht ausgegeben; eine zweite Response entsteht nicht.
- Für den späteren Implementierungsslice die mutationswirksame Regression mit
  einem zwischen beide erfassten Prototypen eingeschobenen `toJSON`-Objekt und
  privatem Test-Sentinel festgelegt. Die bisherigen direkten Prototyp- und Own-
  `toJSON`-Prüfungen bestehen dabei, nur die neue Kettenprüfung lehnt vor der
  Serialisierung ab. `concurrency: false`, vollständiger `finally`-Restore und
  eine saubere Kontrollprobe der exakten Kette mit genau einem erfassten
  Erfolgsserialisierungsaufruf bleiben verbindlich. Der Restore umfasst die
  ursprüngliche Prototypkette, globalen Funktionen und Descriptoren; Code und
  Tests fehlen.
- Die synchrone Handoff-Grenze als ausdrückliche Nicht-Assimilation gefasst:
  kein `await`, `Promise.resolve` oder Promise-/Thenable-Auflösen. Ein echter
  Promise, ein Result mit zusätzlicher eigener `then`-Property oder ein
  anderweitig malformed Result scheitert an der exakten Resultform; geerbtes
  oder virtuell
  angebotenes `then` wird nicht eigens gelesen und keine universelle
  Proxy-/Thenable-Erkennung behauptet.
- Für den späteren gültigen Erfolgsweg HTTP `200`, für Agenten-, Projektions-,
  Freeze-, Revalidierungs- und Serialisierungsfehler statisch
  `500 gatewayFailed` entschieden. Der aktuelle Implementierungsstand bleibt
  unverändert: Akzeptierte Requests enden weiterhin mit HTTP `503`.
- Den engen Phase-0-/EU-Tor-A-Nachweis ohne Compliance-Siegel dokumentiert:
  kein Modell und keine modell-, lern- oder statistikbasierte Inferenz, kein
  Training, Lernen oder Adaptieren, sondern feste Validierungs-, Projektions-,
  Korrelations- und Mappingregeln mit deterministischem Output bei stabilem
  Request und Clockwert. Das Inhalts-Payload ist bestimmungsgemäß exakt leer,
  und es gibt keinen Zugriff auf PromptVault, LearningHub, LichtwaldLog oder
  GoldenDawn-Vault und keine bestimmungsgemäße Verarbeitung oder Übertragung
  privater Inhalte; Contractmetadaten können dennoch private Bedeutung codieren
  und beweisen weder Nicht-Privatheit noch Datenschutz.
  Die Einordnung bleibt eine vorläufige Arbeitshypothese, keine Rechtsberatung.
- Das Register um die direkten lokalen ADR-0016-/0018-/0020-/0024-, Node.js-
  und Lockfile-Abhängigkeiten sowie den noch unkomponierten SyncService aus ADR
  0017 ergänzt. Jan bleibt Projektowner und erteilt Implementierungs- sowie
  lokale Start-/Betriebsfreigaben ausdrücklich; ADR, Import oder Codex-Lauf
  starten nichts. Nutzung durch andere, Hosting und externer Betrieb bleiben
  unfreigegeben und neubewertungspflichtig.
- ADR 0021, ADR 0022 und Evidence-Schema 1 bleiben unkomponiert und
  unverändert: kein `overallGate`, `stableOssCompatibility: FAIL`, Tenant-,
  Provider-/Execution- und Production-Evidenz `UNPROVEN` sowie
  `activationDecision: FAIL`.
- Keine Code-, Factory-, Contract-, Schema-, Paket-, Evidence- oder
  `503`-Änderung vorgenommen. Nächster Slice ist ausschließlich die
  Implementierung der durch ADR 0025 entschiedenen lokalen Komposition;
  Browsertransport, lokaler End-to-End-Fluss, Betriebsgrenzen und Provider
  folgen später getrennt.
- Den unveränderten technischen Stand lokal verifiziert: serielle Gesamtsuite
  mit 1315/1315 Tests, 0 Fehlern, 0 Skips und 0 Todos; Produktions-Build mit
  exakt 46 transformierten Modulen; n8n-Bundle-Check ohne Drift; tracked und
  neue untracked ADR ohne Whitespacefehler.

### Local Model-free SyncAgent Core Foundation / ADR 0024

- ADR 0024 am `2026-08-22` angenommen. Die Entscheidung ergänzt ADR 0023,
  ersetzt keinen bestehenden ADR und friert ausschließlich Modulort,
  JavaScript-API, Synchronität, lokalen Resultvertrag, Clock- und
  `durationMs`-Semantik, Revalidierungsfolge, erfolgreiche lokale
  `syncTest`-Response sowie Importinaktivität und fehlende Komposition ein.
- `src/agents/syncAgent.js` als vollständig lokalen, modell- und providerfreien
  Kern ergänzt. Das Modul exportiert exakt `createSyncAgent`; die Factory
  `createSyncAgent({ getCurrentTimestamp = defaultUtcClock } = {})` liefert
  eine frische gewöhnliche und eingefrorene API exakt mit
  `processSyncRequest`.
- `processSyncRequest(syncRequest)` synchron mit genau einem formalen Parameter
  und exakt einem zulässigen Argument umgesetzt. Die Methode liefert niemals
  ein Promise oder Thenable. Jeder Aufruf erzeugt einen frischen, gewöhnlichen
  und tief eingefrorenen Vier-Felder-Result aus exakt `ok`, `status`,
  `syncResponse` und `error`; `syncResponseCreated`, `invalidInvocation`,
  `syncRequestRejected` und `agentFailed` bleiben statisch getrennt.
- Auf jedem zulässigen Einargumentpfad die Clock exakt einmal ausgewertet. Nur
  ein primitiver String wird unverändert als Referenzzeit und Response-
  `timestamp` übernommen; Clock-, Referenzzeit- und unerwartete interne Fehler
  werden statisch redigiert. `durationMs: 0` bleibt ausdrücklich ein statischer,
  ungemessener Wert ohne zweite Clock oder Timer.
- Den unveränderten Caller-Request vor jeder Projektion vollständig validiert.
  Erst danach entsteht descriptor-basiert eine frische Sechs-Felder-Projektion
  mit neuem exakt leerem Payload; sie wird validiert, tief eingefroren und final
  erneut validiert. Die neue normale Erfolgsresponse wird gegen denselben
  stabilen internen Request validiert, tief eingefroren und final erneut
  validiert. Fremde Record- oder Arrayidentitäten werden nicht übernommen.
- Bei erfolgreicher Modulevaluation private Referenzen auf `Object.freeze`,
  `Object.isFrozen`, `Object.getPrototypeOf`,
  `Object.getOwnPropertyDescriptor`, `Object.hasOwn` und `Reflect.ownKeys` sowie
  die gewöhnliche `Object.prototype`-Identität erfasst. Ausschließlich der
  terminale Verifier für Factory-API, Errorrecords sowie Failure- und Success-
  Results verwendet die erfassten Reflection-Referenzen und prüft ohne live
  Array-Prototypmethoden oder Iteratoren exakte Datenfelder, feste Werte,
  Identitäten und tatsächlichen Freeze-Zustand. Interne Request-/Response-
  Reflection und `Object.freeze` bleiben live; beobachtete Reflection- oder
  Freeze-Throws, No-ops, Mutationen oder Inkonsistenzen führen redigiert zu
  `agentFailed`. Nach dem Import ersetzte globale terminale Reflection-,
  Freeze- oder Frozen-Funktionen können keine mutable oder korrumpierte
  terminale Ausgabe erzeugen.
- Ausschließlich die erfolgreiche, korrelierte und synthetische `syncTest`-
  Response mit `handledBy: "SyncAgent"`, `processedBy: ["SyncAgent"]`, leeren
  `warnings`, `error: null` und `durationMs: 0` erzeugt. Lokale Ablehnungen und
  interne Fehler bleiben statische lokale Results und werden nicht in normale
  Contract-Fehlerresponses umgeschrieben.
- Der Modulimport startet nichts. Die Factory ruft die aufgelöste Clockfunktion
  nicht auf und startet selbst kein I/O, keinen Timer und keinen Providerpfad;
  ihre Parameterdestrukturierung löst jedoch die vertrauenswürdige
  Composition-Property `getCurrentTimestamp` auf. Ein Accessor oder Proxy im
  Container kann deshalb während der Factory-Erzeugung ausgeführt werden oder
  werfen; dies liegt außerhalb des Methoden-Resultvertrags. Erst
  `processSyncRequest` mit exakt einem Argument ruft die aufgelöste
  Clockfunktion genau einmal auf. Der Kern besitzt keinen Transport-, Provider-,
  Modell-, Workflow-, Storage-, Logging- oder privaten Modulpfad und ist weder
  mit dem lokalen SyncGateway noch mit dem Browser komponiert. Lokal akzeptierte
  HTTP-Requests enden weiterhin statisch mit `503`; es existiert kein externer
  Produktdatenfluss.
- Ausdrücklich nicht garantiert sind vor der Modulevaluation kompromittierte
  Primordials, veränderter Modulcode oder lexikalische Bindungen, eine
  kompromittierte JavaScript-Engine, OOM oder Prozessabbruch und beliebig
  koordinierte Manipulation sämtlicher Reflection-Intrinsics. Same-Realm-
  Ausführung und Deep Freeze bleiben keine Sandbox.
- Die Command-Center-Copy auf den implementierten isolierten Kern aktualisiert.
  Nächster Slice ist ausschließlich die kontrollierte lokale Gateway-/SyncAgent-
  Komposition; Browsertransport und optionale Provider bleiben außerhalb.
- Die gezielte SyncAgent-Suite besteht mit 103/103 Tests, die vier kombinierten
  Sync-Suites mit 245/245 Tests und die vollständige serielle Suite mit
  1315/1315 Tests, jeweils bei 0 Fehlschlägen, 0 Skips und 0 Todos. Der
  Produktions-Build transformiert weiterhin exakt 46 Module; der schreibfreie
  n8n-Bundle-Driftcheck besteht.

### Lokaler SyncAgent vor optionalen externen Providern / ADR 0023

- ADR 0023 am `2026-08-21` als dokumentarische Architektur- und
  Sicherheitsentscheidung angenommen und ADR 0002 sowie ADR 0019 formal
  ersetzt. Der weiterhin gültige Kern bleibt erhalten: `SyncService` ist die
  einzige Kommunikationsschicht des Browsers, der `SyncAgent` der einzige
  Einstieg und Router des Agentensystems, UI und Browser wählen keinen
  Fachagenten oder Provider direkt, Version 1 bleibt auf `SyncAgent`,
  `DataAgent` und `TestAgent` begrenzt, und das lokale SyncGateway ist kein
  vierter Agent.
- Die neue Zieltopologie als `GoldenDawn-Browser → SyncService → späterer
  lokaler SyncTransport → lokales SyncGateway auf GD-WS01 → lokaler SyncAgent
  → lokal validierte und korrelierte SyncResponse` entschieden. Der lokale
  SyncAgent wird die autoritative Policy-, Validierungs-, Routing- und
  Antwortgrenze des Agentensystems.
- Den ersten SyncAgent-Kern ausschließlich für den bestehenden leeren,
  synthetischen und nebenwirkungsfreien `syncTest` als vollständig lokal,
  deterministisch, modellfrei und providerfrei festgelegt. Er setzt keinen
  ModelProvider, WorkflowProvider, n8n-, OpenAI- oder lokalen Modelladapter als
  Dependency voraus.
- `ModelProvider` und `WorkflowProvider` nur als getrennte konzeptionelle
  spätere Portklassen festgelegt, ohne Signaturen, Methoden, Schemas oder
  Dateien zu definieren. Provider, Modell, Workflow, Endpoint und Umgebung
  dürfen ausschließlich aus vertrauenswürdiger lokaler Composition stammen,
  niemals aus Browserwerten, Requestfeldern oder Modelloutput.
- n8n Cloud, self-hosted n8n, OpenAI und lokale Modelle ausschließlich als
  standardmäßig deaktivierte, optionale spätere Provider eingeordnet. Kein
  Adapter ist durch ADR 0023 autorisiert. Provider erhalten später höchstens
  eine explizite minimierte neue Projektion; ursprüngliche Browserbytes,
  Browserheader, URL, Query und Serialisierung werden nicht weitergegeben.
- Die lokalen Gateway-Invarianten aus ADR 0020 unverändert übernommen. ADR 0021
  bleibt angenommen; Bundle und Manifest bleiben korrekte, nicht komponierte
  und nicht aktivierte n8n-Derivate. ADR 0022 bleibt vollständig unverändert
  und dokumentiert den gescheiterten beziehungsweise unbewiesenen ursprünglichen
  n8n-Ingresspfad: Schema 1 besitzt kein `overallGate`, die festen Werte
  `stableOssCompatibility: FAIL`,
  `productionUrlMeasurementStatus: UNPROVEN` und
  `activationDecision: FAIL` bleiben bestehen.
- Für einen optionalen späteren n8n-Adapter einen neuen ADR, eine neue
  adapterbezogene Evidenz-Schemaversion und eine getrennte Webhook-/Credential-
  Entscheidung verlangt. Der bekannte Header-Auth-/Execution-Data-Befund
  bleibt ein Blocker; `Raw Body` ist kein erforderlicher Beweis ursprünglicher
  Browserbytes und darf nicht als solcher dargestellt werden.
- Die verbindliche weitere Reihenfolge auf lokalen SyncAgent-Kern, getrennte
  Gateway-/SyncAgent-Komposition, Browser-SyncTransport und lokalen End-to-End-
  `syncTest`, lokale Missbrauchs-, Parallelitäts-, Zeit- und Ressourcenlimits
  und erst danach getrennte Providerentscheidungen festgelegt. Der nächste
  Schritt ist ein separater Implementierungsplan für den vollständig lokalen,
  modellfreien und importinaktiven `syncTest`-SyncAgent-Kern.
- Keinen Produkt-, Test- oder Servercode, keinen Transport, Provideradapter,
  externen Datenfluss, Workflow, Webhook, Credential oder Secret ergänzt.
  Contractfelder, Validatorregeln, Evidence-Schema und feste Evidence-Werte
  bleiben unverändert. Bis zur späteren Gateway-/SyncAgent-Komposition enden
  lokal akzeptierte Requests weiterhin statisch mit HTTP `503`.
- Den unveränderten technischen Stand lokal erneut verifiziert: vollständige
  serielle Suite mit 1212/1212 Tests, 0 Fehlschlägen, 0 Skips und 0 Todos;
  erfolgreicher Produktions-Build mit exakt 46 transformierten Modulen;
  Bundle-Check driftfrei und `git diff --check` erfolgreich.

### n8n Cloud Ingress & Runtime Evidence Gate Foundation / ADR 0022

- ADR 0022 als angenommene Evidenz- und Stoppentscheidung ergänzt. Die vier
  Klassen dokumentierte Plattformgarantie, commitgebundene Beobachtung im
  offiziellen OSS-Code, Messung im konkreten Cloud-Tenant und workflowseitig
  nicht beobachtbare Provider-/Ingress-Eigenschaft bleiben strikt getrennt.
  Jedes Messgate besitzt exakt `PASS`, `FAIL` oder `UNPROVEN`; `FAIL` hat
  Vorrang. Selbst ein vollständig gebundener Test-URL-Tenantmessstatus `PASS`
  öffnet keine Aktivierung, sondern ist nur Input für die getrennte
  ADR-0019-Neubewertung. ADR 0022 ergänzt und blockiert ADR 0019, ersetzt ihn
  aber nicht.
- Als öffentlichen Stable-Bezugspunkt
  [`n8n@2.35.4`](https://github.com/n8n-io/n8n/releases/tag/n8n%402.35.4)
  am Commit `d2ce3c084c228622c2ffe7c245d25870430e18a9` festgehalten. Der
  [offizielle Body-Reader](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/middlewares/body-parser.ts)
  setzt für `gzip` einen Gunzip- und für `deflate` einen Inflate-Stream vor
  `req.rawBody`; das commitgebundene Gate für den Erhalt dieser Wire-Bytes ist
  deshalb `FAIL`. `br` fällt dort in den unveränderten Defaultpfad, ist dadurch
  aber weder als Cloud- noch als Tenantgarantie bewiesen.
- Im selben Stable-Stand vergleicht die
  [Header Authentication](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/nodes-base/nodes/Webhook/utils.ts)
  den Credentialwert, entfernt ihn aber nicht aus `req.headers`; der
  [Standard-Webhook-Output](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/nodes-base/nodes/Webhook/Webhook.node.ts)
  gibt diese Header weiter. Das commitgebundene Gate „Header-Auth-Secret nicht
  im Standard-Webhook-Output“ ist daher ebenfalls `FAIL`. Dies ist eine
  offizielle OSS-Quellbeobachtung und keine Behauptung über den Build eines
  konkreten Cloud-Tenants.
- Den commitgebundenen
  [Test-Webhook-Lifecycle-Quellanker](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/webhooks/test-webhooks.ts)
  ergänzt, ohne daraus nicht dokumentierte Symbol-, Zeilen- oder Tenantzusagen
  abzuleiten.
- Die importseitig und standardmäßig netzwerkinaktive lokale Foundation aus
  `scripts/n8n/n8nCloudIngressProbe.js`,
  `scripts/n8n/n8nCloudIngressProbeObserver.js`,
  `tests/n8nCloudIngressProbe.test.js` und
  `docs/evidence/n8n-cloud-ingress-runtime-evidence.template.json` ergänzt.
- Eine feste Registry aus exakt 32 synthetischen Vektoren festgelegt:
  gültiges und ungültiges JSON, ASCII und Mehrbyte-UTF-8, Vierbytezeichen, BOM,
  NFC/NFD, CRLF/Whitespace und NUL, vier ungültige UTF-8-Folgen, die
  65.535-/65.536-/65.537-Byte-Grenzen einschließlich eines Mehrbytegrenzfalls,
  fehlendes beziehungsweise `identity`-/`gzip`-/`deflate`-/`br`-Encoding und
  Expansion über 65.536 Bytes, fehlende/falsche/korrekte/doppelt gleiche
  Header Authentication sowie beide Reihenfolgen des widersprüchlichen
  Doppelheaders. Der alte `auth-duplicate-conflicting` entfällt zugunsten von
  `auth-duplicate-conflicting-correct-first-wrong-last` und
  `auth-duplicate-conflicting-wrong-first-correct-last`; `Content-Length`- und
  Chunked-Framing bleiben getrennt.
- Die Fixture-Identitäten geschlossen: alle Auth-Bodies sind identisch,
  absent/identity und `Content-Length`/Chunked teilen jeweils exakt denselben
  Body, die Größenfixtures sind A-Präfix-kompatibel und die
  `gzip`-/`deflate`-/`br`-Payloads besitzen denselben dekomprimierten Sentinel;
  der Expansionsvektor bleibt die getrennte 65.537-Byte-Grenzprobe.
- Den kanonischen und vorgesehenen Operator-Laufweg für einen One-shot als
  `npm run probe:n8n:cloud:test -- --vector <probeId>` festgelegt; das
  Paket-Script bindet exakt `node scripts/n8n/n8nCloudIngressProbe.js --run`.
  Import, bloße Factory-Erzeugung, Build, Tests, Dev-Server und Bundle-Check
  binden keinen Real-HTTPS-Transport.
  Endpoint und
  Wegwerfsecret werden nur aus
  `GOLDENDAWN_N8N_CLOUD_PROBE_ENDPOINT` und
  `GOLDENDAWN_N8N_CLOUD_PROBE_SECRET` gelesen. Das Tool akzeptiert nur HTTPS
  ohne URL-Userinfo, Query oder Fragment und ausschließlich kanonische Pfade
  der Form `/webhook-test/<segment>[/<segment>…]`. Jedes nicht leere
  Suffixsegment besteht nur aus ASCII-Buchstaben, Ziffern, Bindestrich oder
  Unterstrich. Prozentkodierungen, rohe oder kodierte Backslashes,
  Steuerzeichen, leere Segmente sowie `.` und `..` werden vor der
  Transportauflösung abgelehnt. Das Tool verwendet eine feste Deadline von
  5.000 ms und höchstens 16 KiB Responsebytes, folgt keinen Redirects und
  wiederholt keinen Request. Nach vollständiger Argument-, Konfigurations- und
  ID-Validierung sendet es genau einen allowlist-validierten Vektor in genau
  einem HTTPS-Request an diese Test-URL und stoppt. Vor jedem nächsten Vektor
  muss der Operator den Test-Webhook manuell neu registrieren beziehungsweise
  in Listening versetzen. Es gibt keinen Sweep, kein Autoregister und keinen
  Production-URL-Runner. Die Factory verwendet ausschließlich einen explizit
  injizierten Transport; nur der CLI-Adapter darf danach Real-HTTPS binden.
- Den menschenprüfbaren importfreien Code-Node-Observer auf die offiziell
  dokumentierte API
  [`this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName)`](https://docs.n8n.io/build/code-in-n8n/cookbook/code-node/get-the-binary-data-buffer/)
  und die sechs erlaubten Rückgabefelder `probeId`, `exactMatch`,
  `receivedByteLength`, `strictUtf8Outcome`,
  `authorizationHeaderPresence` und `contentEncodingOutcome` begrenzt. Er komponiert weder
  SyncContract, Request Boundary, Boundary-Bundle noch `SyncAgent` und parst
  keinen fachlichen SyncRequest.
- Observerresponse, Runnerresult und Evidenzvorlage als geschlossene,
  allowlist-basierte Verträge umgesetzt. Unbekannte Felder, Accessors, Symbole,
  unbekannte Semantik und unvollständige Beobachtung werden nicht positiv
  normalisiert. Ausgabe und persistierbare Evidenz bleiben statisch redigiert:
  Endpoint, Tenantdomain, URL-Pfad, Secret, Credential-/Authorization-Werte,
  Header, Bodies, Bytes und Base64 werden nicht ausgegeben oder gespeichert.
  `executionDataSettings` besitzt zusätzlich zu den vier Save-/Pruning-Feldern
  exakt `readTimeRedaction`. Aktivierte Read-time-Redaction ist notwendig, aber
  nicht hinreichend: Die
  [offizielle Dokumentation](https://docs.n8n.io/deploy/host-n8n/configure-n8n/security/redact-execution-data/)
  sagt ausdrücklich, dass sie gespeicherte Daten nicht verändert. Unsichere
  beobachtete Save-/Redaction-Einstellungen ergeben `FAIL`, fehlende Angaben
  `UNPROVEN`.
- Das geschlossene Evidenz-Schema 1 auf die getrennten Statusfelder
  `testUrlTenantMeasurementStatus`, `stableOssCompatibility`,
  `providerExecutionEvidenceStatus`, `productionUrlMeasurementStatus` und
  `activationDecision` festgelegt; `overallGate` entfällt. `endpointKind` ist
  exakt `test`, Stable-OSS-Kompatibilität und Aktivierungsentscheidung sind
  unveränderlich `FAIL`, der Production-URL-Messstatus unveränderlich
  `UNPROVEN`. `activationDecision: PASS` wird in Schema 1 immer abgelehnt;
  Änderungen dieser festen Werte benötigen einen neuen ADR und eine neue
  Schemaversion. Ohne Lauf bleiben Test-URL-Tenant- und Providerstatus
  `UNPROVEN`, `cleanupConfirmed` ist `false`. Provider-`PASS` verlangt
  zusätzlich nicht-nullische Werte für `tenantAlias`, `observedAt`, `timezone`,
  `n8nBuild`, `webhookNodeTypeVersion` und `secretFreeWorkflowSha256`; `plan`
  und `region` dürfen `null` bleiben. Fehlt mindestens eine dieser sechs
  Pflichtbindungen, bleibt der Providerstatus ohne bekannten Widerspruch
  `UNPROVEN`; bekannte unsichere Setting-, Header-, Count- oder
  Attributionswerte behalten mit `FAIL` Vorrang.
- Jedes Vektorergebnis auf exakt `probeId`, `expectedByteLength`,
  `observedByteLength`, `expectedSha256`, `httpStatus`, `observerCallCount`,
  `workflowExecutionCount`, `uniqueVectorAttribution`, `exactMatch`,
  `strictUtf8Outcome`, `authorizationHeaderPresence`,
  `contentEncodingOutcome` und `gate` begrenzt. Nullable Counts werden nie aus
  HTTP-Antworten erfunden. Bei einer übernommenen geschlossenen erfolgreichen
  `2xx`-Observerresponse muss jeder bekannte Count exakt `1` sein; `0` oder ein
  Wert größer als `1` ist `FAIL`. `null` bleibt bei normalen und komprimierten
  Erfolgswegen als „noch nicht separat gebunden“ zulässig. Frühe eindeutig
  gebundene Auth-Ablehnungen mit `400`, `401` oder `403` und Encoding-
  Ablehnungen mit `400` oder `415` dürfen weiterhin 0/0 verwenden;
  `auth-correct` verlangt unverändert 1/1. Auf jedem erfolgreichen eindeutig
  zugeordneten `2xx`-Observerpfad kann nur
  `authorizationHeaderPresence: absent` das Header-Teilgate bestehen lassen;
  `present` ist `FAIL`, `null` oder `unavailable` ist mindestens `UNPROVEN`.
  Provider-`PASS` verlangt die Abwesenheit auf allen solchen Erfolgswegen. Ein
  einzelnes Vektor-`PASS` kann weder den Test-URL-Tenantstatus noch die
  Aktivierungsentscheidung öffnen.
- Keinen n8n-Cloud-Aufruf ausgeführt und keinen Tenant, Workflow, Webhook oder
  Credential angelegt oder verändert. Der tenantgebundene Messstatus bleibt
  `UNPROVEN`; wegen der zwei negativen Stable-OSS-Befunde ist das aktuelle
  Aktivierungsgate `FAIL` und geschlossen. Auch unabhängig davon würde
  `UNPROVEN` die Aktivierung geschlossen halten.
- Nach der lokalen Foundation einen verbindlichen Stopp festgelegt. Eine
  temporäre Workflowanlage, ein Wegwerfcredential, synthetischer externer
  Test-URL-Traffic und jede Supportanfrage benötigen jeweils getrennte
  Freigaben. Die vorbereiteten Supportfragen einschließlich der rein
  informativen Frage nach Test-/Production-URL-Unterschieden wurden nicht
  gesendet und autorisieren keinen Productionlauf.
  Jedes `FAIL` oder `UNPROVEN` erzwingt sofortigen Stopp, Cleanup und die
  Neubewertung von ADR 0019 vor weiterer Cloudarbeit.
- Keinen produktiven Webhook, Cloud-Upstream, Browser-SyncTransport, operativen
  `SyncAgent`, normale SyncResponse oder Boundary-Bundle-Komposition ergänzt.
  Lokal akzeptierte SyncRequests enden weiterhin statisch mit HTTP `503`.
- Die gezielte Evidence-Suite besteht mit 26/26 Tests, Bundle und Boundary
  unverändert mit 115/115 und die kombinierte Sync-Suite einschließlich der
  Evidence-Foundation mit 279/279 Tests. Die vollständige serielle Gesamtsuite
  besteht mit 1212/1212 Tests; alle Läufe besitzen 0 Fehlschläge, 0 Skips und
  0 Todos. Beide neuen Skripte bestehen die Syntaxprüfung, der
  Produktions-Build transformiert weiterhin exakt 46 Browsermodule und der
  schreibfreie Bundle-Check meldet keinen Drift.
  Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
  `v0.2.2` bleiben unverändert.

### Generated n8n Boundary Bundle Foundation / ADR 0021

- ADR 0021 als angenommene Implementierungsentscheidung ergänzt. Die
  unveränderten Module `src/contracts/syncContract.js` und
  `src/gateways/syncGatewayRequestBoundary.js` bleiben die einzigen fachlich
  kanonischen Quellen. Der Entry ist eine kleine explizit gepflegte,
  manifestierte nichtfachliche Glue- und Quelldatei, der Generator gepflegtes
  Repository-Tooling. Ausschließlich Bundle und Manifest sind reproduzierbar
  generierte Derivate und keine manuell gepflegte zweite fachliche
  Implementierung.
- Den kleinen expliziten Entry
  `scripts/n8n/syncGatewayBoundaryBundleEntry.js` sowie den deterministischen
  Generator `scripts/n8n/generateSyncGatewayBoundaryBundle.js` ergänzt. Die
  bereits im Lockfile gebundene Vite-`8.1.4`-/Rolldown-Toolchain wird ohne neue
  Dependency oder Lockfile-Erweiterung verwendet.
- `npm run bundle:n8n:generate` als expliziten Erzeugen-/Aktualisieren-Modus und
  `npm run bundle:n8n:check` als schreibfreien Driftcheck ergänzt. Der
  Checkmodus vergleicht die erwarteten Bytes ausschließlich im Speicher und
  endet bei abweichendem Artefakt, Manifest oder kanonischer Quelle mit einem
  Fehlercode.
- Das eingecheckte, menschenprüfbare
  `artifacts/n8n/syncGatewayRequestBoundary.bundle.js` als eigenständiges,
  seiteneffektfreies Artefakt aus statischem Header und direkt bindbarem
  Expression-IIFE ohne Top-Level-`var` oder Globalmutation ergänzt.
  `"use strict";` ist der erste IIFE-Body-Prolog und kein Top-Level-Statement;
  nach dem Ausdruck folgt kein separates Semikolon-Statement. Die vollständigen
  Artefaktbytes sind unverändert hinter `const boundaryBundle =` bindbar. Ihre
  Auswertung liefert exakt die eingefrorene API
  `{ createSyncGatewayRequestBoundary }`; die Factory behält die bestehende
  Clock- und Gateway-ID-Injektion und liefert exakt die eingefrorene API
  `{ processSyncRawBody }`. Beim Laden wird kein Request verarbeitet und kein
  globaler Namespace mutiert.
- Die Vite-/Rolldown-Ausgabe mit `strict: true` und
  `attachDebugInfo: "none"` erzeugt, sodass keine potenziell pfadabhängigen
  `//#region …`-/`//#endregion`-Direktiven ausgegeben werden. Der Generator
  akzeptiert nur den exakten Modulgraphen und die vollständige erwartete
  Wrapperform, entfernt fail-closed ausschließlich den bekannten deklarativen
  Wrapper und bearbeitet fachlichen Code nicht textuell. Abweichende Quellen,
  Modulgraphen oder Ausgabeformen werden nicht heuristisch umgeschrieben.
- Contract, Boundary und Entry jeweils exakt einmal über sichere FileHandles
  gelesen. SHA-256 und Vite-Virtualmodule verwenden denselben danach
  unveränderlichen In-Memory-Snapshot; ein ABA-Wechsel der Live-Datei kann
  nicht unbemerkt andere Bundler- als Manifestbytes erzeugen.
- Den kanonischen Repository-Root, Zielordner und beide festen Outputpfade vor
  jedem Generate-Write auf Containment, von Node erkannte symbolische Links und
  Junctions sowie `realpath`-Abweichungen geprüft. Der Generator legt
  unvorhersagbar benannte Tempdateien exklusiv im verifizierten Zielordner an,
  prüft Identität und Bytes, ersetzt Artefakt vor Manifest und bereinigt ihm
  weiterhin identitätsgleich zuordenbare Tempdateien. Ein kontrolliert
  unterbrochenes Mischpaar wird vom Checkmodus abgelehnt. Die individuellen
  Replaces bilden keine atomare Paartransaktion und garantieren weder
  Power-Loss- noch Single-Writer-Sicherheit. Die portable Node-API attestiert
  nicht jeden Windows-Reparse-Tag; Schutz vor einem bösartigen gleichzeitigen
  Reparse-Austausch wird nicht behauptet.
- Das Bundle benötigt zur Laufzeit weder ESM- noch CommonJS-Imports und enthält
  kein `import`, `export`, `require()`, `eval()` oder `new Function()`. Es
  besitzt keine Netzwerk-, Dateisystem-, Prozess-, Environment-, Credential-
  oder Secretzugriffe, erzeugt keine Logs oder Telemetrie und erfindet keine
  Webhook-, `$json`-, `$input`-, `items`- oder andere n8n-Inputstruktur.
- Das deterministische Manifest
  `artifacts/n8n/syncGatewayRequestBoundary.bundle.manifest.json` ergänzt. Es
  enthält eine feste Schema-Version, den relativen Artefaktpfad und SHA-256
  über dessen exakte Bytes sowie die feste geordnete Folge aus Contract,
  Boundary und Entry mit ihren SHA-256-Hashes. Zeit, absolute oder temporäre
  Pfade, Hostname, Locale und zufällige Buildwerte sind ausgeschlossen.
- Reproduzierbarkeit auf byteidentische Artefakt- und Manifestbytes bei
  wiederholter Generierung und unterschiedlichen absoluten Arbeitsverzeichnissen
  begrenzt. Beide Dateien verwenden UTF-8 ohne BOM, ausschließlich LF, einen
  finalen Zeilenumbruch und keine Source Map.
- `tests/n8nSyncGatewayBoundaryBundle.test.js` für Generator-,
  Reproduzierbarkeits-, Integritäts-, Snapshot-/ABA-, Outputpfad-, Paritäts-
  und Mutationseigenschaften ergänzt. Die kanonische lokale Boundary bleibt
  das Referenzorakel; verglichen werden auch eigene Felder, Reihenfolge,
  Prototypen, Freeze-Zustand, Identitäten, Entkopplung, Redaction,
  Console-Stille und Dependency-Aufrufgrenzen.
- Temporäre Mutationen erkennen Bundle-Byteänderungen, Quelldrift ohne
  Regeneration, semantische Abweichungen sowie entfernte API-/Freeze-Garantien.
  Ein künstlicher privater Marker wird weder in kontrollierten Resultaten noch
  in Consoleausgaben offengelegt. Kanonische Dateien werden dafür nicht
  verändert.
- Den offiziellen n8n-Plattformstand auf den `2026-08-17` datiert: n8n Cloud
  erhält keine beliebigen externen npm-Imports durch die getrennte
  Self-Hosted-Modul-Allowlist; die Webhook-Option `Raw Body` belegt weiterhin
  weder ursprüngliche byteidentische Wire-Oktette noch eine Prüfung vor
  Provider-Allokation. Das versions- und tenantgebundene Laufzeitgate aus ADR
  0019 bleibt unverändert.
- Kein n8n-Workflow, Webhook, Credential, Secret, Authentisierungsheader,
  Cloudaufruf, Browser- oder Cloudtransport, operativer `SyncAgent`, normaler
  SyncResponse-Upstream, Retry, Rate Limit, Persistenz, Logging, Telemetrie, UI
  oder `src/main.js`-Komposition ergänzt. Das Local-SyncGateway-HTTP-Verhalten
  bleibt unverändert; es existiert weiterhin kein externer Datenfluss.
- Die abschließende Syntax-, gezielte Bundle-, kombinierte Sync-, vollständige
  serielle, Build-, Checkmodus- und Dateihygiene-Verifikation wurde mit den
  tatsächlich ausgeführten Ergebnissen beziffert. Die gezielte Bundle-Suite
  bestand mit 61/61 Tests; Bundle zusammen mit der SyncGateway Request Boundary
  bestand mit 115/115 Tests. SyncContract, SyncService, Boundary, Local
  SyncGateway und Bundle bestanden kombiniert mit 253/253 Tests; die
  vollständige serielle Gesamtsuite bestand mit 1186/1186 Tests. Alle Läufe
  hatten 0 Fehlschläge, 0 Skips und 0 Todos. Der Produktions-Build war
  erfolgreich und transformierte weiterhin exakt 46 Browsermodule; der
  Bundle-Check meldete keinen Drift. Das aktuelle Artefakt besitzt SHA-256
  `15b84126852a597d429304d66d723a356b18537ba3910db9dd9443b3b787114f`;
  die exakten Manifestdateibytes besitzen SHA-256
  `87c4fa153d2af2753aaaf4d74fd515b3edae5268b9935d63faef24d10bcf593f`.
  Paketversion `0.2.2`, Tag `v0.2.2` und neuestes veröffentlichtes Release
  `v0.2.2` bleiben unverändert.

### Local SyncGateway Raw-Wire and HTTP Foundation / ADR 0020

- ADR 0020 als angenommene Implementierungsentscheidung ergänzt. Die lokale
  Foundation läuft als separater, importseitig inaktiver Node-Prozess unter
  `server/`, startet ausschließlich explizit über `npm run gateway:local` und
  verändert weder `src/main.js` noch den Browser-Buildgraphen.
- `readLocalSyncGatewayRuntimeConfig` als fail-closed Konfigurationsgrenze für
  die ausschließlich serverseitigen Variablen
  `GOLDENDAWN_SYNC_GATEWAY_PORT` und
  `GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN` umgesetzt. Die Produktionslaufzeit
  akzeptiert nur einen kanonischen Port von 1 bis 65.535 und genau eine
  kanonische HTTP(S)-Origin auf `localhost`, `127.0.0.1` oder `[::1]`; Werte
  werden in Fehlern nicht gespiegelt. `VITE_*` ist kein Konfigurationspfad.
- `createLocalSyncGatewayHttpServer` als eingefrorene Lifecycle-API mit exakt
  `start` und `stop` ergänzt. Der Listener bindet unveränderlich an
  `127.0.0.1`; Port `0` ist ausschließlich für isolierte Factorytests erlaubt.
  Import, Doppeltstart, Startfehler, Stop vor Start und Doppelstop besitzen
  kontrollierte statische Results. Startfehler verwenden einen gemeinsamen
  irreversiblen Cleanup-Pfad, verwerfen `boundPort`, schließen den Listener
  best effort und zerstören offene Sockets. Ein synchroner Close-Throw erhält
  genau einen Retry; ein weiterhin werfender Listener wird dereferenziert und
  der Prozesseinstieg versucht zusätzlich `stop`. Offene Sockets werden auch
  beim Stop beendet. Der Listening-Handler kapselt außerdem den vollständigen
  Zugriff auf `server.address()` einschließlich des jeweils einmaligen Lesens
  von `address` und `port`. Ein werfender Getter führt zum normalen statischen
  `startFailed`-Cleanup und löst keinen Fatal-Callback aus. Dasselbe gilt für
  gemeldete Ports außerhalb `1` bis `65535` sowie bei einem Produktionsport
  für jede Abweichung vom angeforderten Wert; nur Factory-Port `0` akzeptiert
  einen abweichenden tatsächlich gebundenen Port im gültigen Bereich.
- Den Lifecycle nach einem Serverfehler bei bereits erfolgreichem Start
  vollständig fail-closed gehärtet: `boundPort` wird sofort verworfen, der
  Zustand bleibt irreversibel `failed`, der Listener wird best effort
  geschlossen und vorhandene Sockets werden zerstört. Weitere Request-,
  Decoder- und Boundary-Verarbeitung wird gesperrt; Exceptiontexte bleiben
  redigiert. Die Factoryoption `onFatal = () => {}` signalisiert diesen Zustand
  payloadlos und höchstens einmal; Throws und zurückgegebene Rejections werden
  konsumiert, die öffentliche API bleibt exakt `{ start, stop }`.
- Der Prozesseinstieg entfernt bei einem Fatal-Signal seine Signalhandler,
  versucht die Bereinigung idempotent, setzt `process.exitCode = 1` und gibt
  genau einmal die statische redigierte Meldung
  `Das lokale SyncGateway wurde nach einem internen Serverfehler beendet.` aus.
  Mehrfache Signale sowie werfende oder fehlschlagende Cleanup-Pfade erzeugen
  keine zweite Meldung oder unbehandelte Exception.
- Die lokale HTTP-Allowlist auf das exakte Request-Target `/api/sync-test`,
  einen zum gebundenen Port passenden `Host`, `POST` und einen streng
  kontrollierten `OPTIONS`-Preflight begrenzt. Bei Port `80` sind ausschließlich
  `127.0.0.1` und `127.0.0.1:80` gültige Autoritäten; bei allen anderen Ports
  bleibt exakt `127.0.0.1:<port>` erforderlich. `CONNECT`, Upgrades und
  Erwartungen umgehen die Policy nicht. Sicherheitsrelevante Header werden
  aus `rawHeaders` geprüft; Duplikate und widersprüchliche Framing-Signale
  werden fail-closed abgelehnt.
- `requireHostHeader: false` in den Node-Serveroptionen ausdrücklich gesetzt.
  Dies deaktiviert nur Nodes vorgezogene HTTP/1.1-Hostantwort und lockert die
  Hostpflicht nicht. Im ansonsten regulären Requestpfad, sofern keine frühere
  fail-closed Target- oder Sonderpfadablehnung greift, durchlaufen fehlende,
  doppelte oder falsche Hostwerte Admission und Response-Owner und enden im
  eigenen statischen `invalidHttpRequest`-Envelope mit kontrolliertem
  `Content-Length`. Die Option öffnet keinen akzeptierenden Pfad.
- Ausschließlich HTTP/1.1 unterstützt. Ein als HTTP/1.0 geparster Request endet
  statisch als `invalidHttpRequest`, bevor Raw-Header-Projektion, Decoder oder
  Boundary ausgeführt werden.
- Für Requests genau eine konfigurierte Origin erlaubt. CORS-Antworten spiegeln
  ausschließlich den konfigurierten Wert, erlauben keine Credentials und
  behandeln Loopback sowie CORS ausdrücklich nicht als Authentisierung oder
  Autorisierung. Ein Preflight erlaubt nur `POST` und `Content-Type`.
- POST-Bodies auf `application/json` mit optional genau
  `charset=utf-8`, fehlendes oder `identity` Content-Encoding und ein
  widerspruchsfreies HTTP-Framing begrenzt. Kompression, zusätzliche
  Media-Type-Parameter, Trailer und mehrdeutige relevante Header werden
  abgelehnt. `Content-Length` bleibt nur ein frühes Signal.
- Die kanonische Contractkonstante von 65.536 Bytes in die Wire-Schicht
  importiert. Tatsächlich gelieferte Chunkbytes werden gezählt, höchstens
  65.536 Bytes als Anwendungsbody gehalten und ab Byte 65.537 weder
  zusammengefügt noch decodiert oder an die Boundary übergeben. Diese
  Anwendungsgrenze behauptet keinen Schutz vor bereits durch Node, Betriebssystem
  oder Netzwerkstack allozierten Bytes und keinen vollständigen DoS-Schutz.
- Einen vollständig empfangenen zulässigen Body genau einmal mit einem
  kontrollierten `TextDecoder('utf-8', { fatal: true, ignoreBOM: true })`
  decodiert. Decoderfähigkeiten werden fail-closed geprüft; ungültige oder
  unvollständige UTF-8-Folgen werden abgelehnt. Es gibt kein `setEncoding`,
  keine Chunkdecodierung, Normalisierung, Reparatur oder Trim-Operation. Eine
  gültige UTF-8-BOM bleibt als U+FEFF im String und folgt der bestehenden
  nativen Parsersemantik.
- Nach erfolgreichem Empfang ausschließlich den unveränderten primitiven String
  exakt einmal an die vorhandene kanonische `processSyncRawBody`-Boundary
  übergeben. Die HTTP-Schicht besitzt keinen zweiten JSON-Parser. Sie spiegelt
  weder den Request noch die defensive Requestprojektion und sendet sie nicht
  weiter.
- Kontrollierte Boundary-Ablehnungen ausschließlich als die bereits validierte
  frühe Gateway-Fehlerresponse mit HTTP `400` serialisiert. Lokale HTTP- und
  Gatewayfehler verwenden stattdessen eine getrennte statische Drei-Felder-
  Envelope. Ein akzeptierter Request endet bewusst mit statischem HTTP `503`
  `upstreamUnavailable`; es gibt keine normale SyncResponse und keine
  behauptete Verarbeitung durch einen `SyncAgent`.
- Die implementierte lokale Statusmenge auf `204`, `400`, `403`, `404`, `405`,
  `413`, `415`, `417`, `431`, `500` und `503` begrenzt. Kontrollierte
  Antworten verwenden `no-store`, `nosniff`, statisches JSON mit UTF-8 wo
  zutreffend und eine enge Connection-Close-Strategie; Serverdetails sowie
  fremde Eingaben oder Exceptiontexte werden nicht ausgegeben.
- Pro physischem Socket genau einen Response-Owner vor dem ersten Application-
  oder Raw-Socket-Write eingeführt. Nach einer Übernahme schreibt
  `clientError` keine zweite Response oder Statuszeile; Parserfehler vor jeder
  Anwendungsübernahme erhalten weiterhin genau eine kontrollierte statische
  Raw-Response. Raw-Pfade senden ihre statische redigierte Antwort best effort
  und zerstören den Socket danach zuverlässig; bei bereits beanspruchtem Owner
  schreiben sie nichts und zerstören ihn unmittelbar. Asynchrone
  Raw-Schreibfehler werden redigiert abgefangen und führen nur zum Destroy. Das
  begrenzt auch halb offene Clients, die nach Response oder FIN weiter Bytes
  senden.
- Konservative Node-Ressourcengrenzen für Headerbytes und Headerfelder sowie
  absolute 5.000-ms-Header- und 10.000-ms-Requestfristen, endliche Socket- und
  Keep-Alive-Zeiten und höchstens eine Anfrage pro Socket umgesetzt. Das feste
  produktive `connectionsCheckingInterval` von 100 ms begrenzt die
  konfigurierte Erkennungstoleranz bei responsivem Eventloop auf einen
  Prüftakt. Die nur mit Port `0` und exakt `useTestTimeoutPolicy: true`
  erreichbare private Testpolicy verwendet fest 250/500/500/25 ms und ist
  weder Runtime- noch Environmentkonfiguration. Eventloop-, Betriebssystem-
  und Netzwerkplanung bleiben Laufzeitgrenzen. Das ist eine begrenzte lokale
  Ressourcenhärtung, kein Rate Limit, Identitätsnachweis oder vollständiger
  Schutz gegen lokale Denial-of-Service-Angriffe.
- Eine factory-lokale, vom Response-Owner getrennte Request-Admission als
  ersten gemeinsamen Anwendungsschritt für `request`, `checkContinue` und
  `checkExpectation` ergänzt. Nur der erste Request pro physischem Socket wird
  zugelassen. Jedes weitere Ereignis beansprucht den terminalen
  Response-Owner, pausiert und zerstört den Socket ohne zweite Response, bevor
  HTTP-Version, Headerprojektion, Decoder oder Boundary ausgewertet werden.
  Mutationsgerichtete Regressionen erzwingen für den ersten gültigen
  HTTP/1.1-Request exakt einen Decoderfactory-, Decode- und Boundary-Aufruf mit
  dessen Raw Body sowie für jedes zweite reguläre oder Expect-Ereignis exakt
  null `rawHeaders`-Zugriffe und einen terminalen Response-/Socketzustand.
- Einen expliziten synchronen `dropRequest`-Handler für
  `maxRequestsPerSocket: 1` als zusätzliche Defense-in-Depth ergänzt. Er
  beansprucht den terminalen Response-Owner und zerstört den physischen Socket
  bei einem von Node verworfenen pipelinierten Folgerequest, ohne eine
  zusätzliche Node- oder Gateway-Response zu erzeugen.
- Parser- und Socket-Timeouts fail-closed beendet. Je nach Node-Parserzustand
  kann dabei nur ein Verbindungsabschluss oder eine laufzeiteigene minimale
  Timeoutantwort möglich sein; dafür wird kein stets auslieferbarer lokaler
  JSON-Envelope behauptet.
- Kein Browser-SyncTransport, kein automatischer Start mit `npm run dev`, kein
  Cloud- oder n8n-Transport, Webhook, Secret, Credential, operativer
  `SyncAgent`, erfolgreicher SyncResponse-Pfad, externer Datenfluss, Storage,
  Requestlogging, Telemetrie, Rate Limit, Replay-/Idempotenzschicht oder UI
  ergänzt. PromptVault, LearningHub und LichtwaldLog bleiben unberührt und
  lokal.
- Die Host-Zentralisierung mit einem hostlosen HTTP/1.1-`OPTIONS` plus gültigem
  POST in einem Pipeline-Write mutationswirksam geprüft: bei deaktiviertem
  `maxRequestsPerSocket` exakt zwei Anwendungsereignisse, kein `dropRequest`,
  null Decoder-/Boundary-Aufrufe, höchstens eine eigene statische Response und
  keine Marker-Leaks. Gemeldete Ports `0`, `-1`, `65536` sowie ein abweichender
  gültiger Produktionsport führen redigiert zu `startFailed`, vollständigem
  Cleanup und keinem `onFatal`. Globale Instrumentierungen laufen mit
  `concurrency: false` und vollständigem `finally`-Restore.
- Die gehärtete gezielte Local-SyncGateway-Suite am `2026-08-16` mit 50/50
  Tests und die kombinierte Suite mit Boundary, SyncContract und SyncService
  mit 192/192 Tests bestanden. Die vollständige serielle Suite bestand mit
  1125/1125 Tests. Alle Läufe hatten 0 Fehlschläge, 0 Skips und 0 Todos und
  verwendeten ausschließlich synthetische Werte sowie Loopback-Kommunikation.
  Der
  Produktions-Build war erfolgreich und transformierte weiterhin exakt 46
  Browsermodule. Paketversion `0.2.2`, Tag `v0.2.2` und Release `v0.2.2`
  bleiben unverändert.

### ADR 0019 – Local SyncGateway before n8n Cloud Decision

- ADR 0019 als angenommene, ausschließlich dokumentationsbasierte Entscheidung
  ergänzt. Der Stand dieses damaligen Dokumentationsslices lautete
  `v0.3.0 – in Arbeit – Local SyncGateway before n8n Cloud Decision`.
- Die spätere Zieltopologie als
  `GoldenDawn-Browser → SyncService → lokaler SyncTransport → lokales
  SyncGateway auf GD-WS01 → authentisierter n8n-Cloud-Webhook → SyncAgent →
  validierte normale SyncResponse` entschieden. Alle neuen Transport-, Gateway-,
  Cloud- und Agentenkomponenten bleiben geplant und nicht implementiert.
- Das lokale SyncGateway als schmale, Loopback-only Transport- und
  Sicherheitsgrenze festgelegt. Es ist kein vierter Agent, keine Fachlogik,
  kein allgemeines Backend, kein Storage, kein Ersatz für den `SyncAgent` und
  keine UI-Komponente. ADR 0002, ADR 0005 und ADR 0016 bis ADR 0018 bleiben
  unverändert gültig.
- Browsercaller als nicht authentisiert und unvertrauenswürdig eingeordnet.
  `POST`, fester serverseitiger Pfad, kontrolliertes JSON/UTF-8, Ablehnung
  komprimierter Bodies und nicht unterstützter Content-Encodings sowie exakte
  Origin-Allowlist entschieden. `OPTIONS` darf nur einen CORS-Preflight
  bedienen; CORS und Loopback beweisen keine Identität.
- Die geplante lokale Raw-Wire-Reihenfolge entschieden: `Content-Length` nur als
  frühes Signal, tatsächliche Streaming-Bytezählung bis 65.536, Abbruch bei Byte
  65.537 vor vollständiger Materialisierung, exakt eine strikte UTF-8-
  Decodierung mit Erhalt einer gültigen BOM als U+FEFF und ohne Entfernung oder
  Reparatur, danach exakt ein Aufruf der vorhandenen kanonischen Request
  Boundary und ausschließliche Weiterverwendung ihrer defensiven Projektion.
- Für den ersten leeren, nebenwirkungsfreien synthetischen Cloudfluss n8n Header
  Authentication mit dediziertem hochentropischem gemeinsamen Bearer-Secret
  und HTTPS entschieden. Das Secret darf ausschließlich im n8n-Credential-
  Store und vertrauenswürdiger serverseitiger Gateway-Laufzeitkonfiguration
  liegen und wird nur für den `syncTest`-Webhook verwendet. Sein Besitznachweis
  ist keine starke Geräte-, Prozess- oder Benutzeridentität und kein n8n-RBAC-
  Principal. Header Authentication ist keine Bodysignatur; TLS ist kein Replay-
  oder Idempotenzschutz. HMAC-, JWT-Body-Binding und Replay-Nachweis bleiben vor
  privaten oder schreibenden Aktionen neu zu entscheiden.
- `src/contracts/syncContract.js` und
  `src/gateways/syncGatewayRequestBoundary.js` als kanonische Cloudquellen
  bestätigt. Weil n8n Cloud nach dem datierten offiziellen Plattformbefund vom
  2026-08-15 keine beliebigen externen npm-Module im Code Node importiert, darf
  ein späterer Workflow nur ein reproduzierbar generiertes, selbstständiges und
  automatisiert auf Integrität, Parität und Mutationen geprüftes Artefakt
  verwenden; eine manuell gepflegte Contractkopie ist ausgeschlossen.
- Die n8n-Option `Raw Body` nicht als Nachweis byteidentischer ursprünglicher
  Wire-Oktette oder einer GoldenDawn-spezifischen 65.536-Byte-Prüfung vor
  Provider-Allokation behandelt. Aktivierung erst nach versions- und
  tenantgebundenem Laufzeitnachweis tatsächlicher Binärdaten vor Decodierung;
  andernfalls ist ADR 0019 neu zu bewerten. Die geplante n8n-Prüfung bleibt eine
  nachgelagerte Defense-in-Depth-Schicht; das lokale Gateway die geplante exakte
  vorgelagerte Wire-Grenze.
- Responseebenen getrennt: Der SyncService akzeptiert weiterhin nur normale,
  vollständig korrelierte SyncResponses. HTTP-, Authentisierungs-, Timeout-,
  frühe `gateway_`-, lokale Gateway- und ungeeignete Cloudresponses werden
  später als statisch redigierte lokale Transportfehler behandelt und niemals
  zu normalen SyncAgent-Responses umgeschrieben.
- Keine Produktions-, Test-, Paket-, Lock-, Workflow-, Vault- oder
  `src/`-Datei geändert. Kein Server, Transport, Webhook, n8n-Workflow, Bundle,
  Credential, operativer Agent, externer Datenfluss, Storage, Logging,
  Monitoring oder UI wurde implementiert. Paketversion `0.2.2`, Tag `v0.2.2`
  und neuestes Release `v0.2.2` bleiben unverändert.
- Den Dokumentationsslice am `2026-08-15` mit der vollständigen seriellen Suite
  tatsächlich geprüft: 1075/1075 Tests bestanden, 0 Fehlschläge, 0 Skips und
  0 Todos. Der Produktions-Build war erfolgreich und transformierte exakt 46
  Module.

### SyncGateway Request Boundary Foundation

- `createSyncGatewayRequestBoundary({ generateGatewayRequestId,
  getCurrentTimestamp })` als synchrone transportneutrale Grenze für einen
  bereits vollständig materialisierten Raw-Body-Wert ergänzt. Die eingefrorene
  gewöhnliche API exportiert exakt `processSyncRawBody`; die Methode akzeptiert
  exakt einen Wert und ist kein HTTP-Handler.
- Jeden Aufruf synchron auf einen tief eingefrorenen exakten Fünf-Felder-Result
  aus `ok`, `status`, `syncRequest`, `gatewayErrorResponse` und `error`
  begrenzt. Beherrschte Eingabeablehnungen liefern eine vollständig gültige
  frühe Gateway-Fehlerresponse; ungültige Invocation sowie interne oder
  Dependency-Fehler bleiben getrennte statisch redigierte lokale Results.
- Die fail-closed Reihenfolge
  `Raw-Body-Größe prüfen → exakt einmal ohne Reviver parsen → unveränderten
  Parsed-Wert validieren → defensive Sechs-Felder-Projektion mit frischem
  leerem Payload erzeugen → erneut validieren → tief einfrieren → final erneut
  validieren` umgesetzt. Zusatzfelder werden nicht vor der maßgeblichen
  Contractvalidierung entfernt; Parsed-Original und Ausgabe teilen keine
  mutablen Recordidentitäten.
- Statische Ablehnungszuordnung festgelegt: Übergröße zu
  `PAYLOAD_TOO_LARGE`, andere reguläre Raw-Body-Fehler zu
  `VALIDATION_ERROR`, native Parser-Throws zu `INVALID_JSON`, ein alleiniger
  `unsupportedVersion`- oder `unknownAction`-Fehler zum jeweils spezifischen
  Profil und sonstige oder gemischte Requestfehler zu `VALIDATION_ERROR`.
  `invalidReferenceTimestamp` sowie Builder-, Projektions-, Freeze- und
  Validatorinkonsistenzen bleiben lokale `boundaryFailed`-Pfade.
- Frühe Gateway-Responses pro Aufruf aus frischen Records und Arrays gebaut,
  vor und nach Deep Freeze vollständig validiert und mit neuer kontrollierter
  `gateway_`-ID, `action: null`, `handledBy: null`,
  `meta.processedBy: []` sowie statischem, nicht gemessenem
  `durationMs: 0` ausgegeben. Eingehende `req_`-IDs werden nie gespiegelt und
  eine Verarbeitung durch den `SyncAgent` wird nicht behauptet.
- Clock für jeden akzeptierten Request oder ausgegebenen Gateway-Fehler exakt
  einmal erfasst. Gateway-ID-Generator ausschließlich für eine tatsächlich
  benötigte Ablehnung ausgewertet; der Default verwendet nur
  `gateway_ + crypto.randomUUID()` ohne schwächeren Fallback.
- Native ECMAScript-Last-Key-Wins-Semantik für doppelte JSON-Membernamen und die
  Single-Parser-Grenze dokumentiert. Es gibt keinen Reviver, zweiten Parser,
  Duplicate-Key-Scanner, Stringify-/Parse-Roundtrip, Trim-, BOM-,
  Unicode-Normalisierungs- oder Reparaturpfad.
- Klargestellt, dass die Grenze nur die berechnete UTF-8-Länge eines bereits
  allozierten Strings prüft. Sie ist keine tatsächliche Raw-Wire-
  Bytebegrenzung, kein Schutz vor vorheriger Body-Allokation und keine HTTP-,
  Webhook- oder DoS-Durchsetzung. Für die spätere HTTP-/Transportgrenze die
  mechanismusgerechte Reihenfolge aus frühen Methoden-, Content-Type-,
  Origin-/CORS-, Rate-Limit- und gegebenenfalls Header-Auth-Kontrollen, harter
  Raw-Byte-Begrenzung während des Empfangs, einer nur nach gesonderter
  Entscheidung erforderlichen Signaturprüfung vor Decodierung und Parsing,
  einmaliger kontrollierter Decodierung, alleiniger Boundary-Verarbeitung,
  kontextgebundener Autorisierung und erst anschließendem Routing dokumentiert.
  ADR 0019 entscheidet für den ersten synthetischen Flow Header Authentication
  ohne Bodysignatur. CORS ersetzt keine Authentisierung oder Autorisierung;
  Rate Limits können mehrschichtig sein.
- Die Boundary-Suite gezielt gegen verschobene Post-Freeze-Validierungen,
  NFC-Normalisierung vor der Originalgrößenprüfung, Console-Ausgaben im
  Erfolgspfad, wiederholte Dependency-Aufrufe nach Throws und geteilte
  Identitäten desselben Gateway-Fehlerprofils gehärtet. Globale
  Instrumentierungen laufen nicht konkurrierend und werden garantiert im
  `finally` restauriert.
- ADR 0018 ergänzt, ohne ADR 0016 oder ADR 0017 umzudeuten. Kein konkreter
  Transport, HTTP-Handler, Endpoint, Webhook, n8n, operativer `SyncAgent`,
  keine Authentisierung, Autorisierung, Signaturprüfung, Secrets, CORS oder
  Rate Limits, keine Persistenz, Logs, Telemetrie, Hub-UI oder
  `src/main.js`-Komposition wurden eingeführt.

### SyncContract Foundation

- Transportneutralen Vertragskern für Contract-Version `1.0`, die einzige
  Aktion `syncTest`, den kanonischen Handler `SyncAgent` und ausschließlich
  als `synthetic` klassifizierte Erfolgsdaten ergänzt.
- Strikte Validatoren für den exakt sechs Felder umfassenden Request, normal
  korrelierte Responses, getrennte frühe Gateway-Fehler und bereits als String
  vorliegende Raw Bodies bereitgestellt. Determinismus und Seiteneffektfreiheit
  werden nur für stabile gewöhnliche Records, Arrays und Strings zugesichert,
  deren Beobachtung selbst keine Seiteneffekte auslöst.
- Pflicht-`requestId`, kanonische UTC-Zeitstempel mit expliziter Referenzzeit,
  statische redigierte Fehlerprofile, exakte Response-Korrelation und
  kontrollierte Ablehnung nicht unterstützter beobachteter Strukturen
  festgelegt.
- Dokumentiert, dass der Validator selbst keine Properties schreibt und Werte
  gewöhnlicher eigener Accessors nicht ausliest, Reflection auf Proxies jedoch
  Traps und Descriptor-Getter ausführen kann. Same-Realm-Proxy-Traps führen
  beliebigen JavaScript-Code aus und können Eingaben, externen Zustand oder
  globale Laufzeitobjekte verändern, blockieren oder spätere Operationen zum
  Werfen bringen. Reflection-Catches können solche Wirkungen weder verhindern
  noch rückgängig machen; eine vollständige portable Proxy-Erkennung existiert
  nicht. Erfolg bestätigt nur die während des Aufrufs beobachtete Struktur.
- Das Raw-Body-Limit exakt auf 65.536 UTF-8-Bytes begrenzt. Der reine Helper
  serialisiert keine Objekte und ist ohne konkrete Wire-/Webhook-
  Transportgrenze keine tatsächliche Webhook-Durchsetzung.
- Für eine spätere Wire-Grenze allgemein festgehalten, rohe Bodybytes während
  des Empfangs hart zu begrenzen und eine künftig gesondert entschiedene
  Bodysignatur gegebenenfalls über exakt diese Bytes vor der kontrollierten
  Decodierung zu prüfen. ADR 0019 konkretisiert den ersten synthetischen Flow
  ohne HMAC-, JWT-Body-Binding- oder Replay-Nachweis: Der resultierende String
  wird ausschließlich von der Boundary einmal geparst und projiziert und erst
  nach serverseitiger Policy geroutet. Natives `JSON.parse` ohne
  benutzerdefinierten Reviver erzeugt aus JSON selbst keine Proxies, Accessors,
  Symbole oder Trap-Funktionen.
- `source: "goldendawn-os"` als reine syntaktische Klassifikation festgehalten,
  nicht als Nachweis für Authentisierung, Herkunft, Identität oder Berechtigung.
  Vertrauenswürdige Herkunft, Routing und Autorisierung folgen später aus
  serverseitigem Kontext und niemals allein aus `source`.

### SyncService Foundation

- `createSyncService({ syncTransport, generateRequestId, getCurrentTimestamp })`
  als asynchrone transportneutrale Service-Foundation mit einer eingefrorenen
  API aus exakt `runSyncTest` ergänzt. Der Aufruf akzeptiert keine Argumente
  und bietet keinen generischen Aktions-, Payload-, Endpoint- oder Moduspfad.
- Bei einem argumentlosen Aufruf zuerst
  `syncTransport.sendSyncRequest` in einem einmaligen sicheren
  Auflösungsversuch aufgelöst. Bei fehlender, nicht funktionaler oder werfend
  aufgelöster Methode werden Generator und Clock nicht ausgewertet.
- Erst nach erfolgreicher Methodenauflösung einen frischen exakt sechs Felder
  umfassenden `syncTest`-Request mit exakt leerem `payload` aus den bestehenden
  Contract-Konstanten aufgebaut. `requestId` und `timestamp` stammen aus den
  dabei jeweils exakt einmal ausgewerteten kontrollierten
  Composition-Dependencies; der Standard-ID-Generator verwendet ausschließlich
  `req_ + crypto.randomUUID()` ohne schwächeren Fallback.
- Transportrequest und interne Korrelationsgrundlage als getrennte, tief
  eingefrorene Snapshots erzeugt. Nur die zuvor aufgelöste Portmethode
  `syncTransport.sendSyncRequest(syncRequest)` wird nach vollständiger
  Requestvalidierung pro Aufruf höchstens einmal mit dem vorgesehenen Receiver
  aufgerufen.
- Transportantworten als unvertrauenswürdige Eingaben behandelt, über feste
  Felder defensiv projiziert und ausschließlich als vollständig validierte,
  normal korrelierte SyncResponses akzeptiert. Frühe Gateway-Fehler gehören
  weiterhin nicht zum lokalen Transportprofil.
- Den exakten lokalen Fünf-Felder-Service-Result von der SyncResponse getrennt.
  Eine gültige normale Contract-Fehlerresponse bleibt außen `ok: true`; ihr
  fachlicher Zustand wird weiterhin ausschließlich durch
  `syncResponse.success` ausgedrückt. Lokale Fehler verwenden nur statische
  redigierte Status-, Code- und Meldungsprofile.
- Einen klar gekennzeichneten deterministischen In-Memory-Transport
  ausschließlich als Test-Double vorgesehen. In `src/` wird kein Mock-, HTTP-,
  Fetch-, Webhook- oder n8n-Transport ausgeliefert.
- Dokumentiert, dass injizierte Functions und Function-Proxies
  vertrauenswürdiger ausführbarer Anwendungscode sind. Promise-/Thenable-
  Auflösung und Proxy-Reflection können fremden Code und Seiteneffekte
  auslösen; beobachtbare Throws und Rejections werden redigiert, bereits
  ausgelöste Wirkungen können aber nicht rückgängig gemacht werden.

### Qualität

- Die gezielte Boundary-Suite mit dem exakt geforderten
  `node --test tests/syncGatewayRequestBoundary.test.js` mit 54/54 Tests
  geprüft; 0 Fehlschläge, 0 Skips und 0 Todos.
- Boundary und SyncContract gemeinsam mit 99/99 Tests sowie Boundary,
  SyncContract und SyncService gemeinsam mit 142/142 Tests geprüft. Die
  vollständige Suite besteht mit 1075/1075 Tests; alle Läufe besitzen 0
  Fehlschläge, 0 Skips und 0 Todos.
- Produktions-Build erfolgreich abgeschlossen; exakt 46 Module transformiert.

### Architektur- und Sicherheitsgrenzen

- Den späteren browserinitiierten Fluss durch ADR 0019 um den geplanten lokalen
  SyncTransport und das geplante lokale SyncGateway auf GD-WS01 vor dem
  authentisierten n8n-Cloud-Webhook konkretisiert; ein Vite-Browserfrontend
  terminiert keinen eingehenden öffentlichen Webhook.
- Die spätere Darstellung des `SyncAgent` dem AgentHub und Verbindungen,
  Webhooks, Workflows sowie den einzigen `syncTest`-Auslöser dem AutomationHub
  zugeordnet. Im aktuellen Slice wird keine Hub-UI umgesetzt.
- Keine Netzwerkkommunikation, keinen HTTP-Handler, konkreten externen
  Transport, Endpoint oder Webhook, keinen operativen `SyncAgent`, keine
  n8n-Verbindung, Header-, Methoden-, Statuscode-, Content-Type-, Charset- oder
  Encoding-Verarbeitung, Authentisierung, Autorisierung, Signaturprüfung,
  Secrets, CORS- oder Rate-Limit-Durchsetzung, keinen privaten externen
  Datenfluss und keinen produktiven Datenfluss eingeführt. SyncService und
  Boundary sind weder in `src/main.js` noch in einer UI komponiert.
- ADR 0016 für den transportneutralen Kern und die künftige Transport- und
  Hub-Grenze bleibt unveränderte Vertragsgrundlage. ADR 0017 dokumentiert die
  transportneutrale SyncService Foundation; ADR 0018 die materialisierte
  Request Boundary und ihre spätere Wire-Grenze. Paketversion `0.2.2`, Tag
  `v0.2.2` und neuestes veröffentlichtes Release `v0.2.2` bleiben unverändert.

## v0.2.2 – 2026-08-02

### LichtwaldLog Local MVP

- Lokalen Schema-1-Pfad für Anzeigen, Erstellen, vollständiges Bearbeiten,
  dauerhaftes Löschen und explizite Fokusverwaltung umgesetzt.
- `featuredEntryId` als einzige autoritative Fokusquelle beibehalten und den
  `Besonderen Lichtwaldmoment` ausschließlich als View-/CSS-Projektion ergänzt;
  es gibt keinen zweiten Zustand, keine neue API und keine zusätzliche
  Persistenz.
- Privaten Full-Snapshot unter `goldendawn.lichtwaldLog.content.v1` mit einem
  Limit von 500.000 UTF-16-Codeeinheiten, Read-Preflight, vollständiger
  Validierung, defensiven Kopien und statischer Fehlerredaktion abgesichert.

### Suche und getrennte synthetische Demo

- Flüchtige Textsuche sowie exakte Kalenderdatum- und Tagfilter mit
  AND-Semantik umgesetzt; die Eintragsreihenfolge bleibt unverändert und die
  Filterung vollständig schreibfrei.
- Fünf vollständig erfundene Demo-Einträge über einen vollständig getrennten
  In-Memory-Stack ohne `StorageAdapter`, Browser-Key, privaten Service oder
  Fallback bereitgestellt.
- Demo-Zustand innerhalb des Dokuments erhalten und nach Reload auf den
  kanonischen Seed zurückgesetzt; Demoaktionen lassen den privaten Storage und
  die vollständige Storage-Key-Liste bytegleich.

### Bedienung, Qualität und lokale Grenzen

- Safe DOM, Entry-ID-Isolation, Dirty Guards, Tastaturbedienung, sichtbaren
  `3px`-Fokusrahmen, Reduced Motion und responsive Darstellung geprüft.
- Reale Browserprüfung bei `1440 × 1000` und `390 × 844` erfolgreich
  abgeschlossen.
- LichtwaldLog mit 374/374 Tests und die Gesamtsuite mit 933/933 Tests geprüft;
  0 Skips und 0 Todos. Der Produktions-Build transformiert exakt 46 Module.
- Keine externe Kommunikation, Webhooks, Agentenlogik oder Airtable-Anbindung
  eingeführt. `localStorage` bleibt unverschlüsselt und ist keine
  Cloud-Sicherung.
- Der Umfang von `v0.2.2` ist vollständig abgeschlossen und geprüft. Der
  annotierte Tag `v0.2.2` und das zugehörige GitHub Release wurden am
  `2026-08-02` veröffentlicht; `v0.2.2` ist das neueste veröffentlichte Release.

## v0.2.1 – 2026-07-25

### LearningHub Local MVP

- LearningHub Schema 2 mit mehreren nutzerkonfigurierten LearningModules,
  LearningChapters und textbasierten LearningNodes umgesetzt.
- Lokale Inhalts-, Fortschritts- und LearningArtifact-Pfade mit getrennten
  Verträgen, Services, Storages und UI-Projektionen bereitgestellt.
- Aktuelle Notizen und Zusammenfassungen pro LearningNode lokal bedienbar
  gemacht, ohne sie mit Inhalt oder append-only Fortschritt zu vermischen.
- Veränderbare LearningTestBank und getrennte append-only Versuchshistorie
  ergänzt; abgeschlossene Attempts bleiben in persistierter Reihenfolge
  erhalten.
- Reine deterministische Single-Choice-Engine sowie sichtbar als `Lokaler
  Mock-Test` gekennzeichnete Fragenverwaltung, Durchführung, Auswertung,
  kontrollierter Abbruch und Historie umgesetzt.

### Demo-Initialisierung und Datenschutz

- Genau ein kanonisches synthetisches Demo-Modul mit drei Kapiteln, vier
  LearningNodes, acht LearningArtifacts und sieben Fragen bereitgestellt.
- Einmalige koordinierte Initialisierung vorgeschaltet, die nur bei gemeinsam
  fehlenden Inhalts-, Artifact-, Testbank- und Marker-Keys schreibt.
- Vorhandene Nutzerdaten, bewusst leere oder beschädigte Fachwerte und spätere
  Bearbeitungen vor Ergänzung oder Überschreiben geschützt; Teilfehler werden
  nur für weiterhin bytegleiche Seed-Werte kontrolliert zurückgerollt.
- Die einzelnen Storage- und Service-Loads behalten ihre schreibfreien leeren
  Zustände bei fehlenden Keys; Progress und Attempt-Historie werden nicht
  vorbefüllt.

### Bedienung und Accessibility

- Anzeige- und Bearbeitungswechsel der LearningNodes klarer getrennt und die
  stabile Auswahl bei Abbruch, Validierungsfehlern und erfolgreichem Speichern
  erhalten.
- Ungespeicherte Änderungen in den betroffenen Bearbeitungs- und Testflüssen
  vor unbeabsichtigtem Bereichswechsel oder Verwerfen geschützt.
- Mobile Kapitelüberschriften durch die begrenzte Flex-Basis korrigiert sowie
  Umbruch, Touchziele, native Beschriftungen, Fokusführung und zugängliche
  Status-, Bestätigungs- und Fehlerzustände verbessert.

### Qualität und lokale Grenzen

- Die finale Release-Verifikation umfasst 552/552 bestandene automatisierte
  Tests; sowohl die vollständige Suite mit erzwungener Einzeldatei-Ausführung
  als auch der Produktions-Build wurden erfolgreich abgeschlossen.
- Inhalt, Fortschritt, Notizen, Zusammenfassungen, Fragen und Attempts bleiben
  im aktuellen Browserprofil; `localStorage` ist unverschlüsselt und weder
  Synchronisierung noch Cloud-Sicherung.
- Der lokale Mock-Test verwendet keine KI, Agentenlogik oder externe
  Kommunikation. Repository-Daten bleiben synthetisch und von privaten
  Browserdaten getrennt.
- Der Umfang von `v0.2.1` ist vollständig abgeschlossen. Der annotierte Tag
  `v0.2.1` und das zugehörige GitHub Release wurden am `2026-07-25`
  veröffentlicht; GoldenDawn OS ist seitdem als öffentlich sichtbares
  Portfolio-Repository ohne Open-Source-Lizenz verfügbar.

## v0.2.0 – 2026-07-15

### Command Center und Design

- Responsive Command-Center-Shell mit Sidebar-Navigation, Modulübersicht,
  Projektstatus und klar gekennzeichneten aktuellen sowie geplanten Bereichen
  umgesetzt.
- Responsives Wald-/Gold-Design mit zentralen Farb-, Abstands-, Radius- und
  Schatten-Tokens sowie sichtbaren Fokuszuständen bereitgestellt.
- Desktop- und mobile Darstellung, semantische Beschriftungen sowie bewusste
  Lade-, Leer-, Erfolgs-, Bestätigungs- und Fehlerzustände ausgearbeitet.

### PromptVault Local MVP

- Lokales Anzeigen, Erstellen, Bearbeiten und dauerhaftes Löschen von Prompts
  einschließlich zugänglicher Inline-Bestätigung umgesetzt.
- Lokale Volltextsuche, Kategorie-Filter und kombinierte Filterung ergänzt;
  Such- und Filterzustände bleiben bewusst flüchtig.
- Persistente Favoriten ergänzt, ohne dadurch neue Inhaltsversionen zu
  erzeugen.
- Robuste lokale Speicherung unter `goldendawn.promptVault.v1` mit einem
  Schema-2-Envelope und kontrollierter Behandlung beschädigter, ungültiger oder
  nicht unterstützter Daten umgesetzt.
- Die fachlich unveränderliche Versionshistorie als append-only modelliert:
  Inhaltsänderungen ergänzen neue Snapshots und überschreiben keine frühere
  Fassung.
- Historische Fassungen können nach Bestätigung als neue `restored`-Version
  wiederhergestellt werden; bestehende Historie bleibt erhalten.
- UI, Controller, `PromptService`, `PromptStorage` und gemeinsamer
  `StorageAdapter` klar getrennt. Direkte `localStorage`-Zugriffe aus der
  Oberfläche wurden vermieden.

### Qualität und lokale Grenzen

- 162 automatisierte Tests für Suche, Storage-Adapter, Prompt-Speicherung,
  Service, Controller und View etabliert.
- PromptVault bleibt auf das aktuelle Browserprofil und den aktuellen Origin
  begrenzt. Die lokale Speicherung ist weder Synchronisierung noch
  geräteübergreifende Speicherung oder automatische Cloud-Sicherung.
- Import und Export, Webhooks, Airtable, Backend, Authentifizierung sowie echte
  SyncAgent-, DataAgent- oder TestAgent-Logik sind nicht Bestandteil dieses
  Meilensteins.
- Repository und öffentliche Beispiele verwenden ausschließlich synthetische
  Demo-Daten und enthalten keine privaten Kurs-, Reflexions- oder
  Gesundheitsdaten.

## v0.1.0 – 2026-07-11

### Foundation

- Vite mit Vanilla JavaScript, HTML und CSS als kleine, nachvollziehbare
  Frontend-Grundlage eingerichtet.
- Verbindliche Projekt- und Agentenregeln in `AGENTS.md` festgehalten.
- README, Architektur, Roadmap, Sicherheitsgrundlage sowie Daten- und
  Sync-Verträge als gemeinsame Projektreferenz aufgebaut.
- Fünf Architecture Decision Records zu Vite/Vanilla JavaScript, SyncAgent,
  DataAgent, privater und öffentlicher Datentrennung sowie dem
  Drei-Agenten-Scope dokumentiert.
- Zielarchitektur, Agentenrollen, Storage- und Sync-Grenzen, Sicherheitsregeln
  und schrittweise Entwicklungsreihenfolge definiert.
- UTF-8 ohne BOM, LF-Zeilenenden und abschließende Zeilenumbrüche als
  Repository-Standard festgelegt.
