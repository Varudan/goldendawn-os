# Node-CDP-Kontrollanbindung – vorbereitendes Profil

Diese isolierte Vorbereitung setzt ausschließlich den kleinen Kontrollablauf aus
[ADR 0041](decisions/0041-isolated-local-same-origin-sync-test.md) um. Sie ist
keine reale Dienstbindung, Fähigkeitsprobe oder Produktkomposition. SAC bleibt
aktiv. Browserbereitstellung, Verbindung und praktische Prüfung benötigen eigene
Aufträge. Der angenommene ADR und sein Dokumentreview werden nicht neu bewertet.

## API und Composition

`scripts/browser/nodeCdpContextControl.js` exportiert ausschließlich
`createNodeCdpContextControl(options)`. Die eingefrorene API besitzt nur
`runOnce({ runId, signal? })`, das einen Promise auf einen minimierten Bericht
liefert. Ein zweiter Aufruf wird abgelehnt, auch nach einem verhinderten Start.
Import und Factory rufen keine Dependency auf. Es gibt weder CLI noch Launcher,
Discovery von Endpoints, automatische Ausführung, Retry oder öffentlichen
CDP-Befehlskanal. Die Factory kopiert die vertrauenswürdige Bindung.

Alle Dependencies sind erforderlich; es gibt insbesondere keinen WebSocket- oder
Timer-Fallback. Eine spätere, separat erlaubte Node-Composition kann vorhandene
Node-Funktionen explizit übergeben: `url => new WebSocket(url)`,
`() => performance.now()`, `setTimeout` und `clearTimeout`. Diese Notiz führt sie
nicht aus. Der Transport muss eine WebSocket-EventTarget-Oberfläche bereitstellen
(`url`, `readyState`, `send`, `close`, `addEventListener`, `removeEventListener`).
Weiterleitungen sind kein zulässiger Ersatz für die gebundene Verbindung.

| Dependency | Vertrag |
| --- | --- |
| `binding` | `serviceId`, exakte `webSocketUrl` und `version` mit `protocolVersion`, `product`, `revision`, `userAgent`, `jsVersion`. Alle fünf Versionswerte müssen exakt zu `Browser.getVersion` passen. |
| `createWebSocket(url)` | Erzeugt ausschließlich die eigene Verbindung zur unveränderten URL, liefert sie im Zustand CONNECTING zurück; keine Suche, Weiterleitung oder Wiederverbindung. |
| `now()` | Eine außerhalb des Dokuments gehaltene monotone, endliche Millisekundenuhr. Rückschritte oder Ausfall verhindern einen positiven Zeitnachweis. |
| `schedule(callback, delayMs)`, `cancel(handle)` | Einmaliger, niemals inline ausgeführter Callback; synchrone Abmeldung. Kein realer Timer wird im Modul ohne diese Injektion angelegt. |
| `startGate.acquire(binding, runId)` | Atomarer Startcheck und Reservierung. Nur `{ status: 'ACQUIRED', serviceId, webSocketUrl, runId, ... }` mit exakter Bindung wird als Lease akzeptiert; alles andere verhindert Verbindung, Uhr, Timer und Registrierungen. |
| `startGate.isCurrent(lease)` | Muss strikt `true` liefern, solange dieselbe Dienstinstanz verbindlich gilt. Wird vor Befehlen und bei Nachrichten geprüft. Versionsgleichheit allein beweist keine Prozessidentität. |
| `startGate.block(lease, finding)` | Nimmt Ressourcen-FAIL/-UNPROVEN synchron entgegen, bestätigt mit `true` und hält die allgemeine Startsperre auch für neue Factories, Laufkennungen und Dienstbindungen. Muss auch nach `complete` für dieselbe bekannte Lease gelten: Zeitverbrauch im Abschluss-Hook kann einen nachträglich erkannten Fristverstoß verursachen. |
| `startGate.complete(lease, report)` | Bestätigt synchron mit `true`. Darf nur eine normale laufende Reservierung ohne bestehende Startsperre freigeben; ein späterer Abschluss hebt keine Sperre auf. Fehlende Bestätigung bleibt UNPROVEN. |
| `evidence.save(snapshot)` | Übernimmt genau einen tief eingefrorenen minimierten In-Memory-Snapshot außerhalb des Dokuments; synchrone Bestätigung strikt `true`. Keine Datei, Persistenz oder Rohpayloadablage. |

Die vertrauenswürdigen Composition-Dependencies müssen endlich, synchron und
ohne reentrante Aufrufe in die Kontroll-API arbeiten; Promise-Ergebnisse sind keine
Bestätigung. Ihre externe Implementierung ist kein Bestandteil dieses Moduls.
Der Startsperren-Owner muss insbesondere parallele Nutzung desselben Dienstes
atomar verhindern und eine unklare Operatorsitzung ablehnen. Seine Lebensdauer
muss die einzelnen Factories überdauern. Persistenz der Sperre über einen Neustart
der Operatorsitzung hinaus ist hier nicht implementiert. Es gibt keine Reset-API.
Eine spätere Aufhebung bleibt bei Jan gemäß ADR 0041, Abschnitt 6.4.

Im Bericht bezeichnet `resourceStatus: FAIL/UNPROVEN` den Sperrbedarf.
`gateBlocked` wird nur nach einer synchronen `true`-Bestätigung von `block`
gesetzt; es bezeichnet nicht bloß den Aufrufversuch. Ein erfolgloser Versuch
bleibt durch `GATE_BLOCK_UNCONFIRMED` und `gateAcknowledged: false` sichtbar.
Eine fehlende `complete`-Bestätigung ergibt `GATE_COMPLETE_UNCONFIRMED` und
ebenfalls `gateAcknowledged: false`; sie löst einen Sperrversuch aus.
Spätere Bestätigungen entfernen diese Unsicherheit nicht. Auch ein mit `true`
erfülltes Promise ist keine synchrone Bestätigung.

Die URL wird ohne Parsing-Normalisierung geprüft: ausschließlich
`ws://127.0.0.1:<port>/devtools/browser/<kennung>`, kanonischer Dezimalport
1–65535 und eine ASCII-Kennung aus Buchstaben, Ziffern, `_`, `-` (1–128 Zeichen).
Zugangsdaten, Query, Fragment, Aliase, Prozentkodierung und zusätzliche Slashes
sind ausgeschlossen. Bindungs- und Laufkennungen sind begrenzte ASCII-Werte.

## Fester Ablauf und Zuordnung

1. Externe atomare Admission; eigene Verbindung vor dem Erzeugungsversuch
   bilanzieren, öffnen und deren Abschluss separat beobachten.
2. Version prüfen; Kontextvorbestand mit `Target.getBrowserContexts` erfassen;
   verbindungslokale Target-Beobachtung mit `Target.setDiscoverTargets` aktivieren.
3. Genau einen Nichtdefault-Kontext mit `Target.createBrowserContext` erzeugen.
   Nur dessen korrelierte Antwort gewährt Ownership; eine Bestandsdifferenz
   gewährt sie niemals. Eine Kennung aus dem Vorbestand wird abgelehnt.
4. Genau ein `about:blank`-Target in diesem Kontext erzeugen. Erzeugungsantwort,
   Target-Ereignis und `Target.getTargetInfo` müssen übereinstimmen. Eigene Sitzung
   mit `Target.attachToTarget({ flatten: true })` binden; Antwort und Attach-Ereignis
   müssen dieselbe Sitzung und dasselbe Target belegen. `Page.enable` und
   `Page.getFrameTree` laufen ausschließlich in dieser Sitzung. Root-Frame-ID,
   Loader-ID und `about:blank` binden die Dokumentgeneration. Beobachtete
   widersprüchliche Generationen oder Unterframes werden abgelehnt.
5. Bei vollständiger Bindung oder früherem Stopp beginnt t₀. Befunde außerhalb
   des Dokuments sichern; den eindeutig eigenen Kontext höchstens einmal mit
   `Target.disposeBrowserContext` beenden.
6. Erfolgreiche Disposal-Antwort, danach Kontextabwesenheit in einer Rückprüfung,
   `Target.targetDestroyed` des bekannten Targets und in diesem engen Profil
   zusätzlich `Target.detachedFromTarget` der bekannten Sitzung verlangen.
   Target-Ende und bestätigte Kontextrückgabe schließen die rein dokumentlokale
   Generation. Detach allein genügt nie.
7. Eigene Verbindung einmal schließen, ihr Close-Ereignis beobachten,
   Registrierungen und Timer entfernen, Puffer/Referenzen freigeben und Bericht
   an den Owner übergeben. Der geliehene Browserdienst bleibt bestehen.

Ereignisse vor Antworten werden begrenzt gepuffert. Antworten sind an die private
Verbindung, eine einmalige Befehls-ID und gegebenenfalls die Sitzung gebunden.
Schon die erste eigene frühe Frame-Generation bleibt Vergleichsmaßstab für
weitere Navigationen vor der Frame-Tree-Antwort. Eine passende spätere Antwort
kann einen zuvor beobachteten Generationswiderspruch nicht aufheben.
Doppelte/unbekannte Antworten sowie CDP-Fehler sind kontrollierte Fehler. Fremde
Ereignisse beweisen keinen eigenen Abschluss. Kein fremder Kontext und kein
fremdes Target oder Session wird verändert. Es gibt kein `Runtime.evaluate`,
`Page.navigate`, `Browser.close`, keinen Produktrequest und keine Berechtigungsänderung.

Nachrichten müssen Text sein: maximal 65.536 UTF-8-Bytes und 512 Nachrichten pro
Lauf, davon höchstens 128 Ereignisse. Einzelne Inventare und Ereignismengen sind
auf 64 Einträge begrenzt. Dies begrenzt die eigene Auswertung und Pufferung,
beweist aber keine Begrenzung vorangehender WebSocket-/Hostallokationen.

## Zeit und Ressourcen

Vier getrennte Aufbauphasen erhalten jeweils ein absolutes Warteende
`Phasenstart + 5.000 ms`: Verbindung, Dienst-/Beobachtungsbindung, Kontext,
Target-/Dokumentbindung. Zwischenantworten erneuern es nicht. Vollständige
Bestätigung muss streng vorher abgeschlossen sein. Die Werte sind ungeprüfte
Planungswerte, keine praktisch bestätigten Budgets.

t₀ ist die vollständige Dokumentbindung oder der frühere sperrende Befund,
Operatorabbruch (`AbortSignal`) bzw. das absolute Aufbauwarteende. Verspätete
Callbackverarbeitung verschiebt t₀ nicht. Ab dann gibt es keine weitere
Erzeugung oder Wiederholung; späte eigene Kennungen dürfen ausschließlich noch
dem vorgesehenen Normalabschluss dienen.
Unmittelbar nach dem letzten `isCurrent`-Hook vor dem ersten Verbindungsversuch
werden Zeit und Stoppzustand erneut geprüft. Erkennt die Zeitprüfung nach einer
erfolgreichen Timerabmeldung erstmals das Aufbauwarteende, beginnen Belegsicherung
und der zum Ressourcenstand passende Normalabschluss noch in derselben Verarbeitung.

| Absolute Grenze | Pflicht |
| --- | --- |
| t₀ + 10.000 ms | Minimierte Befunde außerhalb des Dokuments gesichert. |
| t₀ + 30.000 ms | Kontext, bekannte Targets, Sitzung und Dokument bestätigt abgeschlossen. |
| t₀ + 85.000 ms | Eigene Kontrollverbindung, Registrierungen, Timer und Nutzung abgeschlossen. |
| t₀ + 90.000 ms | Ressourcenbilanz und minimierter Bericht fertig. |

Gleichheit ist bereits zu spät. Es gibt kein 90-Sekunden-Gesamtbudget ab Aufbau.
Gateway und Fixtures sind ausdrücklich nicht anwendbar. Bei ausbleibender
Rückgabe wird spätestens bei +30 s der eigene normale Verbindungsabschluss
begonnen; ein fehlender Verbindungsabschluss hält den Ablauf höchstens bis zur
Verarbeitung der +85-s-Grenze fest. Ein blockierter Host kann diese Verarbeitung
verzögern; das begründet keinen rechtzeitigen Abschluss und verlängert keine Frist.

Ressourcen werden vor dem Versuch erfasst, auch ohne später erhaltene Kennung:
`notAttempted`, `possible`, `confirmed`, `closed`. Fehlende Erzeugungskennungen
bleiben sichtbar. Verbindungs-/Dienstverlust verbietet weitere Verwendung alter
Kennungen. Ein Close-Aufruf ist kein Close-Nachweis. Sicher beobachtete Reste
ergeben FAIL, fehlende Gewissheit UNPROVEN. Beide sperren über den externen Owner.
Späte Restklärung kann Positionszustände ergänzen, verbessert das bereits
festgehaltene Urteil aber nicht. Ablaufstatus und Ressourcenstatus sind getrennt.
Auch erfolgreiche Timer- und Listenerabmeldungen zählen vollständig zur
+85-s-Grenze. Physisch bestätigte Abschlüsse dürfen als `closed` erscheinen,
während ein erst an oder nach der Grenze vollständiger Nachweis dauerhaft
`CONTROL_DEADLINE` und Ressourcen-UNPROVEN erhält. Die Finalisierung versucht
jede Abmeldung höchstens einmal; fehlgeschlagene Listenerabmeldungen bleiben
auch bei einem anschließenden Uhrfehler und erneutem Abschluss als `possible`
bilanziert. Späte Callbacks verbessern den fertigen Bericht nicht.
Berichte enthalten statische Fehlercodes, keine fremden Exceptiontexte,
Rohpayloadlogs oder Profile. Der Beleg-Snapshot enthält nur notwendige eigene
Identitäten; der Abschlussbericht enthält die minimierte Bilanz.

## Selbstprüfung und Grenzen

`tests/nodeCdpContextControl.test.js` importiert den tatsächlichen Modulpfad und
verwendet ausschließlich einen simulierten WebSocket, einen gemeinsamen
synthetischen Startsperren-Owner und eine deterministische Uhr/Terminplanung.
Es gibt keine echten Sockets, Browser-/Helferprozesse oder realen Wartezeiten zur
Fristsimulation. Die fokussierte Datei wird ausschließlich seriell mit
`node --test --test-concurrency=1 tests/nodeCdpContextControl.test.js` geprüft;
zusätzlich ist `npm run build` der erlaubte lokale Produktions-Build.

Gezielte Regressionen prüfen die fünf Reviewbefunde einschließlich zeitverbrauchender
Abmeldungen bei Deadline−1/Deadline/Deadline+1, der ersten Verbindungsstelle,
widersprüchlicher und konsistenter früher Generationen, sofortigen Abschlussbeginns
beim Timerwechsel sowie des kombinierten Listener-/Uhrfehlers. Weitere Fälle
prüfen werfende Admission-/Bindungs-/Sperr-Hooks, fehlende synchrone Sperr- und
Abschlussbestätigungen und die Nachrichtengrenze 512/513. Der Zähltest berücksichtigt
die bereits empfangenen Aufbaunachrichten, trennt den früheren Protokollfehler
vom Eintritt der Nachrichtengrenze und prüft die unterbundene Payloadauswertung.

Synthetische Ergebnisse belegen weder reale CDP-Ereignisverfügbarkeit, die
bereitgestellte Dienstinstanz, Redirectfreiheit der konkreten Anbindung,
Budgeteignung noch praktische Kontrollfähigkeiten. Betriebsbindung, externer
Owner und Belegzugang benötigen eigene gebundene Umsetzung/Prüfung. Dies ist kein
unabhängiger Review-PASS. Frühere Nachweise werden nicht übertragen.

`overallGate: FAIL`, `causeStatus: CAUSE_NOT_PROVEN`, fehlendes authentisches
`A_obs`, `NOT_EVIDENCE` und `runtimeRecord:null` bleiben unverändert.
