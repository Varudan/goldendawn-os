# Node-CDP-Betriebshost mit netzwerkfreien Tests

Der Host in `scripts/browser/nodeCdpOperatorHost.js` verbindet den bestehenden
[Startsperren-Owner](node-cdp-start-gate-owner.md) mit der unveränderten
[Kontrollanbindung](node-cdp-context-control.md). Basis dieses Slices ist
`9d6e1be6bc6449cdd02e8d71db128f50ae5abacb`, Branch
`codex/node-cdp-operator-host`. Alle sechs bisherigen Quell-, Test- und
Dokumentdateien bleiben rohbytegleich zum Basiscommit. Es gibt keine neue
Dependency, Produktkomposition oder allgemeine Statusnachführung.

Dies ist eine Implementierung mit synthetischer Selbstprüfung. Reale
Bereitstellung, Fähigkeitsprüfung, Produktlauf und unabhängiger Review gehören
zu eigenen Aufträgen. SAC bleibt aktiv. `overallGate: FAIL`,
`causeStatus: CAUSE_NOT_PROVEN`, fehlendes authentisches `A_obs`, `NOT_EVIDENCE`
und `runtimeRecord:null` bleiben unverändert.

## Vertrauensgrenze und feste Ablage

Der Produktionspfad ist im Modul fest gebunden:

```text
C:\Users\jslom\AppData\Local\GoldenDawn\NodeCdpOperator
```

Er liegt außerhalb von Repository, Vault und temporären Testordnern. Lauf- und
Dienstkennungen ändern ihn nicht. Er wird vom Host nicht automatisch angelegt.
Vor einem später gesondert erlaubten Betrieb muss Jan diese lokale Ablage und
ihre unveränderte Zuordnung klären. Der Host verlangt ein gewöhnliches
Verzeichnis mit übereinstimmendem Realpfad. Ein Alias/Junction zu einer anderen
Ablage wird abgelehnt. Diese Kontrolle beweist keine ACL-Wirkung, keine atomare
Pfadbindung gegen fremde Programme und keine Stromausfallsicherheit.

`reservation.json` wird unmittelbar mit `openSync(..., 'wx+')` exklusiv erzeugt,
ohne vorgeschaltete Prüfung ihrer Existenz. Der begrenzte Datensatz enthält
Sitzungsidentität, Generation und Jans Klärungsreferenz. Partielle positive
Schreibvorgänge werden vollständig fortgesetzt; Null-, unplausible und
asynchrone Ergebnisse verweigern die Zulassung. Es folgen `fsyncSync`, Prüfung
von Dateityp/Größe/Linkanzahl, begrenztes vollständiges Rücklesen und synchroner
Handleabschluss. Erst dann gilt die Sitzung als reserviert.

Jeder Reservierungsversuch verbraucht die Hostinstanz. Vorhandene Marken werden
unabhängig von Inhalt, Alter, PID oder früherem Urteil abgelehnt. Auch leere,
beschädigte, unlesbare oder nur teilweise geschriebene Marken bleiben erhalten.
Eine neue Hostinstanz kann die Marke nicht übernehmen. Auch Ressourcen-PASS,
Abbruch, Dienstende und `end()` entfernen sie nicht. Es gibt keine Reset-,
Unlock-, Lösch-, Übernahme- oder automatische Wiederanlauf-API.

Fehlende Historie bedeutet nicht `CLEAR`: `reserve` verlangt eine ausdrückliche
Betreiberentscheidung samt Referenz. Diese Erklärung ist eine von Jan
verantwortete Eingabe, kein vom Host bewiesener historischer Sachverhalt.
Bei Wiederanlauf muss die gesonderte Klärung nach
[ADR 0041, Abschnitt 6.4](decisions/0041-isolated-local-same-origin-sync-test.md#64-allgemeine-startsperre)
außerhalb dieses Hosts abgeschlossen sein. Eine vorhandene Marke wird auch mit
einer Wiederanlauferklärung nicht geöffnet oder entfernt. Eine fehlende Marke
allein genügt weiterhin nicht. Die Sicherheitswirkung gilt für kooperierende
Hosts unter der gebundenen, stabilen Ablagebedingung; beliebige andere Programme
werden nicht betriebssystemweit gesperrt.

## API und getrennte ausdrückliche Schritte

`createNodeCdpOperatorHost(options)` ist die Produktionsfactory. Sie liest bei
Erzeugung weder Optionen noch Umgebung und führt keine Datei-, Prozess-,
Netzwerk-, Timer- oder Registrierungseffekte aus. Import startet nichts. Es
gibt bewusst keine CLI, automatische Bereitstellung oder automatischen Lauf.

Die Optionen bestehen genau aus `chromeExecutable` und `chromeSha256`: ein
vorab ausgewählter absoluter, normalisierter Windows-EXE-Pfad und dessen
kleingeschriebener SHA-256. Es gibt weder PATH-Suche noch Chrome-Fallback. Diese
Werte sind die Bindung einer späteren Betriebskomposition, keine aus diesem
Slice abgeleitete Freigabe einer installierten Chrome-Fassung.

| Methode | Vertrag |
| --- | --- |
| `reserve({ operator: 'Jan', decision, reference })` | Synchroner einmaliger Reservierungsversuch. `decision` ist `INITIAL_STATE_CLARIFIED` oder `RESTART_CLEARED_ADR0041_6_4`; `reference` benennt die tatsächlich erfolgte gesonderte Klärung. Nur vollständiger Erfolg liefert `true`. |
| `prepareService()` | Einmalige gesonderte Bereitstellung nach Reservierung. Liefert einen Promise auf `READY`, `FAILED` oder `NOT_RUN`; startet keinen Kontrolllauf. |
| `inspect()` | Eingefrorene minimierte Zustandsauskunft samt Sitzung/Dienstgeneration, Versionsbindung und Bereitstellungsbilanz; keine austauschbaren Zustandsobjekte. Prüft bei Bereitschaft auch die gehaltene Prozessreferenz. |
| `authorizeControl(request)` | Ausdrückliche, synchron korrelierte Einzelerlaubnis. Liefert einen privaten identitätsgebundenen Token oder `null`. |
| `runControl({ permission, signal? })` | Verbraucht den eigenen Token, erzeugt eine frische Kontrollfactory am gemeinsamen Owner und gibt deren minimierten Bericht zurück. Ein abgelehnter Versuch liefert `NOT_RUN`. |
| `reportResourceFinding({ runId, resourceStatus, code })` | Übernimmt `FAIL`/`UNPROVEN` für eine bekannte eigene Lease, auch nach deren Abschluss. Bestätigung ist synchron `true`; die Startsperre bleibt dauerhaft. |
| `readEvidence(runId)` | Gibt den tief eingefrorenen, vom Kontrollmodul erzeugten minimierten In-Memory-Snapshot zurück, sonst `null`. Keine Rohpayload- oder Dateispeicherung. |
| `end()` | Widerruft diese Sitzung endgültig, stoppt eine laufende Bereitstellung mit begrenztem Verbindungsabschluss und sperrt weitere Starts. Beendet oder übernimmt keinen Browser und löscht nichts. |

Die Einzelerlaubnis hat genau diese Eingabefelder:

```javascript
{
  operator: 'Jan',
  decision: 'ALLOW_CONTROL_ONCE',
  runId,
  sessionId,
  sessionGeneration,
  serviceId,
  serviceGeneration
}
```

Alle vier Identitätswerte müssen der aktuellen `inspect()`-Auskunft exakt
entsprechen. Kennungen sind ASCII `[A-Za-z0-9._:-]`, Länge 1–128. Fremde Tokens,
Kopien, Promise-Werte, Accessoren, unbekannte Felder und falsch korrelierte
Werte geben keine Berechtigung. Der Aufrufer setzt keine `CONFIRMED`-Felder.
Die API ist ein vertrauenswürdiger lokaler Betreiberzugang, keine
Authentifizierung von Jan gegenüber beliebigem Code im selben Node-Prozess.
Pro Sitzung sind höchstens 64 verschiedene Kontrollläufe und eine aktive
Berechtigung/ein aktiver Lauf vorgesehen. Verbrauchte Laufkennungen werden
nicht wiederverwendet; bekannte Leases bleiben für späte Sperren erreichbar.

Der Host erzeugt genau einen Owner. Dessen `readSession`, `readService` und
`readPermission` entstehen aus bestätigter Reservierung und Klärungsreferenz,
privaten Generationskennungen, gehaltener Prozessreferenz, vollständig
abgeschlossener Bereitstellung und dem eigenen korrelierten Erlaubnistoken.
Diese synchronen Auskünfte sind Hostbeobachtungen, kein atomarer
Betriebssystembeweis. Es gibt keine positiven Defaults oder Promise-Atteste.

Eine Startsperre entzieht einer weiterhin gültigen aktiven Lease nicht die
Dienstidentität. Der unveränderte Kontrollablauf darf deren vorgesehenen
Normalabschluss fortsetzen. Dienst-/Sitzungsverlust entzieht die Identität
hingegen endgültig. Später passende Werte, neue Factories oder Ressourcen-PASS
heben weder Verlust noch Sperre auf. Nach verweigerter Zulassung entstehen
keine neuen Browser-, Socket-, Timer- oder Registrierungsversuche.

## Bereitstellung und Lebensdauer

Vor dem Prozessversuch liest der Host die ausgewählte EXE begrenzt in
64-KiB-Blöcken (höchstens 512 MiB), prüft den ausgewählten Hash und legt
`synthetic-profile` exklusiv und nicht rekursiv an. Ein bereits vorhandenes
Profil wird nicht wiederverwendet. Datei-/Hashbeobachtung und späterer Spawn
sind kein atomarer Schutz gegen einen Austausch durch fremde Programme;
die gebundene Installation muss währenddessen stabil bleiben.

Das Profil erhält unmittelbar vor `mkdirSync` eine eigenständige Position:
`possible` während eines unbestätigten Versuchs, `confirmed` nach synchron
bestätigter Erzeugung, davor `notAttempted`. Diese Position bleibt auch bei
anschließendem Frist- oder Generationsfehler ohne Dienstobjekt erhalten.
Bereitstellungsbericht und `inspect().resources` zeigen Profilpfad und Zustand
sowie getrennt Prozess, gehaltene Prozessreferenz, stdout, stderr und
Prozessregistrierungen einschließlich der Anzahl nicht abgeschlossen
bestätigter Registrierungen. Prozess und Pipes werden vor dem Spawnversuch
als `possible` bilanziert; eine fehlende Pipe wird als `missing`, eine
beobachtete als `confirmed` und erst nach ihrem Close als `closed` geführt.
Ein fehlender Kanal gilt nicht als beobachtet geschlossen. Der Bericht ist
ein eingefrorener Abschluss-Snapshot; `inspect()` führt spätere Beobachtungen
weiter. Es gibt keine automatische Profilbereinigung.

Der einzige Spawn verwendet `shell: false`, `detached: false`,
`windowsHide: true`, eigene Ausgabepipes und ausschließlich feste Argumente:
eigener `--user-data-dir`, Loopback-Debugadresse, dynamischer Debugport,
keine Ersteinrichtung/Standardbrowserabfrage, deaktivierte Erweiterungen und
`about:blank`. Es gibt keine frei ergänzbaren Argumente, Anmeldung,
Profilübernahme, deaktivierte Sandbox oder andere Schutzabsenkung. Der
Produktionspfad garantiert keine vollständige Unterbindung aller eigenen
Hintergrundkommunikation von Chrome. Der Host verwendet keine Provider.

Die Profiltrennung berücksichtigt den seit Chrome 136 geänderten
[Remote-Debugging-Vertrag](https://developer.chrome.com/blog/remote-debugging-port).
Die tatsächliche `ChildProcess`-Referenz bleibt gehalten. `spawn`-Ereignis,
PID, ausgewählter Programmpfad, Exit-/Signalzustand und Killzustand werden
zugeordnet; PID und beobachteter monotoner Startzeitpunkt sind nur ergänzende
Angaben. `error`, `exit`, `disconnect`, `close`, widersprüchliche Zuordnung oder
Ausgabefehler widerrufen die Dienstbindung endgültig. Kein fremder oder später
gefundener Prozess wird übernommen; es gibt keinen Neustartversuch.

Die grundlegenden Prozessbeobachter werden unmittelbar nach Übernahme der
gültigen `ChildProcess`-Referenz installiert, bevor stdout und stderr einzeln
geprüft werden. Fehlende Pipes verhindern Bereitschaft; die Prozessreferenz,
Fehler-/Abschlussbeobachtung und die Beobachter erreichbarer Pipes bleiben
erhalten.

Prozessende, `ChildProcess.close` und die beiden Streamabschlüsse werden
getrennt beobachtet, entsprechend dem
[Node-Prozessvertrag](https://nodejs.org/download/release/v24.19.0/docs/api/child_process.html#event-close).
Ausgaben werden verworfen und kumulativ auf 64 KiB bilanziert; Überschreitung
widerruft die Bindung, während die Ausgabe weiterhin geleert wird. Die
Prozessregistrierungen gehören zur gehaltenen Dienstbeobachtung und bleiben
auch nach Bereitstellung/Hostende bis zu Prozess- und beiden Streamabschlüssen
bestehen. Ihr Abbau wird höchstens einmal versucht, auch bei wiederholtem oder
reentrantem Close. Jede werfende oder nicht synchron bestätigte Abmeldung
bleibt mit ihrer Registrierungsidentität als `possible` erhalten. Weitere
Close-Ereignisse können diese fehlende Bestätigung nicht in `closed` ändern;
erfolgreich geschlossene Registrierungen werden nicht erneut abgemeldet. Ein
fehlgeschlagener Aufbau kann einen gestarteten Browser und sein Profil
zurücklassen. Deren gesonderte Klärung liegt bei Jan; automatisches Kill/Cleanup
ist ausdrücklich nicht Bestandteil dieser API.

## Endpunkt, Version und Abschlussbilanz

Der Endpunkt stammt ausschließlich aus `DevToolsActivePort` im gerade erzeugten
Profil. Pro Leseversuch werden höchstens 257 Bytes angefordert, die Datei darf
höchstens 256 Bytes groß sein. Nur ein kanonischer Port 1–65535 und der exakte
ASCII-Browserpfad `/devtools/browser/<id>` werden akzeptiert. Daraus entsteht
exakt `ws://127.0.0.1:<port>/devtools/browser/<id>`. Keine HTTP-Vorabfrage, keine
Endpointsuche und keine externe oder nachträglich gelieferte URL ist erlaubt.
Nur `ENOENT` wartet weiter; beschädigte, unvollständige, unplausible oder
unlesbare Dateien verweigern die Bereitstellung. Das Verfahren folgt der
[gebundenen Chromium-Quelle](https://chromium.googlesource.com/chromium/src/+/c686e8f4fd379312469fe018f5c390e9c8f20d0d/content/browser/devtools/devtools_http_handler.cc).
Seine Verfügbarkeit in der später gewählten Chrome-Fassung ist noch praktisch
zu prüfen.

| Phase | Absolutes Warteende |
| --- | --- |
| EXE-/Profil-/Dienst-/Endpunkterfassung | Start + 30.000 ms; Polling höchstens alle 100 ms, maximal 301 Leseversuche |
| Eine eigene WebSocket-Verbindung | Phasenstart + 5.000 ms |
| Ein `Browser.getVersion` | Phasenstart + 5.000 ms |
| Verbindungs- und Registrierungsabschluss | Phasenstart + 5.000 ms |

Dies sind ungeprüfte Planungswerte. Gleichheit ist bereits zu spät.
Zwischenbefunde verlängern keine Frist. Die Zeitquelle muss monoton und endlich
sein. Timer und Registrierungen werden vor ihrem Versuch bilanziert; ihre
Abmeldung und ihr Zeitverbrauch gehören zum Abschluss. Ein blockierter
Eventloop kann die Verarbeitung verzögern, aber keine rechtzeitige Bestätigung
erzeugen. Synchrone Dateisystemzugriffe lassen sich dadurch nicht hart abbrechen.

Die Bereitstellungsverbindung sendet ausschließlich einen Befehl mit ID 1:
`Browser.getVersion`. Genau eine Textantwort, höchstens 8.192 UTF-8-Bytes,
mit exakt korrelierter ID und genau den fünf erforderlichen Versionsfeldern
wird angenommen. Jeder Wert muss 1–512 Zeichen lang sein. Doppelte, fremde,
fehlerhafte oder zusätzliche Antworten verhindern Bereitschaft. Es gibt weder
Kontextanlage noch Ergänzung aus Dateiversionen oder früheren Berichten.
Erst das beobachtete Close-Ereignis im geschlossenen Socketzustand, der
synchrone Registrierungs-/Timerabschluss innerhalb der Frist und eine weiterhin
gültige Dienstidentität erlauben `READY`. Ein Close-Aufruf allein genügt nicht.

Bei Fehlern wird höchstens ein normaler Verbindungsabschluss mit einem eigenen
absoluten Fünfsekundenbudget versucht. Bereits begonnener Abschluss wird weder
wiederholt noch verlängert. Der erste maßgebliche Stoppzeitpunkt wird vor
Timerabmeldung und weiteren Abschlussoperationen unveränderlich erfasst.
Nach einer verpassten Aufbaufrist beginnt dieses Budget an der ursprünglichen
Frist; verspätete Callbackverarbeitung, Zeitverbrauch der Abmeldung und
Folgefehler verschieben es nicht. Bei Aufbaufrist 5.000 ms, Socketfehler bei
1.000 ms und Timerabmeldung bis 4.000 ms bleibt die Abschlussfrist 6.000 ms.
Gleichheit ist zu spät; unsichere Zeitbeobachtung bestätigt keinen Erfolg.
Auch ein rechtzeitiger Ressourcenabschluss hebt den Bereitstellungsfehler
nicht auf. Fehlende Bestätigungen bleiben `possible`; es gibt
keine automatische Wiederverbindung. Die Bereitstellungsbilanz enthält
Verbindungs-/Befehlszahlen, Endpunktlesezahl, Phasen und minimierte statische
Fehlercodes. Browserprozess und synthetisches Profil bleiben gesondert gehaltene
Dienstressourcen. Der anschließende Kontrolllauf startet keinen Browser,
erzeugt kein Profil und beendet den Dienst nicht.

## Testkomposition und Prüfnachweise

`createNodeCdpOperatorHostForTest(options, ports)` ist eine ausdrücklich
vertrauenswürdige Simulationsnaht. Alle Ports sind erforderlich (`fs`, `spawn`,
`uuid`, `isChild`, `createWebSocket`, `now`, `schedule`, `cancel`), ohne nativen
Fallback. Sie erlaubt keine andere Produktionsablage; Fixtures bilden die
festen logischen Pfade auf eigenen Speicher oder begrenzte temporäre Dateien
ab. Diese Naht beweist keine Produktionsfähigkeiten und ist keine alternative
Betriebsfreigabe. Wie bei der bestehenden Kontrollkomposition müssen Effects
endlich und synchron sein; Scheduler stellen einmalige Callbacks ausschließlich
zur späteren Verarbeitung ein. Native Node-APIs erfüllen diese Aufrufsemantik.

Die neue Suite verwendet den tatsächlichen Host, Owner und das tatsächliche
Kontrollmodul. Browser, WebSockets, Prozessereignisse und Zeit sind simuliert.
Nur eigene temporäre Dateien prüfen zusätzlich native exklusive Dateierzeugung;
der Betriebsordner wird nicht berührt. Die Fixtures starten keine Browser- oder
Helferprozesse. Effektzähler, Getterzähler und Assertions werden außerhalb
möglicherweise abgefangener Hooks ausgewertet.

Der beauftragte Abschlusslauf lautet seriell:

```text
node --test --test-concurrency=1 --test-reporter=tap tests/nodeCdpContextControl.test.js tests/nodeCdpStartGateOwner.test.js tests/nodeCdpOperatorHost.test.js
npm.cmd run build
```

Der externe Belegordner
`C:\Users\jslom\Documents\Projekte\GoldenDawn-Pruefnachweise\node-cdp-operator-host-2026-11-01-52c7e194ad83`
enthält Ausgangsbindung, rohe Basisblobs, Auswahl und Quellen-/Dependency-/
Konfigurationsbindungen. Vor und nach den Läufen werden auch die tatsächlich
vom npm-Wrapper ausgewählte Installation, die Buildbefehlsauflösung sowie
`.env`, `.env.local`, `.env.production`, `.env.production.local` erfasst.
Originalstreams und native Abschlussdaten bleiben getrennt erhalten.
Tatsächliche Zahlen und Ergebnisse stehen nach Ausführung ausschließlich in
den Belegartefakten und im Abschlussbericht; diese Dokumentation nimmt keinen
Erfolg vorweg. Alte Nachweise werden nicht überschrieben oder übertragen.
