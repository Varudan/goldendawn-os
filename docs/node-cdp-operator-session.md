# Ausdrücklich bediente Node-CDP-Sitzung

## Vorab festgelegter Dienstnachlauf

Vor Implementierung festgelegt am 06.11.2026: **120.000 ms**, einmalig ab
Übernahme des Bereitstellungsfehlers, eines Abbruchs außerhalb einer laufenden
Operation oder des Kontrollberichts. Bei erfolgreicher Bereitstellung wartet
die Sitzung zunächst auf die getrennte Kontrollentscheidung. Während der
Kontrolle beginnt der Nachlauf erst nach deren Bericht, nie bei Abort allein.
Dieser Beginn wird vor Dateischreibvorgängen festgehalten. Die bestehende
Host-/Kontrollfrist wird weder ersetzt noch verschoben.

Polling erfolgt höchstens alle 100 ms. Bedienung, Fensterabfragen, Zwischenstände
und wiederholte Signale verlängern die absolute Grenze nicht. Gleichheit ist
zu spät. Bei sicheren Resten lautet die Bilanz FAIL, bei fehlenden oder erst
verspäteten Belegen UNPROVEN. Beides erhält die Startsperre. Das Zeitbudget
begrenzt die Bewertung, garantiert keine physische Beendigung. Host und
Prozessreferenzen bleiben erhalten; kein Kill, Pipe-Destroy, Unref, Reset,
Profil-/Markenlöschen oder process.exit().

## Umfang und Grenzen

Die importinaktive Session hält ab erfolgreicher Eingangsprüfung genau einen
Produktionshost und dessen vorhandenen Owner. Produktionspfad und ausdrücklich
benannte Testinjektion sind getrennt. Quellen, Chrome-/Node-/PowerShell-Dateien,
Paketmetadaten, relevante Node-Umgebung und feste Helferauswahl werden vor der
Reservierung gelesen und gehasht. `NODE_OPTIONS`/`NODE_PATH` verweigern den Start;
Windows und eine vorhandene native `WebSocket`-Funktion sind erforderlich.
Die Syntax-/Import-/Simulationsprüfung unter Node 20.19.0 und 22.12.0 beweist
keine dortige native WebSocket-Verfügbarkeit. Keine Downloads oder Polyfills.

Die Komposition ist kein Produktlauf, keine Fähigkeitserklärung und keine neue
Freigabe. SAC bleibt aktiv. `overallGate: FAIL`, `causeStatus: CAUSE_NOT_PROVEN`,
fehlendes authentisches `A_obs`, `NOT_EVIDENCE` und `runtimeRecord:null` bleiben
unverändert. Die neuen Bytes benötigen einen gezielten unabhängigen Review.
Frühere PASS-Urteile werden nicht übertragen.

## Bedienung nach gesondertem Prüfauftrag

Vor einem tatsächlichen Start müssen die feste Host-Betriebsablage und der
Nachweis-Elternordner gesondert vorbereitet sein. Die Session erzeugt weder
Elternverzeichnis noch Ersatzablage. Jan referenziert seine tatsächliche
Zustandsklärung (`INITIAL_STATE_CLARIFIED` oder
`RESTART_CLEARED_ADR0041_6_4`) und entscheidet die Netzwerkbedingung:
`ACCEPT_BROWSER_BACKGROUND_NETWORK` oder `PROTECTION_CONFIRMED`, jeweils mit
realer Referenz. Letzteres ist Jans bestätigte externe Schutzentscheidung,
kein von der Session erbrachter Wirksamkeitsnachweis. Beide Referenzen müssen
ASCII `[A-Za-z0-9._:-]`, Länge 1–128, sein. Es gibt keine positiven Defaults.

Hilfe ist ohne Betriebsressourcen möglich:

```text
node scripts/browser/nodeCdpOperatorSession.js --help
```

Ein später gesondert erlaubter CLI-Start verwendet `--run` und genau die sechs
Argumentpaare `--chrome-executable`, `--chrome-sha256`, `--state-decision`,
`--state-reference`, `--network-decision`, `--network-reference`. Pfad und
SHA-256 müssen die unmittelbar gebundene Installation benennen. Es werden
absichtlich keine verwendbaren Freigabe- oder Testreferenzwerte vorgegeben.

Danach nimmt dieselbe Konsole höchstens 32 JSON-Zeilen mit genau `action` und
`value` entgegen (höchstens 8 KiB je Eingabepuffer). Eingabelistener werden erst
nach der ausdrücklich gestarteten, bestätigten Reservierung installiert:

1. `{"action":"prepare","value":null}` versucht genau eine Bereitstellung.
2. Erst das ausgegebene `READY` liefert `confirmation` mit den vier aktuellen
   Identitäten und einem einmaligen Bestätigungswert. Die Bereitstellung
   startet keine Kontrolle. Bei Fehler gibt es keine zweite Bereitstellung.
3. Für Kontrolle eine neue Zeile mit `action: "control"` senden. `value` muss
   genau `operator: "Jan"`, `decision: "ALLOW_CONTROL_ONCE"` und die fünf
   Felder aus der aktuellen READY-Bestätigung enthalten. Alle Identitäten
   werden unmittelbar gegen denselben Host abgeglichen. Der Hosttoken bleibt
   ein privates identisches Objekt und erscheint weder auf der Konsole noch
   in Dateien. Ein kopierter Hosttoken ist keine Sessionfreigabe.
4. `{"action":"abort","value":null}`, Eingabeende, SIGINT oder SIGTERM
   sperren dauerhaft. Während Bereitstellung wird `host.end()` benutzt;
   während Kontrolle ausschließlich deren AbortSignal. Erst nach deren
   Bericht wird der Host beendet. Eingabe wird während dieser Promises
   weiterhin verarbeitet. Wiederholungen erzeugen keinen zweiten Lauf.
5. Nach Kontrollbericht: Nachlauf auf derselben Instanz, anschließend Bericht
   samt Restlage. Die monotone Nachlaufgrenze wird vor Belegschreibvorgängen
   festgehalten. Bei Fehlern bleiben mögliche Normalabschlüsse erreichbar.

Die API `begin`, `prepare`, `controlOnce`, `stop`, `queryWindow`, `installInput`,
`inspect`, `report`, `completed` ist eine vertrauenswürdige lokale Komposition,
keine Authentifizierungsgrenze gegen beliebigen Code im selben Prozess.
`completed()` liefert die erste Abschlussbilanz; spätere Beobachtungen ändern
deren eingefrorenen Dienstbefund nicht. Kein Wiederanlauf oder automatisches
Übernehmen nach Neustart; die exklusive Hostmarke bleibt erhalten.

## Fensterkandidat und verweigerte Schließempfehlung

`{"action":"window","value":null}` ist bei READY und im Nachlauf möglich,
höchstens zweimal insgesamt und nur ohne noch offenen Helferprozess. Eine
laufende Abfrage erlaubt keinen Kontrollstart. Sie verwendet ausschließlich
den festen `readNodeCdpServiceWindow.ps1` neben der Session und
`C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`, mit `-NoProfile`,
`-NonInteractive`, `shell:false`, eigenen Pipes und verborgenem Helferfenster.
Keine frei gelieferten Shellbefehle, Skriptpfade oder Argumentlisten;
kein ExecutionPolicy-Bypass, keine Rechteerhöhung und kein Fallback.

Die unveränderte Quellen-/Werkzeugbindung und die Hostprojektion werden vor
der Abfrage geprüft; die vollständige Hostprojektion wird danach erneut
verglichen. Nur dieselbe weiterhin bestätigte Dienstgeneration kommt infrage.
Der Helfer liest ausschließlich die vorgegebene PID, ihren Programmpfad und
ihre OS-Startzeit. Letztere wird nur im Helfer vor/nach verglichen und nicht mit
dem monotonen Host-Beobachtungswert gleichgesetzt. Die Win32-Interop entsteht
mittels Reflection.Emit ausschließlich im Speicher (`AssemblyBuilderAccess.Run`),
ohne Add-Type-Kompilerprozess, Skript-/DLL-Ausgabedatei oder Installationsschritt.

[EnumWindows](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumwindows)
und [GetWindowThreadProcessId](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowthreadprocessid)
werden für höchstens 4.096 Top-Level-Fenster beziehungsweise 1.000 ms benutzt.
Sichtbare Fenster werden nur bei exakt passendem Besitzerprozess gezählt.
Nur genau ein Kandidat wird zurückgegeben, ohne Titel oder Browserinhalt.
Der Helfer prüft Besitzer und Sichtbarkeit zuletzt erneut. Fehlende, mehrere,
fremde, veraltete oder widersprüchliche Kandidaten bleiben `UNPROVEN`.

Ein `CANDIDATE` ist **keine sichere manuelle Schließempfehlung**:
Die gehaltene ChildProcess-Referenz hat keine vom Host bereits beim Spawn
gebundene OS-Erzeugungszeit oder gehaltene Windows-Prozesshandle-Identität.
PID und Fensterhandle sind wiederverwendbar; außerdem fehlt eine abgesicherte
Zuordnung zum von Jan tatsächlich bedienten Fenster. Vor einem erwogenen
regulären manuellen Ende kann Jan die zweite `window`-Abfrage ausführen und
die aktuelle Generation vergleichen. Auch bei Übereinstimmung gibt die
Bedienung ausdrücklich `closeRecommendation:false` und
`NO_DURABLE_WINDOW_IDENTITY` zurück. **Auf dieser Grundlage wird kein Fenster
zum Schließen empfohlen.** Die fehlende praktische Zuordnung ist gesondert
zu klären; die Session aktiviert oder schließt kein Fenster.

Der Helfer hat eine interne Viersekundengrenze; die Session bewertet ihn ab
unmittelbar vor dem Start maximal 5.000 ms, mit höchstens 4.096 Bytes über beide
Ausgabekanäle. stderr, zu große/ungültige Antworten und verspätete Abschlüsse
ergeben keinen Kandidaten. Prozessende, ChildProcess.close, beide Pipes,
Registrierungen und Timer werden separat bilanziert. Nach Timeout bleiben
Referenzen und Drain-Beobachter erhalten. Es wird kein Prozess gekillt und
keine Pipe zerstört. Das Bewertungsbudget garantiert keine physische Beendigung
eines blockierten Windows-/PowerShell-Aufrufs. Spätes Close verbessert den
früheren Befund nicht. Die praktische Eignung dieses gesamten nativen Weges
ist ungeprüft; die netzwerkfreien Tests simulieren ihn vollständig.

## Belegablage und Restlage

Neue Sessiondateien liegen exklusiv unter
`C:\Users\jslom\Documents\Projekte\GoldenDawn-Pruefnachweise\node-cdp-session-<UUID>`.
Bestehende Verzeichnisse werden nicht übernommen. Höchstens 24 Dateien,
64 KiB pro Datei, 512 KiB insgesamt; fortlaufende Nummern, Länge und SHA-256,
exklusives `wx+`, vollständiger Write, fsync, Stat, Readback und bestätigter
Close. Bereits partielle Writes bleiben Fehler; kein Nachschreiben bis PASS.
Unsichere Flush-/Close- oder Rücklesebefunde bleiben sichtbar. Synchrone
Dateizugriffe sind nicht hart abbrechbar; ihr Zeitverbrauch zählt gegen das
bereits begonnene Nachlaufbudget.

Binding/Konfiguration, Reservierung, Bereitstellungsbericht, Kontrollsnapshot,
Kontrollbericht, Fensterbeobachtung, Nachlauf, Sessionbericht und Manifest sind
getrennte Dateien. Phasen und Bedienentscheidungen erhalten monotone Werte
und unabhängige UTC-Zuordnungen. Es gibt keine vollständige Umgebungsablage,
Rohpayloads, Browserinhalte, Profilarchive, Berechtigungstokens oder fremden
Exceptiontexte. Der vorhandene In-Memory-Bericht bleibt unverändert:
`control.evidenceSaved` sagt nichts über die zusätzliche Dateiablage aus.

`fileEvidence.status` wird erst im terminalen Rückgabewert zu `PASS`, nachdem
auch das Manifest bestätigt geschlossen ist. Die gespeicherte Zwischenbilanz
führt folgerichtig noch `OPEN`; das Manifest bindet nur vorherige Dateien,
nicht seinen eigenen zukünftigen Close. Eine verlorene finale Bestätigung
ist kein Datei-PASS. Datei-PASS bestätigt keine Dienst- oder Produktabnahme.

Die Dienstbilanz verlangt getrennt Prozess-exit, ChildProcess.close, stdout-
und stderr-close sowie bestätigte Registrierungsabmeldung bei Restzahl null.
Fensterschluss, Bedienbestätigung und `end()` genügen nicht. Profil und Marke
sind ausdrücklich erhaltene Bestände. FAIL/UNPROVEN führt zur Übergabe an Jan
mit weiterhin gesperrten Starts. Keine Bereinigung oder Entsperrung erfolgt.

## Prüfung dieses Implementierungsslices

Die Sessiontests verwenden den echten Host, Owner und Kontrollcode mit
vollständigen expliziten Testports. Kein fehlender Port führt auf einen nativen
Fallback. Browser, Sockets, Fensterhelper, Prozesse und Zeit sind simuliert;
nur eigene begrenzte temporäre Belegdateien und Node-Prozesse für Import/CLI
werden real benutzt. Effekt-/Getterzähler werden außerhalb abgefangener Hooks
ausgewertet. Die Host-B1–B4-Regressionen und portable Importprüfung bleiben
unverändert vorhanden. Der Windows-Helfer wird nicht ausgeführt; reine
Syntaxprüfung ersetzt keine native Fähigkeitsprüfung.

Die vollständigen Control-/Owner-/Host-/Session-Suiten laufen seriell mit TAP.
Node 20.19.0 und 22.12.0 werden über vorhandene erneut gebundene Dateien geprüft.
Nach letzten Änderungen und erfolgreichen Tests folgt genau ein Produktions-
Build mit gebundener npm-Auswahl. Reale Betriebsablage, Reservierungsmarken,
Browserprofile, Browser-/CDP-/Fensterproben und Produktrequests bleiben dabei
unberührt. Zahlen und Rohbindungen stehen in den getrennten Ausführungsbelegen;
diese Dokumentation nimmt keinen Prüferfolg vorweg.
