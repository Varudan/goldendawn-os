# ADR 0038 – Isolierte CI-Testgruppierung der ADR-0036-Adaptersuite

## Status

Angenommen – 2026-09-28

Jan hat ADR 0038 am 2026-09-28 ausdrücklich angenommen:
„ADR 0038 wird hiermit angenommen.“ Er ergänzt ausschließlich
[ADR 0036](0036-browser-sync-transport-runtime-diagnostic-adapter-boundary.md)
hinsichtlich CI-Isolation und Serialitätsreichweite; er ersetzt keinen ADR.
Alle nicht ausdrücklich präzisierten Verträge bleiben bestehen. ADRs 0032–0037
werden nicht geändert.

Der von Jan übermittelte unabhängige Dokumentreview urteilt technisch `PASS`
ohne relevante Befunde. Er bindet die Vorannahmefassung dieses ADRs mit 21.644
Rohbytes und SHA-256
`5930d5bd9bd2de644cd18ec5464e9e79b32acbed27bda50c3add6fe70411cf35`
sowie die sechs weiteren im [Changelog](../../CHANGELOG.md#adr-0038-dokumentreview-und-annahme--2026-09-28)
gebundenen Dokumentfassungen. Vorgesehen war Daybreak Blue / extra high,
ein Reviewer ohne Subagenten; der Bericht attestiert die Modellkonfiguration
nicht technisch. Diese Provenienzunsicherheit bleibt vom technischen Urteil
getrennt. Der Review gilt nicht für die neuen vollständigen Bytes dieser
Statusnachführung; ein neuer unabhängiger Review wird nicht behauptet.

Der geprüfte Hauptteil ab einschließlich `## Kontext` bleibt rohbytegleich.
Seine Formulierungen zum Vorschlag, zur ausstehenden Annahme und zum noch
ausstehenden Dokumentreview beschreiben den historischen Vorannahmestand.
Maßgeblich ist dieser Statusvermerk: Review und Annahme sind abgeschlossen,
die beschriebene CI-Grenze ist entschieden. Technische Regeln, separate
Beauftragungen und sämtliche noch offenen Abnahmenachweise gelten fort.

Die CI-Gruppierung ist weder implementiert noch ausgeführt. Ihre Umsetzung
und Nachweise benötigen weiterhin einen gesonderten Auftrag. Dieser Slice
umfasst nur die Annahme- und Reviewnachführung mit statischer Verifikation;
Tests, Builds, Bundlechecks und CI-Läufe sind ausgeschlossen. Commit und Push
bleiben manuell bei Jan; ein PR ist derzeit nicht beauftragt. Die unveränderten
Runtime- und Evidenzgrenzen im Hauptteil bleiben geschlossen.

## Kontext

Der Dokumentationsslice beginnt auf `codex/docs/adr-0038-ci-isolation` mit
HEAD `1299011e63455658ac645fe7646fc55af8b07997`, sauberem Arbeitsbaum und ohne
staged Änderungen. Featurebranch und dessen lokaler Remote-Tracking-Ref zeigen
auf denselben Commit; `main` und lokales `origin/main` stehen auf
`91eef75adf179de8d32720562ea481bc891319b3`. Der Entscheidungsindex endete vor
diesem Slice bei ADR 0037. Diese Bindung wurde ausschließlich lokal gelesen,
nicht durch Fetch oder andere Synchronisierung erneuert.

Der Adapter ist implementiert und committet. Die
[historischen Abschlussnachweise](../../CHANGELOG.md#adr-0036-adapterfortsetzung--2026-09-27)
dokumentieren 1010/1010 Adaptertests, 757/757 Foundationtests, 1767/1767 gemeinsam,
3522/3522 Gesamttests, Build mit 46 Modulen und driftfreien Bundlecheck. Diese
Ergebnisse werden hier nicht wiederholt. Laut Auftrag und bereitgestelltem
Vertragsabgleich lautet der unabhängige Daybreak-Review technisch `PASS`.
Verlangt war ursprünglich `xhigh`; Jan verwendete tatsächlich Blue / Ultra und
akzeptierte diese Abweichung ausdrücklich. Technisches `PASS`, damaliges
formales `INCOMPLETE` und spätere Akzeptanz sind getrennte Aussagen. Allein die
akzeptierte Abweichung erfordert keinen Wiederholungsreview. Keiner dieser
Nachweise prüft die neuen Dokumentbytes oder einen gruppierten CI-Prüfweg.

Der vollständig gelesene Vertragsabgleich (`Eingefügter Text.txt`, 21.552
Rohbytes, SHA-256
`60983876a26366c0faf495f228d0a13fddf3d2abaf963e8d77b568541b47e188`)
untersuchte noch HEAD `02412d2a054f86fef12f14c451ad6a3b7f38bbfc` plus damalige
Arbeitsbaumänderungen. Er ist eine historische Quelle, kein Ausführungsauftrag
und kein Audit der jetzigen Dokumentbytes. Seine einschlägigen Aussagen wurden
mit den aktuellen Vertrags- und Harnessquellen statisch abgeglichen.

Neue parallele CI-Testgruppen sind bisher nicht eindeutig freigegeben. Ein
globales Verbot über sämtliche Prozesse und CI-Jobs ist ebenfalls nicht
belegt. ADR 0036 §1 verlangt serielle Imports und bindet Profile, Quellbytes,
eindeutige Modulidentitäten sowie bestätigten Cleanup. Die Reichweite zwischen
isolierten CI-Jobs bleibt offen. Die bereits bestehende Node-Matrix beantwortet
diese Frage für zusätzliche Gruppen innerhalb einer Node-Version nicht.

Importserialität und Serialität des vollständigen Kopielebenszyklus sind
verschiedene Anforderungen. Der vorhandene Helper `withAdapterCopy` in der
[einzigen Adaptertestdatei](../../tests/browserSyncTransportRuntimeDiagnosticAdapter.test.js)
wartet auf `g36HarnessCopyTail` und hält diese modulbezogene Kette über
Byteprüfung, Kopieerzeugung, Import, Callback, Nachprüfungen und Cleanup.
Sie ist kein globaler oder prozessübergreifender Lock. Vorbereitungen außerhalb
des Helpers werden davon nicht erfasst; ein zurückgegebener Namespace kann
nach Helperabschluss weiterverwendet werden. Dateientfernung entlädt keinen
ESM-Modulcache. Deshalb muss eine Gruppierungsentscheidung auch die Tests
außerhalb des Helpers und die Lebensdauer des Gruppenprozesses erfassen.

Der Harness enthält Registrierungsfamilien, dynamisch registrierte Fälle,
interne Schleifen und modulbezogene Fixture-/Kontroll-Caches, unter anderem
`sourceFixtureFilesSeedPromise` und `provenSourceFamilies`. Die bestehende
defensive Map-/Bytekopierung und die kausalen Gegenproben bleiben wesentlich.
Die Baseline enthält 1010 registrierte Fälle, aber nur 1000 unterschiedliche
Anzeigenamen: Zwei Arity-Namen kommen je dreimal vor, ein Finalizer-Name
siebenmal. Hinzu kommen interne Varianten ohne eigene Resultatzeile, etwa die
je 59 Kontroll-/Mutationsprüfungen der Replay-Mutanten. Anzeigenamen und gleiche
Summen allein beweisen daher weder Vollständigkeit noch unveränderte Testaussage.

Die 1010 Resultatzeilen und 1000 Namen wurden hier ausschließlich lesend im
bereits vorhandenen, im Vertragsabgleich benannten Adapter-Reviewlog bestätigt
(`02-adapter.stdout`, 95.246 Rohbytes, SHA-256
`4bdff4fabb8ea8e6fe9ca2b22752d29eeadd723b557881fa81fffa0afbe09a75`).
Dies ist keine neue Testdiscovery oder Testausführung.

Die vorhandene [CI](../../.github/workflows/ci.yml) verwendet `ubuntu-latest`,
Node `20.19.0` und `22.12.0`, `timeout-minutes: 10` für den gesamten Job sowie
den Testaufruf mit VM-Flags und `--test-concurrency=1`.
[package.json](../../package.json) definiert `test` als `node --test`; die
genannten Flags setzt der Aufrufer. Installation und Build liegen im selben
Jobbudget. Berichtete lokale Laufzeiten zeigen ein Zeitrisiko, beweisen aber
weder einen CI-`FAIL` noch einen Beschleunigungsfaktor.

### Statische Quellbindung

Diese Rohbindungen gehören zur Ausgangsbasis `1299011…`, ohne BOM-, EOL-,
Unicode- oder sonstige Normalisierung. Sie sind keine neue Testverifikation
und keine vorausgenommenen Hashes einer späteren Implementierung.

| Quelle | Bytes | SHA-256 |
| --- | --- | --- |
| `scripts/browser/browserSyncTransportRuntimeDiagnosticAdapter.js` | 257839 | `4d27ab936ab4cb2f20ac22f570ded19ebc2f68e7ee1d9014bb8d735979163e7d` |
| `tests/browserSyncTransportRuntimeDiagnosticAdapter.test.js` | 463641 | `cf8cd3802e2ae2904f6743a5c3ad7535b1dcd2d11029a1dbb59b19d8e704f6c7` |
| `scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js` | 219112 | `d4cadf656bb50e2b062c9d0d66e3f895bc87649362ce995abfbdbe24a9f4e731` |
| `tests/browserSyncTransportRuntimeDiagnosticObserver.test.js` | 325244 | `4cf2698fa2af48750a71a5effbc23e059ef51133e0646c3e0333bb93d633cb64` |
| `.github/workflows/ci.yml` | 865 | `89d968ed7c2551187dab9a7a8816eb794f3d6a04f154f58fbc4f6b819183fca1` |
| `package.json` | 607 | `819dc018b594d17e4b853b624eb4c63250e369d5962afdc8412d19a584fa2e96` |
| `package-lock.json` | 28051 | `11931d92d2643bec6d18c39911954ca0d001c2bfb95b4a434db4491f6571865d` |

## Entscheidungsvorschlag

Die folgenden Regeln beschreiben ausschließlich die zur Annahme vorgeschlagene
Grenze. Ihre Umsetzung benötigt nach Annahme einen separat beauftragten
Implementierungs- und Nachweisslice.

### 1. Ausschließlich isolierte CI-Gruppen der Adaptersuite

Nur die ADR-0036-Adaptersuite darf je erforderlicher CI-Node-Version in explizit
definierte Gruppen aufgeteilt werden. Jede Gruppe benötigt einen getrennten
CI-Job mit eigenem isoliertem Runner, eigenem Checkout und frischem
Node-Prozess samt eigenem Harnesszustand. Eine andere Jobbezeichnung allein
belegt diese Isolation nicht. Innerhalb einer Node-Version dürfen diese
isolierten Jobs parallel laufen; ein gemeinsamer Gruppenprozess oder gemeinsam
verwendeter Checkout erfüllt die Grenze nicht.

### 2. Vollständige Serialität innerhalb jeder Gruppe

Sämtliche Tests einer Gruppe bleiben seriell, einschließlich Vorbereitungen
und Nacharbeiten außerhalb von `withAdapterCopy`. Jeder vollständige
Testkopielebenszyklus bleibt seriell: Byteprüfung, Erzeugung, Import, Callback,
Nachprüfungen und bestätigter Cleanup. Der nächste Lebenszyklus beginnt erst
nach abgeschlossenen Nachprüfungen und bestätigtem Cleanup des vorherigen.
Ein erwarteter kausaler Mutantenfehlschlag bleibt davon getrennt; ein fehlender
Cleanupnachweis erlaubt keinen erfolgreichen Gruppenabschluss.

Zwischen den so isolierten CI-Jobs wird keine zusätzliche Import- oder
Kopielebenszyklusserialität verlangt. Diese Präzisierung verändert keine
ownerinternen FIFO-, Producer-, Microtask-, Join- oder Cleanupreihenfolgen aus
ADR 0036 §§4, 6 und 7. Vorgeschriebene virtuelle Ereignisfolgen und kontrollierte
Interleavings innerhalb eines Testfalls bleiben erhalten; sie sind keine
Erlaubnis zu gleichzeitig laufenden Tests oder Kopielebenszyklen.

### 3. Eine Testdatei und geschlossene Auswahl

`tests/browserSyncTransportRuntimeDiagnosticAdapter.test.js` bleibt die einzige
Adaptertestdatei. Zulässig wäre ausschließlich eine geschlossene testseitige
Gruppenauswahl. Der Standardaufruf ohne Gruppenauswahl registriert weiterhin
die vollständige Suite. Unbekannte, ungültige oder widersprüchliche Gruppen
dürfen keinen erfolgreichen Lauf erzeugen, auch keinen erfolgreichen Leerlauf.
Ein Auswahlfehler darf nicht durch Rückfall auf eine andere Gruppe verdeckt
werden. Die konkrete Auswahltechnik wird hier weder festgelegt noch
implementiert; daraus entsteht kein Produktions-, Debug- oder Capabilityseam.

### 4. Unveränderte Profile und kausale Familien

Beide disjunkten Vier-Export-Profile `derivation-conformance` und
`virtual-runtime-conformance` bleiben vollständig erhalten, einschließlich
ihrer exakten Transformationen, Byteprüfungen, Selector-Sperren und
`adapterEvidenceEligible:false`. Der byte-owned Foundationload pro Owner
bleibt unverändert; ein gemeinsames Foundationmodul ist kein Ersatz.

Alle Pflichtfälle und Mutanten aus ADR 0036 §15, dynamisch registrierten und
intern iterierten Varianten, Assertions sowie kausalen Kontroll-/Mutanten-
beziehungen bleiben erhalten. Zusammengehörige Kontroll-/Mutantenfamilien
bleiben ungeteilt in derselben Gruppe. Eine Kontrolle aus einem anderen Job
oder früheren Versuch darf keinen lokalen kausalen Nachweis ersetzen. Die
erfolgreich importierte unveränderte Gegenprobe und der gezielte Bruch des
betroffenen Oracles bleiben erforderlich; Syntax-, Import- oder Treiberfehler
zählen nicht als Mutantenkill.

### 5. Vollständigkeit über Fall- und Variantenidentitäten

Die spätere Zuordnung muss aus der gebundenen seriellen Baseline eindeutige
Fallidentitäten und die zugehörigen Variantenidentitäten ableiten. Dazu gehören
Registrierungsfamilie, konkreter Vektor beziehungsweise Schleifenvariante und
eine eindeutige Unterscheidung gleichnamiger Registrierungen. Ein bloßer Name,
eine flüchtige Ergebnisposition oder eine Summe genügt nicht. Eine konkrete
Kodierung dieser Identitäten wird hier nicht vorgegeben.

Für jede erforderliche Node-Version gilt: Jeder der 1010 Baselinefälle wird
genau einer Gruppe zugeordnet. Die Gruppenfallmengen sind paarweise disjunkt,
und ihre Vereinigung ist exakt die erwartete Baselinefallmenge. Für jeden Fall
bleiben zusätzlich seine vollständige interne Variantenmenge, Assertions und
Kontroll-/Mutantenbeziehungen gebunden. Eine gleiche Zahl von Resultatzeilen
kann weder fehlende Varianten noch doppelte oder ersetzte Fälle ausgleichen.
Zusätzliche spätere Prüfungen der Auswahl und Aggregation werden getrennt
ausgewiesen und dürfen keinen Baselinefall ersetzen.

### 6. Gemeinsame Quellen und eindeutige Ergebnisbindung

Alle Gruppen verwenden dieselben gebundenen Quellbytes, Fixtures und dieselbe
Gruppendefinition einschließlich vollständiger Sollzuordnung. Dazu gehören
Adapter, Foundation, Harness und dessen gelesene Quellen sowie Workflow-,
Paket-/Lockfile- und Prüfkonfiguration. Abweichende Node-Versionen sind nur
entlang der ausdrücklich erwarteten Versionsmatrix zulässig.

Jedes Ergebnis und zugehörige Testartefakt muss eindeutig an CI-Lauf, Versuch,
Node-Version, Gruppe, Quellen und Gruppendefinition gebunden sein. Die
erwarteten Gruppen und Fallmengen stehen vor Auswertung fest und dürfen nicht
erst aus den eingetroffenen Erfolgsartefakten abgeleitet werden. Verschiedene
Wiederholungen, Quellstände oder Konfigurationen dürfen nicht vermischt werden;
auch ein Teil-Rerun ergänzt keinen anderen Versuch zu einem scheinbaren PASS.
Das konkrete Artefaktformat und der Aggregationsmechanismus bleiben offen.

### 7. Gesamterfolg nur bei vollständigem Abschluss

Ein Adapter-Gesamterfolg je Node-Version verlangt die exakte erwartete Fall-
und Variantenmenge, erfolgreiche native Prozessabschlüsse, vollständige
Abschlussresultate und die erforderlichen Cleanupnachweise aller erwarteten
Gruppen. Jeder erwartete Fall muss genau einmal erfolgreich abgeschlossen sein.
Exitcode null allein, einzelne grüne Zeilen oder ein Gruppen-PASS genügen nicht.

Fehlende, doppelte, unbekannte, falsch beziehungsweise fremd gebundene,
fehlgeschlagene, abgebrochene, übersprungene oder unvollständige Gruppen
schließen Gesamterfolg aus. Dasselbe gilt für fehlende, doppelte oder fremde
Fälle, Cancellations, Skips und Todos sowie fehlende Abschluss- oder
Cleanupnachweise. Ein Timeout oder Abbruch darf nicht durch bereits vorhandene
Teilresultate als Erfolg erscheinen. Ergebnisse beider Node-Versionen werden
getrennt vollständig geprüft; Erfolg einer Version ersetzt die andere nicht.

Gruppen-PASS und selbst vollständiger Adapter-PASS sind kein vollständiger
CI-PASS. Foundation, Bestandsregressionen, Build und die übrigen bestehenden
Prüfpflichten bleiben erforderlich. Ihre Nachweise werden durch die
Gruppenaggregation weder ersetzt noch abgeschwächt.

### 8. Ressourcen, Caches und Cleanup

Temporäre Kopien besitzen exklusiv erzeugte, aufgelöste Roots außerhalb des
jeweiligen Checkouts und eindeutige Modulidentitäten. Bestehende Pfad-,
Byte- und Ownershipprüfungen, `finally`-Cleanup sowie Datei- und
Root-Nichtexistenznachweise bleiben erhalten. Cleanup darf ausschließlich
eigene nachgewiesene Ressourcen betreffen, niemals bloß namensgleiche Pfade
oder Roots anderer Gruppen. Ein Prozessabbruch beweist keine Entfernung.

Modulcache, Capabilityslots, Factories, Owner, mutable Fixtures und
Kontrollzustände werden nicht zwischen Gruppen geteilt. Modulbezogene Seed-
und Kontroll-Caches entstehen in jedem frischen Gruppenprozess neu; defensive
Map-/Bytekopien und individuelle Queues und Zähler bleiben erhalten. Ein
innerhalb einer Gruppe erlaubter abgeschlossener Kontrollcache ist keine
gruppenübergreifende Import- oder Nachweisabkürzung. Testartefakte sind keine
Runtime-Evidenzrecords.

### 9. Unveränderte übrige Prüforganisation

Foundation und Bestandsregressionen behalten ihre bisherige serielle
Organisation. Insbesondere bleiben die ADR-0035-Testkopie mit insgesamt fünf
Exports und die serielle Foundation-Suite nach ADR 0037 §7 getrennt von den
Adapterprofilen. Zusätzliche lokale Mehrprozessparallelität, mehrere
Gruppenprozesse in einem gemeinsamen Runner und weitere Adaptertestdateien sind
nicht umfasst. Der lokale Commit-Prüfweg bleibt ausdrücklich eine andere
Entscheidung; Commithelfer und dessen Dokumentation werden hier nicht geändert.

### 10. Keine vorweggenommene Dimensionierung

Gruppenzahl und Zuschnitt bleiben späterer Implementierungs- und Nachweisarbeit
vorbehalten. Node `20.19.0` und `22.12.0` sowie das Zehn-Minuten-Joblimit bilden
den bestehenden Ausgangspunkt. Dieser ADR schlägt keine Timeoutänderung,
wiederkehrende Referenzprüfung, geplante oder periodische Automation und
keinen konkreten Beschleunigungsfaktor vor. Eine geeignete Zahl von Gruppen
folgt erst aus vollständiger Abdeckung und tatsächlichen CI-Messungen.

## Spätere Abnahmebedingungen

Die folgenden Nachweise sind erst nach Annahme und gesondertem Auftrag zu
erbringen; sie werden in diesem Dokumentationsslice nicht ausgeführt:

| Nachweis | Erforderlicher Inhalt |
| --- | --- |
| Fall- und Variantenmengen | Vollständiger Identitätsvergleich mit der gebundenen seriellen Baseline: genau eine Zuordnung je Baselinefall und Node-Version, keine Lücken, Dubletten oder Ersatzfälle; unveränderte interne Varianten, Assertions und kausale Familien. |
| Profile und Mutationserkennung | Beide Vier-Export-Profile mit unveränderten Byte-/Selectorgrenzen; erfolgreiche Kontrollen und dieselben kausalen Mutantenkills am jeweiligen Oracle, getrennt von Import-/Treiberfehlern. |
| Quellen, Isolation und Reihenfolge | Identische Quell- und Gruppendefinitionen, isolierte Runner und Checkouts, frische Prozesse und Harnesszustände; serielle Tests und vollständige Kopielebenszyklen, unveränderte Ownerreihenfolgen und bestätigter Cleanup. |
| Negative Aggregation | Fehlende, doppelte, unbekannte/falsche, fremd gebundene, fehlgeschlagene, abgebrochene, übersprungene und unvollständige Gruppen; falsche Node-Version, Quelle, Konfiguration oder Versuch; Falllücken/-dubletten, Skips/Todos, fehlender Footer, fehlender nativer Erfolg und fehlender Cleanupnachweis müssen Gesamterfolg verhindern. Auch die Mischung von Teil-Reruns muss scheitern. |
| Einmaliger serieller Vergleich | Ein vollständiger serieller Vergleichslauf zur Erstabnahme des veränderten Prüfwegs mit gebundenen Quellen, Kontext, nativen Abschlussresultaten und Fall-/Variantenzuordnung; getrennt mit den Gruppenergebnissen vergleichen. |
| Tatsächliche CI-Ergebnisse | Vollständige Resultate sämtlicher erwarteter Gruppen auf beiden tatsächlichen CI-Node-Versionen `20.19.0` und `22.12.0`, erfolgreiche Aggregation je Version sowie alle übrigen bestehenden Prüfungen. Ein lokaler Lauf ersetzt diese Ergebnisse nicht. |
| Laufzeit und Speicher | Gruppen- und Gesamtlaufzeiten, langsamste Gruppe, Einrichtungs- und Aggregationsaufwand; Speichermessungen mit Messmethode, Einheit, Prozess-/Jobumfang, Spitzenwertbezug und Grenzen. Prozessheap, RSS und Runnergesamtverbrauch dürfen nicht gleichgesetzt werden; nicht verfügbare Messwerte werden als solche ausgewiesen. |

Der einmalige Abnahmevergleich begründet keine neue Volltestpflicht bei jedem
Commit und keine geplante oder periodische Automation. Lokale historische
Laufzeiten, Gruppensummen, kausale Mutationserkennung und tatsächliche
CI-Performance sind getrennte Nachweise. Eine Beschleunigung oder das Einhalten
des bestehenden Joblimits ist vor diesen Messungen nicht zugesagt.

## Konsequenzen und Alternativen

Die vorgeschlagene Grenze erlaubt eine spätere Verteilung der Adapterarbeit
auf isolierte CI-Jobs, ohne die beweisrelevanten Abläufe eines Tests zu ändern.
Sie erfordert zusätzliche vollständige Ergebnisbindung und Aggregation.
Mehrfacher Setupaufwand, erneuter Cacheaufbau und ungleich schwere Familien
können den Nutzen begrenzen; deshalb wird kein Zuschnitt vorab festgelegt.

Eine bloße Umdeutung der Importklausel würde die offene Reichweite nicht
verlässlich entscheiden. Ein globaler Lock über alle Jobs wäre eine zusätzliche
Vorgabe, die weder aus den bisherigen Verträgen folgt noch hier vorgeschlagen
wird. Gleichzeitige Tests im Gruppenprozess, zusätzliche Adaptertestdateien
oder Gruppenprozesse in einem gemeinsamen Runner würden andere Grenzen öffnen und
sind nicht Teil dieser Entscheidung. Eine reine Summen-/Namensaggregation
wäre wegen der Mehrfachnamen und internen Varianten unzureichend.

## Unveränderte Evidenz- und Aktivierungsgrenzen

`overallGate: FAIL` und `causeStatus: CAUSE_NOT_PROVEN` bleiben unverändert.
Foundation und Testkopien bleiben `NOT_EVIDENCE`, Testfinalisierung liefert
`runtimeRecord:null`; ein authentischer Runtime-`A_obs`-Nachweis fehlt.
Diagnoselauf, Browserkomposition, Browser-E2E, Writer und Persistenz erhalten
keine Freigabe. Windows-Prozessbaumownership, handlegebundene Pfadbereinigung
und unabhängige Adapterausgabestille bleiben spätere Laufblocker. Isolierte
CI-Runner und erfolgreicher Testkopien-Cleanup belegen diese Runtimefähigkeiten
nicht. Die angenommenen Runtime- und Foundationverträge bleiben bestehen.

## Offene Punkte und nächste Schritte

Offen sind Jans Annahmeentscheidung sowie die spätere konkrete Gruppenzahl,
der Familienzuschnitt, eindeutige Identitätskodierung, geschlossene
Auswahltechnik, Ergebnisbindung/Aggregation und Messmethodik. Die vollständigen
Abnahmenachweise stehen aus. Dieser Slice umfasst nur Dokumentation und
statische Verifikation; Code, Tests, Workflow und Paketdateien bleiben
unverändert. Keine Tests, Harnessdiscovery, Modulproben, Builds, Bundlechecks,
Benchmarks, Runtimevorgänge oder Git-Schreibaktionen werden ausgeführt.

Der nächste mögliche Schritt ist ein separat beauftragter Review der neuen
Dokumentbytes. Danach entscheidet Jan über Annahme und manuelle Git-Schritte;
eine Implementierung benötigt anschließend einen eigenen Auftrag.

## Vertragsreferenzen

- [ADR 0032 §7](0032-browser-sync-transport-diagnostic-determinism-boundary.md#7-geschlossene-foundation-und-foundation-hashdomäne): rohe Foundation-Hashdomäne.
- [ADR 0033 §14](0033-browser-sync-transport-diagnostic-foundation-effects-protocol-boundary.md#14-verbindliche-spätere-testmatrix): fortgeltende Foundation-Testmatrix.
- [ADR 0034 §8](0034-browser-sync-transport-diagnostic-foundation-grammar-derivation-and-testability-boundary.md#8-candidate-pass-vollständige-private-ableitung-und-testbarkeit): historischer Testkopienvertrag.
- [ADR 0035](0035-browser-sync-transport-diagnostic-foundation-join-and-internal-transition-testability-boundary.md): Testkopie v2, Pending-/Microtask- und kausale Joinnachweise.
- [ADR 0036](0036-browser-sync-transport-runtime-diagnostic-adapter-boundary.md): einziger Testpfad, Profile (§1), byte-owned Load (§2), Ownerreihenfolgen (§§4, 6–7), Pflicht-/Mutationsmatrix (§15).
- [ADR 0037 §7](0037-browser-sync-transport-diagnostic-foundation-observation-close-notification.md#7-ausführbarer-späterer-testzugang-ohne-neuen-export): unveränderte serielle Foundation-Testgrenze.
- [Datenverträge](../data-contracts.md), [Architektur](../architecture.md) und [Sicherheitsgrundlage](../security.md): fortgeltende Living Contracts.
