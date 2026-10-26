# ADR 0040 – Separater nativer Windows-Helfer für Diagnoseressourcen

## Status

Vorgeschlagen – Arbeitsfassung vom 2026-10-07.

Jan hat am 2026-10-07 ausschließlich die dokumentarische Ausarbeitung eines
eigenen Diagnosehosts als bedingte Architekturvariante bestätigt. Der Host
ist weder angenommen noch gebaut. Seine gemeinsame CRT-Ownership und der
vollständige Abschluss seiner Schreibproduzenten sind offene Voraussetzungen.

Jan hat den separaten Helfer als bevorzugte Richtung bestätigt und die
begrenzte Ordnerhoheit zur Ausarbeitung im Vorschlag gewählt. Der von Jan
übermittelte unabhängige Dokumentreview ist mit technischem `FAIL` bei
`COMPLETE` abgeschlossen: P1 zur Absicherung bei Ownerverlust und P2 zur
Cap-/Callbacklebensdauer der Ausgabeversiegelung. Er gilt ausschließlich für
die folgenden Vorfassungen:

| Datei | Bytes | SHA-256 |
| --- | --- | --- |
| dieser ADR | 9157 | `16f169ebd212ecae131a659c57cf3a59f1b254b9d50aaefc4ea295cb1888dc4a` |
| Entscheidungsindex | 42421 | `23cec6911ce8780925ca7a96c9cd54836d908aa1d0c3acdc7c5a53324bfe610d` |

Der ebenfalls von Jan übermittelte erste Re-Review endete mit technischem
`FAIL` bei `COMPLETE`. P1 ist für die gebundene Korrekturfassung auf
Dokumentebene geschlossen. P2 blieb offen: Für private Zwischenfakten fehlte
ein vertragskonformer Weg zum Foundation-Dequeue und gemeinsamen Clocksample.
Dieser Re-Review gilt ausschließlich für:

| Datei | Bytes | SHA-256 |
| --- | --- | --- |
| dieser ADR | 17344 | `07f107b6807df565f314152d6cf3ade304c86e14514bcfd63c146910e6d6204d` |
| Entscheidungsindex | 42799 | `f78d7f370be8093d781049be838eebf15890e91d3206319f9589b4e308bd0a65` |

Die damalige P2-Korrektur mit nativem Sammelvorgang, genau einer terminalen
Dequeue-Meldung und adapterprivater Ergebnisbindung schloss laut dem von Jan
übermittelten zweiten unabhängigen Re-Review mit technischem `PASS` bei
`COMPLETE`. P1 und P2 sind für diese dokumentarische Probegrundlage geschlossen.
Dieser Review gilt ausschließlich für:

| Datei | Bytes | SHA-256 |
| --- | --- | --- |
| dieser ADR vor dem Diagnosehostvorschlag | 24504 | `30914fb04079865897092cda6ef2b4344bdcb58d0e0c7f992759fa2b248cb283` |
| Entscheidungsindex vor dem Diagnosehostvorschlag | 43095 | `8b27959cd3cd47f1a467c320ab467cfbd34b6bd8f99ecb6551644a84e931e7c6` |

Das PASS bestätigt weder native Machbarkeit noch formale Annahme oder
Implementierungsreife. Es gilt nicht für die vollständigen Bytes dieser
neuen Arbeitsfassung. Die gesonderte synthetische Pipeprobe endete insgesamt
mit `FAIL`; ihr begrenzter direkter Pipe-Nachweis und der anschließende
lesende Entwurf tragen die unten beschriebene bedingte Hostvariante. Ein
unabhängiger Dokumentreview dieser Ergänzung und sämtliche neuen
Ausführungsaufträge stehen aus.

## Kontext und Entscheidungsumfang

Der [ADR-0036-Adapter](0036-browser-sync-transport-runtime-diagnostic-adapter-boundary.md)
kann bislang weder vollständige Windows-Prozessbaumbeendigung noch
objektgebundene Profilbereinigung oder unabhängige Ausgabestille positiv belegen.

Dieser Vorschlag ergänzt gezielt die Prozess-, Ressourcen-, Ausgabe- und
Abschlussgrenzen von ADR 0036. Die angenommenen historischen Dokumente werden
nicht umgeschrieben. Die [Foundation nach ADR 0035](0035-browser-sync-transport-diagnostic-foundation-join-and-internal-transition-testability-boundary.md)
und ihr synchroner `observationClosed()`-Übergang nach
[ADR 0037](0037-browser-sync-transport-diagnostic-foundation-observation-close-notification.md)
bleiben erhalten.

## Zuständigkeiten bei Annahme

| Bestandteil | Zuständigkeit |
| --- | --- |
| Gebundener Node-Starter | Startet den Helfer und beobachtet dessen stdout/stderr unabhängig. |
| Nativer Windows-Helfer | Besitzt Jobs und temporäre Ressourcen; startet den Adapter und die drei festen Childrollen; beobachtet Adapterausgabe und drainiert Childstreams. |
| Node-Adapter | Behält Foundationload, Effects-Port, einzige FIFO, Controllerclock, Caps, CDP-Verarbeitung, synchrones `A_obs` und kanonische Recordableitung. |

Vorgesehene Umsetzungssprache des Helfers ist C++17 mit dem Windows SDK, ohne
zusätzliche Bibliotheken.

Der Starter bildet die ausdrücklich gebundene Messwurzel. Seine Quellen-,
Prozess- und Kanalbindung gehört zur späteren Abnahme. Seine Beobachtung ist
kein Beweis für globale Ausgabestille des Systems.

## Bedingte Variante für einen eigenen Diagnosehost

### Ausgangsbefunde und Geltungsbereich

Die gesondert beauftragte synthetische Probe bestätigt direkte Windows-/Node-
Pipes in einem vollständig abgeschlossenen Lauf mit festen NUL-Frames und
kausal erzwungener Fragmentierung. Beide Versiegelungsversuche bei
weiterlaufendem Adapter erreichten die erforderliche native EOF-Barriere
nicht. Helferversiegelung und unabhängige Starterbestätigung wurden deshalb
nicht erreicht. Ein allgemeines Verbot oder eine Unmöglichkeit anderer
Schließwege ist daraus nicht abgeleitet.

Die Originalbelege verbleiben außerhalb des Repositorys im Probeordner
`C:\Users\jslom\AppData\Local\Temp\GoldenDawn-ADR0040-pipe-probe-20261006T215023332Z-798b31b88edd45f182557aad3faa806f`.
Sein `sha256-manifest.json` bindet 75 Dateien und besitzt den SHA-256
`6799ba85a03b966d8d702adc72c442af64ab63865a8dfe1e9b68fc72d174b6d3`.
`probe-report.json`, `profile.json` und `case-completions.json` trennen
Ergebnisse, Profil und native Abschlüsse. Die Fixturezeitgrenze ist kein
Produktionscap; abgebrochene gesunde Läufe erhalten keinen PASS. Die
vollständige Liste damaliger Schreibhandlehalter, einschließlich möglicher
Consolebindungen, ist nicht nachgewiesen.

Der gebundene Lauf verwendete Windows x64, Build `26300.9457`, Edition Core,
Registry-DisplayVersion `26H2`, NTFS, tatsächlich ausgeführtes Node
`v24.19.0 / win32 / x64`, MSVC `19.44.35229` und SDK `10.0.26100.0`.
Die damalige `node.exe` besitzt den Roh-SHA-256
`3602f2bb1a10f2cbab4c36886218a33c1ab3db87290e73b033c46c77147d0237`.
Diese Werte beschreiben die alte Probe; sie binden keinen künftigen Host.

Der anschließende, von Jan übermittelte lesende Entwurf erklärt die beiden
Methoden anhand der versionierten Quellen: `uv_pipe_open` dupliziert unter
Windows Standarddeskriptoren; der Socketabschluss schließt nur diesen
Owner. `fs__close` ruft `_close` ausschließlich bei `fd > 2` auf und meldet
für 0–2 nach der Deskriptorprüfung Erfolg ohne diesen Close. Die eigenen
Fixturestreams sind vom zusätzlichen `dummyDestroy` der globalen
Stdiostreams zu unterscheiden. Dies sind statische Quellenbefunde, kein
nachträglicher nativer Kausalnachweis oder vollständiges Handleinventar.
[Node 24.19.0: Windows-Pipes](https://raw.githubusercontent.com/nodejs/node/v24.19.0/deps/uv/src/win/pipe.c),
[Windows-FS](https://raw.githubusercontent.com/nodejs/node/v24.19.0/deps/uv/src/win/fs.c),
[FS-Streams](https://raw.githubusercontent.com/nodejs/node/v24.19.0/lib/internal/fs/streams.js).

Die bedingte Variante beschränkt sich auf den Diagnoseadapter: ein eigener,
fest gebundener Node-Host mit einkompilierter Schließbrücke. Er würde den
Adapterprozess innerhalb dessen bestehendem Schutzjob ersetzen und keine
weitere fachliche Prozessrolle erhalten. Starter und nativer Helfer behalten
ihre unabhängigen Beobachtungsrollen. Ein Austausch der allgemeinen
Node-Installation oder der Frontend-, Gateway- und CI-Runtimes ist nicht
Bestandteil der Variante.

Der Host müsste Foundation und Adapter aus ihren unverändert gebundenen
Quellen laden und alle bestehenden Port-, Clock-, FIFO- und Recordverträge
einhalten. Neue Binär-, Bootstrap- und Umgebungsbindungen verlangen eigene
Abnahmen; alte Reviews oder Laufresultate werden nicht übertragen. Die
öffentliche C++-Embedder-API ist ein möglicher Integrationsrahmen, liefert
aber keinen Stdio-Versiegelungsvertrag.
[Node 24.19.0: C++-Embedder-API](https://raw.githubusercontent.com/nodejs/node/v24.19.0/doc/api/embedding.md).

### Gemeinsame CRT und ausschließliche Abschlussverantwortung

Die Brücke muss dieselbe konkrete C-Runtime-Instanz wie die tatsächlichen
Ausgabeowner verwenden. Gleiche Deskriptornummern, Compilerstände oder
CRT-Quellen beweisen keine gemeinsame Zustandshaltung. Verschiedene
CRT-Kopien besitzen getrennten Zustand; ein gewöhnliches nachgeladenes
Addon mit `_close(1)` und `_close(2)` genügt daher nicht als Lösung.
[Microsoft: CRT-Grenzen zwischen DLLs](https://learn.microsoft.com/en-us/cpp/c-runtime-library/potential-errors-passing-crt-objects-across-dll-boundaries?view=msvc-170).

Die Node-24.19.0-Releasekonfiguration sieht für den nicht geteilten Build
`/MT` vor. Der Entwurfsbericht nennt zusätzlich keinen direkten UCRT-DLL-
Import der alten EXE; diese Teilbefunde sind keine vollständige Provenienz
ihres tatsächlichen Builds. Für den neuen Host muss die gemeinsame CRT aus
der konkreten Bauzusammensetzung und ihrem nativen Nachweis hervorgehen.
[Node 24.19.0: Baukonfiguration](https://raw.githubusercontent.com/nodejs/node/v24.19.0/common.gypi).

Vor Verwendung werden pro Ausgabe die tatsächliche Pipeidentität, ihr
`FILE*`-Owner, CRT-Deskriptor, Windows-Standardhandlewert, sämtliche
Duplikate und Borrower sowie die Laufgeneration gebunden. Eine einmalig
konsumierbare private Owner-Capability bezeichnet diese Registrierung;
frei übergebene fd-/Handlezahlen dürfen keinen Close freigeben.

| Ressource | Owner und zulässiger Abschluss |
| --- | --- |
| Beide Adapter-Leseenden | Ausschließlich der Helfer drainiert und beobachtet sie; eigenes Schließen oder Abbrechen ist kein EOF-Beweis. |
| Temporäre Parentwriter und CRT-Mappings | Der jeweilige erzeugende Owner schließt sie nach der nachgewiesenen Übergabe; weitere Kopien bleiben inventarisiert. |
| Adapter-`stdout` und `stderr` als `FILE*` | Ausschließlich ihre besitzende Host-CRT führt je einen `fclose` aus; kein zusätzlicher `_close` oder `CloseHandle`. |
| Windows-Standardslots | Sie halten zugeordnete Handlewerte, aber keine zusätzliche Ownership. Änderung nur unter nachgewiesener exklusiver Zuständigkeit; `SetStdHandle` ersetzt keinen Close. |
| FS-Streams und native Borrower | Sie erhalten keine Abschlussownership und müssen vor dem Owner-Close alle Zugriffe und aktiven Operationen abgeben. |
| Weitere libuv-, CRT-, Console- oder vererbte Writer | Jeder benötigt einen belegten Owner und Abschluss. Unbekannte Halter sperren den positiven Pfad. |
| Private Kontrollwege | Eigene gebundene Owner ohne Alias auf die Standardausgaben; sie bleiben während Versiegelung und Bestätigung aktiv. |

`_open_osfhandle` überträgt Ownership an den CRT-Deskriptor. Bei einem
`FILE*`-Owner schließt `fclose` den Stream und den zugrunde liegenden
Deskriptor und behandelt dessen Puffer. Ein geliehener OS-Handlewert
berechtigt deshalb nicht zu einem zusätzlichen Close.
[Microsoft: _open_osfhandle](https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/open-osfhandle?view=msvc-170),
[fclose](https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/fclose-fcloseall?view=msvc-170).

### Producerabschluss und sichere Versiegelung

Für die kleinste synthetische Probe umfasst das geschlossene Producerprofil
genau zwei private FS-WriteStreams mit `autoClose:false`. Die Host-CRT bleibt
ihr Owner. Eine kontrollierte Hülle besitzt ihre Referenzen, sperrt neue
Schreibannahmen und registriert jede aktive Operation vor dem Write.
Native Producer benötigen dieselbe Annahmegrenze und eigene aktive Leases.
Die Zustandsfolge lautet `OPEN → QUIESCING → CLOSING → SEALED` oder
terminaler Fehler. Ein verlorener Teilnachweis wird nicht durch Wiederholung
oder einen zweiten Schließversuch geheilt.

Für den realen Host ist vor einem produktiven Schließpfad die vollständige
Producermenge über Bootstrap, Betrieb und verbleibenden Abschluss zu
belegen. Dazu gehören globale Stdiostreams, weitere CRT-/libuv-Kopien,
Warnungs-, Fehler-, Fatal- und sonstige native Node-/V8-Ausgabepfade. Für
jeden Weg muss konstruktiv feststehen, wie Annahmeverschluss, aktive
Zugriffe und terminales Verhalten gebunden sind. `--no-warnings`, fehlende
`console`-Aufrufe oder leere JS-Queues ersetzen diesen Nachweis nicht.
Eine gemeinsam verwendete CRT allein liefert ihn ebenfalls nicht.

Der konkrete Bootstrap zum Ausschluss zusätzlicher Stdio-Wrapper und die
Einbindung sämtlicher nativer Producer bleiben offene Entwurfsbedingungen.
Eine private Node-Handlemanipulation, ein Monkeypatch oder die Annahme,
native Ausgabe sei bloß unwahrscheinlich, erfüllt sie nicht. Kann die
Producermenge nicht vollständig geschlossen werden, bleibt der reale
Schließpfad dieser Variante gesperrt.

Nach den vorausgehenden Cleanupsteps wäre folgende Folge erforderlich:

1. `QUIESCING` sperrt neue Schreibannahmen. Bereits aktive Producer geben alle Leases zurück; beide Borrower erhalten genau einmal `end()`. Sämtliche Writecallbacks ohne Fehler und beide `finish`-Ereignisse sind lokale Voraussetzungen, noch keine Empfangs- oder EOF-Belege.
2. Streams, native Borrower und alte Callbackgenerationen verlieren endgültig alle Zugriffsrechte auf fd 1/2. Wiederakquisition, Opens, Spawns und zusätzliche Duplikationen dürfen die gebundenen Ausgaben im verbleibenden Abschluss nicht neu erreichbar machen. Schutz gegen Wiederverwendung beruht auf fehlenden alten Zugriffsmöglichkeiten, nicht auf erneut verglichenen Integerwerten.
3. Erst dann konsumiert die native Brücke die beiden Owner-Capabilities und führt im besitzenden CRT-Bereich je einen `fclose` aus. Fehler bleiben terminal negativ beziehungsweise unbewiesen; keine Wiederholung über möglicherweise wiederverwendete Werte. Lokaler Closeerfolg bestätigt noch keinen vollständigen Drain.
4. Der Helfer verarbeitet sämtliche empfangenen Bytes und wartet an beiden gehaltenen Leseenden auf das profilgebundene native EOF-Orakel. Adapterprozess und private Kontrollwege müssen dabei weiterhin gebunden und arbeitsfähig sein.
5. Die Helferversiegelung und die authentische Starterbestätigung verbleiben im bestehenden nativen Sammelvorgang. Dieser liefert ausschließlich seinen einmaligen terminalen Rückgabepfad an den Adapter.

Für die vorgeschlagenen anonymen Pipes ist `ReadFile == FALSE` mit
`ERROR_BROKEN_PIPE` nach vollständiger Verarbeitung der empfangenen Bytes
das terminale Orakel. `ReadFile == TRUE` mit null Bytes kann einen
Nullbyte-Write abbilden und wird nicht als EOF akzeptiert. Ein abgebrochener
Read, das Schließen des eigenen Leseendes oder Prozessende ersetzt keine
erfolgreiche Versiegelung bei weiterlaufendem Adapter. Die neue Probe muss
den zu großzügigen Nullbyte-Zweig des alten Fixture-Readers vermeiden;
die Originalbelege bleiben unverändert.
[Microsoft: ReadFile](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-readfile).

`fclose` kann beim Flush warten. Native Schließarbeit und blockierende
Pipe-Reads benötigen getrennte Arbeitskontexte mit gebundener Lebensdauer;
Dispatcher und Helferkontrolle dürfen weder auf deren Join noch auf einen
Flush oder einen gemeinsam benötigten Lock warten. Diese Trennung
garantiert keinen rechtzeitigen Abschluss nativer Arbeit. Bei Capgewinn
endet die positive Ableitung, ohne noch verwendete Zustände vorzeitig
freizugeben oder fremde Handles blind zu schließen. Der gebundene
Ressourcenabbruch bleibt getrennt; Prozessbeendigung begrenzt Fehler und
ist kein gesunder EOF-Nachweis.

Die Integration muss die notwendige Lebensdauer nativer Arbeitszustände von
Foundation-Envelopes, Ergebnisbytes, Browser-Rawgraphen und flüchtigen IDs
trennen. Cap oder terminaler Port invalidieren Callbackgenerationen und
positive Ergebnisübernahme; ein späteres Workerende eröffnet keinen neuen
Dequeue, Clockread oder Abschluss. Ein Cleanup-PASS darf nicht auf bloß
behauptetem Verwerfen noch erreichbarer Raw-/ID-Referenzen beruhen. Kann
diese Trennung nicht gebunden nachgewiesen werden, bleibt die Integration
gesperrt. Die native Arbeitskontextverwaltung ist noch nicht implementiert
oder abgenommen.

### Bauvertrag und Pflegeaufwand

Vor jeder Hostprobe sind die konkrete Integrationsform und der Bauvertrag
festzulegen: unveränderliche Node-/V8-/libuv- und weitere benötigte Quellen,
Host- und Brückenquellen, alle Konfigurations- und Linkflags, CRT-Modell,
Compiler-/SDK- und Architekturprofil, relevante Generatoren und Werkzeuge
sowie tatsächliche ausführbare Dateien und geladene Runtimekomponenten.
Ein Binärhash ersetzt weder gemeinsame CRT-Ownership noch vollständige
Bauprovenienz oder Dependencyintegrität.

Die C++17-Vorgabe dieses ADR gilt weiterhin dem separaten Windows-Helfer.
Die versionierte Node-24.19.0-Baukonfiguration verwendet C++20; der Host
benötigt einen gesondert geprüften Bauvertrag. Dieser Vorschlag genehmigt
keine neuen Downloads, Installationen, Node-Bauten oder Änderungen an
bestehenden SDKs und Runtimes.

Quellbereitstellung, vollständiger Bau, Peak-RAM/CPU, Speicherbedarf,
Artefaktgröße und spätere Updatekosten sind noch nicht gemessen. Vor einem
Bauauftrag muss Jan dessen Quellen, Prüfumfang und Ressourcenbudget
entscheiden; ein Beschleunigungs- oder Ressourcenvorteil wird nicht
behauptet. Der Host bleibt ein zusätzlicher zu pflegender Diagnosebestand.
Node-, CRT-, SDK-, Compiler- und Konfigurationswechsel verlangen eine neue
Bindungs- und Auswirkungenprüfung samt passenden erneuten Abnahmen. Der
konkrete Pflege- und Sicherheitsupdateprozess ist vor produktiver Nutzung
festzulegen. Ein eigener Runtimebestand trägt frühere Windows-/Ubuntu-
Ergebnisse nicht automatisch weiter.

### Gesonderte Probe und Abbruchkriterien

Nach unabhängiger Prüfung der neuen Dokumentbytes könnte Jan eine eigene,
eng begrenzte synthetische Probe beauftragen. Zuvor müssen gemeinsame CRT,
konkrete Start-/Vererbungsbindung und das geschlossene synthetische
Producerprofil feststehen. Der Testowner muss den Host und seine tatsächlich
entstehenden Nachkommen vor Ausführung in eine getrennte, gebundene
Kill-on-close-Grenze einschließen. Die Fixture enthält keine reale
Chrome-, Vite- oder Gatewayintegration und erzeugt kein authentisches
`A_obs` oder Runtime-Record.

| Betriebsart | Eingriff und unabhängiges Orakel |
| --- | --- |
| Gesunder nativer Abschluss | Zwei feste Bytefolgen über die Borrower, dann echter Owner-Close. Beide Folgen vollständig und exakt drainiert, beide EOFs mit Fehler 109, gebundenes Adapterprozesshandle weiterhin unsignalisiert; anschließend neuer privater Challenge/Response-Roundtrip. Ein Timeout ist ein Fehlschlag. |
| Zurückgehaltener Writer | Der Beobachter hält absichtlich ein zusätzliches, nicht vererbtes stderr-Schreibduplikat. Vor dessen Freigabe kein positiver Gesamtabschluss; eine feste Zusatzfolge muss noch empfangen werden. Erst dessen eigener Close darf den vollständigen stderr-Drain und EOF ermöglichen. |
| Bisheriger Close als kausale Kontrolle | Im gleichen neuen Profil bleiben Bytes, Producerfolge und Beobachter gleich. Nur der echte Owner-Close wird durch `fs.close(1/2)` ersetzt. Lokaler Closeerfolg darf keinen positiven EOF-Abschluss ergeben. |

Die kausale Kontrolle bindet ein neues Profil; sie beweist nicht rückwirkend
die vollständige Ursache alter Läufe. Read-/Producerfehler, unerwartete
Nullbyte-Reads, zusätzliche Writer und negative Teilnachweise müssen
einen positiven Abschluss zuverlässig verhindern. Fixturetimeout und
terminales Jobaccounting begrenzen den Test, ohne Produktions-Liveness
oder die vier vorgeschlagenen produktiven Jobs nachzuweisen.

Die Variante darf nicht in produktive Umsetzung übergehen, wenn eine der
folgenden Voraussetzungen fehlt:

- belegte gemeinsame CRT, tatsächliche `FILE*`-Ownership und einmaliger sicherer Close;
- vollständig geschlossene relevante Producermenge und ausschließlicher Zugriff über ihren Annahme-/Abschlussvertrag;
- vollständige Bootstrap-, private Kanal-, Quellen-, Handle- und Binärbindungen ohne unbekannte Writer;
- fortbestehende Dispatcher-/Kontrollerreichbarkeit sowie sichere Lebensdauer noch aktiver nativer Arbeit;
- vollständig abgeschlossener gesunder Fixturepfad und wirksame kausale Gegenproben mit unabhängigen nativen Orakeln;
- tragfähiger, von Jan separat entschiedener Bau-, Ressourcen- und Pflegevertrag.

Unbekannt bleibt `unproven`; bestätigte Verletzungen bleiben `failed`.
Ein negativer oder unvollständiger Befund führt zur Neubewertung dieser
Variante statt zur stillschweigenden Lockerung der EOF-, Ownership- oder
Producerbedingungen. Es entstehen keine Ersatzsamples, Zusatzcaps oder
späteren Aufwertungen.

Auch ein erfolgreicher synthetischer Versuch bestätigt nicht die reale
Producerabdeckung. Vollständige Helfer-/Starterkette, Owner-/Kanalverlust,
Backpressure, Deadlinegegenproben am gemeinsamen Sample, direkte
Chrome-Pipes und Produktionsintegration bleiben eigene Abnahmen. Formale
Annahme, Umsetzung und sämtliche Runtimefreigaben bleiben getrennte
Entscheidungen. Der folgende Abschlussvertrag gilt unverändert auch als
zu erfüllende Grenze dieser bedingten Variante.

## Private Kommunikation

Die Kommunikation verwendet ausschließlich beim kontrollierten Start erzeugte
und gezielt vererbte Pipeenden. Ein frei erreichbarer IPC-Dienst entsteht nicht.

Das versionierte Protokoll besitzt geschlossene Nachrichtentypen,
Verbindungsgeneration, streng steigende Sequenznummer, Operationskennung und
deklarierte Nutzlastlänge. Nachrichten werden an die tatsächlich erzeugten
Prozesse und deren private Kanäle gebunden. Ein mitgelieferter Digest oder
Erfolgswert ersetzt diese Bindung nicht.

Zulässige Operationen sind auf folgende Aufgaben begrenzt:

- Laufbindung und Initialisierung;
- Erstellung der eigenen Root-, Profil- und freigegebenen Harnessressourcen;
- einmaliger Start der festen Rollen;
- identitätsgebundenes Stoppen und Schließen;
- begrenzte Inventur und Bereinigung;
- Ausgabeversiegelung und terminale Beobachtungsfakten;
- private Rückgabe des bereits sanitisierten Ergebnisses.

Die Ausgabeversiegelung bildet genau einen vorab gebundenen Sammelvorgang.
Der Helfer empfängt dessen Teilnachweise einschließlich der unabhängigen
Starterbestätigung über private, an ihre tatsächlichen Quellen gebundene
Wege. Der Adapter erhält keine Zwischenfakten dieses Vorgangs. Erst sein
terminaler Abschluss oder terminaler Fehler erzeugt die unten beschriebene
einmalige Abschlussmeldung. Die Erhaltung der getrennten Quellenbindungen
beim Zusammenstellen des Ergebnisses gehört zur späteren Abnahme; ein
Helfer-Boolean oder Digest ersetzt sie nicht.

Vorgeschlagene zusätzliche Grenzen sind eine maximale Nachrichtengröße und
ein gesamter ausstehender Kontrollbestand von jeweils `1_048_576` Bytes,
höchstens 16 wartende Nachrichten und eine aktive Ressourcenoperation. Große
Nutzdaten werden begrenzt zerlegt. Diese Werte sind noch keine gemessene
Dimensionierung. Überschreitungen schließen den betroffenen Pfad mit Fehler.

Chrome-CDP erhält eigene, direkt vom Adapter gehaltene Pipeenden. Der Helfer
vermittelt deren Erzeugung und Vererbung, leitet aber keine CDP-Daten weiter.
Damit soll die gemeinsame lokale Frameannahme mit Capture-Capstart im selben
Adapterturn erhalten bleiben. Die konkrete Windows-/Node-Bindung dieser Enden
benötigt eine Machbarkeitsprobe.

## Prozessownership

Für Chrome, Vite und Gateway existiert jeweils ein eigenes Job Object
derselben Laufgeneration. Die Zuordnung erfolgt bei der Prozesserzeugung vor
der ersten Ausführung. Zusätzlich erhält der vom Helfer gestartete Adapter
einen getrennten Schutzjob derselben Generation. Dieser ist eine
Ownerverlustabsicherung und kein weiterer fachlicher Childcheck.

Vor der ersten Prozesszuordnung muss für jeden dieser vier unbenannten Jobs
`JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` gesetzt und über dieselbe Jobidentität
zurückgelesen sein. Nur der Helfer hält jeweils genau ein Jobhandle; Starter,
Adapter und Children erhalten keines. Vererbung, Duplikation, Weitergabe und
ein weiterer öffnungsfähiger Jobname sind ausgeschlossen. Breakaway und
Silent-Breakaway werden nicht freigegeben. Fehlt eine dieser Bindungen,
darf kein Prozess in dem betroffenen Job starten.

Ein positiver Stopnachweis verlangt eine vollständig gebundene Jobidentität
und authentische terminale Accountingfakten. Root-Exit genügt nicht.
Jobbenachrichtigungen dienen als Anlass zur Prüfung; ihr Ausbleiben beweist
keine Beendigung. [Microsoft: Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)

Chromes verschachtelte Jobs und mögliche externe Brokerpfade müssen im
unterstützten Profil geprüft werden. Jobownership wird nicht als allgemeine
Windows-Sandbox dargestellt.

Der Helfer überwacht vor dem Start der Rollen bereits ein tatsächlich an den
Starter gebundenes, signalisierbares Prozesshandle. Das beim Adapterstart
erzeugte Prozesshandle wird entsprechend gebunden. Native Prozess- und
Kanalabschlussereignisse aktivieren ausschließlich den gebundenen
Abbruchpfad; sie sind keine zusätzliche Timer- oder Pollingentscheidung.
Die sichere Bootstrapbindung des Starterhandles und die Überwachung ohne
blockierten Kontrollpfad sind verpflichtende Machbarkeitsnachweise. Ohne
sie bleibt jeder Rollenstart gesperrt.

| Verlust | Verantwortlicher oder Betriebssystemmechanismus |
| --- | --- |
| Starter beendet | Der überlebende Helfer reagiert auf das gebundene Prozessende, sperrt neue Operationen und schließt seine Jobhandles. |
| Helfer beendet | Windows schließt dessen Handles; wegen des zwingenden Flags und des fehlenden weiteren Halters beendet die letzte Jobhandle-Schließung die zugeordneten Prozesse einschließlich des Adapters. Ein toter Helfer muss keinen Terminate-Aufruf mehr ausführen. |
| Adapter beendet | Der Helfer reagiert auf das gebundene Prozessende und schließt die drei Rollenjobs sowie anschließend den Adapterschutzjob. |
| Erforderlicher Kontrollweg verloren oder fehlerhaft | Der überlebende Helfer schließt die Jobs. Erkennt zunächst nur der Adapter den Fehler, fordert er über einen noch gebundenen Weg den Abbruch an und beendet sich; sein gebundenes Prozessende aktiviert denselben Helferpfad. |

Der Helfer sperrt beim Abbruch zuerst weitere Starts und Ressourcenaufträge,
schließt dann die drei Rollenjobhandles, danach das Adapterschutzjobhandle
und zuletzt seine übrigen eigenen Handles. Bei seinem eigenen Prozessende
ersetzt die betriebssystemseitige Handlefreigabe diese programmierte Folge.
Fremde Prozesse oder freie PIDs werden dafür nicht verwendet.

Im gesunden Abschluss werden die Rollenjobs nach den gebundenen terminalen
Accountingprüfungen geschlossen. Der Adapterschutzjob bleibt allein beim
Helfer bis zum Adapterende; er wird nicht als bereits leerer Rollenjob
ausgewiesen. Ausgabe-EOF bedeutet weder Adapter- noch Helferprozessende.

Die letzte Jobhandle-Schließung veranlasst die Beendigung; ihr Aufruf allein
ist weiterhin kein terminaler Accountingnachweis. Ownerverlust erzeugt
keinen nachträglichen Cleanup-PASS oder Ersatz für `A_obs`. Ein blockierter
überlebender Host besitzt keine zusätzliche Fortschrittsgarantie; die native
Wirksamkeit einschließlich Handleverlust und verschachtelter Jobs muss
gesondert geprüft werden.

## Begrenzte Ordnerhoheit

Der Helfer erzeugt genau einen frischen Run-Ordner exklusiv unter einem zuvor
gebundenen Parent. Rootidentität und Parentkette bleiben über Handles gebunden.

Die Bereinigungsbefugnis gilt für sicher gebundene Einträge dieses
Run-Namensraums. Sie behauptet ausdrücklich nicht, welcher Prozess jede
einzelne Chrome-Datei erstellt hat.

Für eine Löschung sind erforderlich:

- Öffnung einzelner Komponenten relativ zu gehaltenen Verzeichnishandles;
- bestätigte Typ-, Volumen- und Objektidentität;
- nachgewiesene Stabilität gegen Umbenennung oder Austausch;
- Ausschluss von Reparsepunkten, Junctions, Symlinks und mehrfach verknüpften Dateien;
- Löschung über das gebundene Objekt und terminale Prüfung unter dem gehaltenen Parent.

Vorgesehene Inventurgrenzen sind 4.096 Einträge und Tiefe 64. Eine
Überschreitung beendet den positiven Bereinigungspfad.

Dateiinhalte, Attribute und Zugriffsrechte werden zur Bereinigung nicht
umgeschrieben. Sharingkonflikte werden nicht durch das Schließen fremder
Handles aufgelöst. Windows-Sharingregeln können Umbenennung und weitere
Öffnungen beschränken; ihre konkrete Verwendung muss nativ geprüft werden.
[Microsoft: CreateFileW](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew)

Ein erfolgreicher Löschauftrag oder `delete-pending` allein genügt nicht als
terminaler Entfernungsnachweis.

## Ausgabeversiegelung und Abschluss

Der vorgeschlagene gesunde Abschluss lautet:

1. Die Foundation erzeugt `O0`; der Adapter friert synchron sein authentisch gebundenes `A_obs`.
2. Cleanup beginnt mit demselben Ressourcenledger, genau einer Cleanupgeneration und dem bestehenden absoluten 60.000-ms-Cap. Die gesamte Versiegelungs- und Bestätigungsphase gehört zu dieser Generation.
3. Rollenprozesse, vorausgehende Ressourcenoperationen, CDP-Beobachtung und ihre Callbackgenerationen werden geschlossen. Für den letzten Cleanupstep bleiben Cleanupcap und der einmalige native Sammelvorgang samt erforderlichen Kontrollbindungen aktiv.
4. Der Adapter versiegelt seine gebundenen stdout-/stderr-Schreibwege über eine nachgewiesene sichere Methode. Der Helfer sammelt den vollständigen Drain der sechs Childstreams und tatsächliches EOF beider Adapterstreams; er sendet dafür keine Zwischenmeldung an den Adapter.
5. Der Helfer versiegelt seine eigene stdout-/stderr-Ausgabe bei weiter nutzbaren privaten Kontrollwegen. Der Starter drainiert beide Streams bis zu tatsächlichem EOF und liefert seine unabhängig gebundene Abschlussbestätigung an den Helfer. Dieser terminalisiert den Sammelvorgang erst mit allen erforderlichen Teilnachweisen oder mit einem terminalen Fehler.
6. Genau eine terminale Abschlussmeldung gelangt als reguläres `cleanup-fact` in die Adapter-FIFO. Der Adapter erfüllt damit den wartenden Foundation-Dequeue; die Foundation fordert das gemeinsame Clocksample an. Nur unterhalb der Cleanupdeadline prüft der Adapter das privat an diesen Eintrag gebundene Sammelergebnis und terminalisiert sein Stepledger; die Foundation verarbeitet danach den regulären Envelope.
7. Nach sämtlichen terminalen Cleanupfakten wird der bestehende Cleanupcap genau einmal gecancelt und das bestehende Completionsample geprüft. Anschließend werden auch die verbliebenen Kontroll-/Versiegelungsproducer und Resolver invalidiert sowie inventarisierte Rawreferenzen und flüchtige IDs verworfen. Erst dann folgen terminales `A_clean`, `A_final` und die einmalige kanonische Recordmaterialisierung.

### Abschlussbarriere und Kontrolllebensdauer

Die Versiegelung ist keine Wartephase nach `cleanupCompleted`. Sie liegt vor
dem endgültigen Cleanup-Cancel, Completionsample und Verwerfen der relevanten
Producerbindungen. Genau diese spätere Grenze ist das vorgeschlagene Delta
zum heutigen Adapterabschluss; die Implementierung bleibt unverändert.

Der bestehende letzte Step `observerStorageLogAndTelemetryResidueAbsent`
startet nach den vorausgehenden Steps genau einen gebundenen Sammelvorgang
für seine bisherige Residueprüfung und die Versiegelungs-/Bestätigungsbarriere.
Sein Step-Ack bestätigt nur die nichtwartende Annahme; weder EOF noch der
Abschluss des Sammelvorgangs ist eine Ackvoraussetzung. Die übrigen elf
Cleanupsteps und ihre Acks bleiben erhalten.

Vor der Annahme werden Lauf-/Cleanupgeneration, Operationsidentität,
erwartete Helfer- und Starterquellen sowie ihre privaten Wege gebunden. Die
Teilnachweise verbleiben im nativen Sammelvorgang. Sie sind keine
Adapter- oder Foundation-Dequeue-Events und beanspruchen keinen gemeinsamen
Controller-Clock-Guard für ihren nativen Eingang. Der Helfer darf eine
Starterbestätigung nicht selbst erfinden; seine Ergebnisbindung muss deren
tatsächlichen getrennten Ursprung und die ursprüngliche Operation erhalten.
stdout/stderr werden nicht als Kontrollkanal benutzt.

### Terminaler Envelope und private Ergebnisbindung

Der erste terminale Rückgabepfad des Sammelvorgangs liefert entweder ein
begrenzt transportiertes Ergebnis oder einen statischen terminalen
Transport-/Controlfehler. Nur dieser Rückgabepfad erzeugt genau einen
frischen, gewöhnlichen, tief eingefrorenen Foundation-Envelope:

```text
{kind:"cleanup-fact", checkId:"observerStorageLogAndTelemetryResidueAbsent", fact:true}
```

`fact:true` ist hier ausdrücklich die neutrale Abschlussmeldung eines
terminalen Vorgangs, kein positiver Befund zum noch ungeprüften Ergebnis.
Die unveränderte Foundation bewertet diesen Wert als `unproven` und beendet
den wartenden Step. Ein Fehler oder negativer Teilnachweis wird getrennt im
Adapterledger als `failed` beziehungsweise `unproven` erhalten; der Envelope
kann ihn weder heilen noch in `confirmed` umwandeln. Auch ein fehlerhaft
terminaler Vorgang wartet nicht auf spätere Reparaturmeldungen.

Das Ergebnis wird als ausschließlich adaptereigene Bytekopie samt
vorgebundener Quellen-/Operationsregistratur privat an die konkrete
FIFO-Eintragsidentität gebunden. Ein statischer Transportfehler benötigt
keinen fremden Fehlergraphen. Der Envelope erhält keine Zusatzfelder;
Ergebnisbytes, Quellenmetadata und Zustandswerte gelangen nicht an die
Foundation. Vor dem gemeinsamen Sample erfolgen nur begrenzte
Transportframing-/Besitzoperationen, keine semantische Auswertung der
Teilnachweise, Nutzlastdecodierung oder -reflection im Adapter.

Die terminale Meldung erhält beim Eintritt ihre reguläre FIFO-Sequenznummer
und bleibt unverändert, auch wenn sie vor dem Step-Ack ankommt. Sie ersetzt
den Ack nicht. Zwischenfakten werden weder heimlich im Adapter konsumiert
noch als CDP, `connection-closed`, No-op oder vorläufiges `cleanup-fact`
getarnt. Bestehende CDP-, Cap-, Connection-Close- und andere Cleanup-Events
bleiben vollständig in ihrer bisherigen Ankunftsreihenfolge erhalten. Die
native Sammlung erzeugt ihren einzelnen terminalen Event erst am Ende;
bereits entstandene Adapterevents werden nicht zusammengefasst.

### Foundation-Dequeue und gemeinsames Sample

Der Übergang ist vollständig:

1. Nach dem Step-Ack wartet die Foundation mit ihrem bestehenden `observation-dequeue` der Phase `cleanup`. Solange der Sammelvorgang läuft, liefert er dafür keinen Envelope; echte andere FIFO-Events und der bestehende Cap bleiben erreichbar.
2. Der einzelne terminale Envelope erfüllt einen regulären Dequeue. Die Foundation hält ihn unreflektiert und fordert unverändert `controller-clock-sample` mit `reason:"cleanup-dequeue-before-reflection"` an.
3. Der Adapter liest genau einmal die bestehende Controllerclock. Derselbe rohe primitive Wert wird im Adapterledger festgehalten und unverändert an die Foundation zurückgegeben. Die private Ergebnisregistratur wird über die gehaltene FIFO-Eintragsidentität gefunden; dafür ist keine Reflection des Envelopes oder seiner Nutzlast nötig.
4. Bei `sample >= deadline` gewinnt der Cleanupcap. Ergebnisbytes und private Bindungsreferenzen werden ohne Nutzlastdecodierung oder -reflection verworfen; fehlende Abschlussnachweise bleiben `unproven`. Die Foundation verwirft den gehaltenen Envelope ebenfalls vor Reflection.
5. Nur bei `sample < deadline` prüft der Adapter synchron und begrenzt das privat gebundene Ergebnis: geschlossene Grammatik, tatsächliche Quellen-/Kanal-/Operationsbindung, Residueprüfung, sämtliche Drains und EOF-Nachweise sowie die unabhängige Starterbestätigung. Dann übernimmt er die terminalen Befunde ins Cleanup-/Outputledger. Ungültige oder negative Werte latchen den entsprechenden Verstoß beziehungsweise `unproven`; sie lösen kein weiteres Warten aus.
6. Der Adapter gibt den identischen Clockwert zurück. Die Foundation reflektiert danach ausschließlich den bereits unverändert gehaltenen regulären `cleanup-fact`-Envelope, bewertet `true` als `unproven` und setzt ihren bestehenden Cleanupablauf fort. Die adapterseitige Ledgerterminalisierung erzeugt keinen zweiten Cleanupfact-Envelope.

Die begrenzte Ergebnisauswertung enthält einen statischen Fehlerpfad ohne
nachgelagerten Callback oder fremden Fehlergraphen. Ein Decode-, Grammatik-
oder Bindungsfehler wird im Adapter gelatcht; das bereits gültige gemeinsame
Clocksample wird dadurch weder ersetzt noch erneut gelesen. Bestätigte
Verstöße bleiben sticky `failed` und erzwingen Aggregate-FAIL; fehlende
Bindungen oder Nachweise bleiben `unproven`. Die bisherigen Fehlerpfade
eines ungültigen Clocksamples gelten unverändert und dürfen keine
Ergebnisauswertung freigeben.

Die Auswertung am gemeinsamen Sample ist ein ausdrücklich vorgeschlagenes
Adapterdelta gegenüber der heutigen Dequeue-Buchführung. Es verändert
weder Foundationbytes noch deren vier Fulfillmentformen, sieben Intents,
Clockgründe oder Effects-Port. Es entstehen kein dreizehnter Cleanupstep,
neuer Foundationintent, Ersatz für `observationClosed()` oder zusätzliches
Recordfeld. Die Abschlussmeldung zählt als ein regulärer Dequeue innerhalb
des unveränderten 128er-Limits; private Teilnachweise erhöhen dieses Limit
nicht. Ein Sample außerhalb des tatsächlich erfüllten Foundation-Dequeues
oder ein eigener Ersatzclockread ist verboten.

Die eigenständige Finalrecordprüfung bleibt erforderlich. Das neutrale
Foundationfact ersetzt insbesondere keine positive Ableitung von
Ausgabestille, Quellenauthentizität oder `cleanupCompleted`.

Ausbleibendes EOF, fehlende Starterbestätigung oder anhaltende Backpressure
werden nur bis zur bestehenden Cleanupdeadline erwartet. Bekannter
Kanalfehler, unzulässige Nachricht oder Überlauf terminalisieren den nativen
Sammelvorgang mit Fehler. Ein noch aktiver Adapter kann dessen einmalige
terminale Meldung über denselben beschriebenen Dequeue-/Samplepfad prüfen;
sie liefert keine positive Ableitung. Der Cap beendet ausstehende
Wartebindungen und macht späte Callbackgenerationen inert. Er verwirft
auch Teilframes und eine bereits kopierte, aber noch nicht ausgewertete
Ergebnisbindung. Fehlende Abschlussfakten bleiben `unproven`; ein gefeuertes
Cap wird nicht anschließend gecancelt.

Ist die Foundation oder ihr Port bereits terminal, entsteht kein Ersatz-
Dequeue oder Ersatzsample. Ohne den beschriebenen Guard darf ein privates
Ergebnis nicht evidenzfähig übernommen werden; der begrenzte
Ressourcenabbruch bleibt davon getrennt. Nach Terminalisierung gibt es
keinen zweiten Abschluss desselben Sammelvorgangs und keine nachträgliche
Aufwertung. Ergebnisbytes, Kontrollbindungen sowie Raw-/ID-Referenzen
werden auf jedem terminalen Pfad inventarisiert verworfen.

Kein Kontrollwrite und keine Drainoperation darf den Adapterdispatcher
blockieren. Die konkrete nichtblockierende Windows-/Node-Einbindung ist
noch nachzuweisen; ein nicht zurückkehrender nativer Aufruf oder blockierter
Host wird nicht durch eine behauptete Capwirkung geheilt.

Die private Rückgabe des bereits sanitisierten Ergebnisses benötigt nach
`A_final` keine weitere Bestätigung oder Wartephase. Ihre begrenzte Annahme
ist kein Zustellnachweis; fehlt eine nichtwartende Übergabe, bleibt das
Ergebnis unzugestellt. Sie verändert weder Record noch Gate oder Finding
und aktiviert keine invalidierte Beobachtungs- oder Cleanupgeneration neu.

Ein Node-`close`-Event wird nicht mit kernelbestätigtem EOF gleichgesetzt: Der
Node-24.19.0-Stdiocode kann ein solches Event auslösen, ohne den Descriptor
tatsächlich zu schließen.
[Node-Stdiocode](https://raw.githubusercontent.com/nodejs/node/v24.19.0/lib/internal/bootstrap/switches/is_main_thread.js)

Die sichere Schließmethode ist noch nicht festgelegt. Insbesondere dürfen
Descriptoren nicht blind geschlossen werden, während andere Operationen sie
verwenden. [Node: fs.closeSync](https://nodejs.org/download/release/v24.19.0/docs/api/fs.html#fsclosesyncfd)

Fehlt eine vollständige Versiegelungs- und Ownerbindung, bleibt der
evidenzfähige Abschluss gesperrt. Ein beobachteter Ausgabeverstoß bleibt ein
Verstoß; er wird nicht durch anschließendes Verwerfen geheilt.

## Zeit- und Fehlergrenzen

Controllerclock, FIFO und die bestehenden Budgets `6.000/6.000/60.000 ms`
bleiben beim Adapter. Helfer und Starter führen keine zusätzliche produktive
Timer- oder Pollingentscheidung ein.

Ein Cap beendet Warten und positive Ableitung. Bereits laufende native
Operationen können später enden; späte Fakten verändern keinen eingefrorenen
Zustand. Der native Sammelvorgang sowie Versiegelung und Ownerbestätigung
verlängern den Cleanupcap nicht; sie werden vor seinem endgültigen Cancel
und vor Callbackinvalidierung
abgeschlossen oder innerhalb derselben Generation ohne positive Ableitung
terminalisiert. Eine atomare Widerrufswirkung über Prozessgrenzen wird nicht
behauptet.

Ohne authentisches `A_obs` entsteht kein Runtime-Record. Abbruch, Kanalverlust
oder Ownerfehler führen ausschließlich in den begrenzten Ressourcenabschluss.

## Voraussetzungen für Annahme und Umsetzung

Vor einer implementierungsreifen Annahme fehlen insbesondere:

- bei Wahl der bedingten Hostvariante der konkrete Bau-/Pflegevertrag, gemeinsame CRT-Ownership, geschlossene Producerprofile und eigene Quellen-/Binärabnahmen;
- Windows-Nachweise für direkte CDP-Pipebindung und sichere Ausgabeversiegelung;
- Wirksamkeit der vier Jobs mit Kill-on-close, ausschließlicher Handlehaltung und gebundener Owner-/Kanalverlustbehandlung;
- nichtblockierender Sammelvorgang, terminale Ergebnisbindung und Dequeue-/Samplegegenproben unterhalb, exakt auf und oberhalb derselben Cleanupdeadline;
- die konkret geprüften Öffnungs-, Sharing- und Löschprimitive;
- vollständige Bootstrap-, Peer-, Quellen- und Binärbindungen;
- ein gebundenes Windows-, Dateisystem-, Compiler- und SDK-Profil;
- unabhängiger Dokumentreview der vervollständigten Fassung.

Danach folgen gesondert beauftragte Umsetzung und native Gegenproben.
Ubuntu-CI ersetzt diese Windows-Nachweise nicht.

Die bisher vorgesehenen zwei Umsetzungscommits betreffen
Prozessownership/Dateibereinigung sowie Ausgabebeobachtung/Abschlussbindung.
Ein eigener Host und dessen Bau-/Pflegevertrag benötigen eine gesonderte
Sliceplanung; diese Fassung legt dafür weder Commits noch PR fest.

`overallGate: FAIL`, `causeStatus: CAUSE_NOT_PROVEN`, `NOT_EVIDENCE` und
`runtimeRecord:null` bleiben unverändert. Diagnose-, Browser-, E2E-, Writer-
und Persistenzfreigaben bleiben geschlossen.
